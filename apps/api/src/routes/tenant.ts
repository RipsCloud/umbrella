import { Hono } from "hono";
import {
  createAuthenticatedFetch,
  type SisproCredentials,
} from "@ripscloud/client";
import { createLogger } from "@ripscloud/logger";

import type { Bindings, Variables } from "../env";
import {
  createDoCredentialsProvider,
  createDoTokenStore,
  stubFor,
  storeCredentials,
  storeToken,
  NoCredentialsStoredError,
} from "../tenant-store";

const DEFAULT_TTL_SEC = 25 * 60;
const MIN_TTL_SEC = 30;

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use("/:tenant/*", async (c, next) => {
  const tenant = c.req.param("tenant");
  if (!tenant) return c.json({ error: "missing_tenant" }, 400);
  const stub = stubFor(c.env.TENANT, tenant);
  c.set("tenant", tenant);
  c.set("tenantStub", stub);
  return next();
});

// --- Login intercept: LoginSISPRO ---------------------------------

app.post("/:tenant/api/Auth/LoginSISPRO", async (c) =>
  handleLoginIntercept(c, "/api/Auth/LoginSISPRO"),
);

app.post("/:tenant/api/Auth/LoginSISPROERP", async (c) =>
  handleLoginIntercept(c, "/api/Auth/LoginSISPROERP"),
);

async function handleLoginIntercept(
  c: {
    env: Bindings;
    get: <K extends keyof Variables>(key: K) => Variables[K];
    req: { raw: Request };
  },
  upstreamPath: string,
): Promise<Response> {
  const log = createLogger({
    level: c.env.LOG_LEVEL,
    context: { tenant: c.get("tenant"), route: upstreamPath },
  });

  const rawBody = await c.req.raw.clone().text();
  let creds: SisproCredentials;
  try {
    creds = JSON.parse(rawBody) as SisproCredentials;
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const upstreamUrl = `${c.env.FEVRIPS_UPSTREAM_BASE_URL.replace(/\/+$/, "")}${upstreamPath}`;
  log.info("login intercept: forwarding to upstream", { upstreamUrl });

  const upstream = await fetch(upstreamUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: rawBody,
  });

  const respBody = await upstream.text();

  if (upstream.ok) {
    try {
      const parsed = JSON.parse(respBody) as { token?: string | null };
      if (parsed.token) {
        const stub = c.get("tenantStub");
        await storeCredentials(stub, creds);
        await storeToken(stub, parsed.token, deriveTtlSec(parsed.token));
        log.info("login intercept: stored credentials + token in DO");
      } else {
        log.warn("login intercept: upstream OK but no token in body");
      }
    } catch {
      log.warn("login intercept: upstream body is not JSON");
    }
  } else {
    log.warn("login intercept: upstream non-ok", { status: upstream.status });
  }

  return new Response(respBody, {
    status: upstream.status,
    headers: passthroughHeaders(upstream.headers),
  });
}

// --- Generic proxy for everything else under /:tenant/api/* -------

app.all("/:tenant/api/*", async (c) => {
  const tenant = c.get("tenant");
  const stub = c.get("tenantStub");
  const log = createLogger({
    level: c.env.LOG_LEVEL,
    context: { tenant, route: "proxy" },
  });

  const prefix = `/${tenant}`;
  const pathWithQuery = c.req.raw.url.slice(new URL(c.req.raw.url).origin.length);
  const upstreamPath = pathWithQuery.startsWith(prefix)
    ? pathWithQuery.slice(prefix.length)
    : pathWithQuery;

  const authFetch = createAuthenticatedFetch({
    baseUrl: c.env.FEVRIPS_UPSTREAM_BASE_URL,
    tenantKey: tenant,
    credentials: createDoCredentialsProvider(stub, tenant),
    tokenStore: createDoTokenStore(stub),
    log,
  });

  const method = c.req.raw.method;
  const body =
    method === "GET" || method === "HEAD" ? undefined : await c.req.raw.clone().arrayBuffer();

  try {
    const upstream = await authFetch(upstreamPath, {
      method,
      headers: forwardedHeaders(c.req.raw.headers),
      body,
    });

    const respBody = await upstream.arrayBuffer();
    return new Response(respBody, {
      status: upstream.status,
      headers: passthroughHeaders(upstream.headers),
    });
  } catch (err) {
    if (err instanceof NoCredentialsStoredError) {
      return Response.json(
        {
          error: "no_credentials",
          message: err.message,
          hint: `Call POST /${tenant}/api/Auth/LoginSISPRO first.`,
        },
        { status: 401 },
      );
    }
    log.error("proxy failed", { error: err instanceof Error ? err.message : String(err) });
    return Response.json(
      { error: "proxy_failed", message: err instanceof Error ? err.message : String(err) },
      { status: 502 },
    );
  }
});

function forwardedHeaders(src: Headers): Headers {
  const out = new Headers();
  for (const [k, v] of src.entries()) {
    const lower = k.toLowerCase();
    if (lower === "host" || lower === "authorization" || lower.startsWith("cf-") || lower.startsWith("x-forwarded-")) continue;
    out.set(k, v);
  }
  return out;
}

function passthroughHeaders(src: Headers): Headers {
  const out = new Headers();
  for (const [k, v] of src.entries()) {
    const lower = k.toLowerCase();
    if (lower === "content-encoding" || lower === "transfer-encoding") continue;
    out.set(k, v);
  }
  return out;
}

function deriveTtlSec(token: string): number {
  const parts = token.split(".");
  if (parts.length !== 3) return DEFAULT_TTL_SEC;
  try {
    const payload = parts[1]!;
    const b64 = payload.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((payload.length + 3) % 4);
    const json = typeof atob === "function" ? atob(b64) : Buffer.from(b64, "base64").toString("utf8");
    const parsed = JSON.parse(json) as { exp?: number };
    if (typeof parsed.exp !== "number") return DEFAULT_TTL_SEC;
    const remaining = parsed.exp - Math.floor(Date.now() / 1000);
    if (!Number.isFinite(remaining) || remaining < MIN_TTL_SEC) return MIN_TTL_SEC;
    return remaining;
  } catch {
    return DEFAULT_TTL_SEC;
  }
}

export default app;
