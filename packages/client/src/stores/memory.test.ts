import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { createInMemoryTokenStore } from "./memory";

describe("createInMemoryTokenStore", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns undefined when key is missing", async () => {
    const store = createInMemoryTokenStore();
    expect(await store.get("t1")).toBeUndefined();
  });

  it("stores and retrieves a token", async () => {
    const store = createInMemoryTokenStore();
    await store.set("t1", "abc", 60);
    expect(await store.get("t1")).toBe("abc");
  });

  it("scopes tokens per tenantKey", async () => {
    const store = createInMemoryTokenStore();
    await store.set("t1", "token-a", 60);
    await store.set("t2", "token-b", 60);
    expect(await store.get("t1")).toBe("token-a");
    expect(await store.get("t2")).toBe("token-b");
  });

  it("invalidate removes the token", async () => {
    const store = createInMemoryTokenStore();
    await store.set("t1", "abc", 60);
    await store.invalidate("t1");
    expect(await store.get("t1")).toBeUndefined();
  });

  it("returns undefined after TTL expires", async () => {
    const store = createInMemoryTokenStore();
    await store.set("t1", "abc", 60);
    expect(await store.get("t1")).toBe("abc");
    vi.advanceTimersByTime(61_000);
    expect(await store.get("t1")).toBeUndefined();
  });
});
