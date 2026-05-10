#!/usr/bin/env tsx
import pg from "pg";
import type { Client as PgClient } from "pg";

const { Client } = pg;

type LegacyRow = Record<string, unknown>;
type JsonRecord = Record<string, unknown>;

type Options = {
  sourceUrl: string;
  targetUrl: string;
  tenantFilters: string[];
  batchSize: number;
  apply: boolean;
  allowRemote: boolean;
  includeDispatchAttempts: boolean;
  migrationSecret: string | null;
};

type TenantPayload = JsonRecord & {
  id: string;
  invoiceProvider: string;
};

type CollectionPlan = {
  collection: string;
  table: string;
  map: (row: LegacyRow, context: TenantContext) => JsonRecord;
};

type TenantContext = {
  tenant: TenantPayload;
  usersById: Map<string, LegacyRow>;
  userIdMap: Map<string, string>;
};

type GlobalMigrationResponse = {
  tenants?: {
    idMap?: Record<string, string>;
  };
  users?: {
    userIdMap?: Record<string, string>;
  };
};

const DEFAULT_TARGET_URL = "http://localhost:8830";
const DEFAULT_BATCH_SIZE = 200;
const MAX_SQL_TEXT_BYTES = 1_800_000;
const textEncoder = new TextEncoder();

const COLLECTION_PLANS: CollectionPlan[] = [
  { collection: "locations", table: "TenantLocations", map: mapLocation },
  { collection: "clients", table: "Clients", map: mapClient },
  { collection: "patients", table: "Patients", map: mapPatient },
  { collection: "specialists", table: "Specialists", map: mapSpecialist },
  { collection: "services", table: "TenantServices", map: mapService },
  { collection: "resolutions", table: "InvoiceResolutions", map: mapResolution },
  { collection: "credit-note-resolutions", table: "CreditNoteResolutions", map: mapResolution },
  { collection: "invoice-drafts", table: "InvoiceDrafts", map: mapInvoiceDraft },
  { collection: "credit-note-drafts", table: "CreditNoteDrafts", map: mapCreditNoteDraft },
];

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  if (!options.sourceUrl) {
    throw new Error("Set --source-url or RIPS_ADMIN_LEGACY_DATABASE_URL.");
  }
  if (options.apply) assertTargetIsAllowed(options);

  const client = new Client({ connectionString: options.sourceUrl });
  await client.connect();
  try {
    const tableCache = new Map<string, boolean>();
    const tenants = filterTenants(await readRows(client, tableCache, "Tenants"), options.tenantFilters);
    if (!tenants.length) throw new Error("No legacy tenants matched the selected filters.");

    const tenantIds = new Set(tenants.map((row) => requiredString(pick(row, "Id"), "tenant.Id")));
    const memberships = (await readMemberships(client, tableCache)).filter((row) =>
      tenantIds.has(requiredString(pick(row, "TenantId"), "UserWorkspace.TenantId")),
    );
    const selectedUserIds = new Set(memberships.map((row) => requiredString(pick(row, "UserId"), "UserWorkspace.UserId")));
    for (const tenant of tenants) {
      const createdByUserId = stringValue(pick(tenant, "CreatedByUserId"));
      if (createdByUserId) selectedUserIds.add(createdByUserId);
    }

    const users = (await readUsers(client, tableCache)).filter((row) =>
      selectedUserIds.size === 0 ? true : selectedUserIds.has(requiredString(pick(row, "Id"), "User.Id")),
    );
    const usersById = new Map(users.map((row) => [requiredString(pick(row, "Id"), "User.Id"), row]));
    const tenantPayloads = mapTenants(tenants);
    const userPayloads = users.map(mapUser);
    const membershipPayloads = memberships.map(mapMembership);

    console.log(`Source: ${describeDatabaseUrl(options.sourceUrl)}`);
    console.log(`Target: ${options.targetUrl}`);
    console.log(`Mode: ${options.apply ? "apply" : "dry-run"}`);
    console.log(
      `Global rows: ${tenantPayloads.length} tenants, ${userPayloads.length} users, ${membershipPayloads.length} memberships`,
    );

    const tenantIdMap = new Map(tenantPayloads.map((tenant) => [tenant.id, tenant.id]));
    const userIdMap = new Map(users.map((row) => {
      const id = requiredString(pick(row, "Id"), "User.Id");
      return [id, id] as const;
    }));

    if (options.apply) {
      const globalResponse = await postJson(options, "/api/rips-admin/migration/global", {
        tenants: tenantPayloads,
        users: userPayloads,
        memberships: membershipPayloads,
      }) as GlobalMigrationResponse;
      for (const [legacyId, targetId] of Object.entries(globalResponse.tenants?.idMap ?? {})) tenantIdMap.set(legacyId, targetId);
      for (const [legacyId, targetId] of Object.entries(globalResponse.users?.userIdMap ?? {})) userIdMap.set(legacyId, targetId);
    }

    const collectionCounts: Record<string, number> = {};
    for (const tenant of tenantPayloads) {
      const tenantId = tenant.id;
      const targetTenantId = tenantIdMap.get(tenantId) ?? tenantId;
      const tenantCounts: Record<string, number> = {};
      console.log(`Tenant ${tenantId}: ${tenant.companyName ?? tenant.nit ?? "unknown"}`);

      for (const plan of COLLECTION_PLANS) {
        const rows = await readTenantRows(client, tableCache, plan.table, tenantId);
        const items = rows.map((row) => plan.map(row, { tenant, usersById, userIdMap }));
        collectionCounts[plan.collection] = (collectionCounts[plan.collection] ?? 0) + items.length;
        tenantCounts[plan.collection] = items.length;
        console.log(`  ${plan.collection}: ${items.length}`);
        if (options.apply) {
          await bulkUpsertCollection(options, targetTenantId, plan.collection, items);
        }
      }

      if (options.includeDispatchAttempts) {
        const attempts = await readDispatchAttempts(client, tableCache, tenantId, tenant.invoiceProvider);
        collectionCounts["dispatch-attempts"] = (collectionCounts["dispatch-attempts"] ?? 0) + attempts.length;
        tenantCounts["dispatch-attempts"] = attempts.length;
        console.log(`  dispatch-attempts: ${attempts.length}`);
        if (options.apply) {
          await bulkUpsertCollection(options, targetTenantId, "dispatch-attempts", attempts);
        }
      }

      if (options.apply) await verifyTenantSummary(options, targetTenantId, tenantCounts);
    }

    if (!options.apply) {
      console.log("Dry run only. Re-run with --apply to write to the target Worker.");
    }
    console.log(`Collection rows: ${JSON.stringify(collectionCounts)}`);
  } finally {
    await client.end();
  }
}

