import type { LogLevel } from "@ripscloud/ripscloud-logger";

export type Bindings = {
  LOG_LEVEL: LogLevel;
  ALLOWED_ORIGINS: string;
  FEVRIPS_UPSTREAM_BASE_URL: string;
  DB: D1Database;
  FILES: R2Bucket;
  TOKENS: KVNamespace;
  TENANT: DurableObjectNamespace;
};

export type Variables = {
  tenant: string;
  tenantStub: DurableObjectStub;
};
