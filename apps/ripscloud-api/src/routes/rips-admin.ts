import { Hono } from "hono";
import { strToU8, unzipSync, zipSync } from "fflate";
import { createAuthenticatedFetch } from "@ripscloud/ripscloud-client";

import { hashPassword } from "../auth/password";
import type { Bindings, Variables } from "../env";
import {
  createDoCredentialsProvider,
  createDoTokenStore,
  NoCredentialsStoredError,
  stubFor,
  storeCredentials,
} from "../tenant-store";

type TenantRow = {
  id: string;
  slug: string;
  do_name: string;
  nit: string;
  verification_digit: string;
  company_name: string;
  commercial_name: string | null;
  tax_regime: string | null;
  economic_activity_code: string | null;
  address: string | null;
  department_code: string | null;
  municipality_code: string | null;
  phone_number: string | null;
  email: string | null;
  service_code: string | null;
  invoice_api_token: string | null;
  invoice_provider: string;
  environment: number;
  logo_url: string | null;
  is_active: number;
  created_at: number;
  updated_at: number;
};

type TenantResponse = {
  id: string;
  slug: string;
  doName: string;
  nit: string;
  verificationDigit: string;
  companyName: string;
  commercialName: string | null;
  taxRegime: string | null;
  economicActivityCode: string | null;
  address: string | null;
  departmentCode: string | null;
  municipalityCode: string | null;
  phoneNumber: string | null;
  email: string | null;
  serviceCode: string | null;
  invoiceApiToken: string | null;
  invoiceProvider: string;
  environment: number;
  logoUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type JsonRecord = Record<string, unknown>;
type DocumentKind = "invoice" | "credit-note";
type ProviderDocumentType = "pdf" | "xml" | "attached";
type DispatchAttempt = {
  id: string;
  documentType: string;
  documentId: string;
  channel: string;
  provider: string | null;
  attemptedAtUtc: number;
  succeeded: boolean;
  requestPayload: string | null;
  responsePayload: string | null;
  errorMessage: string | null;
};
type ProviderPostResult = {
  body: unknown;
  rawBody: string;
  rawRequestBody?: string;
};
type ProviderDocumentResolution = {
  isValidType: boolean;
  documentType: string;
  isSupported: boolean;
  canDownload: boolean;
  documentName: string | null;
  attempt: DispatchAttempt | null;
};
type RipsPayloadPreparation =
  | { payloadJson: string }
  | { error: string }
  | { skipRips: true; payloadJson: string | null };
type EmailAttachment = {
  filename: string;
  bytes: Uint8Array;
  mimeType: string;
};
type EmailDispatchSuccess = {
  sent: true;
  to: string;
  cc: string | null;
  subject: string;
  attachmentName: string;
  attachmentSize: number;
};
type EmailDispatchFailure = {
  sent: false;
  reason: string;
  message: string;
  status: number;
};
type EmailDispatchResult = EmailDispatchSuccess | EmailDispatchFailure;
type SmtpConfig = {
  host: string;
  port: number;
  username: string;
  password: string;
  from: string;
  secure: boolean;
  startTls: boolean;
};

const DO_ORIGIN = "https://tenant.internal";
const MONAROS_BASE_URL = "https://apidian.monaros.com.co/api/ubl2.1/";
const LEDGER_PRODUCTION_URL = "https://dian-orchestrator.pahventure.com/api/v1/dian/";
const LEDGER_HABILITACION_URL = "https://dian-orchestrator-hab.pahventure.com/api/v1/dian/";
const LEDGER_REPORTING_PRODUCTION_URL = "https://pahventure-reporting-api-prod.pahventure.workers.dev/api/v1/dian/";
const LEDGER_REPORTING_HABILITACION_URL = "https://pahventure-reporting-api-hab.pahventure.workers.dev/api/v1/dian/";
const PROVIDER_DOCUMENT_TYPES: ProviderDocumentType[] = ["pdf", "xml", "attached"];
const MAX_RIPS_XML_BYTES = 6_000_000;
const MAX_EMAIL_DOCUMENT_BYTES = 8_000_000;
const MAX_EMAIL_ZIP_BYTES = 2_000_000;

const TENANT_SELECT = `
  id, slug, do_name, nit, verification_digit, company_name, commercial_name,
  tax_regime, economic_activity_code, address, department_code, municipality_code,
  phone_number, email, service_code, invoice_api_token, invoice_provider, environment, logo_url,
  is_active, created_at, updated_at
`;

const LEGACY_COLLECTIONS: Record<string, string> = {
  clients: "clients",
  patients: "patients",
  specialists: "specialists",
  services: "services",
  resolutions: "resolutions",
  "credit-note-resolutions": "credit-note-resolutions",
  "credit-notes": "credit-note-drafts",
  "invoice/documents": "invoice-drafts",
  "invoice/drafts": "invoice-drafts",
};

const PATIENT_TEMPLATE_ROWS = [
  [
    "documentType",
    "documentNumber",
    "userType",
    "birthDate",
    "sexCode",
    "countryResidenceCode",
    "countryOriginCode",
    "municipalityResidenceCode",
    "territorialZoneCode",
    "disabilityFlag",
    "firstName",
    "middleName",
    "lastName",
    "secondLastName",
  ],
  ["CC", "123456789", "1", "1980-01-31", "M", "170", "170", "11001", "U", "N", "Nombre", "", "Apellido", ""],
];
const PATIENT_CSV_TEMPLATE = PATIENT_TEMPLATE_ROWS.map((row) => row.map(csvCell).join(",")).join("\n");

const DATE_FIELDS = new Set(["birthdate", "fechanacimiento"]);
const DATETIME_FIELDS = new Set(["fechainicioatencion", "fechaegreso"]);

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.get("/api/config/frontend", (c) =>
  c.json({
    apiUrl: new URL(c.req.raw.url).origin,
    googleClientId: c.env.RIPS_ADMIN_GOOGLE_CLIENT_ID ?? "",
  }),
);

app.get("/api/rips-admin/tenants", async (c) => {
  const q = c.req.query("q")?.trim();
  const limit = boundedInt(c.req.query("limit"), 100, 1, 500);
  const offset = boundedInt(c.req.query("offset"), 0, 0, 100_000);
  const bindings: (string | number)[] = [];
  let where = "";

  if (q) {
    where = "WHERE slug LIKE ? OR nit LIKE ? OR company_name LIKE ? OR commercial_name LIKE ?";
    const like = `%${q}%`;
    bindings.push(like, like, like, like);
  }

  const result = await c.env.DB.prepare(
    `SELECT ${TENANT_SELECT} FROM rips_admin_tenants ${where} ORDER BY company_name ASC LIMIT ? OFFSET ?`,
  )
    .bind(...bindings, limit, offset)
    .all<TenantRow>();
  const count = await c.env.DB.prepare(`SELECT COUNT(*) AS count FROM rips_admin_tenants ${where}`)
    .bind(...bindings)
    .first<{ count: number }>();

  return c.json({
    tenants: (result.results ?? []).map(mapTenant),
    count: count?.count ?? 0,
  });
});

app.post("/api/rips-admin/tenants", async (c) => {
  const body = asObject(await c.req.json().catch(() => null));
  const tenant = await createTenant(c.env, body);
  await syncTenantMetadata(c.env, tenant);
  await maybeCreateAdminMembership(c.env, tenant, body);
  return c.json({ tenant }, 201);
});

app.post("/api/rips-admin/migration/global", async (c) => {
  if (!migrationRequestAllowed(c.env, c.req.raw)) {
    return c.json({ error: "migration_not_allowed" }, 403);
  }

  try {
    const body = asObject(await c.req.json().catch(() => null));
    const tenantResult = await upsertMigratedTenants(c.env, payloadArray(body, "tenants"));
    const userResult = await upsertMigratedUsers(
      c.env,
      payloadArray(body, "users"),
      payloadArray(body, "memberships", "userTenants", "user_tenants"),
      tenantResult.idMap,
    );

    return c.json({
      ok: true,
      tenants: tenantResult,
      users: userResult,
    });
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : String(err) }, 400);
  }
});

app.get("/api/rips-admin/tenants/:tenantId", async (c) => {
  const tenant = await findTenant(c.env.DB, c.req.param("tenantId"));
  if (!tenant) return c.json({ error: "tenant_not_found" }, 404);
  return c.json({ tenant });
});

app.put("/api/rips-admin/tenants/:tenantId", async (c) => {
  const tenant = await findTenant(c.env.DB, c.req.param("tenantId"));
  if (!tenant) return c.json({ error: "tenant_not_found" }, 404);
  const updated = await updateTenant(c.env, tenant.id, asObject(await c.req.json().catch(() => null)));
  await syncTenantMetadata(c.env, updated);
  return c.json({ tenant: updated });
});

app.get("/api/rips-admin/tenants/:tenantId/summary", async (c) => {
  const tenant = await findTenant(c.env.DB, c.req.param("tenantId"));
  if (!tenant) return c.json({ error: "tenant_not_found" }, 404);
  const upstream = await fetchTenantDo(c.env, tenant, "/rips-admin/summary");
  return respondFromDo(upstream);
});

app.get("/api/rips-admin/tenants/:tenantId/users", async (c) => {
  const tenant = await findTenant(c.env.DB, c.req.param("tenantId"));
  if (!tenant) return c.json({ error: "tenant_not_found" }, 404);
  return c.json(await listWorkspaceUsers(c.env.DB, tenant.id));
});

app.post("/api/rips-admin/tenants/:tenantId/users", async (c) => {
  const tenant = await findTenant(c.env.DB, c.req.param("tenantId"));
  if (!tenant) return c.json({ error: "tenant_not_found" }, 404);
  try {
    const result = await addUserToWorkspace(c.env, tenant, asObject(await c.req.json().catch(() => null)));
    return c.json(result, 201);
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : String(err) }, 400);
  }
});

app.all("/api/rips-admin/tenants/:tenantId/bulk-upsert/:collection", async (c) => {
  const tenant = await findTenant(c.env.DB, c.req.param("tenantId"));
  if (!tenant) return c.json({ error: "tenant_not_found" }, 404);
  const upstream = await fetchTenantDo(
    c.env,
    tenant,
    `/rips-admin/bulk-upsert/${c.req.param("collection")}`,
    c.req.raw,
  );
  return respondFromDo(upstream);
});

app.all("/api/rips-admin/tenants/:tenantId/:collection", async (c) => {
  const tenant = await findTenant(c.env.DB, c.req.param("tenantId"));
  if (!tenant) return c.json({ error: "tenant_not_found" }, 404);
  const path = `/rips-admin/${c.req.param("collection")}${new URL(c.req.raw.url).search}`;
  const upstream = await fetchTenantDo(c.env, tenant, path, c.req.raw);
  return respondFromDo(upstream);
});

app.all("/api/rips-admin/tenants/:tenantId/:collection/:id", async (c) => {
  const tenant = await findTenant(c.env.DB, c.req.param("tenantId"));
  if (!tenant) return c.json({ error: "tenant_not_found" }, 404);
  const path = `/rips-admin/${c.req.param("collection")}/${c.req.param("id")}${new URL(c.req.raw.url).search}`;
  const upstream = await fetchTenantDo(c.env, tenant, path, c.req.raw);
  return respondFromDo(upstream);
});

app.get("/api/workspaces", async (c) => {
  const result = await c.env.DB.prepare(`SELECT ${TENANT_SELECT} FROM rips_admin_tenants ORDER BY company_name ASC`)
    .all<TenantRow>();
  return c.json((result.results ?? []).map(mapLegacyWorkspace));
});

app.post("/api/workspaces", async (c) => {
  const body = asObject(await c.req.json().catch(() => null));
  const tenant = await createTenant(c.env, body);
  await syncTenantMetadata(c.env, tenant);
  await maybeCreateAdminMembership(c.env, tenant, body);
  return c.json(mapLegacyWorkspace(tenant), 201);
});

app.get("/api/workspaces/user", async (c) => {
  const result = await c.env.DB.prepare(`SELECT ${TENANT_SELECT} FROM rips_admin_tenants WHERE is_active = 1 ORDER BY company_name ASC`)
    .all<TenantRow>();
  return c.json((result.results ?? []).map((tenant) => ({
    id: tenant.id,
    companyName: tenant.company_name,
    displayName: tenant.commercial_name || tenant.company_name,
    role: "Admin",
  })));
});

app.get("/api/workspaces/:workspaceId", async (c) => {
  const tenant = await findTenant(c.env.DB, c.req.param("workspaceId"));
  if (!tenant) return c.json({ error: "tenant_not_found" }, 404);
  return c.json(mapLegacyWorkspace(tenant));
});

app.all("/api/workspaces/:workspaceId/*", async (c) => {
  const tenant = await findTenant(c.env.DB, c.req.param("workspaceId"));
  if (!tenant) return c.json({ error: "tenant_not_found" }, 404);

  const requestUrl = new URL(c.req.raw.url);
  const rest = stripWorkspacePrefix(requestUrl.pathname, c.req.param("workspaceId"));

  if (rest === "company") {
    if (c.req.raw.method === "GET") return c.json(mapLegacyWorkspace(tenant));
    if (c.req.raw.method === "PUT") {
      const updated = await updateTenant(c.env, tenant.id, asObject(await c.req.json().catch(() => null)));
      await syncTenantMetadata(c.env, updated);
      return c.json(mapLegacyWorkspace(updated));
    }
  }

  if (rest === "environment") {
    if (c.req.raw.method === "GET") return c.json({ environment: tenant.environment });
    if (c.req.raw.method === "PUT") {
      const body = asObject(await c.req.json().catch(() => null));
      const updated = await updateTenant(c.env, tenant.id, { environment: body.environment });
      await syncTenantMetadata(c.env, updated);
      return c.json({ environment: updated.environment });
    }
  }

  if (rest === "dashboard/summary" && c.req.raw.method === "GET") {
    const upstream = await fetchTenantDo(c.env, tenant, "/rips-admin/summary");
    const summary = (await upstream.json()) as { summary?: Record<string, number> };
    return c.json({
      tenant: mapLegacyWorkspace(tenant),
      counts: summary.summary ?? {},
    });
  }

  if (rest === "users") {
    if (c.req.raw.method === "GET") return c.json(await listWorkspaceUsers(c.env.DB, tenant.id));
    if (c.req.raw.method === "POST") {
      try {
        const result = await addUserToWorkspace(c.env, tenant, asObject(await c.req.json().catch(() => null)));
        return c.json(result, 201);
      } catch (err) {
        return c.json({ error: err instanceof Error ? err.message : String(err) }, 400);
      }
    }
  }

  if (rest === "invoice/wizard/context" && c.req.raw.method === "GET") {
    return c.json(await getWizardContext(c.env, tenant));
  }

  if (rest === "invoice/settings") {
    if (c.req.raw.method === "GET") return c.json(invoiceSettings(tenant));
    if (c.req.raw.method === "PUT") {
      const body = asObject(await c.req.json().catch(() => null));
      const updated = await updateTenant(c.env, tenant.id, {
        invoiceApiToken: body.token,
        invoiceProvider: body.invoiceProvider,
      });
      await syncTenantMetadata(c.env, updated);
      return c.json(invoiceSettings(updated));
    }
  }

  if (rest === "sispro/settings" && c.req.raw.method === "GET") {
    const stub = stubFor(c.env.TENANT, tenant.doName);
    const response = await stub.fetch(`${DO_ORIGIN}/credentials`);
    const body = (await response.json()) as { credentials: Record<string, unknown> | null };
    const credentials = body.credentials;
    const persona = asObject(credentials?.persona);
    const identificacion = asObject(persona.identificacion);
    return c.json({
      documentType: identificacion.tipo ?? credentials?.tipoDocumentoIdentificacion ?? credentials?.documentType ?? null,
      documentNumber: identificacion.numero ?? credentials?.numDocumentoIdentificacion ?? credentials?.documentNumber ?? null,
      hasPassword: Boolean(credentials),
      hasToken: false,
    });
  }

  if (rest === "sispro/login" && c.req.raw.method === "POST") {
    const body = asObject(await c.req.json().catch(() => null));
    const credentials = {
      persona: {
        identificacion: {
          tipo: valueToString(body.tipoDocumentoIdentificacion ?? body.documentType) ?? "",
          numero: valueToString(body.numDocumentoIdentificacion ?? body.documentNumber) ?? "",
        },
      },
      clave: valueToString(body.clave ?? body.password) ?? "",
      nit: valueToString(body.nit) ?? tenant.nit,
    };
    await storeCredentials(stubFor(c.env.TENANT, tenant.doName), credentials);
    return c.json({ success: true, message: "SISPRO credentials stored for this tenant." });
  }

  if (rest === "patients/csv-template" && c.req.raw.method === "GET") {
    return csvResponse(
      PATIENT_CSV_TEMPLATE,
      "rips-admin-patients-template.csv",
    );
  }

  if (rest === "patients/xlsx-template" && c.req.raw.method === "GET") {
    return xlsxResponse(
      createXlsx(PATIENT_TEMPLATE_ROWS, "Patients"),
      "rips-admin-patients-template.xlsx",
    );
  }

  if (rest === "patients/convert-xlsx-to-csv" && c.req.raw.method === "POST") {
    try {
      return csvResponse(
        await convertXlsxRequestToCsv(c.req.raw),
        "rips-admin-patients-upload.csv",
      );
    } catch (err) {
      return c.json({
        error: err instanceof Error ? err.message : "Failed to parse XLSX file.",
      }, 400);
    }
  }

  const creditNoteContextMatch = /^invoices\/([^/]+)\/credit-note-context$/.exec(rest);
  if (creditNoteContextMatch && c.req.raw.method === "GET") {
    return c.json(await getCreditNoteContext(c.env, tenant, creditNoteContextMatch[1] ?? ""));
  }

  const invoiceActionMatch = /^invoice\/documents\/([^/]+)\/([^/]+)(?:\/([^/]+))?$/.exec(rest);
  if (invoiceActionMatch) {
    return handleInvoiceAction(c.env, tenant, c.req.raw, invoiceActionMatch[1] ?? "", invoiceActionMatch[2] ?? "", invoiceActionMatch[3]);
  }

  const invoiceRipsMatch = /^invoice\/drafts\/([^/]+)\/rips(?:\/xml\/refresh)?$/.exec(rest);
  if (invoiceRipsMatch) {
    return handleInvoiceRipsAction(c.env, tenant, c.req.raw, invoiceRipsMatch[1] ?? "", rest.endsWith("/xml/refresh"));
  }

  const creditNoteActionMatch = /^credit-notes\/([^/]+)\/([^/]+)(?:\/([^/]+))?$/.exec(rest);
  if (creditNoteActionMatch) {
    return handleCreditNoteAction(
      c.env,
      tenant,
      c.req.raw,
      creditNoteActionMatch[1] ?? "",
      creditNoteActionMatch[2] ?? "",
      creditNoteActionMatch[3],
    );
  }

  if (rest.startsWith("reports/") && c.req.raw.method === "GET") {
    return handleReportRequest(c.env, tenant, rest, requestUrl.searchParams);
  }

  const mapped = mapLegacyCollection(rest, requestUrl.search);
  if (mapped) {
    return handleLegacyCollectionProxy(c.env, tenant, mapped, c.req.raw, requestUrl.searchParams);
  }

  return c.json(
    {
      error: "route_not_found",
      route: rest,
      hint: "The RipsCloud API supports the legacy RIPS Admin auth, workspace, CRUD, report, CSV/XLSX, invoice, credit-note, SISPRO/RIPS, provider download, retry, correction, and email-resend routes used by the migrated web app.",
    },
    { status: 404 },
  );
});

async function fetchTenantDoJson(env: Bindings, tenant: TenantResponse, path: string): Promise<unknown> {
  const response = await fetchTenantDo(env, tenant, path);
  return response.json();
}

function itemArray(value: unknown): JsonRecord[] {
  if (!value || typeof value !== "object") return [];
  const items = (value as { items?: unknown }).items;
  return Array.isArray(items) ? items.map(asObject) : [];
}

function mapLegacyCollection(rest: string, search = ""): string | null {
  const parts = rest.split("/").filter(Boolean);
  const firstTwo = parts.slice(0, 2).join("/");
  const collection = LEGACY_COLLECTIONS[firstTwo] ?? LEGACY_COLLECTIONS[parts[0] ?? ""];
  if (!collection) return null;

  const consumed = LEGACY_COLLECTIONS[firstTwo] ? 2 : 1;
  const id = parts[consumed];
  return `/rips-admin/${collection}${id ? `/${id}` : ""}${search}`;
}

async function handleLegacyCollectionProxy(
  env: Bindings,
  tenant: TenantResponse,
  mappedPath: string,
  source: Request,
  searchParams: URLSearchParams,
): Promise<Response> {
  const target = parseRipsAdminPath(mappedPath);
  if (!target) return Response.json({ error: "invalid_legacy_collection" }, { status: 400 });
  const normalized = await normalizeLegacyCollectionRequest(env, tenant, target.collection, source);
  const upstreamPath = legacyDoPathForCollectionList(target, mappedPath, source.method);
  const upstream = await fetchTenantDo(env, tenant, upstreamPath, normalized);
  const contentType = upstream.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return respondFromDo(upstream);

  let body = await upstream.json();
  if (upstream.ok && source.method === "POST" && (target.collection === "invoice-drafts" || target.collection === "credit-note-drafts")) {
    body = await dispatchCreatedFinancialDocument(env, tenant, target.collection, body);
  }
  const payload = await transformLegacyCollectionResponse(
    env,
    tenant,
    target.collection,
    body,
    Boolean(target.id),
    source.method,
    searchParams,
  );
  return Response.json(payload, { status: upstream.status });
}

function legacyDoPathForCollectionList(
  target: { collection: string; id: string | null },
  mappedPath: string,
  method: string,
): string {
  if (
    method !== "GET"
    || target.id
    || (target.collection !== "invoice-drafts" && target.collection !== "credit-note-drafts")
  ) {
    return mappedPath;
  }

  const params = new URLSearchParams();
  params.set("limit", "500");
  params.set("sort", "created_at");
  params.set("direction", "desc");
  return `/rips-admin/${target.collection}?${params.toString()}`;
}

function parseRipsAdminPath(path: string): { collection: string; id: string | null } | null {
  const pathname = path.split("?")[0] ?? "";
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== "rips-admin" || !parts[1]) return null;
  return { collection: parts[1], id: parts[2] ?? null };
}

async function normalizeLegacyCollectionRequest(
  env: Bindings,
  tenant: TenantResponse,
  collection: string,
  source: Request,
): Promise<Request> {
  if (source.method === "GET" || source.method === "HEAD" || source.method === "DELETE") return source;
  if (collection !== "invoice-drafts" && collection !== "credit-note-drafts") return source;

  const body = asObject(await source.clone().json().catch(() => null));
  const normalized = collection === "invoice-drafts"
    ? normalizeInvoiceDraftInput(body)
    : await normalizeCreditNoteDraftInput(env, tenant, body);

  return new Request(source.url, {
    method: source.method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(normalized),
  });
}

function normalizeInvoiceDraftInput(input: JsonRecord): JsonRecord {
  const invoicePayload = input.invoicePayload ?? input.invoice_payload ?? input.invoicePayloadJson ?? input.invoice_payload_json;
  const ripsPayload = input.ripsPayload ?? input.rips_payload ?? input.ripsPayloadJson ?? input.rips_payload_json;
  const metadata = input.metadata ?? input.metadataJson ?? input.metadata_json;
  return {
    ...input,
    status: valueToString(input.status) ?? "Queued",
    kind: invoiceKindName(input.kind),
    metadataJson: jsonString(metadata, "{}"),
    invoicePayloadJson: jsonString(invoicePayload, "{}"),
    ripsPayloadJson: ripsPayload === undefined || ripsPayload === null ? undefined : jsonString(ripsPayload, "{}"),
    invoiceResolutionId: input.invoiceResolutionId ?? input.invoice_resolution_id,
    locationId: input.locationId ?? input.location_id,
    totalAmount: numericValue(input.totalAmount ?? input.total_amount, 0),
  };
}