function parseArgs(argv: string[]): Options {
  const out: Options = {
    sourceUrl: process.env.RIPS_ADMIN_LEGACY_DATABASE_URL ?? "",
    targetUrl: process.env.RIPS_ADMIN_TARGET_API_URL ?? DEFAULT_TARGET_URL,
    tenantFilters: [],
    batchSize: DEFAULT_BATCH_SIZE,
    apply: false,
    allowRemote: false,
    includeDispatchAttempts: true,
    migrationSecret: process.env.RIPS_ADMIN_MIGRATION_SECRET ?? null,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--") continue;
    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
    if (arg === "--apply") {
      out.apply = true;
      continue;
    }
    if (arg === "--dry-run") {
      out.apply = false;
      continue;
    }
    if (arg === "--allow-remote") {
      out.allowRemote = true;
      continue;
    }
    if (arg === "--skip-dispatch-attempts") {
      out.includeDispatchAttempts = false;
      continue;
    }
    if (arg === "--source-url") {
      out.sourceUrl = requiredArg(argv, ++i, arg);
      continue;
    }
    if (arg === "--target-url") {
      out.targetUrl = requiredArg(argv, ++i, arg).replace(/\/+$/, "");
      continue;
    }
    if (arg === "--tenant") {
      out.tenantFilters.push(requiredArg(argv, ++i, arg).toLowerCase());
      continue;
    }
    if (arg === "--batch-size") {
      out.batchSize = boundedInt(requiredArg(argv, ++i, arg), DEFAULT_BATCH_SIZE, 1, 500);
      continue;
    }
    if (arg === "--migration-secret") {
      out.migrationSecret = requiredArg(argv, ++i, arg);
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  out.targetUrl = out.targetUrl.replace(/\/+$/, "");
  return out;
}

function printHelp(): void {
  console.log(`Usage:
  pnpm migrate:rips-admin --source-url "$RIPS_ADMIN_LEGACY_DATABASE_URL" [--apply]

Options:
  --source-url <url>          Legacy PostgreSQL connection string.
  --target-url <url>          Target Worker origin. Defaults to ${DEFAULT_TARGET_URL}.
  --tenant <id-or-nit>        Migrate only selected tenant. Can be repeated.
  --batch-size <n>            DO bulk-upsert batch size. Defaults to ${DEFAULT_BATCH_SIZE}.
  --migration-secret <value>  Sends x-rips-admin-migration-secret to guarded targets.
  --skip-dispatch-attempts    Skip historical DIAN/SISPRO dispatch attempts.
  --allow-remote              Required with --apply for non-local target URLs.
  --apply                     Write data. Without this flag the script only prints counts.`);
}

function assertTargetIsAllowed(options: Options): void {
  const url = new URL(options.targetUrl);
  const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
  if (!localHosts.has(url.hostname) && !options.allowRemote) {
    throw new Error("Refusing to apply to a non-local target without --allow-remote.");
  }
}

async function readRows(
  client: PgClient,
  tableCache: Map<string, boolean>,
  table: string,
  orderBy = `"CreatedAt", "Id"`,
): Promise<LegacyRow[]> {
  if (!(await tableExists(client, tableCache, table))) return [];
  const result = await client.query<LegacyRow>(`SELECT * FROM ${quoteIdent(table)} ORDER BY ${orderBy}`);
  return result.rows;
}

async function readTenantRows(
  client: PgClient,
  tableCache: Map<string, boolean>,
  table: string,
  tenantId: string,
): Promise<LegacyRow[]> {
  if (!(await tableExists(client, tableCache, table))) return [];
  const result = await client.query<LegacyRow>(
    `SELECT * FROM ${quoteIdent(table)} WHERE "TenantId" = $1 ORDER BY "CreatedAt", "Id"`,
    [tenantId],
  );
  return result.rows;
}

async function readUsers(client: PgClient, tableCache: Map<string, boolean>): Promise<LegacyRow[]> {
  if (!(await tableExists(client, tableCache, "Users"))) return [];
  const hasUserLogins = await tableExists(client, tableCache, "UserLogins");
  const join = hasUserLogins
    ? `LEFT JOIN "UserLogins" gl ON gl."UserId" = u."Id" AND gl."LoginProvider" = 'Google'`
    : "";
  const select = hasUserLogins ? `u.*, gl."ProviderKey" AS "GoogleSubject"` : "u.*";
  const result = await client.query<LegacyRow>(
    `SELECT ${select} FROM "Users" u ${join} ORDER BY COALESCE(u."Email", u."UserName"), u."Id"`,
  );
  return result.rows;
}

async function readMemberships(client: PgClient, tableCache: Map<string, boolean>): Promise<LegacyRow[]> {
  if (!(await tableExists(client, tableCache, "UserWorkspaces"))) return [];
  const hasRoles = await tableExists(client, tableCache, "Roles");
  const join = hasRoles ? `LEFT JOIN "Roles" r ON r."Id" = uw."RoleId"` : "";
  const select = hasRoles ? `uw.*, r."Name" AS "RoleName"` : "uw.*";
  const result = await client.query<LegacyRow>(
    `SELECT ${select} FROM "UserWorkspaces" uw ${join} ORDER BY uw."TenantId", uw."CreatedAt", uw."Id"`,
  );
  return result.rows;
}

async function readDispatchAttempts(
  client: PgClient,
  tableCache: Map<string, boolean>,
  tenantId: string,
  invoiceProvider: string,
): Promise<JsonRecord[]> {
  const out: JsonRecord[] = [];
  out.push(...await readDocumentAttempts(client, tableCache, {
    table: "InvoiceDispatchAttempts",
    draftTable: "InvoiceDrafts",
    draftIdColumn: "InvoiceDraftId",
    documentType: "Invoice",
    channel: "InvoiceProvider",
    provider: invoiceProvider,
    tenantId,
    attemptedAtColumn: "AttemptedAt",
  }));
  out.push(...await readDocumentAttempts(client, tableCache, {
    table: "InvoiceRipsDispatchAttempts",
    draftTable: "InvoiceDrafts",
    draftIdColumn: "InvoiceDraftId",
    documentType: "Invoice",
    channel: "RipsMinistry",
    provider: "SISPRO",
    tenantId,
    attemptedAtColumn: "AttemptedAt",
  }));
  out.push(...await readDocumentAttempts(client, tableCache, {
    table: "CreditNoteDispatchAttempts",
    draftTable: "CreditNoteDrafts",
    draftIdColumn: "CreditNoteDraftId",
    documentType: "CreditNote",
    channel: "DIAN",
    provider: invoiceProvider,
    tenantId,
    attemptedAtColumn: "AttemptedAtUtc",
  }));
  out.push(...await readDocumentAttempts(client, tableCache, {
    table: "CreditNoteRipsDispatchAttempts",
    draftTable: "CreditNoteDrafts",
    draftIdColumn: "CreditNoteDraftId",
    documentType: "CreditNote",
    channel: "RipsMinistry",
    provider: "SISPRO",
    tenantId,
    attemptedAtColumn: "AttemptedAtUtc",
  }));
  return out.sort((a, b) => numberValue(a.attemptedAtUtc, 0) - numberValue(b.attemptedAtUtc, 0));
}

async function readDocumentAttempts(
  client: PgClient,
  tableCache: Map<string, boolean>,
  config: {
    table: string;
    draftTable: string;
    draftIdColumn: string;
    documentType: string;
    channel: string;
    provider: string;
    tenantId: string;
    attemptedAtColumn: string;
  },
): Promise<JsonRecord[]> {
  if (!(await tableExists(client, tableCache, config.table))) return [];
  if (!(await tableExists(client, tableCache, config.draftTable))) return [];
  const result = await client.query<LegacyRow>(
    `SELECT a.*
     FROM ${quoteIdent(config.table)} a
     INNER JOIN ${quoteIdent(config.draftTable)} d ON d."Id" = a.${quoteIdent(config.draftIdColumn)}
     WHERE d."TenantId" = $1
     ORDER BY a.${quoteIdent(config.attemptedAtColumn)}, a."Id"`,
    [config.tenantId],
  );
  return result.rows.map((row) => mapDispatchAttempt(row, config));
}

async function tableExists(client: PgClient, cache: Map<string, boolean>, table: string): Promise<boolean> {
  const cached = cache.get(table);
  if (cached !== undefined) return cached;
  const result = await client.query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.tables
       WHERE table_schema = current_schema() AND table_name = $1
     ) AS "exists"`,
    [table],
  );
  const exists = result.rows[0]?.exists === true;
  cache.set(table, exists);
  return exists;
}

function filterTenants(rows: LegacyRow[], filters: string[]): LegacyRow[] {
  if (!filters.length) return rows;
  const selected = new Set(filters.map((value) => value.toLowerCase()));
  return rows.filter((row) => {
    const values = [
      stringValue(pick(row, "Id")),
      stringValue(pick(row, "Nit")),
      stringValue(pick(row, "CompanyName")),
      stringValue(pick(row, "CommercialName")),
    ].filter((value): value is string => Boolean(value)).map((value) => value.toLowerCase());
    return values.some((value) => selected.has(value));
  });
}

function mapTenants(rows: LegacyRow[]): TenantPayload[] {
  const seen = new Map<string, number>();
  return rows.map((row) => {
    const id = requiredString(pick(row, "Id"), "Tenant.Id");
    const companyName = requiredString(pick(row, "CompanyName"), "Tenant.CompanyName");
    const nit = requiredString(pick(row, "Nit"), "Tenant.Nit");
    const baseSlug = slugify(`${companyName}-${nit}`);
    const occurrence = seen.get(baseSlug) ?? 0;
    seen.set(baseSlug, occurrence + 1);
    const slug = occurrence === 0 ? baseSlug : `${baseSlug}-${id.slice(0, 8)}`;
    return mapTenant(row, slug);
  });
}

function mapTenant(row: LegacyRow, slug: string): TenantPayload {
  const id = requiredString(pick(row, "Id"), "Tenant.Id");
  const companyName = requiredString(pick(row, "CompanyName"), "Tenant.CompanyName");
  const nit = requiredString(pick(row, "Nit"), "Tenant.Nit");
  return cleanRecord({
    id,
    slug,
    doName: `rips-admin:${slug}`,
    nit,
    verificationDigit: stringValue(pick(row, "VerificationDigit")) ?? "",
    companyName,
    commercialName: stringValue(pick(row, "CommercialName")),
    taxRegime: stringValue(pick(row, "TaxRegime")),
    economicActivityCode: stringValue(pick(row, "EconomicActivityCode")),
    address: stringValue(pick(row, "Address")),
    departmentCode: stringValue(pick(row, "DepartmentCode")),
    municipalityCode: stringValue(pick(row, "MunicipalityCode")),
    phoneNumber: stringValue(pick(row, "PhoneNumber")),
    email: stringValue(pick(row, "Email")),
    serviceCode: stringValue(pick(row, "ServiceCode")),
    invoiceApiToken: stringValue(pick(row, "InvoiceApiToken")),
    invoiceProvider: invoiceProviderName(pick(row, "InvoiceProvider")),
    environment: numberValue(pick(row, "Environment"), 2),
    logoUrl: stringValue(pick(row, "LogoUrl")),
    isActive: boolValue(pick(row, "IsActive"), true),
    createdAt: isoDate(pick(row, "CreatedAt")),
    updatedAt: isoDate(pick(row, "UpdatedAt")) ?? isoDate(pick(row, "CreatedAt")),
    sispro: cleanRecord({
      documentType: stringValue(pick(row, "SisproDocumentType")),
      documentNumber: stringValue(pick(row, "SisproDocumentNumber")),
      password: stringValue(pick(row, "SisproPassword")),
    }),
  }) as TenantPayload;
}

function mapUser(row: LegacyRow): JsonRecord {
  return cleanRecord({
    id: requiredString(pick(row, "Id"), "User.Id"),
    email: normalizeEmail(pick(row, "Email", "UserName")),
    firstName: stringValue(pick(row, "FirstName")) ?? "",
    lastName: stringValue(pick(row, "LastName")) ?? "",
    passwordHash: stringValue(pick(row, "PasswordHash")),
    googleSubject: stringValue(pick(row, "GoogleSubject")),
    isActive: boolValue(pick(row, "IsActive"), true),
    createdAt: isoDate(pick(row, "CreatedAt")),
    updatedAt: isoDate(pick(row, "UpdatedAt")) ?? isoDate(pick(row, "CreatedAt")),
  });
}

function mapMembership(row: LegacyRow): JsonRecord {
  return cleanRecord({
    id: requiredString(pick(row, "Id"), "UserWorkspace.Id"),
    userId: requiredString(pick(row, "UserId"), "UserWorkspace.UserId"),
    tenantId: requiredString(pick(row, "TenantId"), "UserWorkspace.TenantId"),
    role: stringValue(pick(row, "RoleName", "RoleId")) ?? "Admin",
    isActive: boolValue(pick(row, "IsActive"), true),
    createdAt: isoDate(pick(row, "CreatedAt")),
    updatedAt: isoDate(pick(row, "UpdatedAt")) ?? isoDate(pick(row, "CreatedAt")),
  });
}

function mapLocation(row: LegacyRow): JsonRecord {
  return cleanRecord({
    id: requiredString(pick(row, "Id"), "TenantLocation.Id"),
    name: stringValue(pick(row, "Name")) ?? "Main",
    address: stringValue(pick(row, "Address")),
    departmentCode: stringValue(pick(row, "DepartmentCode")),
    municipalityCode: stringValue(pick(row, "MunicipalityCode")),
    phoneNumber: stringValue(pick(row, "PhoneNumber")),
    email: stringValue(pick(row, "Email")),
    habilitationCode: stringValue(pick(row, "HabilitationCode")),
    isActive: boolValue(pick(row, "IsActive"), true),
    createdAt: epochMillis(pick(row, "CreatedAt")),
    updatedAt: epochMillis(pick(row, "UpdatedAt")) ?? epochMillis(pick(row, "CreatedAt")),
  });
}

function mapClient(row: LegacyRow): JsonRecord {
  return cleanRecord({
    id: requiredString(pick(row, "Id"), "Client.Id"),
    nit: stringValue(pick(row, "Nit")) ?? "",
    verificationDigit: stringValue(pick(row, "VerificationDigit")),
    companyName: stringValue(pick(row, "CompanyName")) ?? "",
    commercialName: stringValue(pick(row, "CommercialName")),
    taxRegime: stringValue(pick(row, "TaxRegime")),
    economicActivityCode: stringValue(pick(row, "EconomicActivityCode")),
    address: stringValue(pick(row, "Address")),
    departmentCode: stringValue(pick(row, "DepartmentCode")),
    municipalityCode: stringValue(pick(row, "MunicipalityCode")),
    phoneNumber: stringValue(pick(row, "PhoneNumber")),
    email: stringValue(pick(row, "Email")),
    typeOrganizationId: numberValue(pick(row, "TypeOrganizationId"), 2),
    typeDocumentIdentificationId: numberValue(pick(row, "TypeDocumentIdentificationId"), 3),
    isActive: boolValue(pick(row, "IsActive"), true),
    createdAt: epochMillis(pick(row, "CreatedAt")),
    updatedAt: epochMillis(pick(row, "UpdatedAt")) ?? epochMillis(pick(row, "CreatedAt")),
  });
}

function mapPatient(row: LegacyRow): JsonRecord {
  return cleanRecord({
    id: requiredString(pick(row, "Id"), "Patient.Id"),
    documentType: stringValue(pick(row, "DocumentType")) ?? "",
    documentNumber: stringValue(pick(row, "DocumentNumber")) ?? "",
    userType: stringValue(pick(row, "UserType")),
    birthDate: dateOnly(pick(row, "BirthDate")),
    sexCode: stringValue(pick(row, "SexCode")),
    countryResidenceCode: stringValue(pick(row, "CountryResidenceCode")),
    countryOriginCode: stringValue(pick(row, "CountryOriginCode")),
    municipalityResidenceCode: stringValue(pick(row, "MunicipalityResidenceCode")),
    territorialZoneCode: stringValue(pick(row, "TerritorialZoneCode")),
    disabilityFlag: stringValue(pick(row, "DisabilityFlag")),
    firstName: stringValue(pick(row, "FirstName")) ?? "",
    middleName: stringValue(pick(row, "MiddleName")),
    lastName: stringValue(pick(row, "LastName")) ?? "",
    secondLastName: stringValue(pick(row, "SecondLastName")),
    isActive: boolValue(pick(row, "IsActive"), true),
    createdAt: epochMillis(pick(row, "CreatedAt")),
    updatedAt: epochMillis(pick(row, "UpdatedAt")) ?? epochMillis(pick(row, "CreatedAt")),
  });
}

function mapSpecialist(row: LegacyRow, context: TenantContext): JsonRecord {
  const legacyUserId = stringValue(pick(row, "UserId"));
  const user = context.usersById.get(legacyUserId ?? "");
  return cleanRecord({
    id: requiredString(pick(row, "Id"), "Specialist.Id"),
    userId: mappedUserId(legacyUserId, context),
    documentType: stringValue(pick(row, "DocumentType")) ?? "",
    documentNumber: stringValue(pick(row, "DocumentNumber")) ?? "",
    professionalType: stringValue(pick(row, "ProfessionalType")),
    registrationNumber: stringValue(pick(row, "RegistrationNumber")),
    birthDate: dateOnly(pick(row, "BirthDate")),
    sexCode: stringValue(pick(row, "SexCode")),
    countryResidenceCode: stringValue(pick(row, "CountryResidenceCode")),
    municipalityResidenceCode: stringValue(pick(row, "MunicipalityResidenceCode")),
    territorialZoneCode: stringValue(pick(row, "TerritorialZoneCode")),
    firstName: stringValue(pick(user ?? {}, "FirstName")) ?? "",
    lastName: stringValue(pick(user ?? {}, "LastName")) ?? "",
    isActive: boolValue(pick(row, "IsActive"), true),
    createdAt: epochMillis(pick(row, "CreatedAt")),
    updatedAt: epochMillis(pick(row, "UpdatedAt")) ?? epochMillis(pick(row, "CreatedAt")),
  });
}

function mapService(row: LegacyRow): JsonRecord {
  return cleanRecord({
    id: requiredString(pick(row, "Id"), "TenantService.Id"),
    category: serviceCategoryName(pick(row, "Category")),
    name: stringValue(pick(row, "Name")) ?? "",
    description: stringValue(pick(row, "Description")),
    payloadJson: jsonPayload(pick(row, "PayloadJson"), {}),
    isActive: boolValue(pick(row, "IsActive"), true),
    createdAt: epochMillis(pick(row, "CreatedAt")),
    updatedAt: epochMillis(pick(row, "UpdatedAt")) ?? epochMillis(pick(row, "CreatedAt")),
  });
}

function mapResolution(row: LegacyRow): JsonRecord {
  return cleanRecord({
    id: requiredString(pick(row, "Id"), "Resolution.Id"),
    resolutionNumber: stringValue(pick(row, "ResolutionNumber")) ?? "",
    prefix: stringValue(pick(row, "Prefix")) ?? "",
    nextNumber: numberValue(pick(row, "NextNumber"), 1),
    fromNumber: numberValue(pick(row, "FromNumber"), 1),
    toNumber: numberValue(pick(row, "ToNumber"), 1),
    validFrom: dateOnly(pick(row, "ValidFrom")),
    validTo: dateOnly(pick(row, "ValidTo")),
    isActive: boolValue(pick(row, "IsActive"), true),
    environment: numberValue(pick(row, "Environment"), 2),
    technicalKey: stringValue(pick(row, "TechnicalKey")),
    createdAt: epochMillis(pick(row, "CreatedAt")),
    updatedAt: epochMillis(pick(row, "UpdatedAt")) ?? epochMillis(pick(row, "CreatedAt")),
  });
}

function mapInvoiceDraft(row: LegacyRow, context: TenantContext): JsonRecord {
  return cleanRecord({
    id: requiredString(pick(row, "Id"), "InvoiceDraft.Id"),
    clientId: stringValue(pick(row, "ClientId")) ?? "",
    submittedByUserId: mappedUserId(stringValue(pick(row, "SubmittedByUserId")), context),
    status: statusName(pick(row, "Status")),
    kind: invoiceKindName(pick(row, "Kind")),
    statusMessage: stringValue(pick(row, "StatusMessage")),
    metadataJson: compactJsonPayload(pick(row, "MetadataJson"), {}, "InvoiceDraft.MetadataJson"),
    totalAmount: numberValue(pick(row, "TotalAmount"), 0),
    assignedInvoiceNumber: stringValue(pick(row, "AssignedInvoiceNumber")),
    cufe: stringValue(pick(row, "Cufe")),
    cuv: stringValue(pick(row, "Cuv")),
    dianStatusCode: stringValue(pick(row, "DianStatusCode")),
    dianStatusDescription: stringValue(pick(row, "DianStatusDescription")),
    patientServicesJson: compactJsonPayload(pick(row, "PatientServicesJson"), null, "InvoiceDraft.PatientServicesJson"),
    invoicePayloadJson: compactJsonPayload(pick(row, "InvoicePayloadJson"), {}, "InvoiceDraft.InvoicePayloadJson"),
    ripsPayloadJson: compactJsonPayload(pick(row, "RipsPayloadJson"), null, "InvoiceDraft.RipsPayloadJson"),
    invoiceResolutionId: stringValue(pick(row, "InvoiceResolutionId")),
    locationId: stringValue(pick(row, "LocationId")),
    ripsQueuedAtUtc: epochMillis(pick(row, "RipsQueuedAtUtc")),
    emailSentAtUtc: epochMillis(pick(row, "EmailSentAtUtc")),
    createdAt: epochMillis(pick(row, "CreatedAt")),
    updatedAt: epochMillis(pick(row, "UpdatedAt")) ?? epochMillis(pick(row, "CreatedAt")),
  });
}

function mapCreditNoteDraft(row: LegacyRow, context: TenantContext): JsonRecord {
  return cleanRecord({
    id: requiredString(pick(row, "Id"), "CreditNoteDraft.Id"),
    invoiceDraftId: stringValue(pick(row, "InvoiceDraftId")) ?? "",
    clientId: stringValue(pick(row, "ClientId")) ?? "",
    submittedByUserId: mappedUserId(stringValue(pick(row, "SubmittedByUserId")), context),
    status: statusName(pick(row, "Status")),
    kind: invoiceKindName(pick(row, "Kind")),
    statusMessage: stringValue(pick(row, "StatusMessage")),
    metadataJson: compactJsonPayload(pick(row, "MetadataJson"), {}, "CreditNoteDraft.MetadataJson"),
    totalAmount: numberValue(pick(row, "TotalAmount"), 0),
    assignedCreditNoteNumber: stringValue(pick(row, "AssignedCreditNoteNumber")),
    cude: stringValue(pick(row, "Cude")),
    dianStatusCode: stringValue(pick(row, "DianStatusCode")),
    dianStatusDescription: stringValue(pick(row, "DianStatusDescription")),
    discrepancyResponseCode: numberValue(pick(row, "DiscrepancyResponseCode"), 1),
    discrepancyResponseDescription: stringValue(pick(row, "DiscrepancyResponseDescription")),
    creditNotePayloadJson: compactJsonPayload(pick(row, "CreditNotePayloadJson"), {}, "CreditNoteDraft.CreditNotePayloadJson"),
    ripsPayloadJson: compactJsonPayload(pick(row, "RipsPayloadJson"), null, "CreditNoteDraft.RipsPayloadJson"),
    selectedItemsJson: compactJsonPayload(pick(row, "SelectedItemsJson"), null, "CreditNoteDraft.SelectedItemsJson"),
    creditNoteResolutionId: stringValue(pick(row, "CreditNoteResolutionId")),
    locationId: stringValue(pick(row, "LocationId")),
    ripsQueuedAtUtc: epochMillis(pick(row, "RipsQueuedAtUtc")),
    emailSentAtUtc: epochMillis(pick(row, "EmailSentAtUtc")),
    createdAt: epochMillis(pick(row, "CreatedAt")),
    updatedAt: epochMillis(pick(row, "UpdatedAt")) ?? epochMillis(pick(row, "CreatedAt")),
  });
}

function mapDispatchAttempt(
  row: LegacyRow,
  config: {
    table: string;
    draftIdColumn: string;
    documentType: string;
    channel: string;
    provider: string;
    attemptedAtColumn: string;
  },
): JsonRecord {
  return cleanRecord({
    id: requiredString(pick(row, "Id"), `${config.table}.Id`),
    documentType: config.documentType,
    documentId: requiredString(pick(row, config.draftIdColumn), `${config.draftIdColumn}`),
    channel: config.channel,
    provider: config.provider,
    attemptedAtUtc: epochMillis(pick(row, config.attemptedAtColumn)),
    succeeded: boolValue(pick(row, "Succeeded"), false),
    requestPayload: compactJsonPayload(pick(row, "RequestPayload"), null, `${config.table}.RequestPayload`),
    responsePayload: compactJsonPayload(pick(row, "ResponsePayload"), null, `${config.table}.ResponsePayload`),
    errorMessage: stringValue(pick(row, "ErrorMessage")),
  });
}

function mappedUserId(legacyUserId: string | null, context: TenantContext): string | null {
  if (!legacyUserId) return null;
  return context.userIdMap.get(legacyUserId) ?? legacyUserId;
}

async function bulkUpsertCollection(
  options: Options,
  tenantId: string,
  collection: string,
  items: JsonRecord[],
): Promise<void> {
  for (const batch of chunks(items, options.batchSize)) {
    if (!batch.length) continue;
    await postJson(options, `/api/rips-admin/tenants/${encodeURIComponent(tenantId)}/bulk-upsert/${collection}`, {
      items: batch,
    });
  }
}

async function postJson(options: Options, path: string, body: unknown): Promise<unknown> {
  const headers: Record<string, string> = {
    accept: "application/json",
    "content-type": "application/json",
  };
  if (options.migrationSecret) headers["x-rips-admin-migration-secret"] = options.migrationSecret;

  const response = await fetch(`${options.targetUrl}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} from ${path}: ${text.slice(0, 500)}`);
  }
  return text ? JSON.parse(text) as unknown : null;
}

async function getJson(options: Options, path: string): Promise<unknown> {
  const headers: Record<string, string> = { accept: "application/json" };
  if (options.migrationSecret) headers["x-rips-admin-migration-secret"] = options.migrationSecret;
  const response = await fetch(`${options.targetUrl}${path}`, { headers });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} from ${path}: ${text.slice(0, 500)}`);
  }
  return text ? JSON.parse(text) as unknown : null;
}

