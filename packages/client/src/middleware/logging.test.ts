import { describe, expect, it, vi } from "vitest";

import { createFevRipsClient } from "../client";
import { createInMemoryTokenStore } from "../stores/memory";
import { staticCredentials } from "../types/credentials";
import type { Logger } from "../types/logger";

const BASE_URL = "https://rips-stage.example.com";
const CREDS = {
  persona: { identificacion: { tipo: "CC", numero: "1" } },
  clave: "pw",
  nit: "nit",
};

function makeLogger(): Logger & { calls: Array<{ level: string; event: string; fields?: Record<string, unknown> }> } {
  const calls: Array<{ level: string; event: string; fields?: Record<string, unknown> }> = [];
  const push = (level: string) => (event: string, fields?: Record<string, unknown>) => {
    calls.push({ level, event, fields });
  };
  return {
    calls,
    trace: push("trace"),
    debug: push("debug"),
    info: push("info"),
    warn: push("warn"),
    error: push("error"),
  };
}

describe("logging middleware", () => {
  it("emits request + response entries with method, path, status, durationMs, tenantKey", async () => {
    const log = makeLogger();
    const mockFetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      const pathname = new URL(url).pathname;
      if (pathname === "/api/Auth/LoginSISPRO") {
        return new Response(JSON.stringify({ token: "tok-1" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ version: "1.0" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    });

    const client = createFevRipsClient({
      baseUrl: BASE_URL,
      tenantKey: "t1",
      credentials: staticCredentials(CREDS),
      tokenStore: createInMemoryTokenStore(),
      log,
      fetch: mockFetch as typeof fetch,
    });

    await client.GET("/api/TestApi/Index");

    const responseLog = log.calls.find((c) => c.event === "fevrips-client: response" && c.fields?.path === "/api/TestApi/Index");
    expect(responseLog).toBeDefined();
    expect(responseLog!.fields).toMatchObject({
      method: "GET",
      path: "/api/TestApi/Index",
      status: 200,
      tenantKey: "t1",
    });
    expect(typeof responseLog!.fields!.durationMs).toBe("number");
  });

  it("never logs clave or token in payloads", async () => {
    const log = makeLogger();
    const mockFetch = vi.fn(async () =>
      new Response(JSON.stringify({ token: "secret-token" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const client = createFevRipsClient({
      baseUrl: BASE_URL,
      tenantKey: "t1",
      credentials: staticCredentials(CREDS),
      tokenStore: createInMemoryTokenStore(),
      log,
      fetch: mockFetch as typeof fetch,
    });

    await client.GET("/api/TestApi/Index");

    const serialized = JSON.stringify(log.calls);
    expect(serialized).not.toContain("secret-token");
    expect(serialized).not.toContain(CREDS.clave);
  });
});