async function normalizeCreditNoteDraftInput(env: Bindings, tenant: TenantResponse, input: JsonRecord): Promise<JsonRecord> {
  const invoiceDraftId = valueToString(input.invoiceDraftId ?? input.invoice_draft_id);
  const invoice = invoiceDraftId ? await getTenantItem(env, tenant, "invoice-drafts", invoiceDraftId) : null;
  const creditNotePayload = input.creditNotePayload
    ?? input.credit_note_payload
    ?? input.creditNotePayloadJson
    ?? input.credit_note_payload_json;
  const ripsPayload = input.ripsPayload ?? input.rips_payload ?? input.ripsPayloadJson ?? input.rips_payload_json;
  const selectedItems = input.selectedItems ?? input.selected_items ?? input.selectedItemsJson ?? input.selected_items_json;
  return {
    ...input,
    invoiceDraftId,
    clientId: input.clientId ?? input.client_id ?? invoice?.client_id,
    status: valueToString(input.status) ?? "Queued",
    kind: invoiceKindName(input.kind ?? invoice?.kind),
    totalAmount: numericValue(input.totalAmount ?? input.total_amount ?? invoice?.total_amount, 0),
    creditNotePayloadJson: jsonString(creditNotePayload, "{}"),
    ripsPayloadJson: ripsPayload === undefined || ripsPayload === null ? undefined : jsonString(ripsPayload, "{}"),
    selectedItemsJson: selectedItems === undefined || selectedItems === null ? undefined : jsonString(selectedItems, "[]"),
    creditNoteResolutionId: input.creditNoteResolutionId ?? input.credit_note_resolution_id,
    locationId: input.locationId ?? input.location_id ?? invoice?.location_id,
    discrepancyResponseCode: numericValue(input.discrepancyResponseCode ?? input.discrepancy_response_code, 2),
    discrepancyResponseDescription: valueToString(input.discrepancyResponseDescription ?? input.discrepancy_response_description)
      ?? valueToString(input.notes)
      ?? "Anulacion",
  };
}

async function transformLegacyCollectionResponse(
  env: Bindings,
  tenant: TenantResponse,
  collection: string,
  body: unknown,
  single: boolean,
  method: string,
  searchParams: URLSearchParams,
): Promise<unknown> {
  if (method === "DELETE") return body;
  const detail = single || method === "POST" || method === "PUT" || method === "PATCH";
  const rows = Array.isArray((body as { items?: unknown }).items)
    ? itemArray(body)
    : [asObject((body as { item?: unknown }).item ?? body)];
  const clientNames = collection === "invoice-drafts" || collection === "credit-note-drafts"
    ? await getClientNameMap(env, tenant)
    : new Map<string, string>();
  const invoiceRows = collection === "credit-note-drafts"
    ? await getInvoiceMap(env, tenant)
    : new Map<string, JsonRecord>();
  const attemptsByDocument = detail && (collection === "invoice-drafts" || collection === "credit-note-drafts")
    ? await getDispatchAttemptsByDocument(env, tenant, rows)
    : new Map<string, DispatchAttempt[]>();
  const mapped = rows.map((row) =>
    mapLegacyItem(
      tenant,
      collection,
      row,
      clientNames,
      detail,
      attemptsByDocument.get(valueToString(row.id) ?? "") ?? [],
      invoiceRows.get(valueToString(row.invoice_draft_id ?? row.invoiceDraftId) ?? ""),
    ),
  );

  if (collection === "invoice-drafts" || collection === "credit-note-drafts") {
    if (single || method === "POST" || method === "PUT" || method === "PATCH") return mapped[0] ?? null;
    const filtered = filterLegacyFinancialRows(mapped, collection, searchParams);
    const sorted = sortLegacyFinancialRows(filtered, collection, searchParams);
    const page = boundedInt(searchParams.get("page") ?? undefined, 1, 1, 100_000);
    const pageSize = boundedInt(searchParams.get("pageSize") ?? undefined, sorted.length || 100, 1, 500);
    return {
      items: paginate(sorted, page, pageSize),
      page,
      pageSize,
      totalCount: sorted.length,
    };
  }

  if (single || method === "POST" || method === "PUT" || method === "PATCH") return mapped[0] ?? null;
  return mapped;
}

function mapLegacyItem(
  tenant: TenantResponse,
  collection: string,
  row: JsonRecord,
  clientNames: Map<string, string>,
  detail: boolean,
  attempts: DispatchAttempt[] = [],
  sourceInvoice: JsonRecord | undefined = undefined,
): JsonRecord {
  if (collection === "invoice-drafts") return mapInvoiceDraft(tenant, row, clientNames.get(valueToString(row.client_id) ?? "") ?? "", detail, attempts);
  if (collection === "credit-note-drafts") {
    return mapCreditNoteDraft(
      tenant,
      row,
      clientNames.get(valueToString(row.client_id) ?? "") ?? "",
      detail,
      attempts,
      sourceInvoice,
    );
  }
  if (collection === "resolutions" || collection === "credit-note-resolutions") return mapResolution(row, tenant.id);
  if (collection === "clients") return { tenantId: tenant.id, ...camelizeDbRow(row) };
  if (collection === "patients") return { tenantId: tenant.id, ...camelizeDbRow(row) };
  if (collection === "specialists") return { tenantId: tenant.id, user: null, ...camelizeDbRow(row) };
  if (collection === "services") return { tenantId: tenant.id, ...camelizeDbRow(row) };
  return camelizeDbRow(row);
}

function mapInvoiceDraft(
  tenant: TenantResponse,
  row: JsonRecord,
  clientName: string,
  detail: boolean,
  attempts: DispatchAttempt[] = [],
): JsonRecord {
  const createdAt = dateValue(row.created_at);
  const updatedAt = dateValue(row.updated_at);
  const base = {
    id: row.id,
    tenantId: tenant.id,
    clientId: row.client_id,
    clientName,
    totalAmount: numericValue(row.total_amount, 0),
    status: valueToString(row.status) ?? "Queued",
    statusMessage: row.status_message ?? null,
    assignedInvoiceNumber: row.assigned_invoice_number ?? null,
    createdAt,
    updatedAt,
    submittedByUserId: row.submitted_by_user_id ?? "",
    submittedByDisplayName: "",
    kind: invoiceKindName(row.kind),
    cuv: row.cuv ?? null,
  };
  if (!detail) return base;
  return {
    ...base,
    metadata: parseJsonString(row.metadata_json, {}),
    cufe: row.cufe ?? null,
    dianStatusCode: row.dian_status_code ?? null,
    dianStatusDescription: row.dian_status_description ?? null,
    invoiceDispatchHistory: dispatchHistory(row, "InvoiceProvider", providerDispatchAttempts("invoice", attempts)),
    ripsDispatchHistory: ripsDispatchHistory(row, ripsDispatchAttempts(attempts), "RipsMinistry"),
    documentAvailability: documentAvailability(tenant.invoiceProvider, "invoice", attempts),
    ripsPayloadJson: row.rips_payload_json ?? null,
  };
}

function mapCreditNoteDraft(
  tenant: TenantResponse,
  row: JsonRecord,
  clientName: string,
  detail: boolean,
  attempts: DispatchAttempt[] = [],
  sourceInvoice: JsonRecord | undefined = undefined,
): JsonRecord {
  const createdAt = dateValue(row.created_at);
  const updatedAt = dateValue(row.updated_at);
  const base = {
    id: row.id,
    tenantId: tenant.id,
    invoiceDraftId: row.invoice_draft_id,
    originalInvoiceNumber: sourceInvoice?.assigned_invoice_number ?? null,
    clientId: row.client_id,
    clientName,
    totalAmount: numericValue(row.total_amount, 0),
    status: valueToString(row.status) ?? "Queued",
    assignedCreditNoteNumber: row.assigned_credit_note_number ?? null,
    discrepancyResponseCode: numericValue(row.discrepancy_response_code, 0),
    discrepancyResponseDescription: row.discrepancy_response_description ?? "",
    createdAt,
    updatedAt,
    kind: invoiceKindName(row.kind),
  };
  if (!detail) return base;
  return {
    ...base,
    originalInvoiceCufe: sourceInvoice?.cufe ?? null,
    statusMessage: row.status_message ?? null,
    submittedByUserId: row.submitted_by_user_id ?? "",
    submittedByDisplayName: "",
    cude: row.cude ?? null,
    dianStatusCode: row.dian_status_code ?? null,
    dianStatusDescription: row.dian_status_description ?? null,
    dispatchHistory: dispatchHistory(row, "DIAN", providerDispatchAttempts("credit-note", attempts)),
    ripsDispatchHistory: ripsDispatchHistory(row, ripsDispatchAttempts(attempts), "RIPS"),
    documentAvailability: documentAvailability(tenant.invoiceProvider, "credit-note", attempts),
  };
}

function mapResolution(row: JsonRecord, tenantId?: string): JsonRecord {
  return {
    tenantId,
    ...camelizeDbRow(row),
  };
}

async function getWizardContext(env: Bindings, tenant: TenantResponse): Promise<Record<string, unknown>> {
  const [clients, locations, resolutions, services] = await Promise.all([
    fetchTenantDoJson(env, tenant, "/rips-admin/clients?limit=500&direction=asc"),
    fetchTenantDoJson(env, tenant, "/rips-admin/locations?limit=500&direction=asc"),
    fetchTenantDoJson(env, tenant, "/rips-admin/resolutions?limit=500&direction=asc"),
    fetchTenantDoJson(env, tenant, "/rips-admin/services?limit=500&direction=asc"),
  ]);

  return {
    settings: invoiceSettings(tenant),
    tenant: {
      id: tenant.id,
      companyName: tenant.companyName,
      nit: tenant.nit,
      verificationDigit: tenant.verificationDigit,
      environment: tenant.environment,
    },
    clients: itemArray(clients).map((row) => ({ tenantId: tenant.id, ...camelizeDbRow(row) })),
    locations: itemArray(locations).map(camelizeDbRow),
    resolutions: itemArray(resolutions).map((row) => mapResolution(row)),
    services: itemArray(services).map((row) => ({ tenantId: tenant.id, ...camelizeDbRow(row) })),
  };
}

async function getCreditNoteContext(env: Bindings, tenant: TenantResponse, invoiceId: string): Promise<Record<string, unknown>> {
  const [invoice, clients, patients, resolutions] = await Promise.all([
    getTenantItem(env, tenant, "invoice-drafts", invoiceId),
    getTenantItems(env, tenant, "clients"),
    getTenantItems(env, tenant, "patients"),
    getTenantItems(env, tenant, "credit-note-resolutions"),
  ]);
  const clientNames = new Map(clients.map((client) => [valueToString(client.id) ?? "", legacyClientName(client)]));
  const mappedInvoice = invoice
    ? mapInvoiceForCreditNote(tenant, invoice, clientNames.get(valueToString(invoice.client_id) ?? "") ?? "")
    : null;

  return {
    invoice: mappedInvoice,
    patients: patients.map(camelizeDbRow),
    availableResolutions: resolutions.map((row) => mapResolution(row, tenant.id)),
    canCreateCreditNote: Boolean(invoice?.cufe),
    validationMessage: invoice
      ? invoice.cufe ? null : "Invoice has no CUFE and cannot be credited yet."
      : "Invoice not found.",
  };
}

async function handleInvoiceAction(
  env: Bindings,
  tenant: TenantResponse,
  request: Request,
  draftId: string,
  action: string,
  argument?: string,
): Promise<Response> {
  const invoice = await getTenantItem(env, tenant, "invoice-drafts", draftId);
  if (!invoice) return Response.json({ error: "invoice_not_found" }, { status: 404 });
  if (action === "download" && request.method === "GET") {
    return documentPayloadResponse(env, tenant, "invoice", invoice, argument ?? "json");
  }
  if (action === "export" && request.method === "GET") {
    return jsonDownloadResponse({
      tenant,
      invoice: mapInvoiceDraft(tenant, invoice, await getClientName(env, tenant, valueToString(invoice.client_id) ?? ""), true),
      invoicePayload: parseJsonString(invoice.invoice_payload_json, {}),
      ripsPayload: parseJsonString(invoice.rips_payload_json, null),
    }, `invoice-${draftId}-${argument ?? "package"}.json`);
  }
  if (action === "resend" && request.method === "POST") {
    return handleInvoiceEmailResend(env, tenant, invoice);
  }
  if (action === "retry" && request.method === "POST") {
    if (valueToString(invoice.cufe)) {
      return Response.json({ error: "Invoice already has a CUFE - use credit note annulation instead of retrying." }, { status: 400 });
    }
    if ((valueToString(invoice.status) ?? "").toLowerCase() !== "failed") {
      return Response.json({ error: `Only Failed invoices can be retried (current status: ${valueToString(invoice.status) ?? "unknown"}).` }, { status: 400 });
    }
    const { row: updated } = await dispatchInvoiceDraft(env, tenant, invoice);
    const attempts = await getDispatchAttempts(env, tenant, valueToString(updated.id) ?? "");
    return Response.json(mapInvoiceDraft(tenant, updated, await getClientName(env, tenant, valueToString(updated.client_id) ?? ""), true, attempts));
  }
  if (action === "full-annul" && request.method === "POST") {
    const body = asObject(await request.json().catch(() => null));
    const creditNote = await upsertTenantItem(env, tenant, "credit-note-drafts", {
      invoiceDraftId: draftId,
      clientId: invoice.client_id,
      status: "Queued",
      kind: invoiceKindName(invoice.kind),
      totalAmount: numericValue(invoice.total_amount, 0),
      discrepancyResponseCode: 2,
      discrepancyResponseDescription: valueToString(body.notes) ?? "Full annulment",
      creditNotePayloadJson: jsonString({ notes: body.notes ?? null, sourceInvoiceId: draftId }, "{}"),
      locationId: invoice.location_id,
    });
    return Response.json(mapCreditNoteDraft(tenant, creditNote, await getClientName(env, tenant, valueToString(creditNote.client_id) ?? ""), true), { status: 202 });
  }
  return Response.json({ error: "method_not_allowed" }, { status: 405 });
}

async function handleCreditNoteAction(
  env: Bindings,
  tenant: TenantResponse,
  request: Request,
  creditNoteId: string,
  action: string,
  argument?: string,
): Promise<Response> {
  const creditNote = await getTenantItem(env, tenant, "credit-note-drafts", creditNoteId);
  if (!creditNote) return Response.json({ error: "credit_note_not_found" }, { status: 404 });
  if (action === "download" && request.method === "GET") {
    return documentPayloadResponse(env, tenant, "credit-note", creditNote, argument ?? "json");
  }
  if (action === "resend" && request.method === "POST") {
    return handleCreditNoteEmailResend(env, tenant, creditNote);
  }
  if (action === "retry" && request.method === "POST") {
    if (valueToString(creditNote.cude)) {
      return Response.json({ error: "Credit note already has a CUDE - it has been accepted by DIAN and cannot be retried." }, { status: 400 });
    }
    if ((valueToString(creditNote.status) ?? "").toLowerCase() !== "failed") {
      return Response.json({ error: `Only Failed credit notes can be retried (current status: ${valueToString(creditNote.status) ?? "unknown"}).` }, { status: 400 });
    }
    const { row: updated } = await dispatchCreditNoteDraft(env, tenant, creditNote);
    const sourceInvoice = await getTenantItem(env, tenant, "invoice-drafts", valueToString(updated.invoice_draft_id) ?? "");
    const attempts = await getDispatchAttempts(env, tenant, valueToString(updated.id) ?? "");
    return Response.json(mapCreditNoteDraft(tenant, updated, await getClientName(env, tenant, valueToString(updated.client_id) ?? ""), true, attempts, sourceInvoice ?? undefined));
  }
  return Response.json({ error: "method_not_allowed" }, { status: 405 });
}

async function handleInvoiceEmailResend(env: Bindings, tenant: TenantResponse, invoice: JsonRecord): Promise<Response> {
  const result = await dispatchInvoiceEmail(env, tenant, invoice);
  if (!result.sent) {
    return Response.json({ error: result.reason, reason: result.reason, message: result.message, queued: false, sent: false }, {
      status: result.status,
    });
  }
  const updated = await getTenantItem(env, tenant, "invoice-drafts", valueToString(invoice.id) ?? "");
  return Response.json({
    success: true,
    queued: false,
    sent: true,
    message: "Invoice email dispatched successfully.",
    invoice: updated ? mapInvoiceDraft(
      tenant,
      updated,
      await getClientName(env, tenant, valueToString(updated.client_id) ?? ""),
      true,
      await getDispatchAttempts(env, tenant, valueToString(updated.id) ?? ""),
    ) : null,
    email: result,
  });
}

async function handleCreditNoteEmailResend(
  env: Bindings,
  tenant: TenantResponse,
  creditNote: JsonRecord,
): Promise<Response> {
  const result = await dispatchCreditNoteEmail(env, tenant, creditNote);
  if (!result.sent) {
    return Response.json({ error: result.reason, reason: result.reason, message: result.message, queued: false, sent: false }, {
      status: result.status,
    });
  }
  const updated = await getTenantItem(env, tenant, "credit-note-drafts", valueToString(creditNote.id) ?? "");
  const sourceInvoice = updated ? await getTenantItem(env, tenant, "invoice-drafts", valueToString(updated.invoice_draft_id) ?? "") : null;
  return Response.json({
    success: true,
    queued: false,
    sent: true,
    message: "Credit note email dispatched successfully.",
    creditNote: updated ? mapCreditNoteDraft(
      tenant,
      updated,
      await getClientName(env, tenant, valueToString(updated.client_id) ?? ""),
      true,
      await getDispatchAttempts(env, tenant, valueToString(updated.id) ?? ""),
      sourceInvoice ?? undefined,
    ) : null,
    email: result,
  });
}

async function handleInvoiceRipsAction(
  env: Bindings,
  tenant: TenantResponse,
  request: Request,
  draftId: string,
  refresh: boolean,
): Promise<Response> {
  const invoice = await getTenantItem(env, tenant, "invoice-drafts", draftId);
  if (!invoice) return Response.json({ error: "invoice_not_found" }, { status: 404 });
  const body = asObject(await request.json().catch(() => null));
  const status = (valueToString(invoice.status) ?? "").toLowerCase();
  if (status !== "failed") {
    return Response.json({ error: `Only Failed invoices can be corrected or re-queued for RIPS (current status: ${valueToString(invoice.status) ?? "unknown"}).` }, { status: 400 });
  }
  if (!valueToString(invoice.cufe)) {
    return Response.json({ error: "Cannot dispatch RIPS before the invoice has a provider CUFE." }, { status: 400 });
  }

  let ripsPayloadJson = valueToString(invoice.rips_payload_json);
  if (refresh) {
    const refreshed = await refreshRipsXmlFromProvider(env, tenant, "invoice", invoice);
    if ("error" in refreshed) return Response.json({ error: refreshed.error }, { status: 400 });
    ripsPayloadJson = refreshed.payloadJson;
  } else {
    const current = normalizeRipsPayloadForSispro(parseJsonString(ripsPayloadJson, null));
    if (!current) return Response.json({ error: "Invoice draft does not have a valid RIPS payload." }, { status: 400 });
    const rips = asObject(current.rips);
    current.rips = { ...rips, usuarios: Array.isArray(body.usuarios) ? body.usuarios : [] };
    ripsPayloadJson = JSON.stringify(current);
  }

  const updated = await upsertTenantItem(env, tenant, "invoice-drafts", {
    id: draftId,
    kind: "Health",
    status: body.requeueForRipsDispatch === false && refresh ? valueToString(invoice.status) ?? "Failed" : "Processing",
    statusMessage: refresh
      ? "RIPS XML refreshed from provider attached document."
      : "RIPS payload corrected; submitting to SISPRO.",
    ripsPayloadJson,
  });

  const finalRow = body.requeueForRipsDispatch === false && refresh
    ? updated
    : (await dispatchRipsDocument(env, tenant, "invoice-drafts", updated, "Invoice")).row;
  const attempts = await getDispatchAttempts(env, tenant, valueToString(finalRow.id) ?? "");
  return Response.json(mapInvoiceDraft(tenant, finalRow, await getClientName(env, tenant, valueToString(finalRow.client_id) ?? ""), true, attempts), { status: 202 });
}

