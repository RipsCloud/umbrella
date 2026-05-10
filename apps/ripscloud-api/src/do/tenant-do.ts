import type { SisproCredentials } from "@ripscloud/ripscloud-client";

type TokenEntry = { token: string; expiresAt: number };

type SqlValue = string | number | null;
type SqlRow = Record<string, SqlValue>;

type CollectionConfig = {
  table: string;
  columns: readonly string[];
  defaultSort: string;
  searchColumns?: readonly string[];
};

const COLLECTIONS = {
  locations: {
    table: "rips_admin_locations",
    defaultSort: "name",
    searchColumns: ["name", "habilitation_code", "email"],
    columns: [
      "id",
      "name",
      "address",
      "department_code",
      "municipality_code",
      "phone_number",
      "email",
      "habilitation_code",
      "is_active",
      "created_at",
      "updated_at",
    ],
  },
  clients: {
    table: "rips_admin_clients",
    defaultSort: "company_name",
    searchColumns: ["nit", "company_name", "commercial_name", "email"],
    columns: [
      "id",
      "nit",
      "verification_digit",
      "company_name",
      "commercial_name",
      "tax_regime",
      "economic_activity_code",
      "address",
      "department_code",
      "municipality_code",
      "phone_number",
      "email",
      "type_organization_id",
      "type_document_identification_id",
      "is_active",
      "created_at",
      "updated_at",
    ],
  },
  patients: {
    table: "rips_admin_patients",
    defaultSort: "last_name",
    searchColumns: ["document_number", "first_name", "last_name", "second_last_name"],
    columns: [
      "id",
      "document_type",
      "document_number",
      "user_type",
      "birth_date",
      "sex_code",
      "country_residence_code",
      "country_origin_code",
      "municipality_residence_code",
      "territorial_zone_code",
      "disability_flag",
      "first_name",
      "middle_name",
      "last_name",
      "second_last_name",
      "is_active",
      "created_at",
      "updated_at",
    ],
  },
  specialists: {
    table: "rips_admin_specialists",
    defaultSort: "last_name",
    searchColumns: ["document_number", "first_name", "last_name", "registration_number"],
    columns: [
      "id",
      "user_id",
      "document_type",
      "document_number",
      "professional_type",
      "registration_number",
      "birth_date",
      "sex_code",
      "country_residence_code",
      "municipality_residence_code",
      "territorial_zone_code",
      "first_name",
      "last_name",
      "is_active",
      "created_at",
      "updated_at",
    ],
  },
  services: {
    table: "rips_admin_services",
    defaultSort: "name",
    searchColumns: ["category", "name", "description"],
    columns: [
      "id",
      "category",
      "name",
      "description",
      "payload_json",
      "is_active",
      "created_at",
      "updated_at",
    ],
  },
  resolutions: {
    table: "rips_admin_invoice_resolutions",
    defaultSort: "prefix",
    searchColumns: ["resolution_number", "prefix"],
    columns: [
      "id",
      "resolution_number",
      "prefix",
      "next_number",
      "from_number",
      "to_number",
      "valid_from",
      "valid_to",
      "is_active",
      "environment",
      "technical_key",
      "created_at",
      "updated_at",
    ],
  },
  "credit-note-resolutions": {
    table: "rips_admin_credit_note_resolutions",
    defaultSort: "prefix",
    searchColumns: ["resolution_number", "prefix"],
    columns: [
      "id",
      "resolution_number",
      "prefix",
      "next_number",
      "from_number",
      "to_number",
      "valid_from",
      "valid_to",
      "is_active",
      "environment",
      "technical_key",
      "created_at",
      "updated_at",
    ],
  },
  "invoice-drafts": {
    table: "rips_admin_invoice_drafts",
    defaultSort: "created_at",
    searchColumns: ["assigned_invoice_number", "status", "cufe", "cuv"],
    columns: [
      "id",
      "client_id",
      "submitted_by_user_id",
      "status",
      "kind",
      "status_message",
      "metadata_json",
      "total_amount",
      "assigned_invoice_number",
      "cufe",
      "cuv",
      "dian_status_code",
      "dian_status_description",
      "patient_services_json",
      "invoice_payload_json",
      "rips_payload_json",
      "invoice_resolution_id",
      "location_id",
      "rips_queued_at_utc",
      "email_sent_at_utc",
      "created_at",
      "updated_at",
    ],
  },
  "credit-note-drafts": {
    table: "rips_admin_credit_note_drafts",
    defaultSort: "created_at",
    searchColumns: ["assigned_credit_note_number", "status", "cude"],
    columns: [
      "id",
      "invoice_draft_id",
      "client_id",
      "submitted_by_user_id",
      "status",
      "kind",
      "status_message",
      "metadata_json",
      "total_amount",
      "assigned_credit_note_number",
      "cude",
      "dian_status_code",
      "dian_status_description",
      "discrepancy_response_code",
      "discrepancy_response_description",
      "credit_note_payload_json",
      "rips_payload_json",
      "selected_items_json",
      "credit_note_resolution_id",
      "location_id",
      "rips_queued_at_utc",
      "email_sent_at_utc",
      "created_at",
      "updated_at",
    ],
  },
  "dispatch-attempts": {
    table: "rips_admin_dispatch_attempts",
    defaultSort: "attempted_at_utc",
    searchColumns: ["document_type", "provider", "error_message"],
    columns: [
      "id",
      "document_type",
      "document_id",
      "channel",
      "provider",
      "attempted_at_utc",
      "succeeded",
      "request_payload",
      "response_payload",
      "error_message",
    ],
  },
} as const satisfies Record<string, CollectionConfig>;

