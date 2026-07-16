import { beforeEach, describe, expect, it, vi } from "vitest";
import { authenticatedFetch } from "../src/api";

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() { return values.size; }, clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null, key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => { values.delete(key); }, setItem: (key, value) => { values.set(key, value); },
  };
}

function token(expiresAt = Math.floor(Date.now() / 1000) + 300) {
  return `header.${btoa(JSON.stringify({ exp: expiresAt }))}.signature`;
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.stubGlobal("sessionStorage", memoryStorage());
  sessionStorage.setItem("modelpass.accessToken", token());
  sessionStorage.setItem("modelpass.refreshToken", "refresh_1");
  sessionStorage.setItem("modelpass.user", JSON.stringify({ id: "user_123" }));
});

describe("authenticatedFetch", () => {
  it("adds a bearer token and leaves a streaming response body unread", async () => {
    const response = new Response("streamed text", { status: 200 });
    const fetchSpy = vi.fn().mockResolvedValue(response);
    vi.stubGlobal("fetch", fetchSpy);

    const result = await authenticatedFetch("/chats/response", { method: "POST" });
    expect(fetchSpy.mock.calls[0][1].headers.Authorization).toMatch(/^Bearer /);
    expect(result.bodyUsed).toBe(false);
    await expect(result.text()).resolves.toBe("streamed text");
  });

  it("refreshes and retries a token 401 exactly once", async () => {
    const fetchSpy = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ code: "TOKEN_EXPIRED" }), { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ accessToken: token(), refreshToken: "refresh_2", user: { id: "user_123" } }), { status: 200 }))
      .mockResolvedValueOnce(new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);

    const result = await authenticatedFetch("/protected");
    expect(await result.text()).toBe("ok");
    expect(fetchSpy).toHaveBeenCalledTimes(3);
    expect(sessionStorage.getItem("modelpass.refreshToken")).toBe("refresh_2");
  });

  it("does not loop when the retried request is still unauthorized", async () => {
    const fetchSpy = vi.fn()
      .mockResolvedValueOnce(new Response("", { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ accessToken: token(), refreshToken: "refresh_2", user: { id: "user_123" } }), { status: 200 }))
      .mockResolvedValueOnce(new Response("", { status: 401 }));
    vi.stubGlobal("fetch", fetchSpy);

    const result = await authenticatedFetch("/protected");
    expect(result.status).toBe(401);
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });
});

