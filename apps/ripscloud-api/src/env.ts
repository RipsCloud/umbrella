import type { LogLevel } from "@ripscloud/ripscloud-logger";

export type Bindings = {
  LOG_LEVEL: LogLevel;
  ALLOWED_ORIGINS: string;
  FEVRIPS_UPSTREAM_BASE_URL: string;
  RIPS_ADMIN_GOOGLE_CLIENT_ID?: string;
  RIPS_ADMIN_JWT_SECRET?: string;
  RIPS_ADMIN_AUTH_ISSUER: string;
  RIPS_ADMIN_AUTH_AUDIENCE: string;
  RIPS_ADMIN_MIGRATION_SECRET?: string;
  RIPS_ADMIN_ACCESS_TOKEN_TTL_SEC: string;
  RIPS_ADMIN_REFRESH_TOKEN_TTL_SEC: string;
  RIPS_ADMIN_MONAROS_BASE_URL?: string;
  RIPS_ADMIN_LEDGER_PRODUCTION_URL?: string;
  RIPS_ADMIN_LEDGER_HABILITACION_URL?: string;
  RIPS_ADMIN_LEDGER_REPORTING_PRODUCTION_URL?: string;
  RIPS_ADMIN_LEDGER_REPORTING_HABILITACION_URL?: string;
  RIPS_ADMIN_LEDGER_API_KEY?: string;
  RIPS_ADMIN_LEDGER_HABILITACION_TEST_SET_ID?: string;
  RIPS_ADMIN_LEDGER_MAX_POLL_ATTEMPTS?: string;
  RIPS_ADMIN_LEDGER_POLL_INTERVAL_MS?: string;
  SEND_EMAIL?: string;
  SMTP_HOST?: string;
  SMTP_PORT?: string;
  SMTP_USERNAME?: string;
  SMTP_PASSWORD?: string;
  SMTP_FROM_ADDRESS?: string;
  SMTP_ENABLE_SSL?: string;
  DB: D1Database;
  FILES: R2Bucket;
  TOKENS: KVNamespace;
  TENANT: DurableObjectNamespace;
};

export type Variables = {
  tenant: string;
  tenantStub: DurableObjectStub;
};
