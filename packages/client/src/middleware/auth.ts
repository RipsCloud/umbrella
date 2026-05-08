import type { Middleware } from "openapi-fetch";

import type { CredentialsProvider } from "../types/credentials";
import type { Logger } from "../types/logger";
import type { TokenStore } from "../types/token-store";
import { FevRipsAuthError } from "../types/errors";
import {
  createTokenManager,
  isAuthPath,
  safeJson,
  type TokenManager,
} from "../internal/token-core";

export interface AuthMiddlewareOptions {
  baseUrl: string;
  tenantKey: string;
  credentials: CredentialsProvider;
  tokenStore: TokenStore;
  log: Logger;
  fetch?: typeof fetch;
}

export function createAuthMiddleware(opts: AuthMiddlewareOptions): Middleware {
  const fetchImpl = opts.fetch ?? globalThis.fetch.bind(globalThis);
  const manager: TokenManager = createTokenManager({
    baseUrl: opts.baseUrl,
    tenantKey: opts.tenantKey,
    credentials: opts.credentials,
    tokenStore: opts.tokenStore,
    log: opts.log,
    fetch: fetchImpl,
  });

  return {
    async onRequest({ request }) {
      if (isAuthPath(request.url)) return;

      let token = await manager.getCached();
      if (!token) {
        opts.log.debug("fevrips-client: token miss, logging in", { tenantKey: opts.tenantKey });
        token = await manager.getOrRefresh();
      }

      const headers = new Headers(request.headers);
      headers.set("Authorization", `Bearer ${token}`);
      return new Request(request, { headers });
    },

    async onResponse({ request, response }) {
      if (response.status !== 401) return response;
      if (isAuthPath(request.url)) return response;

      opts.log.info("fevrips-client: 401 received, refreshing token", {
        tenantKey: opts.tenantKey,
        url: request.url,
      });

      await manager.invalidate();

      let newToken: string;
      try {
        newToken = await manager.getOrRefresh();
      } catch (err) {
        throw new FevRipsAuthError("failed to refresh token after 401", {
          status: 401,
          body: err instanceof Error ? err.message : String(err),
        });
      }

      const headers = new Headers(request.headers);
      headers.set("Authorization", `Bearer ${newToken}`);
      const retried = await fetchImpl(new Request(request, { headers }));

      if (retried.status === 401) {
        const body = await safeJson(retried);
        throw new FevRipsAuthError("401 after token refresh", { status: 401, body });
      }

      return retried;
    },
  };
}