async function handleReportRequest(
  env: Bindings,
  tenant: TenantResponse,
  rest: string,
  params: URLSearchParams,
): Promise<Response> {
  const csv = rest.endsWith("/csv");
  const report = rest.replace(/^reports\//, "").replace(/\/csv$/, "");
  if (report === "sales") {
    const payload = await salesReport(env, tenant, params);
    return csv ? csvResponse(toCsv(payload.items as JsonRecord[]), "sales-report.csv") : Response.json(payload);
  }
  if (report === "client-statement") {
    const payload = await clientStatementReport(env, tenant, params);
    return csv ? csvResponse(toCsv(payload.items as JsonRecord[]), "client-statement.csv") : Response.json(payload);
  }
  if (report === "resolution-usage") {
    const payload = await resolutionUsageReport(env, tenant);
    return csv ? csvResponse(toCsv(payload.items as JsonRecord[]), "resolution-usage.csv") : Response.json(payload);
  }
  if (report === "rips-dispatch") {
    const payload = await ripsDispatchReport(env, tenant, params);
    return csv ? csvResponse(toCsv(payload.items as JsonRecord[]), "rips-dispatch.csv") : Response.json(payload);
  }
  return Response.json({ error: "report_not_found", report }, { status: 404 });
}

async function salesReport(env: Bindings, tenant: TenantResponse, params: URLSearchParams): Promise<JsonRecord> {
  const [invoices, creditNotes, clients] = await Promise.all([
    getTenantItems(env, tenant, "invoice-drafts"),
    getTenantItems(env, tenant, "credit-note-drafts"),
    getTenantItems(env, tenant, "clients"),
  ]);
  const clientNames = new Map(clients.map((client) => [valueToString(client.id) ?? "", legacyClientName(client)]));
  const rows = [
    ...invoices.map((row) => salesRow(row, clientNames, "Invoice")),
    ...creditNotes.map((row) => salesRow(row, clientNames, "CreditNote")),
  ].filter((row) => reportMatches(row, params));
  const totalInvoiced = rows.filter((row) => row.documentType === "Invoice").reduce((sum, row) => sum + numericValue(row.totalAmount, 0), 0);
  const totalCredited = rows.filter((row) => row.documentType === "CreditNote").reduce((sum, row) => sum + numericValue(row.totalAmount, 0), 0);
  const page = boundedInt(params.get("page") ?? undefined, 1, 1, 100_000);
  const pageSize = boundedInt(params.get("pageSize") ?? undefined, 50, 1, 500);
  return {
    items: paginate(rows, page, pageSize),
    summary: {
      totalInvoiced,
      totalCredited,
      netRevenue: totalInvoiced - totalCredited,
      documentCount: rows.length,
    },
    page,
    pageSize,
    totalCount: rows.length,
  };
}

async function clientStatementReport(env: Bindings, tenant: TenantResponse, params: URLSearchParams): Promise<JsonRecord> {
  const clientId = params.get("clientId") ?? "";
  const [invoices, creditNotes, clients] = await Promise.all([
    getTenantItems(env, tenant, "invoice-drafts"),
    getTenantItems(env, tenant, "credit-note-drafts"),
    getTenantItems(env, tenant, "clients"),
  ]);
  const client = clients.find((row) => row.id === clientId);
  const entries = [
    ...invoices.filter((row) => row.client_id === clientId).map((row) => statementRow(row, "Invoice")),
    ...creditNotes.filter((row) => row.client_id === clientId).map((row) => statementRow(row, "CreditNote")),
  ].filter((row) => reportMatches(row, params))
    .sort((a, b) => dateMillis(a.date) - dateMillis(b.date));
  let runningBalance = 0;
  const rows: JsonRecord[] = entries.map((row) => {
    runningBalance += numericValue(row.debit, 0) - numericValue(row.credit, 0);
    return { ...row, runningBalance };
  });
  const totalDebits = rows.reduce((sum, row) => sum + numericValue(row.debit, 0), 0);
  const totalCredits = rows.reduce((sum, row) => sum + numericValue(row.credit, 0), 0);
  const page = boundedInt(params.get("page") ?? undefined, 1, 1, 100_000);
  const pageSize = boundedInt(params.get("pageSize") ?? undefined, 50, 1, 500);
  return {
    items: paginate(rows, page, pageSize),
    summary: {
      totalDebits,
      totalCredits,
      finalBalance: totalDebits - totalCredits,
      clientName: client ? legacyClientName(client) : "",
    },
    page,
    pageSize,
    totalCount: rows.length,
  };
}

async function resolutionUsageReport(env: Bindings, tenant: TenantResponse): Promise<JsonRecord> {
  const [invoiceResolutions, creditResolutions] = await Promise.all([
    getTenantItems(env, tenant, "resolutions"),
    getTenantItems(env, tenant, "credit-note-resolutions"),
  ]);
  return {
    items: [
      ...invoiceResolutions.map((row) => resolutionUsageRow(row, "Invoice")),
      ...creditResolutions.map((row) => resolutionUsageRow(row, "CreditNote")),
    ],
  };
}

async function ripsDispatchReport(env: Bindings, tenant: TenantResponse, params: URLSearchParams): Promise<JsonRecord> {
  const [invoices, creditNotes, clients] = await Promise.all([
    getTenantItems(env, tenant, "invoice-drafts"),
    getTenantItems(env, tenant, "credit-note-drafts"),
    getTenantItems(env, tenant, "clients"),
  ]);
  const attemptsByDocument = await getDispatchAttemptsByDocument(env, tenant, [...invoices, ...creditNotes]);
  const clientNames = new Map(clients.map((client) => [valueToString(client.id) ?? "", legacyClientName(client)]));
  const rows = [
    ...invoices.map((row) => ripsDispatchRow(row, clientNames, "Invoice", attemptsByDocument.get(valueToString(row.id) ?? "") ?? [])),
    ...creditNotes.map((row) => ripsDispatchRow(row, clientNames, "CreditNote", attemptsByDocument.get(valueToString(row.id) ?? "") ?? [])),
  ].filter((row) => reportMatches(row, params));
  const successful = rows.filter((row) => row.ripsStatus === "Accepted").length;
  const failed = rows.filter((row) => row.ripsStatus === "Failed").length;
  const pending = rows.filter((row) => row.ripsStatus === "Pending").length;
  const page = boundedInt(params.get("page") ?? undefined, 1, 1, 100_000);
  const pageSize = boundedInt(params.get("pageSize") ?? undefined, 50, 1, 500);
  return {
    items: paginate(rows, page, pageSize),
    summary: {
      totalSubmitted: rows.length,
      successful,
      failed,
      pending,
    },
    page,
    pageSize,
    totalCount: rows.length,
  };
}

function salesRow(row: JsonRecord, clients: Map<string, string>, documentType: "Invoice" | "CreditNote"): JsonRecord {
  return {
    date: dateValue(row.created_at),
    documentType,
    number: valueToString(row.assigned_invoice_number ?? row.assigned_credit_note_number) ?? valueToString(row.id) ?? "",
    clientId: row.client_id,
    clientName: clients.get(valueToString(row.client_id) ?? "") ?? "",
    subtotal: numericValue(row.total_amount, 0),
    tax: 0,
    totalAmount: numericValue(row.total_amount, 0),
    status: valueToString(row.status) ?? "Queued",
    cufeOrCude: row.cufe ?? row.cude ?? row.cuv ?? null,
  };
}

function statementRow(row: JsonRecord, documentType: "Invoice" | "CreditNote"): JsonRecord {
  const amount = numericValue(row.total_amount, 0);
  return {
    date: dateValue(row.created_at),
    documentType,
    number: valueToString(row.assigned_invoice_number ?? row.assigned_credit_note_number) ?? valueToString(row.id) ?? "",
    description: documentType === "Invoice" ? "Invoice" : "Credit note",
    debit: documentType === "Invoice" ? amount : 0,
    credit: documentType === "CreditNote" ? amount : 0,
    runningBalance: 0,
  };
}

function resolutionUsageRow(row: JsonRecord, type: "Invoice" | "CreditNote"): JsonRecord {
  const from = numericValue(row.from_number, 0);
  const to = numericValue(row.to_number, 0);
  const next = numericValue(row.next_number, from);
  const range = Math.max(to - from + 1, 0);
  const used = Math.max(next - from, 0);
  const remaining = Math.max(to - next + 1, 0);
  const daysRemaining = Math.ceil((dateMillis(row.valid_to) - Date.now()) / 86_400_000);
  return {
    resolutionNumber: valueToString(row.resolution_number) ?? "",
    prefix: valueToString(row.prefix) ?? "",
    type,
    rangeFrom: from,
    rangeTo: to,
    used,
    remaining,
    percentUsed: range === 0 ? 0 : Math.min(100, (used / range) * 100),
    validFrom: valueToString(row.valid_from) ?? "",
    validTo: valueToString(row.valid_to) ?? "",
    daysRemaining,
    status: !row.is_active || daysRemaining < 0 ? "Expired" : remaining <= 0 ? "Exhausted" : "Active",
  };
}

function ripsDispatchRow(
  row: JsonRecord,
  clients: Map<string, string>,
  documentType: "Invoice" | "CreditNote",
  attempts: DispatchAttempt[] = [],
): JsonRecord {
  const status = valueToString(row.status) ?? "Queued";
  const ripsAttempts = ripsDispatchAttempts(attempts);
  const latestAttempt = ripsAttempts[0];
  const accepted = Boolean(row.cuv) || ripsAttempts.some((attempt) => attempt.succeeded);
  const failed = status.toLowerCase() === "failed" || Boolean(latestAttempt && !latestAttempt.succeeded);
  return {
    date: dateValue(row.created_at),
    documentType,
    number: valueToString(row.assigned_invoice_number ?? row.assigned_credit_note_number) ?? valueToString(row.id) ?? "",
    clientName: clients.get(valueToString(row.client_id) ?? "") ?? "",
    ripsStatus: accepted ? "Accepted" : failed ? "Failed" : row.rips_queued_at_utc ? "Pending" : "NotSubmitted",
    lastAttemptDate: latestAttempt ? dateValue(latestAttempt.attemptedAtUtc) : row.rips_queued_at_utc ? dateValue(row.rips_queued_at_utc) : null,
    errorMessage: latestAttempt?.errorMessage ?? row.status_message ?? null,
  };
}

function reportMatches(row: JsonRecord, params: URLSearchParams): boolean {
  const clientId = params.get("clientId");
  const status = params.get("status");
  const documentType = params.get("documentType");
  const dateFrom = params.get("dateFrom");
  const dateTo = params.get("dateTo");
  if (clientId && row.clientId !== clientId) return false;
  if (status && valueToString(row.status)?.toLowerCase() !== status.toLowerCase()) return false;
  if (documentType && valueToString(row.documentType)?.toLowerCase() !== documentType.toLowerCase()) return false;
  if (dateFrom && dateMillis(row.date) < dateMillis(dateFrom)) return false;
  if (dateTo && dateMillis(row.date) > dateMillis(dateTo)) return false;
  return true;
}

function filterLegacyFinancialRows(rows: JsonRecord[], collection: string, params: URLSearchParams): JsonRecord[] {
  return rows.filter((row) => {
    if (!stringIncludes(row.clientName, params.get("clientName"))) return false;
    if (!stringIncludes(row.status, params.get("status"))) return false;
    if (!stringIncludes(row.submittedByDisplayName ?? row.submittedByUserId, params.get("submittedBy"))) return false;
    if (!dateWithin(row.createdAt, params.get("createdFrom"), params.get("createdTo"))) return false;
    if (!numberWithin(numericValue(row.totalAmount, 0), params.get("totalMin"), params.get("totalMax"))) return false;

    if (collection === "invoice-drafts") {
      return stringIncludes(row.assignedInvoiceNumber ?? row.id, params.get("invoiceNumber"));
    }

    return stringIncludes(row.assignedCreditNoteNumber ?? row.id, params.get("creditNoteNumber"))
      && stringIncludes(row.originalInvoiceNumber, params.get("originalInvoiceNumber"));
  });
}

function sortLegacyFinancialRows(rows: JsonRecord[], collection: string, params: URLSearchParams): JsonRecord[] {
  const sortBy = legacySortField(collection, params.get("sortBy"));
  const direction = params.get("sortDirection")?.toLowerCase() === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => compareSortValues(a[sortBy], b[sortBy]) * direction);
}

function legacySortField(collection: string, sortBy: string | null): string {
  const normalized = normalizeToken(sortBy ?? "");
  const fields: Record<string, string> = collection === "invoice-drafts"
    ? {
        invoicenumber: "assignedInvoiceNumber",
        assignedinvoicenumber: "assignedInvoiceNumber",
        clientname: "clientName",
        status: "status",
        submittedby: "submittedByDisplayName",
        createdat: "createdAt",
        updatedat: "updatedAt",
        totalamount: "totalAmount",
      }
    : {
        creditnotenumber: "assignedCreditNoteNumber",
        assignedcreditnotenumber: "assignedCreditNoteNumber",
        originalinvoicenumber: "originalInvoiceNumber",
        clientname: "clientName",
        status: "status",
        createdat: "createdAt",
        updatedat: "updatedAt",
        totalamount: "totalAmount",
      };
  return fields[normalized] ?? "createdAt";
}

function stringIncludes(value: unknown, needle: string | null): boolean {
  if (!needle?.trim()) return true;
  return valueToString(value)?.toLowerCase().includes(needle.trim().toLowerCase()) ?? false;
}

function dateWithin(value: unknown, from: string | null, to: string | null): boolean {
  const millis = dateMillis(value);
  if (from && millis < Date.parse(from)) return false;
  if (to && millis > Date.parse(to)) return false;
  return true;
}

function numberWithin(value: number, min: string | null, max: string | null): boolean {
  const minValue = min?.trim() ? Number(min) : null;
  const maxValue = max?.trim() ? Number(max) : null;
  if (minValue !== null && Number.isFinite(minValue) && value < minValue) return false;
  if (maxValue !== null && Number.isFinite(maxValue) && value > maxValue) return false;
  return true;
}

function compareSortValues(a: unknown, b: unknown): number {
  const aNumber = typeof a === "number" ? a : Number.NaN;
  const bNumber = typeof b === "number" ? b : Number.NaN;
  if (Number.isFinite(aNumber) && Number.isFinite(bNumber)) return aNumber - bNumber;

  const aDate = typeof a === "string" ? Date.parse(a) : Number.NaN;
  const bDate = typeof b === "string" ? Date.parse(b) : Number.NaN;
  if (Number.isFinite(aDate) && Number.isFinite(bDate)) return aDate - bDate;

  return String(a ?? "").localeCompare(String(b ?? ""));
}

function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  return items.slice((page - 1) * pageSize, page * pageSize);
}

async function getTenantItems(env: Bindings, tenant: TenantResponse, collection: string): Promise<JsonRecord[]> {
  const body = await fetchTenantDoJson(env, tenant, `/rips-admin/${collection}?limit=500&direction=asc`);
  return itemArray(body);
}

async function getTenantItem(env: Bindings, tenant: TenantResponse, collection: string, id: string): Promise<JsonRecord | null> {
  const response = await fetchTenantDo(env, tenant, `/rips-admin/${collection}/${id}`);
  if (response.status === 404) return null;
  const body = await response.json() as { item?: unknown };
  return body.item ? asObject(body.item) : null;
}

async function upsertTenantItem(env: Bindings, tenant: TenantResponse, collection: string, item: JsonRecord): Promise<JsonRecord> {
  const response = await fetchTenantDo(env, tenant, `/rips-admin/${collection}/${valueToString(item.id) ?? crypto.randomUUID()}`, new Request(`${DO_ORIGIN}/item`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(item),
  }));
  const body = await response.json();
  return asObject((body as { item?: unknown }).item ?? body);
}

async function getClientNameMap(env: Bindings, tenant: TenantResponse): Promise<Map<string, string>> {
  const clients = await getTenantItems(env, tenant, "clients");
  return new Map(clients.map((client) => [valueToString(client.id) ?? "", legacyClientName(client)]));
}

async function getInvoiceMap(env: Bindings, tenant: TenantResponse): Promise<Map<string, JsonRecord>> {
  const invoices = await getTenantItems(env, tenant, "invoice-drafts");
  return new Map(invoices.map((invoice) => [valueToString(invoice.id) ?? "", invoice]));
}

async function getClientName(env: Bindings, tenant: TenantResponse, clientId: string): Promise<string> {
  if (!clientId) return "";
  const client = await getTenantItem(env, tenant, "clients", clientId);
  return client ? legacyClientName(client) : "";
}

function legacyClientName(client: JsonRecord): string {
  return valueToString(client.company_name ?? client.companyName ?? client.commercial_name ?? client.commercialName) ?? "";
}

function mapInvoiceForCreditNote(tenant: TenantResponse, row: JsonRecord, clientName: string): JsonRecord {
  return {
    id: row.id,
    invoiceNumber: row.assigned_invoice_number ?? null,
    cufe: row.cufe ?? null,
    issueDate: dateValue(row.created_at),
    totalAmount: numericValue(row.total_amount, 0),
    clientName,
    clientId: row.client_id,
    locationId: row.location_id ?? "",
    tenantId: tenant.id,
  };
}

function invoiceSettings(tenant: TenantResponse): JsonRecord {
  return {
    token: tenant.invoiceApiToken,
    invoiceProvider: invoiceProviderNumber(tenant.invoiceProvider),
  };
}

async function dispatchCreatedFinancialDocument(
  env: Bindings,
  tenant: TenantResponse,
  collection: string,
  body: unknown,
): Promise<unknown> {
  const item = asObject((body as { item?: unknown }).item ?? body);
  const id = valueToString(item.id);
  if (!id) return body;

  const dispatched = collection === "invoice-drafts"
    ? await dispatchInvoiceDraft(env, tenant, item)
    : await dispatchCreditNoteDraft(env, tenant, item);
  return { item: dispatched.row };
}

async function dispatchInvoiceDraft(
  env: Bindings,
  tenant: TenantResponse,
  invoice: JsonRecord,
): Promise<{ row: JsonRecord; succeeded: boolean }> {
  const invoiceId = valueToString(invoice.id) ?? "";
  const payload = asObject(parseJsonString(invoice.invoice_payload_json, {}));
  if (!invoiceId || !Object.keys(payload).length) {
    return failProviderDispatch(env, tenant, "invoice-drafts", invoice, "Invoice", "Invoice payload missing.", "{}");
  }

  if (!tenant.invoiceApiToken) {
    return failProviderDispatch(env, tenant, "invoice-drafts", invoice, "Invoice", "Tenant is missing the invoice provider token.", jsonString(payload, "{}"));
  }

  const providerName = normalizeInvoiceProvider(tenant.invoiceProvider);
  if (providerName !== "monaros" && providerName !== "ledger") {
    return failProviderDispatch(
      env,
      tenant,
      "invoice-drafts",
      invoice,
      "Invoice",
      `Invoice provider '${tenant.invoiceProvider}' is not supported. Supported providers are Monaros and Ledger.`,
      jsonString(payload, "{}"),
    );
  }

  const reservation = await resolveInvoiceReservation(env, tenant, invoice);
  if ("error" in reservation) {
    return failProviderDispatch(env, tenant, "invoice-drafts", invoice, "Invoice", reservation.error, jsonString(payload, "{}"));
  }

  const requestPayload = normalizeInvoiceDispatchPayload(payload, reservation);
  let requestPayloadJson = JSON.stringify(requestPayload);
  const totalAmount = payableAmount(requestPayload, numericValue(invoice.total_amount, 0));

  try {
    const provider = providerName === "ledger"
      ? await postLedgerProvider(env, tenant, "invoice", invoice, requestPayload)
      : await postMonarosProvider(env, tenant, "invoice", requestPayload);
    requestPayloadJson = provider.rawRequestBody ?? requestPayloadJson;
    const status = providerResponseStatus(provider.body, "invoice");
    let ripsPayloadPatch: JsonRecord = {};
    if (status.succeeded && invoiceKindName(invoice.kind) === "Health") {
      const prepared = await prepareInvoiceRipsPayload(env, tenant, invoice, provider.body, reservation.fullNumber);
      if ("error" in prepared) {
        const failedRow = await persistProviderDispatchResult(env, tenant, "invoice-drafts", invoice, {
          documentType: "Invoice",
          requestPayload: requestPayloadJson,
          responsePayload: provider.rawBody,
          succeeded: false,
          attemptSucceeded: true,
          errorMessage: prepared.error,
          patch: {
            assignedInvoiceNumber: reservation.fullNumber,
            invoicePayloadJson: requestPayloadJson,
            totalAmount,
            cufe: status.identifier,
            dianStatusCode: status.statusCode,
            dianStatusDescription: status.statusDescription,
            status: "Failed",
            statusMessage: prepared.error,
          },
        });
        return { row: failedRow, succeeded: false };
      }
      ripsPayloadPatch = { ripsPayloadJson: prepared.payloadJson };
    }
    const row = await persistProviderDispatchResult(env, tenant, "invoice-drafts", invoice, {
      documentType: "Invoice",
      requestPayload: requestPayloadJson,
      responsePayload: provider.rawBody,
      succeeded: status.succeeded,
      errorMessage: status.errorMessage,
      patch: {
        assignedInvoiceNumber: reservation.fullNumber,
        invoicePayloadJson: requestPayloadJson,
        totalAmount,
        cufe: status.identifier,
        dianStatusCode: status.statusCode,
        dianStatusDescription: status.statusDescription,
        status: status.succeeded ? invoiceKindName(invoice.kind) === "Health" ? "Processing" : "Sent" : "Failed",
        statusMessage: status.succeeded
          ? invoiceKindName(invoice.kind) === "Health"
            ? "Invoice validated successfully by DIAN."
            : "Invoice validated successfully by DIAN."
          : status.errorMessage ?? "Invoice provider validation failed.",
        ripsQueuedAtUtc: status.succeeded && invoiceKindName(invoice.kind) === "Health" ? Date.now() : invoice.rips_queued_at_utc,
        ...ripsPayloadPatch,
      },
    });
    if (!status.succeeded) return { row, succeeded: false };
    if (invoiceKindName(row.kind) !== "Health") {
      return { row: await maybeDispatchInvoiceEmail(env, tenant, row), succeeded: true };
    }
    return dispatchRipsDocument(env, tenant, "invoice-drafts", row, "Invoice");
  } catch (err) {
    return failProviderDispatch(
      env,
      tenant,
      "invoice-drafts",
      invoice,
      "Invoice",
      err instanceof Error ? err.message : "Invoice provider dispatch failed.",
      requestPayloadJson,
      {
        assignedInvoiceNumber: reservation.fullNumber,
        invoicePayloadJson: requestPayloadJson,
        totalAmount,
      },
    );
  }
}

async function dispatchCreditNoteDraft(
  env: Bindings,
  tenant: TenantResponse,
  creditNote: JsonRecord,
): Promise<{ row: JsonRecord; succeeded: boolean }> {
  const creditNoteId = valueToString(creditNote.id) ?? "";
  const payload = asObject(parseJsonString(creditNote.credit_note_payload_json, {}));
  if (!creditNoteId || !Object.keys(payload).length) {
    return failProviderDispatch(env, tenant, "credit-note-drafts", creditNote, "CreditNote", "Credit note payload missing.", "{}");
  }

  if (!tenant.invoiceApiToken) {
    return failProviderDispatch(env, tenant, "credit-note-drafts", creditNote, "CreditNote", "Tenant is missing the invoice provider token.", jsonString(payload, "{}"));
  }

  const providerName = normalizeInvoiceProvider(tenant.invoiceProvider);
  if (providerName !== "monaros" && providerName !== "ledger") {
    return failProviderDispatch(
      env,
      tenant,
      "credit-note-drafts",
      creditNote,
      "CreditNote",
      `Invoice provider '${tenant.invoiceProvider}' is not supported. Supported providers are Monaros and Ledger.`,
      jsonString(payload, "{}"),
    );
  }

  const reservation = await resolveCreditNoteReservation(env, tenant, creditNote);
  if ("error" in reservation) {
    return failProviderDispatch(env, tenant, "credit-note-drafts", creditNote, "CreditNote", reservation.error, jsonString(payload, "{}"));
  }

  const requestPayload = normalizeCreditNoteDispatchPayload(payload, reservation);
  let requestPayloadJson = JSON.stringify(requestPayload);
  const totalAmount = payableAmount(requestPayload, numericValue(creditNote.total_amount, 0));

  try {
    const provider = providerName === "ledger"
      ? await postLedgerProvider(env, tenant, "credit-note", creditNote, requestPayload)
      : await postMonarosProvider(env, tenant, "credit-note", requestPayload);
    requestPayloadJson = provider.rawRequestBody ?? requestPayloadJson;
    const status = providerResponseStatus(provider.body, "credit-note");
    let ripsPayloadPatch: JsonRecord = {};
    let skipRips = false;
    if (status.succeeded && invoiceKindName(creditNote.kind) === "Health") {
      const prepared = await prepareCreditNoteRipsPayload(env, tenant, creditNote, provider.body, reservation.fullNumber);
      if ("error" in prepared) {
        const failedRow = await persistProviderDispatchResult(env, tenant, "credit-note-drafts", creditNote, {
          documentType: "CreditNote",
          requestPayload: requestPayloadJson,
          responsePayload: provider.rawBody,
          succeeded: false,
          attemptSucceeded: true,
          errorMessage: prepared.error,
          patch: {
            assignedCreditNoteNumber: reservation.fullNumber,
            creditNotePayloadJson: requestPayloadJson,
            totalAmount,
            cude: status.identifier,
            dianStatusCode: status.statusCode,
            dianStatusDescription: status.statusDescription,
            status: "Failed",
            statusMessage: prepared.error,
          },
        });
        return { row: failedRow, succeeded: false };
      }
      if ("skipRips" in prepared) {
        skipRips = true;
      } else {
        ripsPayloadPatch = { ripsPayloadJson: prepared.payloadJson };
      }
    }
    const row = await persistProviderDispatchResult(env, tenant, "credit-note-drafts", creditNote, {
      documentType: "CreditNote",
      requestPayload: requestPayloadJson,
      responsePayload: provider.rawBody,
      succeeded: status.succeeded,
      errorMessage: status.errorMessage,
      patch: {
        assignedCreditNoteNumber: reservation.fullNumber,
        creditNotePayloadJson: requestPayloadJson,
        totalAmount,
        cude: status.identifier,
        dianStatusCode: status.statusCode,
        dianStatusDescription: status.statusDescription,
        status: status.succeeded ? invoiceKindName(creditNote.kind) === "Health" && !skipRips ? "Processing" : "Sent" : "Failed",
        statusMessage: status.succeeded
          ? invoiceKindName(creditNote.kind) === "Health" && !skipRips
            ? "Credit note validated successfully by DIAN."
            : "Credit note validated successfully by DIAN."
          : status.errorMessage ?? "Credit note provider validation failed.",
        ripsQueuedAtUtc: status.succeeded && invoiceKindName(creditNote.kind) === "Health" && !skipRips ? Date.now() : creditNote.rips_queued_at_utc,
        ...ripsPayloadPatch,
      },
    });
    if (!status.succeeded) return { row, succeeded: false };
    if (invoiceKindName(row.kind) !== "Health" || skipRips) {
      return { row: await maybeDispatchCreditNoteEmail(env, tenant, row), succeeded: true };
    }
    return dispatchRipsDocument(env, tenant, "credit-note-drafts", row, "CreditNote");
  } catch (err) {
    return failProviderDispatch(
      env,
      tenant,
      "credit-note-drafts",
      creditNote,
      "CreditNote",
      err instanceof Error ? err.message : "Credit note provider dispatch failed.",
      requestPayloadJson,
      {
        assignedCreditNoteNumber: reservation.fullNumber,
        creditNotePayloadJson: requestPayloadJson,
        totalAmount,
      },
    );
  }
}

async function failProviderDispatch(
  env: Bindings,
  tenant: TenantResponse,
  collection: "invoice-drafts" | "credit-note-drafts",
  row: JsonRecord,
  documentType: "Invoice" | "CreditNote",
  errorMessage: string,
  requestPayload: string,
  extraPatch: JsonRecord = {},
): Promise<{ row: JsonRecord; succeeded: boolean }> {
  const updated = await persistProviderDispatchResult(env, tenant, collection, row, {
    documentType,
    requestPayload,
    responsePayload: JSON.stringify({ error: errorMessage }),
    succeeded: false,
    errorMessage,
    patch: {
      ...extraPatch,
      status: "Failed",
      statusMessage: errorMessage,
    },
  });
  return { row: updated, succeeded: false };
}