async function verifyTenantSummary(
  options: Options,
  tenantId: string,
  expected: Record<string, number>,
): Promise<void> {
  const response = await getJson(options, `/api/rips-admin/tenants/${encodeURIComponent(tenantId)}/summary`) as {
    summary?: Record<string, number>;
  };
  const summary = response.summary ?? {};
  const mismatches = Object.entries(expected).filter(([collection, count]) => summary[collection] !== count);
  if (mismatches.length) {
    const detail = mismatches.map(([collection, count]) => `${collection}: expected ${count}, got ${summary[collection] ?? "missing"}`);
    throw new Error(`Tenant ${tenantId} summary mismatch after migration: ${detail.join("; ")}`);
  }
}

function pick(row: LegacyRow, ...keys: string[]): unknown {
  for (const key of keys) {
    if (Object.hasOwn(row, key)) return row[key];
    const found = Object.keys(row).find((candidate) => candidate.toLowerCase() === key.toLowerCase());
    if (found) return row[found];
  }
  return undefined;
}

function requiredString(value: unknown, label: string): string {
  const parsed = stringValue(value);
  if (!parsed) throw new Error(`Missing required value: ${label}`);
  return parsed;
}

function stringValue(value: unknown): string | null {
  if (typeof value === "string") return value.trim() ? value.trim() : null;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "bigint") return value.toString();
  return null;
}

