export interface TokenStore {
  get(tenantKey: string): Promise<string | undefined>;
  set(tenantKey: string, token: string, ttlSec: number): Promise<void>;
  invalidate(tenantKey: string): Promise<void>;
}
