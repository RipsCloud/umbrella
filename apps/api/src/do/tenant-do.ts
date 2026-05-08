import type { SisproCredentials } from "@ripscloud/client";

type TokenEntry = { token: string; expiresAt: number };

export class TenantDO implements DurableObject {
  constructor(private state: DurableObjectState) {}

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (method === "GET" && path === "/credentials") {
      const creds = await this.state.storage.get<SisproCredentials>("credentials");
      return Response.json({ credentials: creds ?? null });
    }

    if (method === "PUT" && path === "/credentials") {
      const body = (await request.json()) as SisproCredentials;
      await this.state.storage.put("credentials", body);
      return Response.json({ ok: true });
    }

    if (method === "DELETE" && path === "/credentials") {
      await this.state.storage.delete("credentials");
      await this.state.storage.delete("token");
      return Response.json({ ok: true });
    }

    if (method === "GET" && path === "/token") {
      const entry = await this.state.storage.get<TokenEntry>("token");
      if (!entry) return Response.json({ token: null });
      if (entry.expiresAt <= Date.now()) {
        await this.state.storage.delete("token");
        return Response.json({ token: null });
      }
      return Response.json({ token: entry.token });
    }

    if (method === "PUT" && path === "/token") {
      const { token, ttlSec } = (await request.json()) as { token: string; ttlSec: number };
      const entry: TokenEntry = { token, expiresAt: Date.now() + ttlSec * 1000 };
      await this.state.storage.put("token", entry);
      return Response.json({ ok: true });
    }

    if (method === "DELETE" && path === "/token") {
      await this.state.storage.delete("token");
      return Response.json({ ok: true });
    }

    return Response.json({ error: "not_found", path, method }, { status: 404 });
  }
}