async function persistProviderDispatchResult(
  env: Bindings,
  tenant: TenantResponse,
  collection: "invoice-drafts" | "credit-note-drafts",
  row: JsonRecord,
  result: {
    documentType: "Invoice" | "CreditNote";
    requestPayload: string;
    responsePayload: string;
    succeeded: boolean;
    attemptSucceeded?: boolean;
    errorMessage: string | null;
    patch: JsonRecord;
  },
): Promise<JsonRecord> {
  const documentId = valueToString(row.id) ?? crypto.randomUUID();
  await upsertTenantItem(env, tenant, "dispatch-attempts", {
    documentType: result.documentType,
    documentId,
    channel: result.documentType === "Invoice" ? "InvoiceProvider" : "DIAN",
    provider: tenant.invoiceProvider,
    attemptedAtUtc: Date.now(),
    succeeded: result.attemptSucceeded ?? result.succeeded,
    requestPayload: result.requestPayload,
    responsePayload: result.responsePayload,
    errorMessage: result.errorMessage,
  });
  return upsertTenantItem(env, tenant, collection, {
    id: documentId,
    ...result.patch,
  });
}

async function resolveInvoiceReservation(
  env: Bindings,
  tenant: TenantResponse,
  invoice: JsonRecord,
): Promise<{ prefix: string; number: string; resolutionNumber: string; fullNumber: string } | { error: string }> {
  const payload = asObject(parseJsonString(invoice.invoice_payload_json, {}));
  const assigned = valueToString(invoice.assigned_invoice_number ?? invoice.assignedInvoiceNumber);
  const payloadPrefix = valueToString(payload.prefix);
  const payloadResolutionNumber = valueToString(payload.resolution_number);
  if (assigned) {
    const prefix = payloadPrefix ?? "";
    return {
      prefix,
      number: prefix && assigned.startsWith(prefix) ? assigned.slice(prefix.length) : assigned,
      resolutionNumber: payloadResolutionNumber ?? "",
      fullNumber: assigned,
    };
  }

  const resolutionId = valueToString(invoice.invoice_resolution_id ?? invoice.invoiceResolutionId);
  const resolution = resolutionId ? await getTenantItem(env, tenant, "resolutions", resolutionId) : null;
  if (!resolution) {
    const payloadNumber = valueToString(payload.number);
    if (payloadPrefix && payloadNumber) {
      return {
        prefix: payloadPrefix,
        number: payloadNumber,
        resolutionNumber: payloadResolutionNumber ?? "",
        fullNumber: `${payloadPrefix}${payloadNumber}`,
      };
    }
    return { error: "Invoice resolution not found for this draft." };
  }

  const validityError = validateResolutionForToday(resolution, "Invoice");
  if (validityError) return { error: validityError };

  const next = numericValue(resolution.next_number, 0);
  const to = numericValue(resolution.to_number, 0);
  if (next > to) return { error: "Invoice resolution range exhausted." };

  await upsertTenantItem(env, tenant, "resolutions", {
    id: resolution.id,
    nextNumber: next + 1,
  });

  const prefix = valueToString(resolution.prefix) ?? "";
  const number = String(next).padStart(String(to).length, "0");
  return {
    prefix,
    number,
    resolutionNumber: valueToString(resolution.resolution_number) ?? "",
    fullNumber: `${prefix}${number}`,
  };
}

async function resolveCreditNoteReservation(
  env: Bindings,
  tenant: TenantResponse,
  creditNote: JsonRecord,
): Promise<{ prefix: string; number: string; resolutionNumber: string; fullNumber: string } | { error: string }> {
  const payload = asObject(parseJsonString(creditNote.credit_note_payload_json, {}));
  const payloadPrefix = valueToString(payload.prefix);
  const payloadResolutionNumber = valueToString(payload.resolution_number);
  const resolutionId = valueToString(creditNote.credit_note_resolution_id ?? creditNote.creditNoteResolutionId);
  const resolution = resolutionId ? await getTenantItem(env, tenant, "credit-note-resolutions", resolutionId) : null;

  if (!resolution) {
    const payloadNumber = valueToString(payload.number);
    if (payloadPrefix && payloadNumber) {
      return {
        prefix: payloadPrefix,
        number: payloadNumber,
        resolutionNumber: payloadResolutionNumber ?? "",
        fullNumber: `${payloadPrefix}${payloadNumber}`,
      };
    }
    return { error: "Credit note resolution not found for this draft." };
  }

  const validityError = validateResolutionForToday(resolution, "Credit note");
  if (validityError) return { error: validityError };

  const next = numericValue(resolution.next_number, 0);
  const to = numericValue(resolution.to_number, 0);
  if (next > to) return { error: "Credit note resolution range exhausted." };

  await upsertTenantItem(env, tenant, "credit-note-resolutions", {
    id: resolution.id,
    nextNumber: next + 1,
  });

  const prefix = valueToString(resolution.prefix) ?? "";
  const number = String(next);
  return {
    prefix,
    number,
    resolutionNumber: valueToString(resolution.resolution_number) ?? "",
    fullNumber: `${prefix}${number}`,
  };
}

function validateResolutionForToday(resolution: JsonRecord, label: string): string | null {
  const today = bogotaDateTime().date;
  const validFrom = valueToString(resolution.valid_from);
  const validTo = valueToString(resolution.valid_to);
  if (validFrom && today < validFrom.slice(0, 10)) return `${label} resolution is not valid for the current date.`;
  if (validTo && today > validTo.slice(0, 10)) return `${label} resolution is not valid for the current date.`;
  if (resolution.is_active === 0 || resolution.is_active === false) return `${label} resolution is inactive.`;
  return null;
}

function normalizeInvoiceDispatchPayload(
  payload: JsonRecord,
  reservation: { prefix: string; number: string; resolutionNumber: string },
): JsonRecord {
  const now = bogotaDateTime();
  return {
    ...payload,
    prefix: reservation.prefix,
    number: reservation.number.replace(/^0+(?=\d)/, "") || reservation.number,
    resolution_number: reservation.resolutionNumber || payload.resolution_number,
    date: now.date,
    time: now.time,
  };
}

function normalizeCreditNoteDispatchPayload(
  payload: JsonRecord,
  reservation: { prefix: string; number: string; resolutionNumber: string },
): JsonRecord {
  const now = bogotaDateTime();
  const numericNumber = Number(reservation.number);
  return {
    ...payload,
    prefix: reservation.prefix,
    number: Number.isFinite(numericNumber) ? numericNumber : reservation.number,
    resolution_number: reservation.resolutionNumber || payload.resolution_number,
    date: now.date,
    time: now.time,
  };
}

async function postMonarosProvider(
  env: Bindings,
  tenant: TenantResponse,
  endpoint: "invoice" | "credit-note",
  payload: JsonRecord,
): Promise<ProviderPostResult> {
  const response = await fetch(new URL(endpoint, ensureTrailingSlash(env.RIPS_ADMIN_MONAROS_BASE_URL ?? MONAROS_BASE_URL)).toString(), {
    method: "POST",
    headers: {
      "authorization": `Bearer ${tenant.invoiceApiToken ?? ""}`,
      "content-type": "application/json",
      "accept": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const rawBody = await response.text();
  const body = parseJsonString(rawBody, { rawBody });
  if (!response.ok) {
    const message = valueToString((body as { message?: unknown }).message)
      ?? valueToString((body as { error?: unknown }).error)
      ?? `Provider returned HTTP ${response.status}.`;
    throw new Error(message);
  }
  return { body, rawBody };
}

async function postLedgerProvider(
  env: Bindings,
  tenant: TenantResponse,
  kind: DocumentKind,
  row: JsonRecord,
  payload: JsonRecord,
): Promise<ProviderPostResult> {
  const nit = valueToString(tenant.invoiceApiToken) ?? tenant.nit;
  const emitRequest = kind === "invoice"
    ? await ledgerInvoiceEmitRequest(env, tenant, row, payload, nit)
    : await ledgerCreditNoteEmitRequest(env, tenant, row, payload, nit);
  const rawRequestBody = JSON.stringify(emitRequest);
  const endpoint = kind === "invoice" ? "bridge/sales/invoices/emit" : "bridge/sales/credit-notes/emit";
  const emit = await ledgerFetchJson(env, tenant, `${nit}/${endpoint}`, {
    method: "POST",
    body: rawRequestBody,
  }, true);
  const processId = valueToString(asObject(emit.body).processId);
  if (!processId) throw new Error("Ledger emit response did not include a processId.");

  const processState = await pollLedgerProcess(env, tenant, nit, processId);
  const body = ledgerProviderResponse(kind, processState, nit, ledgerDocumentId(payload));
  return {
    body,
    rawBody: JSON.stringify(body),
    rawRequestBody,
  };
}

async function pollLedgerProcess(
  env: Bindings,
  tenant: TenantResponse,
  nit: string,
  processId: string,
): Promise<JsonRecord> {
  const maxAttempts = Math.max(1, Math.min(100, numericValue(env.RIPS_ADMIN_LEDGER_MAX_POLL_ATTEMPTS, 40)));
  const intervalMs = Math.max(250, Math.min(15_000, numericValue(env.RIPS_ADMIN_LEDGER_POLL_INTERVAL_MS, 3_000)));

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const state = await ledgerFetchJson(env, tenant, `${nit}/bridge/processes/${encodeURIComponent(processId)}`, {
      method: "GET",
    }, false);
    const body = asObject(state.body);
    const status = valueToString(body.status)?.toLowerCase();
    if (status === "completed" || status === "failed") return body;
    if (attempt < maxAttempts - 1) await sleep(intervalMs);
  }

  throw new Error(`Ledger process ${processId} did not complete within ${maxAttempts} polling attempts.`);
}

async function ledgerFetchJson(
  env: Bindings,
  tenant: TenantResponse,
  path: string,
  init: { method: "GET" | "POST"; body?: string },
  retryOnServerError: boolean,
): Promise<{ body: unknown; rawBody: string }> {
  const attempts = retryOnServerError ? 3 : 1;
  let lastError: string | null = null;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const headers = new Headers({ accept: "application/json" });
    if (init.body !== undefined) headers.set("content-type", "application/json");
    const apiKey = valueToString(env.RIPS_ADMIN_LEDGER_API_KEY);
    if (apiKey) headers.set("x-api-key", apiKey);

    const response = await fetch(new URL(path.replace(/^\/+/, ""), ledgerBaseUrl(env, tenant.environment, false)).toString(), {
      method: init.method,
      headers,
      body: init.body,
    });
    const rawBody = await response.text();
    const body = parseJsonString(rawBody, { rawBody });
    if (response.ok) return { body, rawBody };

    const parsed = asObject(body);
    lastError = valueToString(parsed.message ?? parsed.error ?? parsed.detail)
      ?? `Ledger returned HTTP ${response.status}.`;
    if (!retryOnServerError || response.status < 500 || attempt === attempts - 1) break;
    await sleep(250 * (attempt + 1));
  }

  throw new Error(lastError ?? "Ledger request failed.");
}

async function ledgerInvoiceEmitRequest(
  env: Bindings,
  tenant: TenantResponse,
  row: JsonRecord,
  request: JsonRecord,
  nit: string,
): Promise<JsonRecord> {
  const documentId = ledgerDocumentId(request);
  const issueDate = ledgerIssueDateTime(request);
  const customizationId = ledgerCustomizationId(payloadObject(request, "health_fields", "healthFields"));
  const additionalData = await ledgerInvoiceAdditionalData(env, tenant, row, request, customizationId);
  const out: JsonRecord = {
    sourceDocumentId: documentId,
    idempotencyKey: valueToString(row.id) ?? crypto.randomUUID(),
    issueDate,
    payload: {
      documentId,
      issueDateTime: issueDate,
      currency: "COP",
      notes: [],
      paymentMeans: ledgerPaymentMeans(payloadObject(request, "payment_form", "paymentForm")),
      allowanceCharges: null,
      taxTotals: ledgerTaxTotals(payloadArray(request, "tax_totals", "taxTotals")),
      monetaryTotals: ledgerMonetaryTotals(payloadObject(request, "legal_monetary_totals", "legalMonetaryTotals")),
      invoiceTypeCode: ledgerInvoiceTypeCode(payloadNumber(request, 1, "type_document_id", "typeDocumentId")),
      operationTypeCode: "10",
      seller: ledgerSeller(tenant, nit),
      buyer: ledgerBuyer(payloadObject(request, "customer")),
      lines: ledgerLines(payloadArray(request, "invoice_lines", "invoiceLines"), false),
      healthSector: ledgerHealthSector(payloadObject(request, "health_fields", "healthFields")),
      deliveryDate: ledgerDeliveryDate(request),
      purchaseOrderReference: null,
      additionalData,
    },
  };
  const testSetId = tenant.environment === 2 ? valueToString(env.RIPS_ADMIN_LEDGER_HABILITACION_TEST_SET_ID) : null;
  if (testSetId) out.testSetId = testSetId;
  return out;
}

async function ledgerCreditNoteEmitRequest(
  env: Bindings,
  tenant: TenantResponse,
  row: JsonRecord,
  request: JsonRecord,
  nit: string,
): Promise<JsonRecord> {
  const documentId = ledgerDocumentId(request);
  const issueDate = ledgerIssueDateTime(request);
  const billingReference = payloadObject(request, "billing_reference", "billingReference");
  const discrepancyCode = payloadNumber(
    request,
    numericValue(row.discrepancy_response_code, 0),
    "discrepancy_response_code",
    "discrepancyResponseCode",
  );
  return {
    sourceDocumentId: documentId,
    idempotencyKey: valueToString(row.id) ?? crypto.randomUUID(),
    issueDate,
    payload: {
      documentId,
      issueDateTime: issueDate,
      currency: "COP",
      notes: valueToString(request.notes) ? [valueToString(request.notes)] : [],
      paymentMeans: ledgerPaymentMeans(payloadObject(request, "payment_form", "paymentForm")),
      allowanceCharges: null,
      taxTotals: ledgerTaxTotals(payloadArray(request, "tax_totals", "taxTotals")),
      monetaryTotals: ledgerMonetaryTotals(payloadObject(request, "legal_monetary_totals", "legalMonetaryTotals")),
      creditNoteTypeCode: "91",
      seller: ledgerSeller(tenant, nit),
      buyer: ledgerBuyer(payloadObject(request, "customer")),
      billingReference: {
        documentId: payloadString(billingReference, "number", "documentId") ?? "",
        uuid: payloadString(billingReference, "uuid"),
        issueDate: payloadString(billingReference, "issue_date", "issueDate"),
        documentTypeCode: payloadString(request, "reference_document_type_code", "referenceDocumentTypeCode") ?? "01",
      },
      discrepancyResponse: {
        referenceId: payloadString(billingReference, "number", "documentId"),
        responseCode: String(discrepancyCode),
        description: ledgerCreditNoteDiscrepancyDescription(
          discrepancyCode,
          payloadString(request, "discrepancy_response_description", "discrepancyResponseDescription")
            ?? valueToString(row.discrepancy_response_description),
        ),
      },
      lines: ledgerLines(payloadArray(request, "credit_note_lines", "creditNoteLines"), true),
      additionalData: await ledgerCreditNoteAdditionalData(env, tenant, row, request),
    },
  };
}

async function ledgerInvoiceAdditionalData(
  env: Bindings,
  tenant: TenantResponse,
  row: JsonRecord,
  request: JsonRecord,
  customizationId: string,
): Promise<JsonRecord | null> {
  const resolution = await ledgerResolution(env, tenant, "resolutions", valueToString(row.invoice_resolution_id ?? row.invoiceResolutionId));
  const resolutionNumber = payloadString(request, "resolution_number", "resolutionNumber")
    ?? valueToString(resolution?.resolution_number);
  if (!resolutionNumber) return null;
  const profileExecutionId = tenant.environment === 2 ? "2" : "1";
  const out: JsonRecord = {
    invoiceAuthorization: resolutionNumber,
    authorizationStartDate: dateOnly(resolution?.valid_from) ?? dateOnly(request.valid_from) ?? bogotaDateTime().date,
    authorizationEndDate: dateOnly(resolution?.valid_to) ?? dateOnly(request.valid_to) ?? bogotaDateTime().date,
    authorizedPrefix: valueToString(resolution?.prefix) ?? payloadString(request, "prefix") ?? "",
    authorizedFrom: scalarToString(resolution?.from_number) ?? payloadString(request, "from_number", "fromNumber") ?? "0",
    authorizedTo: scalarToString(resolution?.to_number) ?? payloadString(request, "to_number", "toNumber") ?? "0",
    merchantRegistration: "0000000-00",
    profileExecutionId,
    customizationId,
    profileId: "DIAN 2.1: Factura Electronica de Venta",
  };
  const technicalKey = valueToString(resolution?.technical_key ?? request.technical_key ?? request.technicalKey);
  if (technicalKey) out.technicalKey = technicalKey;
  return out;
}

async function ledgerCreditNoteAdditionalData(
  env: Bindings,
  tenant: TenantResponse,
  row: JsonRecord,
  request: JsonRecord,
): Promise<JsonRecord | null> {
  const resolution = await ledgerResolution(
    env,
    tenant,
    "credit-note-resolutions",
    valueToString(row.credit_note_resolution_id ?? row.creditNoteResolutionId),
  );
  const resolutionNumber = payloadString(request, "resolution_number", "resolutionNumber")
    ?? valueToString(resolution?.resolution_number);
  if (!resolutionNumber) return null;
  const out: JsonRecord = {
    invoiceAuthorization: resolutionNumber,
    authorizationStartDate: dateOnly(resolution?.valid_from) ?? dateOnly(request.valid_from) ?? bogotaDateTime().date,
    authorizationEndDate: dateOnly(resolution?.valid_to) ?? dateOnly(request.valid_to) ?? bogotaDateTime().date,
    authorizedPrefix: valueToString(resolution?.prefix) ?? payloadString(request, "prefix") ?? "",
    authorizedFrom: scalarToString(resolution?.from_number) ?? payloadString(request, "from_number", "fromNumber") ?? "0",
    authorizedTo: scalarToString(resolution?.to_number) ?? payloadString(request, "to_number", "toNumber") ?? "0",
    merchantRegistration: "0000000-00",
    profileExecutionId: tenant.environment === 1 ? "1" : "2",
    customizationId: "20",
    profileId: "DIAN 2.1: Nota Credito de Factura Electronica de Venta",
  };
  const technicalKey = valueToString(resolution?.technical_key ?? request.technical_key ?? request.technicalKey);
  if (technicalKey) out.technicalKey = technicalKey;
  return out;
}

async function ledgerResolution(
  env: Bindings,
  tenant: TenantResponse,
  collection: "resolutions" | "credit-note-resolutions",
  resolutionId: string | null,
): Promise<JsonRecord | null> {
  return resolutionId ? await getTenantItem(env, tenant, collection, resolutionId) : null;
}

function ledgerProviderResponse(kind: DocumentKind, state: JsonRecord, nit: string, sourceDocumentId: string): JsonRecord {
  const result = asObject(state.result);
  const evidence = asObject(result.evidence);
  const status = valueToString(state.status)?.toLowerCase();
  const evidenceStatus = scalarToString(evidence.status);
  const isValid = status === "completed" && (evidenceStatus === "00" || evidenceStatus?.toLowerCase() === "completed");
  const identifier = kind === "invoice"
    ? valueToString(evidence.cufe)
    : valueToString(evidence.cuds ?? evidence.cufe);
  const errorMessage = isValid
    ? null
    : valueToString(state.error ?? evidence.statusDescription) ?? "Ledger validation failed.";
  const documentType = kind === "invoice" ? "sales-invoice" : "sales-credit-note";
  const artifactBase = `${nit}/artifacts/${documentType}/${sourceDocumentId}`;

  return kind === "invoice"
    ? {
      success: isValid,
      message: isValid ? "Validated by DIAN" : errorMessage,
      isValid,
      IsValid: isValid,
      cufe: identifier,
      StatusCode: evidenceStatus ?? (isValid ? "00" : "99"),
      StatusDescription: valueToString(evidence.statusDescription) ?? (isValid ? "Procesado correctamente" : errorMessage),
      ErrorMessage: errorMessage,
      urlInvoiceXml: `${artifactBase}/signedXML`,
      urlInvoicePdf: "",
      urlInvoiceAttached: `${artifactBase}/attachedDocument`,
      invoiceXml: valueToString(result.signedXmlBase64) ?? "",
      unsignedInvoiceXml: valueToString(result.xmlBase64) ?? "",
      attachedDocument: `${artifactBase}/attachedDocument`,
      ledgerProcess: state,
    }
    : {
      success: isValid,
      message: isValid ? "Validated by DIAN" : errorMessage,
      isValid,
      IsValid: isValid,
      cude: identifier,
      StatusCode: evidenceStatus ?? (isValid ? "00" : "99"),
      StatusDescription: valueToString(evidence.statusDescription) ?? (isValid ? "Procesado correctamente" : errorMessage),
      ErrorMessage: errorMessage,
      urlCreditNoteXml: `${artifactBase}/signedXML`,
      urlCreditNotePdf: "",
      urlCreditNoteAttached: `${artifactBase}/attachedDocument`,
      creditNoteXml: valueToString(result.signedXmlBase64) ?? "",
      attachedDocument: `${artifactBase}/attachedDocument`,
      ledgerProcess: state,
    };
}

function ledgerSeller(tenant: TenantResponse, nit: string): JsonRecord {
  const municipalityCode = valueToString(tenant.municipalityCode) ?? "11001";
  const departmentCode = valueToString(tenant.departmentCode) ?? municipalityCode.slice(0, 2);
  return {
    identification: {
      type: "NIT",
      number: nit,
      dv: computeNitDv(nit) ?? valueToString(tenant.verificationDigit),
    },
    legalName: tenant.companyName || " ",
    tradeName: tenant.commercialName,
    email: tenant.email,
    phone: tenant.phoneNumber,
    address: {
      line1: tenant.address || " ",
      line2: null,
      cityCode: municipalityCode,
      cityName: null,
      departmentCode,
      departmentName: null,
      countryCode: "CO",
      postalZone: municipalityCode,
    },
    contact: {
      name: tenant.companyName,
      email: tenant.email,
      phone: tenant.phoneNumber,
    },
    taxScheme: {
      regimeCode: ledgerRegimeCode(tenant.taxRegime),
      responsibilities: ledgerSellerResponsibilities(tenant.taxRegime),
      isLargeTaxpayer: false,
      isSelfWithholder: false,
    },
  };
}

function ledgerBuyer(customer: JsonRecord): JsonRecord {
  const docType = ledgerDocumentType(payloadNumber(customer, 0, "type_document_identification_id", "typeDocumentIdentificationId"));
  const documentNumber = payloadString(customer, "identification_number", "identificationNumber") ?? "";
  const municipalityCode = payloadString(customer, "municipality_code", "municipalityCode")
    ?? String(payloadNumber(customer, 0, "municipality_id", "municipalityId")).padStart(5, "0");
  return {
    identification: {
      type: docType,
      number: documentNumber,
      dv: docType === "NIT" ? computeNitDv(documentNumber) ?? payloadString(customer, "dv") : payloadString(customer, "dv"),
    },
    legalName: payloadString(customer, "name") ?? " ",
    tradeName: null,
    email: payloadString(customer, "email"),
    phone: payloadString(customer, "phone"),
    address: {
      line1: payloadString(customer, "address") ?? " ",
      line2: null,
      cityCode: municipalityCode,
      cityName: null,
      departmentCode: municipalityCode.slice(0, 2),
      departmentName: null,
      countryCode: "CO",
      postalZone: municipalityCode,
    },
    contact: {
      name: null,
      email: payloadString(customer, "email"),
      phone: payloadString(customer, "phone"),
    },
    taxScheme: ledgerBuyerTaxScheme(
      payloadNumber(customer, 2, "type_regime_id", "typeRegimeId"),
      payloadNumber(customer, 1, "type_organization_id", "typeOrganizationId"),
    ),
  };
}

function ledgerPaymentMeans(paymentForm: JsonRecord): JsonRecord {
  const paymentFormId = payloadNumber(paymentForm, 1, "payment_form_id", "paymentFormId");
  return {
    paymentMeansCode: paymentFormId === 2 ? "30" : "10",
    paymentId: "1",
    paymentDueDate: payloadString(paymentForm, "payment_due_date", "paymentDueDate"),
  };
}

function ledgerTaxTotals(taxTotals: JsonRecord[]): JsonRecord[] | null {
  if (!taxTotals.length) return null;
  const grouped = new Map<string, JsonRecord[]>();
  for (const tax of taxTotals) {
    const key = ledgerTaxId(payloadNumber(tax, 1, "tax_id", "taxId"));
    grouped.set(key, [...(grouped.get(key) ?? []), tax]);
  }
  return [...grouped.entries()].map(([taxTypeCode, rows]) => ({
    taxAmount: rows.reduce((sum, row) => sum + ledgerDecimal(row.tax_amount ?? row.taxAmount), 0),
    subtotals: rows.map((row) => ({
      taxTypeCode,
      percent: ledgerDecimal(row.percent),
      taxableAmount: ledgerDecimal(row.taxable_amount ?? row.taxableAmount),
      taxAmount: ledgerDecimal(row.tax_amount ?? row.taxAmount),
    })),
  }));
}

function ledgerMonetaryTotals(totals: JsonRecord): JsonRecord {
  return {
    lineExtensionAmount: ledgerDecimal(totals.line_extension_amount ?? totals.lineExtensionAmount),
    taxExclusiveAmount: ledgerDecimal(totals.tax_exclusive_amount ?? totals.taxExclusiveAmount),
    taxInclusiveAmount: ledgerDecimal(totals.tax_inclusive_amount ?? totals.taxInclusiveAmount),
    allowanceTotalAmount: null,
    chargeTotalAmount: null,
    prepaidAmount: null,
    payableRoundingAmount: null,
    payableAmount: ledgerDecimal(totals.payable_amount ?? totals.payableAmount),
  };
}

function ledgerLines(lines: JsonRecord[], creditNote: boolean): JsonRecord[] {
  return lines.map((line, index) => ({
    lineId: index + 1,
    item: {
      description: payloadString(line, "description") ?? " ",
      sku: null,
      standardCode: payloadString(line, "code"),
      brandName: null,
      modelName: null,
    },
    quantity: ledgerDecimal(line.invoiced_quantity ?? line.invoicedQuantity),
    unitCode: ledgerUnitCode(payloadNumber(line, 70, "unit_measure_id", "unitMeasureId")),
    unitPrice: ledgerDecimal(line.price_amount ?? line.priceAmount),
    lineExtensionAmount: ledgerDecimal(line.line_extension_amount ?? line.lineExtensionAmount),
    allowanceCharges: null,
    taxTotals: ledgerTaxTotals(payloadArray(line, "tax_totals", "taxTotals")),
    note: creditNote ? payloadString(line, "notes") : null,
  }));
}

function ledgerHealthSector(healthFields: JsonRecord): JsonRecord | null {
  const users = payloadArray(healthFields, "users_info", "usersInfo");
  if (!users.length) return null;
  const user = users[0] ?? {};
  const operation = ledgerHealthOperation(payloadString(healthFields, "health_type_operation_id", "healthTypeOperationId"));
  return {
    operationMode: operation === "2" ? "SS-CUFE" : "SS-Recaudo",
    providerCode: payloadString(user, "provider_code", "providerCode") ?? "",
    paymentModality: payloadString(user, "health_contracting_payment_method_id", "healthContractingPaymentMethodId") ?? "",
    coveragePlanBenefits: payloadString(user, "health_coverage_id", "healthCoverageId") ?? "",
    contractNumber: payloadString(user, "contract_number", "contractNumber"),
    policyNumber: payloadString(user, "policy_number", "policyNumber"),
    copay: ledgerDecimal(user.co_payment ?? user.coPayment),
    moderationFee: ledgerDecimal(user.moderating_fee ?? user.moderatingFee),
    sharedPayments: ledgerDecimal(user.shared_payment ?? user.sharedPayment),
    advancePayment: 0,
    billingPeriodStart: payloadString(healthFields, "invoice_period_start_date", "invoicePeriodStartDate") ?? "",
    billingPeriodEnd: payloadString(healthFields, "invoice_period_end_date", "invoicePeriodEndDate") ?? "",
  };
}

function ledgerDocumentId(request: JsonRecord): string {
  const prefix = payloadString(request, "prefix") ?? "";
  const number = scalarToString(request.number) ?? "";
  return `${prefix}${number}`;
}

function ledgerIssueDateTime(request: JsonRecord): string {
  const now = bogotaDateTime();
  const date = payloadString(request, "date") ?? now.date;
  const time = (payloadString(request, "time") ?? now.time).replace(/(?:\.\d+)?(?:Z|[+-]\d\d:?\d\d)?$/, "");
  return `${date.slice(0, 10)}T${time || "00:00:00"}-05:00`;
}

function ledgerDeliveryDate(request: JsonRecord): string {
  const healthFields = payloadObject(request, "health_fields", "healthFields");
  return payloadString(healthFields, "invoice_period_start_date", "invoicePeriodStartDate")
    ?? payloadString(request, "date")
    ?? bogotaDateTime().date;
}

function ledgerCustomizationId(healthFields: JsonRecord): string {
  return payloadArray(healthFields, "users_info", "usersInfo").length
    ? ledgerHealthOperation(payloadString(healthFields, "health_type_operation_id", "healthTypeOperationId")) === "2" ? "SS-CUFE" : "SS-Recaudo"
    : "10";
}

function ledgerHealthOperation(value: string | null): string {
  const normalized = value?.trim().replace(/^0+/, "");
  return normalized || "0";
}

function ledgerCreditNoteDiscrepancyDescription(code: number, fallback: string | null): string {
  if (code === 1) return "Devolucion parcial de los bienes";
  if (code === 2) return "Anulacion de factura electronica";
  return fallback ?? "";
}

function ledgerDocumentType(value: number): string {
  if (value === 2) return "CE";
  if (value === 3 || value === 6) return "NIT";
  if (value === 4) return "PP";
  if (value === 5) return "TI";
  return "CC";
}

function ledgerInvoiceTypeCode(value: number): string {
  if (value === 2) return "02";
  if (value === 3) return "03";
  if (value === 4) return "04";
  return "01";
}

function ledgerTaxId(value: number): string {
  if (value === 4) return "04";
  if (value === 3) return "03";
  return "01";
}

function ledgerUnitCode(_value: number): string {
  return "EA";
}

function ledgerRegimeCode(value: string | null): string | null {
  const normalized = value?.trim().toUpperCase();
  if (normalized === "48" || normalized === "RESPONSABLE DE IVA") return "48";
  if (normalized === "49" || normalized === "NO RESPONSABLE DE IVA") return "49";
  return null;
}

function ledgerSellerResponsibilities(value: string | null): string[] {
  return ledgerRegimeCode(value) === "48" ? ["O-23"] : ["R-99-PN"];
}

function ledgerBuyerTaxScheme(typeRegimeId: number, typeOrganizationId: number): JsonRecord {
  const regimeCode = typeRegimeId === 1 ? "48" : "49";
  return {
    regimeCode,
    responsibilities: typeOrganizationId === 2 ? ["R-99-PN"] : regimeCode === "48" ? ["O-23"] : ["R-99-PN"],
    isLargeTaxpayer: false,
    isSelfWithholder: false,
  };
}

function ledgerDecimal(value: unknown): number {
  return numericValue(value, 0);
}

function payloadString(record: JsonRecord, ...keys: string[]): string | null {
  for (const key of keys) {
    const direct = valueToString(record[key]);
    if (direct) return direct;
    const insensitive = valueToString(caseInsensitiveValue(record, key));
    if (insensitive) return insensitive;
  }
  return null;
}

function payloadNumber(record: JsonRecord, fallback: number, ...keys: string[]): number {
  for (const key of keys) {
    const value = record[key] ?? caseInsensitiveValue(record, key);
    if (value !== undefined && value !== null) return numericValue(value, fallback);
  }
  return fallback;
}

function payloadObject(record: JsonRecord, ...keys: string[]): JsonRecord {
  for (const key of keys) {
    const value = record[key] ?? caseInsensitiveValue(record, key);
    if (value && typeof value === "object" && !Array.isArray(value)) return value as JsonRecord;
  }
  return {};
}

function payloadArray(record: JsonRecord, ...keys: string[]): JsonRecord[] {
  for (const key of keys) {
    const value = record[key] ?? caseInsensitiveValue(record, key);
    if (Array.isArray(value)) return value.map(asObject);
  }
  return [];
}

function dateOnly(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) return new Date(value).toISOString().slice(0, 10);
  const text = scalarToString(value);
  return text ? text.slice(0, 10) : null;
}

