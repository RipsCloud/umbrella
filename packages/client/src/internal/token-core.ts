import type { CredentialsProvider, SisproCredentials } from "../types/credentials";
import type { Logger } from "../types/logger";
import type { TokenStore } from "../types/token-store";
import { FevRipsAuthError } from "../types/errors";

export const DEFAULT_TTL_SEC = 25 * 60;
export const MIN_TTL_SEC = 30;

export interface TokenManagerOptions {
  baseUrl: string;
  tenantKey: string;
  credentials: CredentialsProvider;
  tokenStore: TokenStore;
  log: Logger;
  fetch: typeof fetch;
}

export interface TokenManager {
  getOrRefresh(): Promise<string>;
  getCached(): Promise<string | undefined>;
  invalidate(): Promise<void>;
}

export function createTokenManager(opts: TokenManagerOptions): TokenManager {
  const inFlight = new Map<string, Promise<string>>();

  async function login(): Promise<string> {
    const creds = await opts.credentials.resolve(opts.tenantKey);
    return performLogin(opts.baseUrl, creds, opts.fetch, opts.log);
  }

  async function getOrRefresh(): Promise<string> {
    const existing = inFlight.get(opts.tenantKey);
    if (existing) return existing;

    const p = (async () => {
      const token = await login();
      const ttl = deriveTtlSec(token);
      await opts.tokenStore.set(opts.tenantKey, token, ttl);
      return token;
    })();

    inFlight.set(opts.tenantKey, p);
    try {
      return await p;
    } finally {
      inFlight.delete(opts.tenantKey);
    }
  }

  return {
    getOrRefresh,
    async getCached() {
      return opts.tokenStore.get(opts.tenantKey);
    },
    async invalidate() {
      await opts.tokenStore.invalidate(opts.tenantKey);
    },
  };
}

export function isAuthPath(urlStr: string): boolean {
  const p = new URL(urlStr).pathname.toLowerCase();
  return p.startsWith("/api/auth/");
}

export async function performLogin(
  baseUrl: string,
  creds: SisproCredentials,
  fetchImpl: typeof fetch,
  log: Logger,
): Promise<string> {
  const url = `${baseUrl.replace(/\/+$/, "")}/api/Auth/LoginSISPRO`;
  const res = await fetchImpl(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(creds),
  });

  if (!res.ok) {
    const body = await safeJson(res);
    log.warn("fevrips-client: login failed", { status: res.status });
    throw new FevRipsAuthError(`LoginSISPRO failed (${res.status})`, { status: res.status, body });
  }

  const body = (await res.json()) as { token?: string | null };
  if (!body.token) {
    throw new FevRipsAuthError("LoginSISPRO returned no token", { status: res.status, body });
  }
  return body.token;
}

export function deriveTtlSec(token: string): number {
  const parts = token.split(".");
  if (parts.length !== 3) return DEFAULT_TTL_SEC;
  try {
    const payload = parts[1]!;
    const json = base64UrlDecode(payload);
    const parsed = JSON.parse(json) as { exp?: number };
    if (typeof parsed.exp !== "number") return DEFAULT_TTL_SEC;
    const remaining = parsed.exp - Math.floor(Date.now() / 1000);
    if (!Number.isFinite(remaining) || remaining < MIN_TTL_SEC) return MIN_TTL_SEC;
    return remaining;
  } catch {
    return DEFAULT_TTL_SEC;
  }
}

export function base64UrlDecode(input: string): string {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((input.length + 3) % 4);
  if (typeof atob === "function") return atob(b64);
  // Node fallback (tests)
  return Buffer.from(b64, "base64").toString("utf8");
}

export async function safeJson(res: Response): Promise<unknown> {
  try {
    return await res.clone().json();
  } catch {
    return undefined;
  }
}