function normalizeEmail(value: unknown): string {
  return stringValue(value)?.toLowerCase() ?? "";
}

function boolValue(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["false", "0", "no"].includes(normalized)) return false;
    if (["true", "1", "yes"].includes(normalized)) return true;
  }
  return fallback;
}

function numberValue(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function isoDate(value: unknown): string | undefined {
  const ms = epochMillis(value);
  return ms === undefined ? undefined : new Date(ms).toISOString();
}

function epochMillis(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (value instanceof Date) {
    const ms = value.getTime();
    return Number.isFinite(ms) ? ms : undefined;
  }
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const numeric = Number(value);
    if (Number.isFinite(numeric) && value.length > 8) return numeric;
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function dateOnly(value: unknown): string | undefined {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const text = stringValue(value);
  if (text) return text.slice(0, 10);
  const ms = epochMillis(value);
  return ms === undefined ? undefined : new Date(ms).toISOString().slice(0, 10);
}

function jsonPayload(value: unknown, fallback: unknown): unknown {
  if (value === undefined || value === null || value === "") return fallback;
  return value;
}

function compactJsonPayload(value: unknown, fallback: unknown, label: string): unknown {
  const payload = jsonPayload(value, fallback);
  if (payload === undefined || payload === null) return payload;
  if (byteLength(payload) <= MAX_SQL_TEXT_BYTES) return payload;

  const parsed = parsePayloadObject(payload);
  if (!parsed) {
    return omittedPayloadMarker(label, byteLength(payload), ["payload"]);
  }

  const omittedFields: string[] = [];
  for (const key of ["XmlFevFile", "xmlFevFile", "XmlAttachedDocument", "xmlAttachedDocument"]) {
    if (typeof parsed[key] === "string" && parsed[key].length > 0) {
      omittedFields.push(key);
      delete parsed[key];
    }
  }
  parsed._migration = {
    ...(asRecord(parsed._migration)),
    omittedLargeFields: omittedFields,
    originalBytes: byteLength(payload),
    reason: "exceeded_do_sqlite_text_limit",
  };

  if (byteLength(parsed) <= MAX_SQL_TEXT_BYTES) return parsed;
  return omittedPayloadMarker(label, byteLength(payload), omittedFields.length ? omittedFields : ["payload"]);
}

function parsePayloadObject(value: unknown): JsonRecord | null {
  if (value && typeof value === "object" && !Array.isArray(value)) return { ...(value as JsonRecord) };
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as JsonRecord : null;
  } catch {
    return null;
  }
}

function omittedPayloadMarker(label: string, originalBytes: number, omittedFields: string[]): JsonRecord {
  return {
    _migration: {
      omittedPayload: true,
      omittedLargeFields: omittedFields,
      originalBytes,
      source: label,
      reason: "exceeded_do_sqlite_text_limit",
    },
  };
}

function byteLength(value: unknown): number {
  return textEncoder.encode(typeof value === "string" ? value : JSON.stringify(value)).byteLength;
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};
}