function computeNitDv(value: string | null): string | null {
  const digits = value?.replace(/\D+/g, "").split("").map(Number) ?? [];
  if (!digits.length || digits.length > 15) return null;
  const factors = [71, 67, 59, 53, 47, 43, 41, 37, 29, 23, 19, 17, 13, 7, 3];
  const offset = factors.length - digits.length;
  const sum = digits.reduce((acc, digit, index) => acc + digit * (factors[offset + index] ?? 0), 0);
  const modulo = sum % 11;
  return String(modulo > 1 ? 11 - modulo : modulo);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function providerResponseStatus(response: unknown, kind: DocumentKind): {
  succeeded: boolean;
  identifier: string | null;
  statusCode: string | null;
  statusDescription: string | null;
  errorMessage: string | null;
} {
  const body = asObject(response);
  const identifier = kind === "invoice"
    ? caseInsensitiveString(body, "cufe") ?? valueToString(findDeepValue(body, "cufe"))
    : caseInsensitiveString(body, "cude") ?? valueToString(findDeepValue(body, "cude"));
  const isValidValue = findDeepValue(body, "IsValid") ?? findDeepValue(body, "isValid");
  const succeeded = isValidValue !== null && isValidValue !== undefined
    ? booleanLike(isValidValue)
    : body.success === true && Boolean(identifier);
  const statusCode = valueToString(findDeepValue(body, "StatusCode") ?? findDeepValue(body, "statusCode") ?? findDeepValue(body, "status"));
  const statusDescription = valueToString(
    findDeepValue(body, "StatusMessage")
      ?? findDeepValue(body, "statusMessage")
      ?? findDeepValue(body, "statusDescription")
      ?? body.message,
  );
  const errorDetail = findDeepValue(body, "ErrorMessage") ?? findDeepValue(body, "errorMessage") ?? body.error;
  const errorMessage = succeeded ? null : valueToString(errorDetail) ?? statusDescription ?? "Provider validation failed.";
  return {
    succeeded,
    identifier,
    statusCode,
    statusDescription,
    errorMessage,
  };
}

async function prepareInvoiceRipsPayload(
  env: Bindings,
  tenant: TenantResponse,
  invoice: JsonRecord,
  providerResponse: unknown,
  invoiceNumber: string,
): Promise<RipsPayloadPreparation> {
  const payload = normalizeRipsPayloadForSispro(parseJsonString(invoice.rips_payload_json, null));
  if (!payload) return { error: "Invoice draft does not include a valid RIPS payload." };

  const rips = asObject(payload.rips);
  payload.rips = {
    ...rips,
    numFactura: invoiceNumber,
    usuarios: setProcedurePaymentNumber(rips.usuarios, invoiceNumber),
  };

  const xmlFevFile = await resolveProviderXmlBase64(env, tenant, "invoice", providerResponse, payload.xmlFevFile);
  if (!xmlFevFile) return { error: "Invoice XML not available for RIPS dispatch." };

  payload.xmlFevFile = xmlFevFile;
  return { payloadJson: JSON.stringify(payload) };
}

async function prepareCreditNoteRipsPayload(
  env: Bindings,
  tenant: TenantResponse,
  creditNote: JsonRecord,
  providerResponse: unknown,
  creditNoteNumber: string,
): Promise<RipsPayloadPreparation> {
  const rawPayload = parseJsonString(creditNote.rips_payload_json, null);
  if (!rawPayload) return { skipRips: true, payloadJson: null };

  const payload = normalizeRipsPayloadForSispro(rawPayload);
  if (!payload) return { error: "Credit note draft has an invalid RIPS payload." };

  const rips = asObject(payload.rips);
  payload.rips = {
    ...rips,
    tipoNota: "NC",
    numNota: creditNoteNumber,
  };

  const xmlFevFile = await resolveProviderXmlBase64(env, tenant, "credit-note", providerResponse, payload.xmlFevFile);
  if (!xmlFevFile) return { error: "Credit note XML not available for RIPS dispatch." };

  payload.xmlFevFile = xmlFevFile;
  return { payloadJson: JSON.stringify(payload) };
}

async function refreshRipsXmlFromProvider(
  env: Bindings,
  tenant: TenantResponse,
  kind: DocumentKind,
  row: JsonRecord,
): Promise<{ payloadJson: string } | { error: string }> {
  const payload = normalizeRipsPayloadForSispro(parseJsonString(row.rips_payload_json, null));
  if (!payload) return { error: "Draft does not include a valid RIPS payload." };

  const attempts = await getDispatchAttempts(env, tenant, valueToString(row.id) ?? "");
  const providerAttempt = latestSuccessfulProviderAttempt(kind, attempts);
  if (!providerAttempt?.responsePayload) return { error: "Cannot refresh RIPS XML before a successful provider dispatch." };

  const xmlFevFile = await resolveProviderXmlBase64(
    env,
    tenant,
    kind,
    parseJsonString(providerAttempt.responsePayload, {}),
    null,
  );
  if (!xmlFevFile) return { error: `${kind === "invoice" ? "Invoice" : "Credit note"} XML not available for RIPS dispatch.` };

  payload.xmlFevFile = xmlFevFile;
  return { payloadJson: JSON.stringify(payload) };
}

async function dispatchRipsDocument(
  env: Bindings,
  tenant: TenantResponse,
  collection: "invoice-drafts" | "credit-note-drafts",
  row: JsonRecord,
  documentType: "Invoice" | "CreditNote",
): Promise<{ row: JsonRecord; succeeded: boolean }> {
  const documentId = valueToString(row.id) ?? "";
  const parsed = normalizeRipsPayloadForSispro(parseJsonString(row.rips_payload_json, null));
  if (!documentId || !parsed) {
    return failRipsDispatch(
      env,
      tenant,
      collection,
      row,
      documentType,
      "Draft does not include a valid RIPS payload.",
      "{}",
    );
  }

  const requestPayload = normalizeRipsPayloadForSispro(fixRipsConsecutivos(mergeRipsUsuarios(parsed)));
  if (!requestPayload) {
    return failRipsDispatch(env, tenant, collection, row, documentType, "Draft does not include a valid RIPS payload.", "{}");
  }
  const requestPayloadJson = JSON.stringify(requestPayload);

  try {
    const upstream = await postFevRipsPackage(env, tenant, requestPayload);
    const expectedIdentifier = valueToString(row.cufe ?? row.cude);
    const normalized = documentType === "Invoice"
      ? normalizeDuplicateFevRipsResponse(upstream.body, expectedIdentifier)
      : upstream.body;
    const responsePayload = JSON.stringify(normalized);
    const status = fevRipsResponseStatus(normalized);
    const patch: JsonRecord = {
      status: status.succeeded ? "Sent" : "Failed",
      statusMessage: status.succeeded
        ? `RIPS upload OK (ProcesoId: ${status.procesoId ?? "N/A"}). Email dispatch is pending.`
        : status.errorMessage ?? "RIPS upload failed.",
      ripsQueuedAtUtc: Date.now(),
      ripsPayloadJson: requestPayloadJson,
    };
    if (documentType === "Invoice" && status.cuv) patch.cuv = status.cuv;

    let updated = await persistRipsDispatchResult(env, tenant, collection, row, {
      documentType,
      requestPayload: requestPayloadJson,
      responsePayload,
      succeeded: status.succeeded,
      errorMessage: status.succeeded ? null : status.errorMessage ?? "RIPS upload failed.",
      patch,
    });
    if (status.succeeded) {
      updated = documentType === "Invoice"
        ? await maybeDispatchInvoiceEmail(env, tenant, updated)
        : await maybeDispatchCreditNoteEmail(env, tenant, updated);
    }
    return { row: updated, succeeded: status.succeeded };
  } catch (err) {
    const errorMessage = err instanceof NoCredentialsStoredError
      ? "SISPRO credentials are not configured for this workspace."
      : err instanceof Error ? err.message : "RIPS upload failed.";
    return failRipsDispatch(env, tenant, collection, row, documentType, errorMessage, requestPayloadJson);
  }
}

async function postFevRipsPackage(
  env: Bindings,
  tenant: TenantResponse,
  payload: JsonRecord,
): Promise<{ body: unknown; rawBody: string }> {
  const stub = stubFor(env.TENANT, tenant.doName);
  const authFetch = createAuthenticatedFetch({
    baseUrl: env.FEVRIPS_UPSTREAM_BASE_URL,
    tenantKey: tenant.doName,
    credentials: createDoCredentialsProvider(stub, tenant.doName),
    tokenStore: createDoTokenStore(stub),
  });

  const response = await authFetch("/api/PaquetesFevRips/CargarFevRips", {
    method: "POST",
    headers: { "content-type": "application/json", "accept": "application/json" },
    body: JSON.stringify(payload),
  });
  const rawBody = await response.text();
  const body = parseJsonString(rawBody, { rawBody });

  if (!response.ok && !looksLikeFevRipsResult(body)) {
    const parsed = asObject(body);
    const message = valueToString(parsed.message ?? parsed.error ?? parsed.detail)
      ?? `FEV-RIPS upload failed with HTTP ${response.status}.`;
    throw new Error(message);
  }

  if (!looksLikeFevRipsResult(body)) {
    throw new Error("FEV-RIPS upload returned an empty or invalid response body.");
  }

  return { body, rawBody };
}

async function failRipsDispatch(
  env: Bindings,
  tenant: TenantResponse,
  collection: "invoice-drafts" | "credit-note-drafts",
  row: JsonRecord,
  documentType: "Invoice" | "CreditNote",
  errorMessage: string,
  requestPayload: string,
): Promise<{ row: JsonRecord; succeeded: boolean }> {
  const updated = await persistRipsDispatchResult(env, tenant, collection, row, {
    documentType,
    requestPayload,
    responsePayload: JSON.stringify({ error: errorMessage }),
    succeeded: false,
    errorMessage,
    patch: {
      status: "Failed",
      statusMessage: errorMessage,
      ripsQueuedAtUtc: Date.now(),
    },
  });
  return { row: updated, succeeded: false };
}

async function persistRipsDispatchResult(
  env: Bindings,
  tenant: TenantResponse,
  collection: "invoice-drafts" | "credit-note-drafts",
  row: JsonRecord,
  result: {
    documentType: "Invoice" | "CreditNote";
    requestPayload: string;
    responsePayload: string;
    succeeded: boolean;
    errorMessage: string | null;
    patch: JsonRecord;
  },
): Promise<JsonRecord> {
  const documentId = valueToString(row.id) ?? crypto.randomUUID();
  await upsertTenantItem(env, tenant, "dispatch-attempts", {
    documentType: result.documentType,
    documentId,
    channel: "RipsMinistry",
    provider: "SISPRO",
    attemptedAtUtc: Date.now(),
    succeeded: result.succeeded,
    requestPayload: result.requestPayload,
    responsePayload: result.responsePayload,
    errorMessage: result.errorMessage,
  });
  return upsertTenantItem(env, tenant, collection, {
    id: documentId,
    ...result.patch,
  });
}

async function maybeDispatchInvoiceEmail(env: Bindings, tenant: TenantResponse, invoice: JsonRecord): Promise<JsonRecord> {
  const result = await dispatchInvoiceEmail(env, tenant, invoice);
  if (!result.sent) return invoice;
  return await getTenantItem(env, tenant, "invoice-drafts", valueToString(invoice.id) ?? "") ?? invoice;
}

async function maybeDispatchCreditNoteEmail(
  env: Bindings,
  tenant: TenantResponse,
  creditNote: JsonRecord,
): Promise<JsonRecord> {
  const result = await dispatchCreditNoteEmail(env, tenant, creditNote);
  if (!result.sent) return creditNote;
  return await getTenantItem(env, tenant, "credit-note-drafts", valueToString(creditNote.id) ?? "") ?? creditNote;
}

async function dispatchInvoiceEmail(
  env: Bindings,
  tenant: TenantResponse,
  invoice: JsonRecord,
): Promise<EmailDispatchResult> {
  const invoiceId = valueToString(invoice.id);
  if (!invoiceId) return emailFailure("missing_document_id", "Invoice id is missing.");
  const cufe = valueToString(invoice.cufe);
  if (!cufe) return emailFailure("missing_cufe", "Invoice has no CUFE and cannot be emailed yet.");

  const smtp = smtpConfig(env);
  if ("sent" in smtp) return smtp;

  const client = await getTenantItem(env, tenant, "clients", valueToString(invoice.client_id) ?? "");
  const to = normalizeEmail(client?.email);
  if (!to) return emailFailure("missing_client_email", "Client email is missing.");
  const cc = tenantCcEmail(tenant, to);
  const attempts = await getDispatchAttempts(env, tenant, invoiceId);
  const attachments = await invoiceEmailAttachments(env, tenant, invoice, attempts);
  if ("sent" in attachments) return attachments;

  const documentNumber = valueToString(invoice.assigned_invoice_number) ?? cufe;
  const attachmentName = `${safeFileNameBase(documentNumber)}.zip`;
  const zip = zipEmailAttachments(attachments);
  if ("sent" in zip) return zip;

  const subject = documentEmailSubject(tenant, documentNumber, "01");
  const body = [
    `Estimado cliente,`,
    "",
    `Adjuntamos la factura electronica ${documentNumber} emitida por ${tenant.companyName}.`,
    `CUFE: ${cufe}`,
    `NIT emisor: ${tenantNitDv(tenant)}`,
    "",
    "El archivo ZIP adjunto contiene el PDF y el XML de la factura electronica.",
    "",
    "Mensaje generado automaticamente por Rips Cloud.",
  ].join("\n");

  return sendDocumentEmail(env, tenant, "invoice-drafts", invoice, smtp, {
    to,
    cc,
    subject,
    body,
    attachmentName,
    attachmentBytes: zip.bytes,
    files: attachments,
  });
}

async function dispatchCreditNoteEmail(
  env: Bindings,
  tenant: TenantResponse,
  creditNote: JsonRecord,
): Promise<EmailDispatchResult> {
  const creditNoteId = valueToString(creditNote.id);
  if (!creditNoteId) return emailFailure("missing_document_id", "Credit note id is missing.");
  const cude = valueToString(creditNote.cude);
  if (!cude) return emailFailure("missing_cude", "Credit note has no CUDE and cannot be emailed yet.");

  const smtp = smtpConfig(env);
  if ("sent" in smtp) return smtp;

  const client = await getTenantItem(env, tenant, "clients", valueToString(creditNote.client_id) ?? "");
  const to = normalizeEmail(client?.email);
  if (!to) return emailFailure("missing_client_email", "Client email is missing.");
  const cc = tenantCcEmail(tenant, to);
  const attempts = await getDispatchAttempts(env, tenant, creditNoteId);
  const attachments = await creditNoteEmailAttachments(env, tenant, creditNote, attempts);
  if ("sent" in attachments) return attachments;

  const sourceInvoice = await getTenantItem(env, tenant, "invoice-drafts", valueToString(creditNote.invoice_draft_id) ?? "");
  const documentNumber = valueToString(creditNote.assigned_credit_note_number) ?? cude;
  const originalInvoiceNumber = valueToString(sourceInvoice?.assigned_invoice_number) ?? "N/A";
  const attachmentName = `${safeFileNameBase(cude)}.zip`;
  const zip = zipEmailAttachments(attachments);
  if ("sent" in zip) return zip;

  const subject = documentEmailSubject(tenant, documentNumber, "91");
  const body = [
    "Estimado cliente,",
    "",
    `Adjuntamos la nota credito electronica ${documentNumber} emitida por ${tenant.companyName}.`,
    `Factura relacionada: ${originalInvoiceNumber}`,
    `CUDE: ${cude}`,
    `NIT emisor: ${tenantNitDv(tenant)}`,
    "",
    "El archivo ZIP adjunto contiene el XML de la nota credito y el PDF cuando esta disponible.",
    "",
    "Mensaje generado automaticamente por Rips Cloud.",
  ].join("\n");

  return sendDocumentEmail(env, tenant, "credit-note-drafts", creditNote, smtp, {
    to,
    cc,
    subject,
    body,
    attachmentName,
    attachmentBytes: zip.bytes,
    files: attachments,
  });
}

async function sendDocumentEmail(
  env: Bindings,
  tenant: TenantResponse,
  collection: "invoice-drafts" | "credit-note-drafts",
  row: JsonRecord,
  smtp: SmtpConfig,
  email: {
    to: string;
    cc: string | null;
    subject: string;
    body: string;
    attachmentName: string;
    attachmentBytes: Uint8Array;
    files: EmailAttachment[];
  },
): Promise<EmailDispatchResult> {
  const documentId = valueToString(row.id) ?? "";
  const requestPayload = emailAttemptPayload(email);
  try {
    const { WorkerMailer } = await import("worker-mailer");
    await WorkerMailer.send({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      startTls: smtp.startTls,
      authType: "plain",
      credentials: {
        username: smtp.username,
        password: smtp.password,
      },
      socketTimeoutMs: 20_000,
      responseTimeoutMs: 20_000,
    }, {
      from: smtp.from,
      to: email.to,
      cc: email.cc ?? undefined,
      subject: email.subject,
      text: email.body,
      attachments: [{
        filename: email.attachmentName,
        content: bytesToBase64(email.attachmentBytes),
        mimeType: "application/zip",
      }],
    });
    await recordEmailDispatchAttempt(env, tenant, row, collection, requestPayload, {
      sent: true,
      attachmentName: email.attachmentName,
      attachmentSize: email.attachmentBytes.byteLength,
    }, true, null);
    await upsertTenantItem(env, tenant, collection, {
      id: documentId,
      emailSentAtUtc: Date.now(),
      statusMessage: emailSentStatusMessage(row),
    });
    return {
      sent: true,
      to: email.to,
      cc: email.cc,
      subject: email.subject,
      attachmentName: email.attachmentName,
      attachmentSize: email.attachmentBytes.byteLength,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Email dispatch failed.";
    await recordEmailDispatchAttempt(
      env,
      tenant,
      row,
      collection,
      requestPayload,
      { sent: false, error: message },
      false,
      message,
    );
    return emailFailure("email_send_failed", message, 502);
  }
}

async function recordEmailDispatchAttempt(
  env: Bindings,
  tenant: TenantResponse,
  row: JsonRecord,
  collection: "invoice-drafts" | "credit-note-drafts",
  requestPayload: JsonRecord,
  responsePayload: JsonRecord,
  succeeded: boolean,
  errorMessage: string | null,
): Promise<void> {
  await upsertTenantItem(env, tenant, "dispatch-attempts", {
    documentType: collection === "invoice-drafts" ? "Invoice" : "CreditNote",
    documentId: valueToString(row.id) ?? crypto.randomUUID(),
    channel: "Email",
    provider: "SMTP",
    attemptedAtUtc: Date.now(),
    succeeded,
    requestPayload: JSON.stringify(requestPayload),
    responsePayload: JSON.stringify(responsePayload),
    errorMessage,
  });
}

async function invoiceEmailAttachments(
  env: Bindings,
  tenant: TenantResponse,
  invoice: JsonRecord,
  attempts: DispatchAttempt[],
): Promise<EmailAttachment[] | EmailDispatchFailure> {
  const pdf = await downloadProviderDocumentForEmail(env, tenant, "invoice", invoice, "pdf", attempts);
  if ("sent" in pdf) return pdf;
  const xml = await downloadFirstProviderDocumentForEmail(env, tenant, "invoice", invoice, ["attached", "xml"], attempts);
  if ("sent" in xml) return xml;
  return [pdf, xml];
}

async function creditNoteEmailAttachments(
  env: Bindings,
  tenant: TenantResponse,
  creditNote: JsonRecord,
  attempts: DispatchAttempt[],
): Promise<EmailAttachment[] | EmailDispatchFailure> {
  const xml = await downloadFirstProviderDocumentForEmail(env, tenant, "credit-note", creditNote, ["attached", "xml"], attempts);
  if ("sent" in xml) return xml;
  const pdf = await downloadProviderDocumentForEmail(env, tenant, "credit-note", creditNote, "pdf", attempts);
  return "sent" in pdf ? [xml] : [xml, pdf];
}

async function downloadFirstProviderDocumentForEmail(
  env: Bindings,
  tenant: TenantResponse,
  kind: DocumentKind,
  row: JsonRecord,
  documentTypes: ProviderDocumentType[],
  attempts: DispatchAttempt[],
): Promise<EmailAttachment | EmailDispatchFailure> {
  let lastFailure: EmailDispatchFailure | null = null;
  for (const documentType of documentTypes) {
    const result = await downloadProviderDocumentForEmail(env, tenant, kind, row, documentType, attempts);
    if (!("sent" in result)) return result;
    lastFailure = result;
  }
  return lastFailure ?? emailFailure("provider_document_not_available", "Provider document is not available.", 409);
}

async function downloadProviderDocumentForEmail(
  env: Bindings,
  tenant: TenantResponse,
  kind: DocumentKind,
  row: JsonRecord,
  documentType: ProviderDocumentType,
  attempts: DispatchAttempt[],
): Promise<EmailAttachment | EmailDispatchFailure> {
  const resolution = resolveProviderDocument(tenant.invoiceProvider, kind, documentType, attempts);
  if (!resolution.isSupported) {
    return emailFailure("unsupported_provider_document", `${documentType} download is not supported for this provider.`, 409);
  }
  if (!resolution.canDownload || !resolution.documentName) {
    return emailFailure("provider_document_not_available", `${documentType} document is not available from the latest provider attempt.`, 409);
  }

  const request = providerDocumentFetchRequest(env, tenant, resolution.documentName, documentType);
  if (request instanceof Response) {
    return emailFailure("provider_document_download_failed", "Provider document download could not be prepared.", 409);
  }

  try {
    const response = await fetch(request.url, { headers: request.headers });
    if (!response.ok) {
      return emailFailure("provider_document_download_failed", `Provider document download returned HTTP ${response.status}.`, 502);
    }
    const contentLength = Number(response.headers.get("content-length") ?? "0");
    if (Number.isFinite(contentLength) && contentLength > MAX_EMAIL_DOCUMENT_BYTES) {
      return emailFailure("provider_document_too_large", `${documentType} document is too large for email.`, 413);
    }
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (!bytes.byteLength) return emailFailure("provider_document_empty", `${documentType} document is empty.`, 502);
    if (bytes.byteLength > MAX_EMAIL_DOCUMENT_BYTES) {
      return emailFailure("provider_document_too_large", `${documentType} document is too large for email.`, 413);
    }
    return {
      filename: providerDocumentFileName(kind, resolution.documentName, documentType, row),
      bytes,
      mimeType: documentType === "pdf" ? "application/pdf" : "application/xml",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Provider document download failed.";
    return emailFailure("provider_document_download_failed", message, 502);
  }
}

function zipEmailAttachments(attachments: EmailAttachment[]): { bytes: Uint8Array } | EmailDispatchFailure {
  const zip = zipSync(uniqueZipEntries(attachments));
  if (zip.byteLength > MAX_EMAIL_ZIP_BYTES) {
    return emailFailure("email_attachment_too_large", "Email ZIP attachment exceeds the 2 MB legacy limit.", 413);
  }
  return { bytes: zip };
}

function uniqueZipEntries(attachments: EmailAttachment[]): Record<string, Uint8Array> {
  const out: Record<string, Uint8Array> = {};
  const used = new Map<string, number>();
  for (const attachment of attachments) {
    const parsed = splitFileName(safeFileName(attachment.filename));
    const count = used.get(parsed.base) ?? 0;
    used.set(parsed.base, count + 1);
    const name = count === 0 ? `${parsed.base}${parsed.ext}` : `${parsed.base}-${count + 1}${parsed.ext}`;
    out[name] = attachment.bytes;
  }
  return out;
}

function emailAttemptPayload(email: {
  to: string;
  cc: string | null;
  subject: string;
  attachmentName: string;
  attachmentBytes: Uint8Array;
  files: EmailAttachment[];
}): JsonRecord {
  return {
    to: email.to,
    cc: email.cc,
    subject: email.subject,
    attachmentName: email.attachmentName,
    attachmentSize: email.attachmentBytes.byteLength,
    files: email.files.map((file) => ({
      filename: file.filename,
      mimeType: file.mimeType,
      size: file.bytes.byteLength,
    })),
  };
}

function smtpConfig(env: Bindings): SmtpConfig | EmailDispatchFailure {
  if (smtpExplicitlyDisabled(env.SEND_EMAIL)) {
    return emailFailure("email_disabled", "SMTP email dispatch is disabled by SEND_EMAIL=false.");
  }

  const host = valueToString(env.SMTP_HOST);
  const username = valueToString(env.SMTP_USERNAME);
  const password = valueToString(env.SMTP_PASSWORD);
  const from = valueToString(env.SMTP_FROM_ADDRESS);
  const port = Number.parseInt(valueToString(env.SMTP_PORT) ?? "587", 10);
  if (!host || !username || !password || !from || !Number.isFinite(port)) {
    return emailFailure("email_not_configured", "SMTP host, port, from address, username, and password are required.");
  }

  const secure = smtpBool(env.SMTP_ENABLE_SSL) ?? port === 465;
  return {
    host,
    port,
    username,
    password,
    from,
    secure,
    startTls: !secure,
  };
}

function smtpExplicitlyDisabled(value: unknown): boolean {
  const normalized = valueToString(value)?.toLowerCase();
  return normalized === "false" || normalized === "0" || normalized === "no" || normalized === "off";
}

function smtpBool(value: unknown): boolean | null {
  const normalized = valueToString(value)?.toLowerCase();
  if (!normalized) return null;
  if (normalized === "true" || normalized === "1" || normalized === "yes" || normalized === "on") return true;
  if (normalized === "false" || normalized === "0" || normalized === "no" || normalized === "off") return false;
  return null;
}

function tenantCcEmail(tenant: TenantResponse, to: string): string | null {
  const cc = normalizeEmail(tenant.email);
  return cc && cc !== to ? cc : null;
}

function documentEmailSubject(tenant: TenantResponse, documentNumber: string, documentCode: string): string {
  return `${tenantNitDv(tenant)}; ${tenant.companyName}; ${documentNumber}; ${documentCode}; ${tenant.commercialName || tenant.companyName}`;
}

function tenantNitDv(tenant: TenantResponse): string {
  return tenant.verificationDigit ? `${tenant.nit}-${tenant.verificationDigit}` : tenant.nit;
}

function emailSentStatusMessage(row: JsonRecord): string {
  const existing = valueToString(row.status_message);
  if (!existing) return "Email dispatched successfully.";
  if (existing.includes("Email dispatched successfully.")) return existing;
  if (existing.includes("Email dispatch is pending.")) {
    return existing.replace("Email dispatch is pending.", "Email dispatched successfully.");
  }
  return `${existing} Email dispatched successfully.`;
}

function emailFailure(reason: string, message: string, status = 400): EmailDispatchFailure {
  return { sent: false, reason, message, status };
}

function safeFileNameBase(value: string): string {
  return safeFileName(value).replace(/\.[A-Za-z0-9]{2,8}$/, "") || "document";
}

function safeFileName(value: string): string {
  const cleaned = value.trim().replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, " ");
  return cleaned || "document";
}

function splitFileName(value: string): { base: string; ext: string } {
  const match = value.match(/^(.*?)(\.[A-Za-z0-9]{2,8})$/);
  if (!match) return { base: value || "document", ext: "" };
  return { base: match[1] || "document", ext: match[2] };
}

function fevRipsResponseStatus(response: unknown): {
  succeeded: boolean;
  procesoId: string | null;
  cuv: string | null;
  errorMessage: string | null;
} {
  const body = asObject(response);
  const succeeded = booleanLike(caseInsensitiveValue(body, "ResultState"));
  const validations = validationArray(body);
  const firstValidation = validations[0] ? asObject(validations[0]) : {};
  const validationMessage = valueToString(
    caseInsensitiveValue(firstValidation, "Descripcion")
      ?? caseInsensitiveValue(firstValidation, "Observaciones"),
  );
  return {
    succeeded,
    procesoId: scalarToString(caseInsensitiveValue(body, "ProcesoId")),
    cuv: valueToString(caseInsensitiveValue(body, "CodigoUnicoValidacion")),
    errorMessage: succeeded ? null : validationMessage ?? "RIPS upload failed.",
  };
}

function normalizeDuplicateFevRipsResponse(response: unknown, expectedCufe: string | null): unknown {
  const body = asObject(response);
  if (booleanLike(caseInsensitiveValue(body, "ResultState")) || !expectedCufe) return response;

  const validations = validationArray(body).map(asObject);
  const rvg02 = validations.find((validation) =>
    stringEquals(caseInsensitiveValue(validation, "Codigo"), "RVG02")
    && valueToString(caseInsensitiveValue(validation, "Observaciones")));
  const rvg18 = validations.find((validation) =>
    stringEquals(caseInsensitiveValue(validation, "Codigo"), "RVG18")
    && valueToString(caseInsensitiveValue(validation, "Observaciones")));
  const observation = valueToString(rvg02 ? caseInsensitiveValue(rvg02, "Observaciones") : null) ?? "";
  const match = observation.match(/CUV\s+(?<cuv>[A-Za-z0-9]+).*?CUFE\/CUDE\s+(?<cufe>[A-Za-z0-9]+).*?ProcesoId\s+(?<procesoId>\d+)/is);
  if (!match?.groups) return response;
  if (!stringEquals(match.groups.cufe, expectedCufe)) return response;

  const rvg18Observation = valueToString(rvg18 ? caseInsensitiveValue(rvg18, "Observaciones") : null) ?? "";
  if (!rvg18Observation.includes(match.groups.cuv) && !rvg18Observation.includes(expectedCufe)) return response;

  return {
    ...body,
    ResultState: true,
    ProcesoId: Number(match.groups.procesoId),
    CodigoUnicoValidacion: match.groups.cuv,
    ResultadosValidacion: validations.filter((validation) =>
      !["RVG02", "RVG18"].some((code) => stringEquals(caseInsensitiveValue(validation, "Codigo"), code))),
  };
}

function looksLikeFevRipsResult(value: unknown): boolean {
  const body = asObject(value);
  return caseInsensitiveValue(body, "ResultState") !== undefined
    || caseInsensitiveValue(body, "ResultadosValidacion") !== undefined
    || caseInsensitiveValue(body, "CodigoUnicoValidacion") !== undefined;
}

function normalizeRipsPayloadForSispro(value: unknown): JsonRecord | null {
  const source = asObject(value);
  const ripsSource = asObject(caseInsensitiveValue(source, "rips"));
  if (!Object.keys(source).length || !Object.keys(ripsSource).length) return null;

  return {
    ...copyWithoutFields(source, ["rips", "xmlFevFile"]),
    rips: normalizeRipsNode(ripsSource),
    xmlFevFile: caseInsensitiveValue(source, "xmlFevFile") ?? null,
  };
}

function normalizeRipsNode(value: JsonRecord): JsonRecord {
  const usuarios = caseInsensitiveValue(value, "usuarios");
  return {
    ...copyWithoutFields(value, ["numDocumentoIdObligado", "numFactura", "tipoNota", "numNota", "usuarios"]),
    numDocumentoIdObligado: normalizeDocumentNumberValue(caseInsensitiveValue(value, "numDocumentoIdObligado")),
    numFactura: nullableNormalizedText(caseInsensitiveValue(value, "numFactura")),
    tipoNota: nullableUpperCode(caseInsensitiveValue(value, "tipoNota")),
    numNota: nullableNormalizedText(caseInsensitiveValue(value, "numNota")),
    usuarios: Array.isArray(usuarios) ? usuarios.map((usuario) => normalizeRipsUsuario(asObject(usuario))) : [],
  };
}

function normalizeRipsUsuario(value: JsonRecord): JsonRecord {
  const servicios = asObject(caseInsensitiveValue(value, "servicios"));
  return {
    ...copyWithoutFields(value, [
      "tipoDocumentoIdentificacion",
      "numDocumentoIdentificacion",
      "tipoUsuario",
      "fechaNacimiento",
      "codSexo",
      "codPaisResidencia",
      "codPaisOrigen",
      "codMunicipioResidencia",
      "codZonaTerritorialResidencia",
      "incapacidad",
      "servicios",
    ]),
    tipoDocumentoIdentificacion: normalizeRequiredCodeValue(caseInsensitiveValue(value, "tipoDocumentoIdentificacion")),
    numDocumentoIdentificacion: normalizeDocumentNumberValue(caseInsensitiveValue(value, "numDocumentoIdentificacion")),
    tipoUsuario: nullableUpperCode(caseInsensitiveValue(value, "tipoUsuario")),
    fechaNacimiento: normalizeDateOnlyValue(caseInsensitiveValue(value, "fechaNacimiento")),
    codSexo: normalizeRequiredCodeValue(caseInsensitiveValue(value, "codSexo")),
    codPaisResidencia: nullableNormalizedText(caseInsensitiveValue(value, "codPaisResidencia")),
    codPaisOrigen: nullableNormalizedText(caseInsensitiveValue(value, "codPaisOrigen")),
    codMunicipioResidencia: nullableNormalizedText(caseInsensitiveValue(value, "codMunicipioResidencia")),
    codZonaTerritorialResidencia: nullableUpperCode(caseInsensitiveValue(value, "codZonaTerritorialResidencia")),
    incapacidad: normalizeRequiredCodeValue(caseInsensitiveValue(value, "incapacidad")),
    consecutivo: numericValue(caseInsensitiveValue(value, "consecutivo"), 0),
    servicios: normalizeServiciosNode(servicios),
  };
}

function normalizeServiciosNode(value: JsonRecord): JsonRecord {
  const out = copyWithoutFields(value, [
    "consultas",
    "procedimientos",
    "urgencias",
    "hospitalizacion",
    "recienNacidos",
    "medicamentos",
    "otrosServicios",
  ]);
  for (const key of ["consultas", "procedimientos", "urgencias", "hospitalizacion", "recienNacidos", "medicamentos", "otrosServicios"]) {
    const list = caseInsensitiveValue(value, key);
    if (Array.isArray(list)) out[key] = list.map((item) => normalizeRipsService(asObject(item), key));
  }
  return out;
}

function normalizeRipsService(value: JsonRecord, serviceKey: string): JsonRecord {
  const out = { ...value };
  const codPrestador = valueToString(caseInsensitiveValue(value, "codPrestador"));
  if (codPrestador !== null) out.codPrestador = codPrestador;
  const tipoDocumento = caseInsensitiveValue(value, "tipoDocumentoIdentificacion");
  if (tipoDocumento !== undefined) {
    out.tipoDocumentoIdentificacion = serviceKey === "otrosServicios"
      ? nullableUpperCode(tipoDocumento)
      : normalizeRequiredCodeValue(tipoDocumento);
  }
  const numDocumento = caseInsensitiveValue(value, "numDocumentoIdentificacion");
  if (numDocumento !== undefined) {
    out.numDocumentoIdentificacion = serviceKey === "otrosServicios"
      ? nullableDocumentNumberValue(numDocumento)
      : normalizeDocumentNumberValue(numDocumento);
  }
  return out;
}

function mergeRipsUsuarios(payload: JsonRecord): JsonRecord {
  const rips = asObject(payload.rips);
  const usuarios = Array.isArray(rips.usuarios) ? rips.usuarios.map(asObject) : [];
  const byUser = new Map<string, JsonRecord>();

  for (const usuario of usuarios) {
    const key = `${valueToString(usuario.tipoDocumentoIdentificacion) ?? ""}:${valueToString(usuario.numDocumentoIdentificacion) ?? ""}`;
    const existing = byUser.get(key);
    if (!existing) {
      byUser.set(key, usuario);
      continue;
    }
    existing.servicios = mergeServicios(asObject(existing.servicios), asObject(usuario.servicios));
  }

  return {
    ...payload,
    rips: {
      ...rips,
      usuarios: [...byUser.values()],
    },
  };
}

function mergeServicios(left: JsonRecord, right: JsonRecord): JsonRecord {
  const out = { ...left };
  for (const key of ["consultas", "procedimientos", "urgencias", "hospitalizacion", "recienNacidos", "medicamentos", "otrosServicios"]) {
    const leftList = Array.isArray(left[key]) ? left[key] as unknown[] : [];
    const rightList = Array.isArray(right[key]) ? right[key] as unknown[] : [];
    if (leftList.length || rightList.length) out[key] = [...leftList, ...rightList];
  }
  return out;
}

function fixRipsConsecutivos(payload: JsonRecord): JsonRecord {
  const rips = asObject(payload.rips);
  const usuarios = Array.isArray(rips.usuarios) ? rips.usuarios.map(asObject) : [];
  return {
    ...payload,
    rips: {
      ...rips,
      usuarios: usuarios.map((usuario, userIndex) => ({
        ...usuario,
        consecutivo: userIndex + 1,
        servicios: fixServiceConsecutivos(asObject(usuario.servicios)),
      })),
    },
  };
}

function fixServiceConsecutivos(servicios: JsonRecord): JsonRecord {
  const out = { ...servicios };
  for (const key of ["consultas", "procedimientos", "urgencias", "hospitalizacion", "recienNacidos", "medicamentos", "otrosServicios"]) {
    const list = servicios[key];
    if (Array.isArray(list)) {
      out[key] = list.map((item, index) => ({ ...asObject(item), consecutivo: index + 1 }));
    }
  }
  return out;
}

function setProcedurePaymentNumber(value: unknown, invoiceNumber: string): JsonRecord[] {
  if (!Array.isArray(value)) return [];
  return value.map((usuario) => {
    const user = asObject(usuario);
    const servicios = asObject(user.servicios);
    const procedimientos = servicios.procedimientos;
    return {
      ...user,
      servicios: {
        ...servicios,
        procedimientos: Array.isArray(procedimientos)
          ? procedimientos.map((procedure) => ({ ...asObject(procedure), numFEVPagoModerador: invoiceNumber }))
          : procedimientos,
      },
    };
  });
}

async function resolveProviderXmlBase64(
  env: Bindings,
  tenant: TenantResponse,
  kind: DocumentKind,
  providerResponse: unknown,
  existingXml: unknown,
): Promise<string | null> {
  const body = asObject(providerResponse);
  const documentName = resolveDocumentName(
    normalizeInvoiceProvider(tenant.invoiceProvider),
    kind,
    "attached",
    body,
  );
  const downloaded = documentName ? await fetchProviderDocumentBase64(env, tenant, documentName) : null;
  if (downloaded) return downloaded;

  const inlineXml = kind === "invoice"
    ? caseInsensitiveString(body, "invoiceXml")
    : caseInsensitiveString(body, "creditNoteXml");
  return xmlStringToBase64(inlineXml) ?? xmlStringToBase64(valueToString(existingXml));
}

async function fetchProviderDocumentBase64(
  env: Bindings,
  tenant: TenantResponse,
  documentName: string,
): Promise<string | null> {
  const request = providerDocumentFetchRequest(env, tenant, documentName, "attached");
  if (request instanceof Response) return null;

  try {
    const response = await fetch(request.url, { headers: request.headers });
    if (!response.ok) return null;
    const contentLength = Number(response.headers.get("content-length") ?? "0");
    if (Number.isFinite(contentLength) && contentLength > MAX_RIPS_XML_BYTES) return null;
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > MAX_RIPS_XML_BYTES) return null;
    return bytesToBase64(new Uint8Array(buffer));
  } catch {
    return null;
  }
}

function xmlStringToBase64(value: string | null): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (looksLikeBase64(trimmed)) return trimmed;
  return bytesToBase64(new TextEncoder().encode(trimmed));
}

