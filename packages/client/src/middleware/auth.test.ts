import { describe, expect, it, vi } from "vitest";

import { createFevRipsClient } from "../client";
import { createInMemoryTokenStore } from "../stores/memory";
import { staticCredentials, type SisproCredentials } from "../types/credentials";
import { FevRipsAuthError } from "../types/errors";

const BASE_URL = "https://rips-stage.example.com";
const CREDS: SisproCredentials = {
  persona: { identificacion: { tipo: "CC", numero: "1014196971" } },
  clave: "pw",
  nit: "nit-1",
};

type Scenario = {
  loginResponses?: Array<{ status?: number; token?: string | null; body?: unknown }>;
  endpointResponses?: Array<{ status: number; body?: unknown }>;
};

function makeFetch(scenario: Scenario) {
  const loginResponses = scenario.loginResponses ?? [{ status: 200, token: "tok-1" }];
  const endpointResponses = scenario.endpointResponses ?? [{ status: 200, body: { version: "1.0" } }];

  let loginIdx = 0;
  let endpointIdx = 0;
  const calls: Array<{ path: string; headers: Record<string, string>; body?: string }> = [];

  const mockFetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    const pathname = new URL(url).pathname;

    const req = input instanceof Request ? input : null;
    const headers: Record<string, string> = {};
    if (req) req.headers.forEach((v, k) => (headers[k] = v));
    else if (init?.headers) {
      const h = new Headers(init.headers);
      h.forEach((v, k) => (headers[k] = v));
    }

    let bodyText: string | undefined;
    if (req) bodyText = await req.clone().text();
    else if (init?.body) bodyText = init.body as string;

    calls.push({ path: pathname, headers, body: bodyText });

    if (pathname === "/api/Auth/LoginSISPRO") {
      const r = loginResponses[Math.min(loginIdx, loginResponses.length - 1)]!;
      loginIdx++;
      const status = r.status ?? 200;
      const body = r.body ?? { token: r.token, login: true };
      return new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
      });
    }

    const r = endpointResponses[Math.min(endpointIdx, endpointResponses.length - 1)]!;
    endpointIdx++;
    return new Response(JSON.stringify(r.body ?? {}), {
      status: r.status,
      headers: { "content-type": "application/json" },
    });
  }) as unknown as typeof fetch;

  return { mockFetch, calls, countLogins: () => loginIdx };
}

function build(fetchImpl: typeof fetch, tenantKey = "t1", credentials = CREDS) {
  return createFevRipsClient({
    baseUrl: BASE_URL,
    tenantKey,
    credentials: staticCredentials(credentials),
    tokenStore: createInMemoryTokenStore(),
    fetch: fetchImpl,
  });
}