const COLLECTION_NAMES = Object.keys(COLLECTIONS);

export class TenantDO implements DurableObject {
  constructor(private state: DurableObjectState) {
    this.state.blockConcurrencyWhile(async () => {
      this.state.storage.sql.exec(TENANT_SQL_SCHEMA);
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (method === "GET" && path === "/credentials") {
      const creds = await this.state.storage.get<SisproCredentials>("credentials");
      return Response.json({ credentials: creds ?? null });
    }

    if (method === "PUT" && path === "/credentials") {
      const body = (await request.json()) as SisproCredentials;
      await this.state.storage.put("credentials", body);
      return Response.json({ ok: true });
    }

    if (method === "DELETE" && path === "/credentials") {
      await this.state.storage.delete("credentials");
      await this.state.storage.delete("token");
      return Response.json({ ok: true });
    }

    if (method === "GET" && path === "/token") {
      const entry = await this.state.storage.get<TokenEntry>("token");
      if (!entry) return Response.json({ token: null });
      if (entry.expiresAt <= Date.now()) {
        await this.state.storage.delete("token");
        return Response.json({ token: null });
      }
      return Response.json({ token: entry.token });
    }

    if (method === "PUT" && path === "/token") {
      const { token, ttlSec } = (await request.json()) as { token: string; ttlSec: number };
      const entry: TokenEntry = { token, expiresAt: Date.now() + ttlSec * 1000 };
      await this.state.storage.put("token", entry);
      return Response.json({ ok: true });
    }

    if (method === "DELETE" && path === "/token") {
      await this.state.storage.delete("token");
      return Response.json({ ok: true });
    }

    if (path.startsWith("/rips-admin")) {
      return this.handleRipsAdminRequest(request, url);
    }

    return Response.json({ error: "not_found", path, method }, { status: 404 });
  }

  private async handleRipsAdminRequest(request: Request, url: URL): Promise<Response> {
    const method = request.method;
    const segments = url.pathname.split("/").filter(Boolean).slice(1);

    if (segments.length === 0 && method === "GET") {
      return Response.json({
        ok: true,
        collections: COLLECTION_NAMES,
      });
    }

    if (segments[0] === "summary" && method === "GET") {
      return Response.json({ summary: this.summary() });
    }

    if (segments[0] === "metadata") {
      if (method === "GET") return Response.json({ metadata: this.getMetadata() });
      if (method === "PUT") {
        const body = (await request.json()) as Record<string, unknown>;
        this.replaceMetadata(body);
        return Response.json({ metadata: this.getMetadata() });
      }
    }

    if (segments[0] === "bulk-upsert" && method === "POST") {
      const collection = collectionFor(segments[1]);
      if (!collection) return collectionNotFound(segments[1]);
      const body = (await request.json()) as { items?: unknown[] };
      const items = Array.isArray(body.items) ? body.items : [];
      const upserted = items.map((item) => this.upsertItem(collection, asObject(item)));
      return Response.json({ count: upserted.length, items: upserted });
    }

    const collection = collectionFor(segments[0]);
    if (!collection) return collectionNotFound(segments[0]);

    if (segments.length === 1) {
      if (method === "GET") return Response.json(this.listItems(collection, url.searchParams));
      if (method === "POST") {
        const body = asObject(await request.json());
        return Response.json(this.upsertItem(collection, body), { status: 201 });
      }
    }

    const id = segments[1];
    if (!id) return Response.json({ error: "missing_id" }, { status: 400 });

    if (method === "GET") {
      const item = this.getItem(collection, id);
      if (!item) return Response.json({ error: "not_found" }, { status: 404 });
      return Response.json({ item });
    }

    if (method === "PUT" || method === "PATCH") {
      const body = asObject(await request.json());
      return Response.json(this.upsertItem(collection, { ...body, id }));
    }

    if (method === "DELETE") {
      const deleted = this.deleteItem(collection, id);
      return Response.json({ ok: true, deleted });
    }

    return Response.json({ error: "method_not_allowed" }, { status: 405 });
  }

  private getMetadata(): Record<string, unknown> {
    const rows = this.state.storage.sql
      .exec<{ key: string; value_json: string }>("SELECT key, value_json FROM rips_admin_metadata ORDER BY key")
      .toArray();
    return Object.fromEntries(rows.map((row) => [row.key, JSON.parse(row.value_json) as unknown]));
  }

  private replaceMetadata(metadata: Record<string, unknown>): void {
    const now = Date.now();
    this.state.storage.sql.exec("DELETE FROM rips_admin_metadata");
    for (const [key, value] of Object.entries(metadata)) {
      this.state.storage.sql.exec(
        "INSERT INTO rips_admin_metadata (key, value_json, updated_at) VALUES (?, ?, ?)",
        key,
        JSON.stringify(value),
        now,
      );
    }
  }

  private summary(): Record<string, number> {
    const out: Record<string, number> = {};
    for (const [name, collection] of Object.entries(COLLECTIONS)) {
      out[name] = this.state.storage.sql
        .exec<{ count: number }>(`SELECT COUNT(*) AS count FROM ${collection.table}`)
        .one().count;
    }
    return out;
  }

  private listItems(collection: CollectionConfig, params: URLSearchParams): { items: SqlRow[]; count: number } {
    const limit = boundedInt(params.get("limit"), 100, 1, 500);
    const offset = boundedInt(params.get("offset"), 0, 0, 100_000);
    const search = params.get("q")?.trim();
    const whereParts: string[] = [];
    const bindings: SqlValue[] = [];

    if (search && collection.searchColumns?.length) {
      const like = `%${search}%`;
      whereParts.push(`(${collection.searchColumns.map((column) => `${column} LIKE ?`).join(" OR ")})`);
      bindings.push(...collection.searchColumns.map(() => like));
    }

    for (const [column, value] of collectionFilters(collection, params)) {
      whereParts.push(`${column} = ?`);
      bindings.push(value);
    }

    const where = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : "";
    const sortColumn = collection.columns.includes(params.get("sort") ?? "")
      ? params.get("sort")
      : collection.defaultSort;
    const direction = params.get("direction")?.toLowerCase() === "asc" ? "ASC" : "DESC";
    const items = this.state.storage.sql
      .exec<SqlRow>(
        `SELECT * FROM ${collection.table} ${where} ORDER BY ${sortColumn} ${direction} LIMIT ? OFFSET ?`,
        ...bindings,
        limit,
        offset,
      )
      .toArray();
    const count = this.state.storage.sql
      .exec<{ count: number }>(`SELECT COUNT(*) AS count FROM ${collection.table} ${where}`, ...bindings)
      .one().count;
    return { items, count };
  }

  private getItem(collection: CollectionConfig, id: string): SqlRow | null {
    const rows = this.state.storage.sql
      .exec<SqlRow>(`SELECT * FROM ${collection.table} WHERE id = ? LIMIT 1`, id)
      .toArray();
    return rows[0] ?? null;
  }

  private upsertItem(collection: CollectionConfig, input: Record<string, unknown>): SqlRow {
    const id = valueToString(input.id) || crypto.randomUUID();
    const now = Date.now();
    const existing = this.getItem(collection, id);
    const values: Record<string, SqlValue> = { ...(existing ?? {}), id, ...normalizeInput(collection, input) };

    if (collection.columns.includes("created_at") && !existing && values.created_at === undefined) {
      values.created_at = now;
    }
    if (collection.columns.includes("updated_at")) {
      values.updated_at = now;
    }
    if (collection.columns.includes("attempted_at_utc") && values.attempted_at_utc === undefined) {
      values.attempted_at_utc = now;
    }

    const columns = Object.keys(values).filter((column) => collection.columns.includes(column));
    const updateColumns = columns.filter((column) => column !== "id");

    this.state.storage.sql.exec(
      `INSERT INTO ${collection.table} (${columns.join(", ")}) VALUES (${columns.map(() => "?").join(", ")})
       ON CONFLICT(id) DO UPDATE SET ${updateColumns.map((column) => `${column} = excluded.${column}`).join(", ")}`,
      ...columns.map((column) => values[column] ?? null),
    );

    const item = this.getItem(collection, id);
    if (!item) throw new Error(`failed to upsert ${collection.table}:${id}`);
    return item;
  }

  private deleteItem(collection: CollectionConfig, id: string): boolean {
    const existing = this.getItem(collection, id);
    if (!existing) return false;
    this.state.storage.sql.exec(`DELETE FROM ${collection.table} WHERE id = ?`, id);
    return true;
  }
}

function collectionFilters(collection: CollectionConfig, params: URLSearchParams): Array<[string, SqlValue]> {
  const filters: Array<[string, SqlValue]> = [];
  for (const column of collection.columns) {
    const value = params.get(column) ?? params.get(snakeToCamel(column));
    if (value !== null) filters.push([column, normalizeValue(value)]);
  }
  return filters;
}

function collectionFor(name: string | undefined): CollectionConfig | null {
  if (!name) return null;
  return Object.hasOwn(COLLECTIONS, name) ? COLLECTIONS[name as keyof typeof COLLECTIONS] : null;
}

function collectionNotFound(name: string | undefined): Response {
  return Response.json(
    {
      error: "unknown_collection",
      collection: name ?? null,
      collections: COLLECTION_NAMES,
    },
    { status: 404 },
  );
}

function boundedInt(value: string | null, fallback: number, min: number, max: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function normalizeInput(collection: CollectionConfig, input: Record<string, unknown>): Record<string, SqlValue> {
  const out: Record<string, SqlValue> = {};
  for (const column of collection.columns) {
    if (column === "id") continue;
    const camel = snakeToCamel(column);
    const value = input[column] ?? input[camel];
    if (value !== undefined) out[column] = normalizeValue(value);
  }
  return out;
}

function normalizeValue(value: unknown): SqlValue {
  if (value === undefined || value === null) return null;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function valueToString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function snakeToCamel(value: string): string {
  return value.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

const TENANT_SQL_SCHEMA = `
CREATE TABLE IF NOT EXISTS rips_admin_metadata (
  key TEXT PRIMARY KEY NOT NULL,
  value_json TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS rips_admin_locations (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  department_code TEXT,
  municipality_code TEXT,
  phone_number TEXT,
  email TEXT,
  habilitation_code TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_rips_admin_locations_habilitation_code ON rips_admin_locations (habilitation_code);
CREATE INDEX IF NOT EXISTS idx_rips_admin_locations_name ON rips_admin_locations (name);

CREATE TABLE IF NOT EXISTS rips_admin_clients (
  id TEXT PRIMARY KEY NOT NULL,
  nit TEXT NOT NULL,
  verification_digit TEXT,
  company_name TEXT NOT NULL,
  commercial_name TEXT,
  tax_regime TEXT,
  economic_activity_code TEXT,
  address TEXT,
  department_code TEXT,
  municipality_code TEXT,
  phone_number TEXT,
  email TEXT,
  type_organization_id INTEGER NOT NULL DEFAULT 2,
  type_document_identification_id INTEGER NOT NULL DEFAULT 3,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_rips_admin_clients_nit_vd ON rips_admin_clients (nit, verification_digit);
CREATE INDEX IF NOT EXISTS idx_rips_admin_clients_company_name ON rips_admin_clients (company_name);

CREATE TABLE IF NOT EXISTS rips_admin_patients (
  id TEXT PRIMARY KEY NOT NULL,
  document_type TEXT NOT NULL,
  document_number TEXT NOT NULL,
  user_type TEXT,
  birth_date TEXT,
  sex_code TEXT,
  country_residence_code TEXT,
  country_origin_code TEXT,
  municipality_residence_code TEXT,
  territorial_zone_code TEXT,
  disability_flag TEXT,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  second_last_name TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_rips_admin_patients_document ON rips_admin_patients (document_type, document_number);
CREATE INDEX IF NOT EXISTS idx_rips_admin_patients_name ON rips_admin_patients (last_name, first_name);

CREATE TABLE IF NOT EXISTS rips_admin_specialists (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT,
  document_type TEXT NOT NULL,
  document_number TEXT NOT NULL,
  professional_type TEXT,
  registration_number TEXT,
  birth_date TEXT,
  sex_code TEXT,
  country_residence_code TEXT,
  municipality_residence_code TEXT,
  territorial_zone_code TEXT,
  first_name TEXT,
  last_name TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_rips_admin_specialists_document ON rips_admin_specialists (document_type, document_number);
CREATE INDEX IF NOT EXISTS idx_rips_admin_specialists_name ON rips_admin_specialists (last_name, first_name);

CREATE TABLE IF NOT EXISTS rips_admin_services (
  id TEXT PRIMARY KEY NOT NULL,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  payload_json TEXT NOT NULL DEFAULT '{}',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_rips_admin_services_category_name ON rips_admin_services (category, name);
CREATE INDEX IF NOT EXISTS idx_rips_admin_services_category_active ON rips_admin_services (category, is_active);

CREATE TABLE IF NOT EXISTS rips_admin_invoice_resolutions (
  id TEXT PRIMARY KEY NOT NULL,
  resolution_number TEXT NOT NULL,
  prefix TEXT NOT NULL,
  next_number INTEGER NOT NULL,
  from_number INTEGER NOT NULL,
  to_number INTEGER NOT NULL,
  valid_from TEXT NOT NULL,
  valid_to TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  environment INTEGER NOT NULL DEFAULT 2,
  technical_key TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_rips_admin_invoice_resolutions_prefix_env ON rips_admin_invoice_resolutions (resolution_number, environment);

CREATE TABLE IF NOT EXISTS rips_admin_credit_note_resolutions (
  id TEXT PRIMARY KEY NOT NULL,
  resolution_number TEXT NOT NULL,
  prefix TEXT NOT NULL,
  next_number INTEGER NOT NULL,
  from_number INTEGER NOT NULL,
  to_number INTEGER NOT NULL,
  valid_from TEXT NOT NULL,
  valid_to TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  environment INTEGER NOT NULL DEFAULT 2,
  technical_key TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_rips_admin_credit_note_resolutions_prefix_env ON rips_admin_credit_note_resolutions (resolution_number, environment);

CREATE TABLE IF NOT EXISTS rips_admin_invoice_drafts (
  id TEXT PRIMARY KEY NOT NULL,
  client_id TEXT NOT NULL,
  submitted_by_user_id TEXT,
  status TEXT NOT NULL DEFAULT 'Queued',
  kind TEXT NOT NULL DEFAULT 'Commercial',
  status_message TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  total_amount REAL NOT NULL DEFAULT 0,
  assigned_invoice_number TEXT,
  cufe TEXT,
  cuv TEXT,
  dian_status_code TEXT,
  dian_status_description TEXT,
  patient_services_json TEXT,
  invoice_payload_json TEXT NOT NULL DEFAULT '{}',
  rips_payload_json TEXT,
  invoice_resolution_id TEXT,
  location_id TEXT,
  rips_queued_at_utc INTEGER,
  email_sent_at_utc INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rips_admin_invoice_drafts_created_at ON rips_admin_invoice_drafts (created_at);
CREATE INDEX IF NOT EXISTS idx_rips_admin_invoice_drafts_status ON rips_admin_invoice_drafts (status);

CREATE TABLE IF NOT EXISTS rips_admin_credit_note_drafts (
  id TEXT PRIMARY KEY NOT NULL,
  invoice_draft_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  submitted_by_user_id TEXT,
  status TEXT NOT NULL DEFAULT 'Queued',
  kind TEXT NOT NULL DEFAULT 'Commercial',
  status_message TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  total_amount REAL NOT NULL DEFAULT 0,
  assigned_credit_note_number TEXT,
  cude TEXT,
  dian_status_code TEXT,
  dian_status_description TEXT,
  discrepancy_response_code INTEGER,
  discrepancy_response_description TEXT,
  credit_note_payload_json TEXT NOT NULL DEFAULT '{}',
  rips_payload_json TEXT,
  selected_items_json TEXT,
  credit_note_resolution_id TEXT,
  location_id TEXT,
  rips_queued_at_utc INTEGER,
  email_sent_at_utc INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rips_admin_credit_note_drafts_created_at ON rips_admin_credit_note_drafts (created_at);
CREATE INDEX IF NOT EXISTS idx_rips_admin_credit_note_drafts_status ON rips_admin_credit_note_drafts (status);

CREATE TABLE IF NOT EXISTS rips_admin_dispatch_attempts (
  id TEXT PRIMARY KEY NOT NULL,
  document_type TEXT NOT NULL,
  document_id TEXT NOT NULL,
  channel TEXT NOT NULL,
  provider TEXT,
  attempted_at_utc INTEGER NOT NULL,
  succeeded INTEGER NOT NULL DEFAULT 0,
  request_payload TEXT,
  response_payload TEXT,
  error_message TEXT
);
CREATE INDEX IF NOT EXISTS idx_rips_admin_dispatch_attempts_document ON rips_admin_dispatch_attempts (document_type, document_id);
CREATE INDEX IF NOT EXISTS idx_rips_admin_dispatch_attempts_attempted_at ON rips_admin_dispatch_attempts (attempted_at_utc);
`;