function looksLikeBase64(value: string): boolean {
  return value.length % 4 === 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(value);
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

function validationArray(body: JsonRecord): unknown[] {
  const validations = caseInsensitiveValue(body, "ResultadosValidacion");
  return Array.isArray(validations) ? validations : [];
}

function caseInsensitiveValue(value: JsonRecord, key: string): unknown {
  const normalizedKey = normalizeToken(key);
  for (const [candidate, candidateValue] of Object.entries(value)) {
    if (normalizeToken(candidate) === normalizedKey) return candidateValue;
  }
  return undefined;
}

function copyWithoutFields(value: JsonRecord, fields: string[]): JsonRecord {
  const normalizedFields = new Set(fields.map(normalizeToken));
  return Object.fromEntries(
    Object.entries(value).filter(([key]) => !normalizedFields.has(normalizeToken(key))),
  );
}

function nullableNormalizedText(value: unknown): string | null {
  return valueToString(value);
}

function nullableUpperCode(value: unknown): string | null {
  return valueToString(value)?.toUpperCase() ?? null;
}

function normalizeRequiredCodeValue(value: unknown): string {
  return valueToString(value)?.toUpperCase() ?? "";
}

function normalizeDocumentNumberValue(value: unknown): string {
  return (valueToString(value) ?? "").replace(/\s+/g, "");
}

function nullableDocumentNumberValue(value: unknown): string | null {
  return valueToString(value)?.replace(/\s+/g, "") ?? null;
}

function normalizeDateOnlyValue(value: unknown): string {
  const parsed = valueToString(value) ?? "";
  return parsed.length >= 10 ? parsed.slice(0, 10) : parsed;
}

function booleanLike(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") return value.toLowerCase() === "true" || value === "1";
  return false;
}

function stringEquals(left: unknown, right: unknown): boolean {
  const a = valueToString(left)?.replace(/[.,;]+$/g, "") ?? "";
  const b = valueToString(right)?.replace(/[.,;]+$/g, "") ?? "";
  return a.toLowerCase() === b.toLowerCase();
}

function findDeepValue(value: unknown, wantedKey: string): unknown {
  const stack = [value];
  const normalizedWanted = normalizeToken(wantedKey);
  while (stack.length) {
    const current = stack.pop();
    if (!current || typeof current !== "object") continue;
    if (Array.isArray(current)) {
      stack.push(...current);
      continue;
    }
    for (const [key, child] of Object.entries(current as JsonRecord)) {
      if (normalizeToken(key) === normalizedWanted) return child;
      if (child && typeof child === "object") stack.push(child);
    }
  }
  return null;
}

function payableAmount(payload: JsonRecord, fallback: number): number {
  const totals = asObject(payload.legal_monetary_totals ?? payload.legalMonetaryTotals);
  return numericValue(totals.payable_amount ?? totals.payableAmount, fallback);
}

function bogotaDateTime(): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const byType = new Map(parts.map((part) => [part.type, part.value]));
  return {
    date: `${byType.get("year")}-${byType.get("month")}-${byType.get("day")}`,
    time: `${byType.get("hour")}:${byType.get("minute")}:${byType.get("second")}`,
  };
}