describe("auth middleware", () => {
  it("triggers one LoginSISPRO on a cold cache and attaches the token", async () => {
    const { mockFetch, calls, countLogins } = makeFetch({
      loginResponses: [{ token: "tok-1" }],
      endpointResponses: [{ status: 200 }],
    });
    const client = build(mockFetch);

    await client.GET("/api/TestApi/Index");

    expect(countLogins()).toBe(1);
    const endpointCall = calls.find((c) => c.path === "/api/TestApi/Index");
    expect(endpointCall?.headers["authorization"]).toBe("Bearer tok-1");
  });

  it("reuses the cached token on subsequent calls (no extra login)", async () => {
    const { mockFetch, countLogins } = makeFetch({
      loginResponses: [{ token: "tok-1" }],
      endpointResponses: [{ status: 200 }, { status: 200 }, { status: 200 }],
    });
    const client = build(mockFetch);

    await client.GET("/api/TestApi/Index");
    await client.GET("/api/TestApi/Index");
    await client.GET("/api/TestApi/Index");

    expect(countLogins()).toBe(1);
  });

  it("never attaches Authorization on /api/Auth/** requests", async () => {
    const { mockFetch, calls } = makeFetch({
      loginResponses: [{ token: "tok-1" }],
    });
    const client = build(mockFetch);

    await client.POST("/api/Auth/LoginSISPRO", { body: CREDS });

    const loginCalls = calls.filter((c) => c.path === "/api/Auth/LoginSISPRO");
    for (const c of loginCalls) {
      expect(c.headers["authorization"]).toBeUndefined();
    }
  });

  it("on 401, invalidates cache, refreshes token, and retries exactly once", async () => {
    const { mockFetch, calls, countLogins } = makeFetch({
      loginResponses: [{ token: "tok-1" }, { token: "tok-2" }],
      endpointResponses: [
        { status: 401, body: { error: "expired" } },
        { status: 200, body: { version: "1.0" } },
      ],
    });
    const client = build(mockFetch);

    const { data, response } = await client.GET("/api/TestApi/Index");

    expect(response.status).toBe(200);
    expect(data).toMatchObject({ version: "1.0" });
    expect(countLogins()).toBe(2);

    const endpointCalls = calls.filter((c) => c.path === "/api/TestApi/Index");
    expect(endpointCalls).toHaveLength(2);
    expect(endpointCalls[0]!.headers["authorization"]).toBe("Bearer tok-1");
    expect(endpointCalls[1]!.headers["authorization"]).toBe("Bearer tok-2");
  });

  it("after a retry that still returns 401, throws FevRipsAuthError", async () => {
    const { mockFetch } = makeFetch({
      loginResponses: [{ token: "tok-1" }, { token: "tok-2" }],
      endpointResponses: [
        { status: 401 },
        { status: 401 },
      ],
    });
    const client = build(mockFetch);

    await expect(client.GET("/api/TestApi/Index")).rejects.toBeInstanceOf(FevRipsAuthError);
  });

  it("concurrent requests for the same tenantKey collapse to one login", async () => {
    let resolveLogin!: (body: string) => void;
    const loginPromise = new Promise<string>((r) => {
      resolveLogin = r;
    });

    let loginCount = 0;
    const mockFetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      const pathname = new URL(url).pathname;

      if (pathname === "/api/Auth/LoginSISPRO") {
        loginCount++;
        const body = await loginPromise;
        return new Response(body, { status: 200, headers: { "content-type": "application/json" } });
      }
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as unknown as typeof fetch;

    const client = build(mockFetch);

    const p1 = client.GET("/api/TestApi/Index");
    const p2 = client.GET("/api/TestApi/Index");
    const p3 = client.GET("/api/TestApi/Index");

    // All three are waiting on the same in-flight login
    resolveLogin(JSON.stringify({ token: "tok-shared" }));
    await Promise.all([p1, p2, p3]);

    expect(loginCount).toBe(1);
  });

  it("different tenantKey values don't share tokens", async () => {
    const store = createInMemoryTokenStore();
    let loginCount = 0;
    const tokensIssued: string[] = [];

    const mockFetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      const pathname = new URL(url).pathname;
      if (pathname === "/api/Auth/LoginSISPRO") {
        loginCount++;
        const token = `tok-${loginCount}`;
        tokensIssued.push(token);
        return new Response(JSON.stringify({ token }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as unknown as typeof fetch;

    const clientA = createFevRipsClient({
      baseUrl: BASE_URL,
      tenantKey: "tenant-a",
      credentials: staticCredentials(CREDS),
      tokenStore: store,
      fetch: mockFetch as typeof fetch,
    });
    const clientB = createFevRipsClient({
      baseUrl: BASE_URL,
      tenantKey: "tenant-b",
      credentials: staticCredentials(CREDS),
      tokenStore: store,
      fetch: mockFetch as typeof fetch,
    });

    await clientA.GET("/api/TestApi/Index");
    await clientB.GET("/api/TestApi/Index");

    expect(loginCount).toBe(2);
    expect(await store.get("tenant-a")).toBe("tok-1");
    expect(await store.get("tenant-b")).toBe("tok-2");
  });
});
