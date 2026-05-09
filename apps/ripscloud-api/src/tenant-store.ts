import type {
  CredentialsProvider,
  SisproCredentials,
  TokenStore,
} from "@ripscloud/ripscloud-client";

const DO_ORIGIN = "https://tenant.internal";

export class NoCredentialsStoredError extends Error {
  constructor(public tenantKey: string) {
    super(`No credentials stored for tenant "${tenantKey}". Call LoginSISPRO first.`);
    this.name = "NoCredentialsStoredError";
  }
}

export function stubFor(namespace: DurableObjectNamespace, tenantKey: string): DurableObjectStub {
  return namespace.get(namespace.idFromName(tenantKey));
}

export function createDoCredentialsProvider(stub: DurableObjectStub, tenantKey: string): CredentialsProvider {
  return {
    async resolve() {
      const res = await stub.fetch(`${DO_ORIGIN}/credentials`);
      const body = (await res.json()) as { credentials: SisproCredentials | null };
      if (!body.credentials) throw new NoCredentialsStoredError(tenantKey);
      return body.credentials;
    },
  };
}

export function createDoTokenStore(stub: DurableObjectStub): TokenStore {
  return {
    async get() {
      const res = await stub.fetch(`${DO_ORIGIN}/token`);
      const body = (await res.json()) as { token: string | null };
      return body.token ?? undefined;
    },
    async set(_tenantKey, token, ttlSec) {
      await stub.fetch(`${DO_ORIGIN}/token`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, ttlSec }),
      });
    },
    async invalidate() {
      await stub.fetch(`${DO_ORIGIN}/token`, { method: "DELETE" });
    },
  };
}

export async function storeCredentials(stub: DurableObjectStub, creds: SisproCredentials): Promise<void> {
  await stub.fetch(`${DO_ORIGIN}/credentials`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(creds),
  });
}

export async function storeToken(stub: DurableObjectStub, token: string, ttlSec: number): Promise<void> {
  await stub.fetch(`${DO_ORIGIN}/token`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token, ttlSec }),
  });
}
