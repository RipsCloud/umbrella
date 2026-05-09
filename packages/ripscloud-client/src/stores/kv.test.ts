import { describe, expect, it, vi } from "vitest";

import { createKvTokenStore, type KVLike } from "./kv";

function makeKv(): KVLike & { store: Map<string, string> } {
  const map = new Map<string, string>();
  return {
    store: map,
    get: vi.fn(async (key: string) => map.get(key) ?? null),
    put: vi.fn(async (key: string, value: string) => {
      map.set(key, value);
    }),
    delete: vi.fn(async (key: string) => {
      map.delete(key);
    }),
  };
}

describe("createKvTokenStore", () => {
  it("namespaces keys with the given prefix", async () => {
    const kv = makeKv();
    const store = createKvTokenStore(kv, { prefix: "ripscloud" });

    await store.set("tenant-1", "abc", 900);

    expect(kv.put).toHaveBeenCalledWith("ripscloud:tenant-1", "abc", { expirationTtl: 900 });
    expect(kv.store.get("ripscloud:tenant-1")).toBe("abc");
  });

  it("returns undefined (not null) on miss", async () => {
    const kv = makeKv();
    const store = createKvTokenStore(kv, { prefix: "ripscloud" });
    expect(await store.get("nope")).toBeUndefined();
  });

  it("returns the stored token on hit", async () => {
    const kv = makeKv();
    const store = createKvTokenStore(kv, { prefix: "ripscloud" });
    await store.set("tenant-1", "abc", 900);
    expect(await store.get("tenant-1")).toBe("abc");
  });

  it("invalidate deletes the prefixed key", async () => {
    const kv = makeKv();
    const store = createKvTokenStore(kv, { prefix: "ripscloud" });
    await store.set("tenant-1", "abc", 900);
    await store.invalidate("tenant-1");

    expect(kv.delete).toHaveBeenCalledWith("ripscloud:tenant-1");
    expect(kv.store.has("ripscloud:tenant-1")).toBe(false);
  });

  it("passes expirationTtl through to put", async () => {
    const kv = makeKv();
    const store = createKvTokenStore(kv, { prefix: "ripscloud" });
    await store.set("tenant-1", "abc", 123);
    expect(kv.put).toHaveBeenCalledWith("ripscloud:tenant-1", "abc", { expirationTtl: 123 });
  });
});
