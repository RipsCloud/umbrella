import { describe, expect, it, vi, expectTypeOf } from "vitest";

import { createFevRipsClient } from "./client";
import { createInMemoryTokenStore } from "./stores/memory";
import { staticCredentials, type SisproCredentials } from "./types/credentials";
import type { paths } from "./generated/schema";

const CREDS: SisproCredentials = {
  persona: { identificacion: { tipo: "CC", numero: "1014196971" } },
  clave: "pw",
  nit: "nit-1",
};

describe("createFevRipsClient", () => {
  it("honors the fetch override", async () => {
    const mockFetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      const pathname = new URL(url).pathname;
      if (pathname === "/api/Auth/LoginSISPRO") {
        return new Response(JSON.stringify({ token: "tok-1" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as unknown as typeof fetch;

    const client = createFevRipsClient({
      baseUrl: "https://example.test",
      tenantKey: "t1",
      credentials: staticCredentials(CREDS),
      tokenStore: createInMemoryTokenStore(),
      fetch: mockFetch,
    });

    await client.GET("/api/TestApi/Index");

    // Must have been called via the override (at least once for the endpoint, once for login)
    expect(mockFetch).toHaveBeenCalled();
  });

  it("SisproCredentials is structurally assignable to the generated login request body", () => {
    type LoginBody = NonNullable<
      paths["/api/Auth/LoginSISPRO"]["post"]["requestBody"]
    >["content"]["application/json"];

    // Compile-time assertion: SisproCredentials fits into the generated body.
    expectTypeOf<SisproCredentials>().toMatchTypeOf<LoginBody>();
  });
});
