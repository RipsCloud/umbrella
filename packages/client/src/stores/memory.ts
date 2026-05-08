import type { TokenStore } from "../types/token-store";

type Entry = { token: string; expiresAt: number };

export function createInMemoryTokenStore(): TokenStore {
  const map = new Map<string, Entry>();

  return {
    async get(tenantKey) {
      const entry = map.get(tenantKey);
      if (!entry) return undefined;
      if (entry.expiresAt <= Date.now()) {
        map.delete(tenantKey);
        return undefined;
      }
      return entry.token;
    },
    async set(tenantKey, token, ttlSec) {
      map.set(tenantKey, { token, expiresAt: Date.now() + ttlSec * 1000 });
    },
    async invalidate(tenantKey) {
      map.delete(tenantKey);
    },
  };
}
