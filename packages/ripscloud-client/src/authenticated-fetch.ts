import type { CredentialsProvider } from "./types/credentials";
import type { Logger } from "./types/logger";
import { noopLogger } from "./types/logger";
import type { TokenStore } from "./types/token-store";
import { FevRipsAuthError } from "./types/errors";
import { createTokenManager, isAuthPath, safeJson } from "./internal/token-core";

export interface AuthenticatedFetchOptions {
  baseUrl: string;
  tenantKey: string;
  credentials: CredentialsProvider;
  tokenStore: TokenStore;
  log?: Logger;
  fetch?: typeof fetch;
}

/**
 * Returns a `fetch`-compatible function that:
 *  - injects `Authorization: Bearer <token>` on every non-/api/auth/ request
 *  - transparently logs in via LoginSISPRO when the store has no token
 *  - on 401, invalidates the cached token, refreshes once, and retries exactly once
 *  - deduplicates concurrent logins for the same tenantKey
 *
 * URLs passed in can be either full absolute URLs or paths starting with `/`
 * (in which case they are resolved against `baseUrl`).
 */
export function createAuthenticatedFetch(opts: AuthenticatedFetchOptions): typeof fetch {
  const fetchImpl = opts.fetch ?? globalThis.fetch.bind(globalThis);
  const log = opts.log ?? noopLogger;
  const base = opts.baseUrl.replace(/\/+$/, "");

  const manager = createTokenManager({
    baseUrl: opts.baseUrl,
    tenantKey: opts.tenantKey,
    credentials: opts.credentials,
    tokenStore: opts.tokenStore,
    log,
    fetch: fetchImpl,
  });

  async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const request = toRequest(input, init, base);

    if (isAuthPath(request.url)) {
      return fetchImpl(request);
    }

    let token = await manager.getCached();
    if (!token) token = await manager.getOrRefresh();

    const headers = new Headers(request.headers);
    headers.set("Authorization", `Bearer ${token}`);
    let response = await fetchImpl(new Request(request, { headers }));

    if (response.status === 401) {
      log.info("fevrips-client: 401, refreshing", {
        tenantKey: opts.tenantKey,
        url: request.url,
      });
      await manager.invalidate();

      let refreshed: string;
      try {
        refreshed = await manager.getOrRefresh();
      } catch (err) {
        throw new FevRipsAuthError("failed to refresh token after 401", {
          status: 401,
          body: err instanceof Error ? err.message : String(err),
        });
      }

      headers.set("Authorization", `Bearer ${refreshed}`);
      response = await fetchImpl(new Request(request, { headers }));

      if (response.status === 401) {
        const body = await safeJson(response);
        throw new FevRipsAuthError("401 after token refresh", { status: 401, body });
      }
    }

    return response;
  }

  return authFetch as typeof fetch;
}

function toRequest(input: RequestInfo | URL, init: RequestInit | undefined, base: string): Request {
  if (input instanceof Request) return init ? new Request(input, init) : input;
  let url: string;
  if (input instanceof URL) {
    url = input.href;
  } else if (typeof input === "string" && input.startsWith("/")) {
    url = `${base}${input}`;
  } else {
    url = String(input);
  }
  return new Request(url, init);
}