async function documentPayloadResponse(
  env: Bindings,
  tenant: TenantResponse,
  kind: DocumentKind,
  row: JsonRecord,
  documentType: string,
): Promise<Response> {
  const normalized = documentType.toLowerCase();
  const payload = kind === "invoice"
    ? normalized === "rips" ? row.rips_payload_json : row.invoice_payload_json
    : row.credit_note_payload_json;

  if (normalized === "pdf" || normalized === "xml" || normalized === "attached") {
    return providerDocumentResponse(
      env,
      tenant,
      kind,
      row,
      normalized,
    );
  }

  if (!payload) {
    return Response.json({
      error: "document_not_available",
      documentType,
      reason: "No stored document payload is available for this draft.",
    }, { status: 404 });
  }
  return jsonDownloadResponse(parseJsonString(payload, payload), `${kind}-${valueToString(row.id) ?? "document"}-${normalized}.json`);
}

function dispatchHistory(row: JsonRecord, source: string, attempts: DispatchAttempt[] = []): JsonRecord[] {
  if (attempts.length) return attempts.map((attempt) => mapDispatchAttempt(attempt, source));

  const requestPayload = valueToString(row.invoice_payload_json ?? row.credit_note_payload_json);
  if (!requestPayload) return [];
  return [{
    attemptedAt: dateValue(row.created_at),
    succeeded: Boolean(row.cufe ?? row.cude),
    errorMessage: row.status_message ?? null,
    requestPayload,
    responsePayload: null,
    source,
  }];
}

function ripsDispatchHistory(row: JsonRecord, attempts: DispatchAttempt[] = [], source = "SISPRO"): JsonRecord[] {
  if (attempts.length) return attempts.map((attempt) => mapDispatchAttempt(attempt, source));

  const requestPayload = valueToString(row.rips_payload_json);
  if (!requestPayload) return [];
  return [{
    attemptedAt: dateValue(row.rips_queued_at_utc ?? row.updated_at),
    succeeded: Boolean(row.cuv),
    errorMessage: row.status_message ?? null,
    requestPayload,
    responsePayload: null,
    source,
  }];
}

function mapDispatchAttempt(attempt: DispatchAttempt, fallbackSource: string): JsonRecord {
  return {
    attemptedAt: dateValue(attempt.attemptedAtUtc),
    succeeded: attempt.succeeded,
    errorMessage: attempt.errorMessage,
    requestPayload: attempt.requestPayload ?? "{}",
    responsePayload: attempt.responsePayload,
    source: valueToString(attempt.channel) ?? fallbackSource,
  };
}

function documentAvailability(
  provider: string,
  kind: DocumentKind,
  attempts: DispatchAttempt[] = [],
): JsonRecord[] {
  return PROVIDER_DOCUMENT_TYPES.map((documentType) => {
    const resolution = resolveProviderDocument(provider, kind, documentType, attempts);
    return {
      documentType,
      isSupported: resolution.isSupported,
      canDownload: resolution.canDownload,
    };
  });
}

async function providerDocumentResponse(
  env: Bindings,
  tenant: TenantResponse,
  kind: DocumentKind,
  row: JsonRecord,
  documentType: ProviderDocumentType,
): Promise<Response> {
  const documentId = valueToString(row.id) ?? "";
  const attempts = documentId ? await getDispatchAttempts(env, tenant, documentId) : [];
  const resolution = resolveProviderDocument(tenant.invoiceProvider, kind, documentType, attempts);

  if (!resolution.isValidType) {
    return Response.json(
      { error: "invalid_document_type", documentType, allowed: PROVIDER_DOCUMENT_TYPES },
      { status: 400 },
    );
  }
  if (!resolution.isSupported) {
    return Response.json(
      { error: "unsupported_document_type", documentType, provider: tenant.invoiceProvider },
      { status: 400 },
    );
  }
  if (!resolution.canDownload || !resolution.documentName) {
    return Response.json(
      { error: "document_not_available", documentType },
      { status: 404 },
    );
  }

  const request = providerDocumentFetchRequest(env, tenant, resolution.documentName, documentType);
  if (request instanceof Response) return request;

  let upstream: Response;
  try {
    upstream = await fetch(request.url, { headers: request.headers });
  } catch {
    return Response.json({ error: "provider_document_download_failed" }, { status: 502 });
  }

  if (!upstream.ok) {
    return Response.json(
      {
        error: "provider_document_download_failed",
        providerStatus: upstream.status,
      },
      { status: 502 },
    );
  }

  if (!upstream.body) {
    return Response.json({ error: "provider_document_empty_response" }, { status: 502 });
  }

  return new Response(upstream.body, {
    headers: {
      "content-type": documentType === "pdf" ? "application/pdf" : "application/xml",
      "content-disposition": `attachment; filename="${providerDocumentFileName(kind, resolution.documentName, documentType, row)}"`,
    },
  });
}

function providerDocumentFetchRequest(
  env: Bindings,
  tenant: TenantResponse,
  documentName: string,
  documentType: ProviderDocumentType,
): { url: string; headers: Headers } | Response {
  const trimmed = documentName.trim();
  const headers = new Headers({
    accept: documentType === "pdf" ? "application/pdf" : "application/xml",
  });
  const absolute = absoluteHttpUrl(trimmed);
  if (absolute) return { url: absolute, headers };

  if (!tenant.invoiceApiToken) {
    return Response.json({ error: "invoice_api_token_not_configured" }, { status: 400 });
  }

  const provider = normalizeInvoiceProvider(tenant.invoiceProvider);
  if (provider === "monaros") {
    headers.set("authorization", `Bearer ${tenant.invoiceApiToken}`);
    return {
      url: new URL(
        `download/${encodeURIComponent(tenant.nit)}/${trimmed.replace(/^\/+/, "")}`,
        ensureTrailingSlash(env.RIPS_ADMIN_MONAROS_BASE_URL ?? MONAROS_BASE_URL),
      ).toString(),
      headers,
    };
  }

  if (provider === "ledger") {
    const apiKey = valueToString(env.RIPS_ADMIN_LEDGER_API_KEY);
    if (apiKey) headers.set("x-api-key", apiKey);
    return {
      url: new URL(
        trimmed.replace(/^\/+/, ""),
        ledgerBaseUrl(env, tenant.environment, ledgerUsesReportingBase(trimmed, documentType)),
      ).toString(),
      headers,
    };
  }

  return Response.json({ error: "unsupported_invoice_provider", provider: tenant.invoiceProvider }, { status: 400 });
}

function resolveProviderDocument(
  providerValue: string,
  kind: DocumentKind,
  documentTypeValue: string,
  attempts: DispatchAttempt[],
): ProviderDocumentResolution {
  const documentType = normalizeProviderDocumentType(documentTypeValue);
  if (!documentType) {
    return {
      isValidType: false,
      documentType: documentTypeValue,
      isSupported: false,
      canDownload: false,
      documentName: null,
      attempt: null,
    };
  }

  const provider = normalizeInvoiceProvider(providerValue);
  const isSupported = providerDocumentSupported(provider, kind, documentType);
  const attempt = latestSuccessfulProviderAttempt(kind, attempts);
  const documentName = isSupported && attempt?.responsePayload
    ? resolveDocumentName(provider, kind, documentType, parseJsonString(attempt.responsePayload, {}))
    : null;

  return {
    isValidType: true,
    documentType,
    isSupported,
    canDownload: isSupported && Boolean(documentName),
    documentName,
    attempt,
  };
}

function resolveDocumentName(
  provider: string | null,
  kind: DocumentKind,
  documentType: ProviderDocumentType,
  response: unknown,
): string | null {
  const body = asObject(response);
  if (kind === "credit-note") {
    if (documentType === "pdf") return caseInsensitiveString(body, "urlcreditnotepdf");
    if (documentType === "xml") return caseInsensitiveString(body, "urlcreditnotexml");
    return caseInsensitiveString(body, "urlcreditnoteattached");
  }

  if (documentType === "pdf") {
    const explicitPdf = caseInsensitiveString(body, "urlinvoicepdf");
    if (explicitPdf) return explicitPdf;
    const invoiceXml = caseInsensitiveString(body, "urlinvoicexml");
    if (provider !== "ledger" || !invoiceXml) return null;
    return invoiceXml.trim().toLowerCase().endsWith("/pdf") ? invoiceXml : `${invoiceXml.trim().replace(/\/+$/, "")}/pdf`;
  }

  if (documentType === "xml") return caseInsensitiveString(body, "urlinvoicexml");
  return caseInsensitiveString(body, "urlinvoiceattached");
}

function latestSuccessfulProviderAttempt(kind: DocumentKind, attempts: DispatchAttempt[]): DispatchAttempt | null {
  return providerDispatchAttempts(kind, attempts)
    .filter((attempt) => attempt.succeeded && Boolean(valueToString(attempt.responsePayload)))
    .sort((a, b) => b.attemptedAtUtc - a.attemptedAtUtc)[0] ?? null;
}

function providerDispatchAttempts(kind: DocumentKind, attempts: DispatchAttempt[]): DispatchAttempt[] {
  return attempts
    .filter((attempt) => isProviderDispatchAttempt(kind, attempt))
    .sort((a, b) => b.attemptedAtUtc - a.attemptedAtUtc);
}

function ripsDispatchAttempts(attempts: DispatchAttempt[]): DispatchAttempt[] {
  return attempts
    .filter((attempt) => attemptMatches(attempt, ["rips", "sispro", "ministry", "ministerio", "fevrips"]))
    .sort((a, b) => b.attemptedAtUtc - a.attemptedAtUtc);
}

function isProviderDispatchAttempt(kind: DocumentKind, attempt: DispatchAttempt): boolean {
  if (ripsDispatchAttempts([attempt]).length > 0) return false;
  if (attemptMatches(attempt, ["email", "smtp", "correo"])) return false;
  const positiveTokens = kind === "invoice"
    ? ["invoice", "invoiceprovider", "factura", "dian", "provider"]
    : ["credit", "creditnote", "notacredito", "nota-credito", "dian", "provider"];
  if (kind === "invoice" && attemptMatches(attempt, ["credit", "creditnote", "notacredito", "nota-credito"])) return false;
  return attemptMatches(attempt, positiveTokens);
}

function attemptMatches(attempt: DispatchAttempt, tokens: string[]): boolean {
  const haystack = [
    attempt.documentType,
    attempt.channel,
    attempt.provider ?? "",
  ].map(normalizeToken).join(" ");
  return tokens.some((token) => haystack.includes(normalizeToken(token)));
}

async function getDispatchAttemptsByDocument(
  env: Bindings,
  tenant: TenantResponse,
  rows: JsonRecord[],
): Promise<Map<string, DispatchAttempt[]>> {
  const entries = await Promise.all(rows.map(async (row) => {
    const id = valueToString(row.id) ?? "";
    return [id, id ? await getDispatchAttempts(env, tenant, id) : []] as const;
  }));
  return new Map(entries);
}

async function getDispatchAttempts(
  env: Bindings,
  tenant: TenantResponse,
  documentId: string,
): Promise<DispatchAttempt[]> {
  const body = await fetchTenantDoJson(
    env,
    tenant,
    `/rips-admin/dispatch-attempts?documentId=${encodeURIComponent(documentId)}&sort=attempted_at_utc&direction=desc&limit=500`,
  );
  return itemArray(body).map(mapDispatchAttemptRow);
}

function mapDispatchAttemptRow(row: JsonRecord): DispatchAttempt {
  return {
    id: valueToString(row.id) ?? "",
    documentType: valueToString(row.document_type ?? row.documentType) ?? "",
    documentId: valueToString(row.document_id ?? row.documentId) ?? "",
    channel: valueToString(row.channel) ?? "",
    provider: valueToString(row.provider),
    attemptedAtUtc: numericValue(row.attempted_at_utc ?? row.attemptedAtUtc, 0),
    succeeded: row.succeeded === 1 || row.succeeded === true || row.succeeded === "1" || row.succeeded === "true",
    requestPayload: valueToString(row.request_payload ?? row.requestPayload),
    responsePayload: valueToString(row.response_payload ?? row.responsePayload),
    errorMessage: valueToString(row.error_message ?? row.errorMessage),
  };
}

function providerDocumentSupported(
  provider: string | null,
  kind: DocumentKind,
  documentType: ProviderDocumentType,
): boolean {
  if (provider === "monaros") return true;
  if (provider === "ledger") return kind === "invoice" || documentType !== "pdf";
  return false;
}

function normalizeProviderDocumentType(value: string): ProviderDocumentType | null {
  const normalized = value.trim().toLowerCase();
  return PROVIDER_DOCUMENT_TYPES.includes(normalized as ProviderDocumentType)
    ? normalized as ProviderDocumentType
    : null;
}

function providerDocumentFileName(
  kind: DocumentKind,
  documentName: string,
  documentType: ProviderDocumentType,
  row: JsonRecord,
): string {
  if (kind === "credit-note") return creditNoteDocumentFileName(documentName, documentType);

  let candidate = valueToString(documentNameFromUrl(documentName))
    ?? valueToString(row.assigned_invoice_number)
    ?? "invoice";
  candidate = stripQueryAndHash(candidate);
  const extension = documentType === "pdf" ? ".pdf" : ".xml";
  if (!hasFileExtension(candidate)) candidate = `${candidate}${extension}`;
  return candidate;
}

function creditNoteDocumentFileName(documentName: string, documentType: ProviderDocumentType): string {
  const extension = documentType === "pdf" ? ".pdf" : ".xml";
  const sanitizedPath = stripQueryAndHash(documentName);
  const segments = sanitizedPath.split("/").map((segment) => segment.trim()).filter(Boolean);
  let fileName = segments.at(-1) ?? "";
  const documentId = segments.length >= 2 ? segments.at(-2) : null;

  if (fileName.toLowerCase() === "signedxml") return `${documentId ?? "credit-note"}${extension}`;
  if (fileName.toLowerCase() === "attacheddocument") return `${documentId ?? "credit-note"}AttachedDocument.xml`;

  fileName = documentNameFromUrl(documentName) ?? fileName;
  if (!fileName) fileName = `credit-note.${documentType}`;
  if (!hasFileExtension(fileName)) fileName = `${fileName}${extension}`;
  return fileName;
}

function documentNameFromUrl(value: string): string | null {
  const absolute = absoluteHttpUrl(value);
  if (!absolute) return stripQueryAndHash(value).split("/").filter(Boolean).at(-1) ?? null;
  const pathName = new URL(absolute).pathname;
  return pathName.split("/").filter(Boolean).at(-1) ?? null;
}

function absoluteHttpUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function ledgerBaseUrl(env: Bindings, environment: number, reporting: boolean): string {
  if (reporting) {
    return ensureTrailingSlash(environment === 1
      ? env.RIPS_ADMIN_LEDGER_REPORTING_PRODUCTION_URL ?? LEDGER_REPORTING_PRODUCTION_URL
      : env.RIPS_ADMIN_LEDGER_REPORTING_HABILITACION_URL ?? LEDGER_REPORTING_HABILITACION_URL);
  }
  return ensureTrailingSlash(environment === 1
    ? env.RIPS_ADMIN_LEDGER_PRODUCTION_URL ?? LEDGER_PRODUCTION_URL
    : env.RIPS_ADMIN_LEDGER_HABILITACION_URL ?? LEDGER_HABILITACION_URL);
}

function ledgerUsesReportingBase(documentName: string, documentType: ProviderDocumentType): boolean {
  return documentType === "pdf" && documentName.trim().toLowerCase().endsWith("/pdf");
}

function caseInsensitiveString(value: JsonRecord, key: string): string | null {
  const normalizedKey = normalizeToken(key);
  for (const [candidate, candidateValue] of Object.entries(value)) {
    if (normalizeToken(candidate) === normalizedKey) return valueToString(candidateValue);
  }
  return null;
}

function stripQueryAndHash(value: string): string {
  return value.split(/[?#]/, 1)[0] ?? "";
}

function hasFileExtension(value: string): boolean {
  const lastSegment = value.split("/").filter(Boolean).at(-1) ?? value;
  return /\.[A-Za-z0-9]{2,8}$/.test(lastSegment);
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function normalizeToken(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

async function convertXlsxRequestToCsv(request: Request): Promise<string> {
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!isUploadedFile(file) || file.size === 0) {
    throw new Error("No file uploaded.");
  }
  return xlsxToCsv(new Uint8Array(await file.arrayBuffer()));
}

function isUploadedFile(value: unknown): value is { size: number; arrayBuffer: () => Promise<ArrayBuffer> } {
  return Boolean(
    value
      && typeof value === "object"
      && "size" in value
      && typeof (value as { size?: unknown }).size === "number"
      && "arrayBuffer" in value
      && typeof (value as { arrayBuffer?: unknown }).arrayBuffer === "function",
  );
}

function createXlsx(rows: string[][], sheetName: string): Uint8Array {
  const escapedSheetName = escapeXml(sheetName);
  const sheetData = rows.map((row, rowIndex) => {
    const rowNumber = rowIndex + 1;
    const cells = row.map((value, columnIndex) => {
      const ref = `${columnName(columnIndex)}${rowNumber}`;
      return `<c r="${ref}" t="inlineStr"><is><t>${escapeXml(value)}</t></is></c>`;
    }).join("");
    return `<row r="${rowNumber}">${cells}</row>`;
  }).join("");

  return zipSync({
    "[Content_Types].xml": strToU8(`<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`),
    "_rels/.rels": strToU8(`<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`),
    "docProps/core.xml": strToU8(`<?xml version="1.0" encoding="UTF-8"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:creator>Rips Cloud</dc:creator>
  <cp:lastModifiedBy>Rips Cloud</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:created>
</cp:coreProperties>`),
    "docProps/app.xml": strToU8(`<?xml version="1.0" encoding="UTF-8"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Rips Cloud</Application></Properties>`),
    "xl/workbook.xml": strToU8(`<?xml version="1.0" encoding="UTF-8"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="${escapedSheetName}" sheetId="1" r:id="rId1"/></sheets>
</workbook>`),
    "xl/_rels/workbook.xml.rels": strToU8(`<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`),
    "xl/styles.xml": strToU8(`<?xml version="1.0" encoding="UTF-8"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>
  <fills count="1"><fill><patternFill patternType="none"/></fill></fills>
  <borders count="1"><border/></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>
</styleSheet>`),
    "xl/worksheets/sheet1.xml": strToU8(`<?xml version="1.0" encoding="UTF-8"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>${sheetData}</sheetData>
</worksheet>`),
  });
}

function xlsxToCsv(bytes: Uint8Array): string {
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(bytes);
  } catch {
    throw new Error("Failed to parse XLSX file. Please ensure it is a valid Excel file.");
  }

  const sheetPath = Object.keys(files).find((path) => /^xl\/worksheets\/sheet\d+\.xml$/i.test(path));
  if (!sheetPath || !files[sheetPath]) throw new Error("No worksheets found in the XLSX file.");

  const sharedStrings = files["xl/sharedStrings.xml"] ? parseSharedStrings(decodeUtf8(files["xl/sharedStrings.xml"])) : [];
  const rows = parseWorksheetRows(decodeUtf8(files[sheetPath]), sharedStrings);
  if (!rows.length) throw new Error("The worksheet is empty.");
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

function parseSharedStrings(xml: string): string[] {
  const strings: string[] = [];
  const siRegex = /<si\b[^>]*>([\s\S]*?)<\/si>/g;
  let match: RegExpExecArray | null;
  while ((match = siRegex.exec(xml))) {
    strings.push(extractTextNodes(match[1] ?? ""));
  }
  return strings;
}

function parseWorksheetRows(xml: string, sharedStrings: string[]): string[][] {
  const rows: string[][] = [];
  const rowRegex = /<row\b[^>]*>([\s\S]*?)<\/row>/g;
  let rowMatch: RegExpExecArray | null;
  while ((rowMatch = rowRegex.exec(xml))) {
    const row: string[] = [];
    const cellRegex = /<c\b([^>]*)>([\s\S]*?)<\/c>/g;
    let cellMatch: RegExpExecArray | null;
    while ((cellMatch = cellRegex.exec(rowMatch[1] ?? ""))) {
      const attrs = cellMatch[1] ?? "";
      const column = cellColumnIndex(attribute(attrs, "r"));
      row[column] = cellValue(attrs, cellMatch[2] ?? "", sharedStrings);
    }
    rows.push(row.map((value) => value ?? ""));
  }
  return normalizeImportedRows(rows);
}

function normalizeImportedRows(rows: string[][]): string[][] {
  const headers = rows[0] ?? [];
  return rows.map((row, rowIndex) => {
    if (rowIndex === 0) return row;
    return row.map((value, columnIndex) => normalizeImportedCell(value, headers[columnIndex] ?? ""));
  });
}

function normalizeImportedCell(value: string, header: string): string {
  const field = baseFieldName(header).toLowerCase();
  if (DATE_FIELDS.has(field)) return formatExcelDate(value, false);
  if (DATETIME_FIELDS.has(field)) return formatExcelDate(value, true);
  return value;
}

function formatExcelDate(value: string, withTime: boolean): string {
  const serial = Number(value);
  if (Number.isFinite(serial) && serial > 0) {
    const date = new Date((serial - 25569) * 86_400_000);
    return withTime ? date.toISOString().slice(0, 16) : date.toISOString().slice(0, 10);
  }
  const parsed = Date.parse(value);
  if (Number.isFinite(parsed)) {
    const date = new Date(parsed);
    return withTime ? date.toISOString().slice(0, 16) : date.toISOString().slice(0, 10);
  }
  return value.replace(" ", "T");
}

function cellValue(attrs: string, xml: string, sharedStrings: string[]): string {
  const type = attribute(attrs, "t");
  if (type === "inlineStr") return extractTextNodes(xml);
  const raw = xml.match(/<v\b[^>]*>([\s\S]*?)<\/v>/)?.[1] ?? extractTextNodes(xml);
  const value = decodeXml(raw);
  if (type === "s") return sharedStrings[Number(value)] ?? "";
  return value;
}

function extractTextNodes(xml: string): string {
  const values: string[] = [];
  const regex = /<t\b[^>]*>([\s\S]*?)<\/t>/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(xml))) values.push(decodeXml(match[1] ?? ""));
  return values.join("");
}

function attribute(attrs: string, name: string): string | null {
  return attrs.match(new RegExp(`${name}="([^"]*)"`))?.[1] ?? null;
}

function cellColumnIndex(ref: string | null): number {
  const letters = ref?.match(/^[A-Z]+/i)?.[0]?.toUpperCase();
  if (!letters) return 0;
  let index = 0;
  for (const char of letters) index = index * 26 + char.charCodeAt(0) - 64;
  return Math.max(index - 1, 0);
}

function columnName(index: number): string {
  let name = "";
  let n = index + 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    name = String.fromCharCode(65 + rem) + name;
    n = Math.floor((n - 1) / 26);
  }
  return name;
}