function invoiceProviderName(value: unknown): string {
  if (value === 2 || value === "2" || String(value).toLowerCase() === "ledger") return "ledger";
  return "monaros";
}

function statusName(value: unknown): string {
  const names = ["Queued", "Processing", "Sent", "Failed", "Cancelled"];
  const numeric = numberValue(value, Number.NaN);
  if (Number.isInteger(numeric) && numeric >= 0 && numeric < names.length) return names[numeric] ?? "Queued";
  const text = stringValue(value);
  return text ?? "Queued";
}

function invoiceKindName(value: unknown): string {
  if (value === 1 || value === "1" || String(value).toLowerCase() === "health") return "Health";
  return "Commercial";
}

function serviceCategoryName(value: unknown): string {
  const names = [
    "",
    "Consultas",
    "Procedimientos",
    "Urgencias",
    "Hospitalizacion",
    "RecienNacidos",
    "Medicamentos",
    "OtrosServicios",
  ];
  const numeric = numberValue(value, Number.NaN);
  if (Number.isInteger(numeric) && numeric >= 1 && numeric < names.length) return names[numeric] ?? String(numeric);
  return stringValue(value) ?? "Consultas";
}

function cleanRecord<T extends JsonRecord>(record: T): T {
  for (const key of Object.keys(record)) {
    if (record[key] === undefined) delete record[key];
  }
  return record;
}

function chunks<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function boundedInt(value: string, fallback: number, min: number, max: number): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function requiredArg(argv: string[], index: number, name: string): string {
  const value = argv[index];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${name}`);
  return value;
}

function quoteIdent(value: string): string {
  return `"${value.replace(/"/g, "\"\"")}"`;
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72) || "tenant";
}

function describeDatabaseUrl(value: string): string {
  try {
    const url = new URL(value);
    return `${url.protocol}//${url.hostname}${url.port ? `:${url.port}` : ""}${url.pathname}`;
  } catch {
    return "legacy database";
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
