import type { TokenStore } from "../types/token-store";

export interface KVLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

export function createKvTokenStore(kv: KVLike, opts: { prefix: string }): TokenStore {
  const key = (tenantKey: string) => `${opts.prefix}:${tenantKey}`;

  return {
    async get(tenantKey) {
      const v = await kv.get(key(tenantKey));
      return v ?? undefined;
    },
    async set(tenantKey, token, ttlSec) {
      await kv.put(key(tenantKey), token, { expirationTtl: ttlSec });
    },
    async invalidate(tenantKey) {
      await kv.delete(key(tenantKey));
    },
  };
}