function baseFieldName(header: string): string {
  const separator = header.indexOf("_");
  return separator >= 0 ? header.slice(separator + 1) : header;
}

function xlsxResponse(bytes: Uint8Array, filename: string): Response {
  return new Response(bytes, {
    headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": `attachment; filename="${filename}"`,
    },
  });
}

function csvResponse(content: string, filename: string): Response {
  return new Response(content.endsWith("\n") ? content : `${content}\n`, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
    },
  });
}

function jsonDownloadResponse(value: unknown, filename: string): Response {
  return new Response(JSON.stringify(value, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
    },
  });
}

function toCsv(rows: JsonRecord[]): string {
  if (!rows.length) return "";
  const columns = Object.keys(rows[0] ?? {});
  return [
    columns.join(","),
    ...rows.map((row) => columns.map((column) => csvCell(row[column])).join(",")),
  ].join("\n");
}

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function decodeXml(value: string): string {
  return value
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&");
}

function decodeUtf8(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

function camelizeDbRow(row: JsonRecord): JsonRecord {
  const out: JsonRecord = {};
  for (const [key, value] of Object.entries(row)) {
    out[snakeToCamel(key)] = normalizeDbValue(key, value);
  }
  return out;
}

function normalizeDbValue(key: string, value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (key === "is_active" || key === "succeeded") return value === 1 || value === true;
  if (key.endsWith("_at") && typeof value === "number") return new Date(value).toISOString();
  return value;
}

function parseJsonString(value: unknown, fallback: unknown): unknown {
  if (typeof value !== "string" || !value.trim()) return fallback;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return fallback;
  }
}

function jsonString(value: unknown, fallback: string): string {
  if (value === undefined) return fallback;
  if (typeof value === "string") return value;
  return JSON.stringify(value ?? JSON.parse(fallback));
}

function dateValue(value: unknown): string {
  if (typeof value === "number") return new Date(value).toISOString();
  if (typeof value === "string" && value.trim()) {
    const numeric = Number(value);
    if (Number.isFinite(numeric) && value.length > 8) return new Date(numeric).toISOString();
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return new Date(parsed).toISOString();
  }
  return new Date(0).toISOString();
}

function dateMillis(value: unknown): number {
  return Date.parse(dateValue(value));
}

function invoiceKindName(value: unknown): string {
  if (value === 1 || value === "1" || String(value).toLowerCase() === "health") return "Health";
  return "Commercial";
}

function invoiceProviderNumber(value: unknown): number {
  const normalized = normalizeInvoiceProvider(value);
  return normalized === "ledger" ? 2 : 1;
}

function normalizeInvoiceProvider(value: unknown): string | null {
  if (value === 1 || value === "1") return "monaros";
  if (value === 2 || value === "2") return "ledger";
  const parsed = valueToString(value)?.toLowerCase();
  if (parsed === "monaros" || parsed === "ledger") return parsed;
  return null;
}

function snakeToCamel(value: string): string {
  return value.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

function migrationRequestAllowed(env: Bindings, request: Request): boolean {
  const secret = valueToString(env.RIPS_ADMIN_MIGRATION_SECRET);
  if (secret) return constantTimeTextEqual(request.headers.get("x-rips-admin-migration-secret") ?? "", secret);
  return env.LOG_LEVEL === "debug";
}

async function upsertMigratedTenants(
  env: Bindings,
  inputs: JsonRecord[],
): Promise<{ count: number; credentialsStored: number; idMap: Record<string, string> }> {
  const idMap: Record<string, string> = {};
  let count = 0;
  let credentialsStored = 0;

  for (const input of inputs) {
    const legacyId = valueToString(input.id) ?? crypto.randomUUID();
    const companyName = requiredString(input.companyName ?? input.company_name, "companyName");
    const nit = requiredString(input.nit, "nit");
    const slug = valueToString(input.slug) ?? slugify(`${companyName}-${nit}`);
    const existing = await findTenant(env.DB, legacyId) ?? await findTenant(env.DB, slug);
    const id = existing?.id ?? legacyId;
    const doName = valueToString(input.doName ?? input.do_name) ?? existing?.doName ?? `rips-admin:${slug}`;
    const now = Date.now();
    const createdAt = dateMillisOr(input.createdAt ?? input.created_at, existing ? Date.parse(existing.createdAt) : now);
    const updatedAt = dateMillisOr(input.updatedAt ?? input.updated_at, now);

    await env.DB.prepare(
      `INSERT INTO rips_admin_tenants (
        id, slug, do_name, nit, verification_digit, company_name, commercial_name,
        tax_regime, economic_activity_code, address, department_code, municipality_code,
        phone_number, email, service_code, invoice_api_token, invoice_provider, environment, logo_url,
        is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        slug = excluded.slug,
        do_name = excluded.do_name,
        nit = excluded.nit,
        verification_digit = excluded.verification_digit,
        company_name = excluded.company_name,
        commercial_name = excluded.commercial_name,
        tax_regime = excluded.tax_regime,
        economic_activity_code = excluded.economic_activity_code,
        address = excluded.address,
        department_code = excluded.department_code,
        municipality_code = excluded.municipality_code,
        phone_number = excluded.phone_number,
        email = excluded.email,
        service_code = excluded.service_code,
        invoice_api_token = excluded.invoice_api_token,
        invoice_provider = excluded.invoice_provider,
        environment = excluded.environment,
        logo_url = excluded.logo_url,
        is_active = excluded.is_active,
        updated_at = excluded.updated_at`,
    )
      .bind(
        id,
        slug,
        doName,
        nit,
        valueToString(input.verificationDigit ?? input.verification_digit) ?? "",
        companyName,
        nullableString(input.commercialName ?? input.commercial_name),
        nullableString(input.taxRegime ?? input.tax_regime),
        nullableString(input.economicActivityCode ?? input.economic_activity_code),
        nullableString(input.address),
        nullableString(input.departmentCode ?? input.department_code),
        nullableString(input.municipalityCode ?? input.municipality_code),
        nullableString(input.phoneNumber ?? input.phone_number),
        nullableString(input.email),
        nullableString(input.serviceCode ?? input.service_code),
        nullableString(input.invoiceApiToken ?? input.invoice_api_token ?? input.token),
        normalizeInvoiceProvider(input.invoiceProvider ?? input.invoice_provider) ?? existing?.invoiceProvider ?? "monaros",
        numericValue(input.environment, existing?.environment ?? 2),
        nullableString(input.logoUrl ?? input.logo_url),
        booleanValue(input.isActive ?? input.is_active, existing?.isActive ?? true),
        createdAt,
        updatedAt,
      )
      .run();

    const tenant = await findTenant(env.DB, id);
    if (!tenant) throw new Error("tenant_migration_failed");
    await syncTenantMetadata(env, tenant);
    idMap[legacyId] = tenant.id;
    count += 1;

    if (await storeMigratedSisproCredentials(env, tenant, input)) credentialsStored += 1;
  }

  return { count, credentialsStored, idMap };
}

async function storeMigratedSisproCredentials(env: Bindings, tenant: TenantResponse, input: JsonRecord): Promise<boolean> {
  const sispro = payloadObject(input, "sispro", "sisproCredentials", "sispro_credentials");
  const documentType = valueToString(
    sispro.documentType ?? sispro.tipoDocumentoIdentificacion ?? input.sisproDocumentType ?? input.sispro_document_type,
  );
  const documentNumber = valueToString(
    sispro.documentNumber ?? sispro.numDocumentoIdentificacion ?? input.sisproDocumentNumber ?? input.sispro_document_number,
  );
  const password = valueToString(sispro.password ?? sispro.clave ?? input.sisproPassword ?? input.sispro_password);
  if (!documentType || !documentNumber || !password) return false;

  await storeCredentials(stubFor(env.TENANT, tenant.doName), {
    persona: {
      identificacion: {
        tipo: documentType,
        numero: documentNumber,
      },
    },
    clave: password,
    nit: tenant.nit,
  });
  return true;
}

async function upsertMigratedUsers(
  env: Bindings,
  users: JsonRecord[],
  memberships: JsonRecord[],
  tenantIdMap: Record<string, string>,
): Promise<{ users: number; memberships: number; userIdMap: Record<string, string> }> {
  const userIdMap: Record<string, string> = {};
  let userCount = 0;
  let membershipCount = 0;

  for (const input of users) {
    const legacyId = valueToString(input.id) ?? crypto.randomUUID();
    const email = normalizeEmail(input.email ?? input.userName ?? input.user_name);
    if (!email) continue;

    const existing = await findMigratedUser(env.DB, legacyId, email);
    const id = existing?.id ?? legacyId;
    const now = Date.now();
    const createdAt = dateMillisOr(input.createdAt ?? input.created_at, existing?.created_at ?? now);
    const updatedAt = dateMillisOr(input.updatedAt ?? input.updated_at, now);
    const passwordHash = nullableString(input.passwordHash ?? input.password_hash);
    const googleSubject = nullableString(input.googleSubject ?? input.google_subject);

    await env.DB.prepare(
      `INSERT INTO rips_admin_users (
        id, email, first_name, last_name, password_hash, google_subject, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        email = excluded.email,
        first_name = excluded.first_name,
        last_name = excluded.last_name,
        password_hash = COALESCE(excluded.password_hash, rips_admin_users.password_hash),
        google_subject = COALESCE(excluded.google_subject, rips_admin_users.google_subject),
        is_active = excluded.is_active,
        updated_at = excluded.updated_at`,
    )
      .bind(
        id,
        email,
        valueToString(input.firstName ?? input.first_name) ?? "",
        valueToString(input.lastName ?? input.last_name) ?? "",
        passwordHash,
        googleSubject,
        booleanValue(input.isActive ?? input.is_active, existing?.is_active === undefined ? true : existing.is_active === 1),
        createdAt,
        updatedAt,
      )
      .run();

    userIdMap[legacyId] = id;
    userCount += 1;
  }

  for (const input of memberships) {
    const legacyUserId = valueToString(input.userId ?? input.user_id);
    const legacyTenantId = valueToString(input.tenantId ?? input.tenant_id);
    if (!legacyUserId || !legacyTenantId) continue;

    const userId = userIdMap[legacyUserId] ?? legacyUserId;
    const tenantId = tenantIdMap[legacyTenantId] ?? legacyTenantId;
    const legacyId = valueToString(input.id) ?? crypto.randomUUID();
    const existing = await findMigratedMembership(env.DB, legacyId, userId, tenantId);
    const id = existing?.id ?? legacyId;
    const now = Date.now();
    const createdAt = dateMillisOr(input.createdAt ?? input.created_at, existing?.created_at ?? now);
    const updatedAt = dateMillisOr(input.updatedAt ?? input.updated_at, now);

    await env.DB.prepare(
      `INSERT INTO rips_admin_user_tenants (
        id, user_id, tenant_id, role, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        user_id = excluded.user_id,
        tenant_id = excluded.tenant_id,
        role = excluded.role,
        is_active = excluded.is_active,
        updated_at = excluded.updated_at`,
    )
      .bind(
        id,
        userId,
        tenantId,
        valueToString(input.role ?? input.roleName ?? input.role_name) ?? "Admin",
        booleanValue(input.isActive ?? input.is_active, existing?.is_active === undefined ? true : existing.is_active === 1),
        createdAt,
        updatedAt,
      )
      .run();

    membershipCount += 1;
  }

  return { users: userCount, memberships: membershipCount, userIdMap };
}

async function findMigratedUser(
  db: D1Database,
  id: string,
  email: string,
): Promise<{ id: string; created_at: number; is_active: number } | null> {
  return await db
    .prepare("SELECT id, created_at, is_active FROM rips_admin_users WHERE id = ? OR email = ? LIMIT 1")
    .bind(id, email)
    .first<{ id: string; created_at: number; is_active: number }>();
}

async function findMigratedMembership(
  db: D1Database,
  id: string,
  userId: string,
  tenantId: string,
): Promise<{ id: string; created_at: number; is_active: number } | null> {
  return await db
    .prepare(
      `SELECT id, created_at, is_active
       FROM rips_admin_user_tenants
       WHERE id = ? OR (user_id = ? AND tenant_id = ?)
       LIMIT 1`,
    )
    .bind(id, userId, tenantId)
    .first<{ id: string; created_at: number; is_active: number }>();
}

function dateMillisOr(value: unknown, fallback: number): number {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Date.parse(dateValue(value));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function constantTimeTextEqual(a: string, b: string): boolean {
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) diff |= left[i]! ^ right[i]!;
  return diff === 0;
}

async function createTenant(env: Bindings, input: Record<string, unknown>): Promise<TenantResponse> {
  const id = valueToString(input.id) ?? crypto.randomUUID();
  const companyName = requiredString(input.companyName ?? input.company_name, "companyName");
  const nit = requiredString(input.nit, "nit");
  const verificationDigit = valueToString(input.verificationDigit ?? input.verification_digit) ?? "";
  const slug = valueToString(input.slug) ?? slugify(`${companyName}-${nit}`);
  const doName = valueToString(input.doName ?? input.do_name) ?? `rips-admin:${slug}`;
  const now = Date.now();

  await env.DB.prepare(
    `INSERT INTO rips_admin_tenants (
      id, slug, do_name, nit, verification_digit, company_name, commercial_name,
      tax_regime, economic_activity_code, address, department_code, municipality_code,
      phone_number, email, service_code, invoice_api_token, invoice_provider, environment, logo_url,
      is_active, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      slug,
      doName,
      nit,
      verificationDigit,
      companyName,
      nullableString(input.commercialName ?? input.commercial_name),
      nullableString(input.taxRegime ?? input.tax_regime),
      nullableString(input.economicActivityCode ?? input.economic_activity_code),
      nullableString(input.address),
      nullableString(input.departmentCode ?? input.department_code),
      nullableString(input.municipalityCode ?? input.municipality_code),
      nullableString(input.phoneNumber ?? input.phone_number),
      nullableString(input.email),
      nullableString(input.serviceCode ?? input.service_code),
      nullableString(input.invoiceApiToken ?? input.invoice_api_token ?? input.token),
      normalizeInvoiceProvider(input.invoiceProvider ?? input.invoice_provider) ?? "monaros",
      numericValue(input.environment, 2),
      nullableString(input.logoUrl ?? input.logo_url),
      booleanValue(input.isActive ?? input.is_active, true),
      now,
      now,
    )
    .run();

  const tenant = await findTenant(env.DB, id);
  if (!tenant) throw new Error("tenant_create_failed");
  return tenant;
}

async function maybeCreateAdminMembership(
  env: Bindings,
  tenant: TenantResponse,
  input: Record<string, unknown>,
): Promise<void> {
  const adminEmail = valueToString(input.adminEmail ?? input.admin_email);
  if (!adminEmail) return;
  await addUserToWorkspace(env, tenant, {
    userEmail: adminEmail,
    firstName: input.adminFirstName ?? input.admin_first_name,
    lastName: input.adminLastName ?? input.admin_last_name,
    roleName: "Admin",
  });
}

async function listWorkspaceUsers(db: D1Database, tenantId: string): Promise<Array<Record<string, unknown>>> {
  const rows = await db
    .prepare(
      `SELECT u.id, u.email, u.first_name, u.last_name, ut.role, ut.is_active, ut.created_at
       FROM rips_admin_user_tenants ut
       INNER JOIN rips_admin_users u ON u.id = ut.user_id
       WHERE ut.tenant_id = ?
       ORDER BY u.email ASC`,
    )
    .bind(tenantId)
    .all<{
      id: string;
      email: string;
      first_name: string;
      last_name: string;
      role: string;
      is_active: number;
      created_at: number;
    }>();

  return (rows.results ?? []).map((row) => ({
    userId: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    roleName: row.role,
    isActive: row.is_active === 1,
    joinedAt: new Date(row.created_at).toISOString(),
  }));
}

async function addUserToWorkspace(
  env: Bindings,
  tenant: TenantResponse,
  input: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const email = normalizeEmail(input.userEmail ?? input.email);
  if (!email) throw new Error("missing_userEmail");
  const roleName = valueToString(input.roleName ?? input.role_name) ?? "Admin";
  const firstName = valueToString(input.firstName ?? input.first_name) ?? "";
  const lastName = valueToString(input.lastName ?? input.last_name) ?? "";
  const now = Date.now();

  let user = await findUserByEmail(env.DB, email);
  if (!user) {
    const userId = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO rips_admin_users
        (id, email, first_name, last_name, password_hash, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
    )
      .bind(userId, email, firstName, lastName, await hashPassword(`User${tenant.nit}+.`), now, now)
      .run();
    user = { id: userId, email };
  }

  const existing = await env.DB.prepare(
    `SELECT id FROM rips_admin_user_tenants WHERE user_id = ? AND tenant_id = ? LIMIT 1`,
  )
    .bind(user.id, tenant.id)
    .first<{ id: string }>();
  if (existing) throw new Error(`User ${email} is already in workspace ${tenant.id}`);

  await env.DB.prepare(
    `INSERT INTO rips_admin_user_tenants
      (id, user_id, tenant_id, role, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, 1, ?, ?)`,
  )
    .bind(crypto.randomUUID(), user.id, tenant.id, roleName, now, now)
    .run();

  return {
    tenantId: tenant.id,
    companyName: tenant.companyName,
    roleName,
    isActive: true,
  };
}

async function findUserByEmail(db: D1Database, email: string): Promise<{ id: string; email: string } | null> {
  const row = await db
    .prepare("SELECT id, email FROM rips_admin_users WHERE email = ? LIMIT 1")
    .bind(email)
    .first<{ id: string; email: string }>();
  return row ?? null;
}

async function updateTenant(env: Bindings, tenantId: string, input: Record<string, unknown>): Promise<TenantResponse> {
  const existing = await findTenant(env.DB, tenantId);
  if (!existing) throw new Error("tenant_not_found");
  const now = Date.now();

  await env.DB.prepare(
    `UPDATE rips_admin_tenants SET
      nit = ?, verification_digit = ?, company_name = ?, commercial_name = ?,
      tax_regime = ?, economic_activity_code = ?, address = ?, department_code = ?,
      municipality_code = ?, phone_number = ?, email = ?, service_code = ?,
      invoice_api_token = ?, invoice_provider = ?, environment = ?, logo_url = ?, is_active = ?, updated_at = ?
    WHERE id = ?`,
  )
    .bind(
      valueToString(input.nit) ?? existing.nit,
      valueToString(input.verificationDigit ?? input.verification_digit) ?? existing.verificationDigit,
      valueToString(input.companyName ?? input.company_name) ?? existing.companyName,
      nullableString(input.commercialName ?? input.commercial_name, existing.commercialName),
      nullableString(input.taxRegime ?? input.tax_regime, existing.taxRegime),
      nullableString(input.economicActivityCode ?? input.economic_activity_code, existing.economicActivityCode),
      nullableString(input.address, existing.address),
      nullableString(input.departmentCode ?? input.department_code, existing.departmentCode),
      nullableString(input.municipalityCode ?? input.municipality_code, existing.municipalityCode),
      nullableString(input.phoneNumber ?? input.phone_number, existing.phoneNumber),
      nullableString(input.email, existing.email),
      nullableString(input.serviceCode ?? input.service_code, existing.serviceCode),
      nullableString(input.invoiceApiToken ?? input.invoice_api_token ?? input.token, existing.invoiceApiToken),
      normalizeInvoiceProvider(input.invoiceProvider ?? input.invoice_provider) ?? existing.invoiceProvider,
      numericValue(input.environment, existing.environment),
      nullableString(input.logoUrl ?? input.logo_url, existing.logoUrl),
      booleanValue(input.isActive ?? input.is_active, existing.isActive),
      now,
      existing.id,
    )
    .run();

  const updated = await findTenant(env.DB, existing.id);
  if (!updated) throw new Error("tenant_update_failed");
  return updated;
}

async function findTenant(db: D1Database, idOrSlug: string): Promise<TenantResponse | null> {
  const row = await db
    .prepare(`SELECT ${TENANT_SELECT} FROM rips_admin_tenants WHERE id = ? OR slug = ? LIMIT 1`)
    .bind(idOrSlug, idOrSlug)
    .first<TenantRow>();
  return row ? mapTenant(row) : null;
}

async function syncTenantMetadata(env: Bindings, tenant: TenantResponse): Promise<void> {
  await fetchTenantDo(env, tenant, "/rips-admin/metadata", new Request(`${DO_ORIGIN}/metadata`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ tenant }),
  }));
}

async function fetchTenantDo(
  env: Bindings,
  tenant: TenantResponse,
  path: string,
  source?: Request,
): Promise<Response> {
  const stub = stubFor(env.TENANT, tenant.doName);
  const url = `${DO_ORIGIN}${path}`;
  if (!source) return stub.fetch(url);
  const body = source.method === "GET" || source.method === "HEAD" ? undefined : await source.clone().arrayBuffer();
  return stub.fetch(url, {
    method: source.method,
    headers: source.headers,
    body,
  });
}

async function respondFromDo(response: Response): Promise<Response> {
  const body = await response.arrayBuffer();
  const headers = new Headers(response.headers);
  headers.delete("content-encoding");
  headers.delete("transfer-encoding");
  return new Response(body, { status: response.status, headers });
}

function mapTenant(row: TenantRow): TenantResponse {
  return {
    id: row.id,
    slug: row.slug,
    doName: row.do_name,
    nit: row.nit,
    verificationDigit: row.verification_digit,
    companyName: row.company_name,
    commercialName: row.commercial_name,
    taxRegime: row.tax_regime,
    economicActivityCode: row.economic_activity_code,
    address: row.address,
    departmentCode: row.department_code,
    municipalityCode: row.municipality_code,
    phoneNumber: row.phone_number,
    email: row.email,
    serviceCode: row.service_code,
    invoiceApiToken: row.invoice_api_token,
    invoiceProvider: row.invoice_provider,
    environment: row.environment,
    logoUrl: row.logo_url,
    isActive: row.is_active === 1,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

function mapLegacyWorkspace(tenant: TenantResponse | TenantRow): Record<string, unknown> {
  const mapped = "company_name" in tenant ? mapTenant(tenant) : tenant;
  return {
    id: mapped.id,
    companyName: mapped.companyName,
    displayName: mapped.commercialName || mapped.companyName,
    nit: mapped.nit,
    verificationDigit: mapped.verificationDigit,
    commercialName: mapped.commercialName,
    taxRegime: mapped.taxRegime,
    economicActivityCode: mapped.economicActivityCode,
    address: mapped.address,
    departmentCode: mapped.departmentCode,
    municipalityCode: mapped.municipalityCode,
    phoneNumber: mapped.phoneNumber,
    email: mapped.email,
    serviceCode: mapped.serviceCode,
    invoiceProvider: mapped.invoiceProvider,
    environment: mapped.environment,
    logoUrl: mapped.logoUrl,
    isActive: mapped.isActive,
    role: "Admin",
  };
}

function stripWorkspacePrefix(pathname: string, workspaceId: string): string {
  return pathname.replace(new RegExp(`^/api/workspaces/${escapeRegExp(workspaceId)}/?`), "").replace(/^\/+/, "");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function requiredString(value: unknown, field: string): string {
  const parsed = valueToString(value);
  if (!parsed) throw new Error(`missing_${field}`);
  return parsed;
}

function valueToString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function scalarToString(value: unknown): string | null {
  if (typeof value === "string") return value.trim() ? value.trim() : null;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  return null;
}

function normalizeEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function nullableString(value: unknown, fallback: string | null = null): string | null {
  if (value === undefined) return fallback;
  return typeof value === "string" ? value : null;
}

function numericValue(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function booleanValue(value: unknown, fallback: boolean): number {
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "number") return value === 0 ? 0 : 1;
  if (typeof value === "string") return value === "false" || value === "0" ? 0 : 1;
  return fallback ? 1 : 0;
}

function boundedInt(value: string | undefined, fallback: number, min: number, max: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72) || crypto.randomUUID();
}

export default app;
