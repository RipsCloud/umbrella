import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const examples = sqliteTable("examples", {
  id: text("id").primaryKey(),
  slug: text("slug").unique().notNull(),
  displayName: text("display_name").notNull(),
  status: text("status").notNull().default("draft"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const ripsAdminTenants = sqliteTable(
  "rips_admin_tenants",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    doName: text("do_name").notNull(),
    nit: text("nit").notNull(),
    verificationDigit: text("verification_digit").notNull(),
    companyName: text("company_name").notNull(),
    commercialName: text("commercial_name"),
    taxRegime: text("tax_regime"),
    economicActivityCode: text("economic_activity_code"),
    address: text("address"),
    departmentCode: text("department_code"),
    municipalityCode: text("municipality_code"),
    phoneNumber: text("phone_number"),
    email: text("email"),
    serviceCode: text("service_code"),
    invoiceApiToken: text("invoice_api_token"),
    invoiceProvider: text("invoice_provider").notNull().default("monaros"),
    environment: integer("environment").notNull().default(2),
    logoUrl: text("logo_url"),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    uniqueIndex("rips_admin_tenants_slug_unique").on(table.slug),
    uniqueIndex("rips_admin_tenants_do_name_unique").on(table.doName),
    index("rips_admin_tenants_company_name_idx").on(table.companyName),
    index("rips_admin_tenants_is_active_idx").on(table.isActive),
  ],
);

export const ripsAdminUsers = sqliteTable(
  "rips_admin_users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    firstName: text("first_name").notNull().default(""),
    lastName: text("last_name").notNull().default(""),
    passwordHash: text("password_hash"),
    googleSubject: text("google_subject"),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    uniqueIndex("rips_admin_users_email_unique").on(table.email),
    uniqueIndex("rips_admin_users_google_subject_unique").on(table.googleSubject),
    index("rips_admin_users_is_active_idx").on(table.isActive),
  ],
);

export const ripsAdminUserTenants = sqliteTable(
  "rips_admin_user_tenants",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => ripsAdminUsers.id, { onDelete: "cascade" }),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => ripsAdminTenants.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("admin"),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    uniqueIndex("rips_admin_user_tenants_user_tenant_unique").on(table.userId, table.tenantId),
    index("rips_admin_user_tenants_tenant_idx").on(table.tenantId),
    index("rips_admin_user_tenants_user_idx").on(table.userId),
  ],
);

export const ripsAdminRefreshTokens = sqliteTable(
  "rips_admin_refresh_tokens",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => ripsAdminUsers.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    revokedAt: integer("revoked_at", { mode: "timestamp" }),
    replacedByTokenHash: text("replaced_by_token_hash"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    uniqueIndex("rips_admin_refresh_tokens_token_hash_unique").on(table.tokenHash),
    index("rips_admin_refresh_tokens_user_idx").on(table.userId),
    index("rips_admin_refresh_tokens_expires_idx").on(table.expiresAt),
  ],
);

export const ripsAdminMigrationRuns = sqliteTable(
  "rips_admin_migration_runs",
  {
    id: text("id").primaryKey(),
    source: text("source").notNull(),
    status: text("status").notNull().default("pending"),
    startedAt: integer("started_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    completedAt: integer("completed_at", { mode: "timestamp" }),
    summaryJson: text("summary_json").notNull().default("{}"),
    errorMessage: text("error_message"),
  },
  (table) => [
    index("rips_admin_migration_runs_status_idx").on(table.status),
    index("rips_admin_migration_runs_started_idx").on(table.startedAt),
  ],
);
