import { beforeEach, describe, expect, it, vi } from "vitest";
import { get } from "svelte/store";
import {
  authStore,
  clearAuthentication,
  logout,
  processAuthenticationCallback,
  restoreAuthentication,
  withValidAccessToken,
} from "../src/auth";

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() { return values.size; },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => { values.delete(key); },
    setItem: (key, value) => { values.set(key, value); },
  };
}

function accessToken(expiresAt = Math.floor(Date.now() / 1000) + 300) {
  return `header.${btoa(JSON.stringify({ exp: expiresAt }))}.signature`;
}

function storedAuthentication(refreshToken = "refresh_1") {
  sessionStorage.setItem("modelpass.accessToken", accessToken());
  sessionStorage.setItem("modelpass.refreshToken", refreshToken);
  sessionStorage.setItem("modelpass.user", JSON.stringify({ id: "user_123", email: "sam@example.com" }));
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.stubGlobal("sessionStorage", memoryStorage());
  vi.stubGlobal("history", { replaceState: vi.fn() });
  vi.stubGlobal("window", {
    location: { hash: "", pathname: "/auth/callback", search: "", origin: "https://modelpass.netlify.app", replace: vi.fn(), assign: vi.fn() },
  });
  clearAuthentication();
});

describe("browser authentication", () => {
  it("restores authentication only from the current tab's sessionStorage", () => {
    storedAuthentication();
    expect(restoreAuthentication()).toEqual({ id: "user_123", email: "sam@example.com" });
    expect(get(authStore).authenticated).toBe(true);
  });

  it("validates callback state and cleans the fragment before exchange", async () => {
    sessionStorage.setItem("modelpass.authorizationState", "expected_state_123");
    window.location.hash = "#code=one_use_code&state=wrong_state";
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    await expect(processAuthenticationCallback()).rejects.toThrow("state was invalid");
    expect(history.replaceState).toHaveBeenCalledWith(null, "", "/auth/callback");
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(sessionStorage.length).toBe(0);
  });

  it("exchanges the code once and stores returned tokens", async () => {
    sessionStorage.setItem("modelpass.authorizationState", "expected_state_123");
    window.location.hash = "#code=one_use_code&state=expected_state_123";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      accessToken: accessToken(), refreshToken: "refresh_1", user: { id: "user_123" },
    }), { status: 200 })));

    await processAuthenticationCallback();
    expect(sessionStorage.getItem("modelpass.refreshToken")).toBe("refresh_1");
    expect(history.replaceState).toHaveBeenCalledWith(null, "", "/auth/callback");
  });

  it("uses one refresh request for concurrent callers and saves rotation", async () => {
    storedAuthentication("old_refresh");
    sessionStorage.setItem("modelpass.accessToken", accessToken(0));
    let resolveRefresh!: (response: Response) => void;
    const fetchSpy = vi.fn().mockReturnValue(new Promise<Response>((resolve) => { resolveRefresh = resolve; }));
    vi.stubGlobal("fetch", fetchSpy);

    const first = withValidAccessToken(async (token) => token);
    const second = withValidAccessToken(async (token) => token);
    resolveRefresh(new Response(JSON.stringify({
      accessToken: accessToken(), refreshToken: "rotated_refresh", user: { id: "user_123" },
    }), { status: 200 }));

    await expect(Promise.all([first, second])).resolves.toHaveLength(2);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem("modelpass.refreshToken")).toBe("rotated_refresh");
  });

  it("clears storage even when logout revocation fails", async () => {
    storedAuthentication();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    await expect(logout()).rejects.toThrow("offline");
    expect(sessionStorage.length).toBe(0);
    expect(get(authStore).authenticated).toBe(false);
  });
});
