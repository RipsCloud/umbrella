import createClient, { type Client } from "openapi-fetch";

import type { paths } from "./generated/schema";
import type { CredentialsProvider } from "./types/credentials";
import type { Logger } from "./types/logger";
import { noopLogger } from "./types/logger";
import type { TokenStore } from "./types/token-store";
import { createAuthMiddleware } from "./middleware/auth";
import { createLoggingMiddleware } from "./middleware/logging";

export interface FevRipsClientOptions {
  baseUrl: string;
  tenantKey: string;
  credentials: CredentialsProvider;
  tokenStore: TokenStore;
  log?: Logger;
  fetch?: typeof fetch;
}

export type FevRipsClient = Client<paths>;

export function createFevRipsClient(opts: FevRipsClientOptions): FevRipsClient {
  const log = opts.log ?? noopLogger;
  const fetchImpl = opts.fetch ?? globalThis.fetch.bind(globalThis);

  const client = createClient<paths>({
    baseUrl: opts.baseUrl.replace(/\/+$/, ""),
    fetch: fetchImpl,
  });

  client.use(
    createLoggingMiddleware({ log, tenantKey: opts.tenantKey }),
    createAuthMiddleware({
      baseUrl: opts.baseUrl,
      tenantKey: opts.tenantKey,
      credentials: opts.credentials,
      tokenStore: opts.tokenStore,
      log,
      fetch: fetchImpl,
    }),
  );

  return client;
}
