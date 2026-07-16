import { writable } from "svelte/store";
import { getApiUrl } from "../apiUrl";
import type { AppProfile } from "../stores/profile";

type Authentication = {
  accessToken: string;
  refreshToken: string;
  user: AppProfile;
};

type AuthState = {
  user: AppProfile | null;
  authenticated: boolean;
};

const storageKeys = {
  accessToken: "modelpass.accessToken",
  refreshToken: "modelpass.refreshToken",
  user: "modelpass.user",
  state: "modelpass.authorizationState",
};

export const authStore = writable<AuthState>({ user: null, authenticated: false });

let refreshPromise: Promise<string> | null = null;
let resetHandlers: Array<() => void> = [];

function storeAuthentication(authentication: Authentication) {
  sessionStorage.setItem(storageKeys.accessToken, authentication.accessToken);
  sessionStorage.setItem(storageKeys.refreshToken, authentication.refreshToken);
  sessionStorage.setItem(storageKeys.user, JSON.stringify(authentication.user));
  authStore.set({ user: authentication.user, authenticated: true });
}

export function clearAuthentication() {
  sessionStorage.removeItem(storageKeys.accessToken);
  sessionStorage.removeItem(storageKeys.refreshToken);
  sessionStorage.removeItem(storageKeys.user);
  sessionStorage.removeItem(storageKeys.state);
  authStore.set({ user: null, authenticated: false });
  for (const reset of resetHandlers) reset();
}

export function registerAuthResetHandler(handler: () => void) {
  resetHandlers.push(handler);
  return () => {
    resetHandlers = resetHandlers.filter((candidate) => candidate !== handler);
  };
}

export function restoreAuthentication() {
  const accessToken = sessionStorage.getItem(storageKeys.accessToken);
  const refreshToken = sessionStorage.getItem(storageKeys.refreshToken);
  const storedUser = sessionStorage.getItem(storageKeys.user);

  if (!accessToken || !refreshToken || !storedUser) {
    clearAuthentication();
    return null;
  }

  try {
    const user = JSON.parse(storedUser) as AppProfile;
    authStore.set({ user, authenticated: true });
    return user;
  } catch {
    clearAuthentication();
    return null;
  }
}

function tokenExpiresSoon(token: string) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))) as { exp?: number };
    return typeof payload.exp !== "number" || payload.exp <= Math.floor(Date.now() / 1000) + 30;
  } catch {
    return true;
  }
}

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = sessionStorage.getItem(storageKeys.refreshToken);
    if (!refreshToken) throw new Error("No refresh token is available");

    const response = await fetch(getApiUrl("/auth/refresh"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!response.ok) throw new Error("Unable to refresh authentication");

    const authentication = await response.json() as Authentication;
    if (!authentication.accessToken || !authentication.refreshToken || !authentication.user) {
      throw new Error("The refresh response was incomplete");
    }

    storeAuthentication(authentication);
    return authentication.accessToken;
  })().catch((error) => {
    clearAuthentication();
    throw error;
  }).finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

export async function withValidAccessToken<T>(useToken: (accessToken: string) => Promise<T>, forceRefresh = false) {
  let accessToken = sessionStorage.getItem(storageKeys.accessToken);
  if (!accessToken) {
    clearAuthentication();
    throw new Error("Authentication is required");
  }

  if (forceRefresh || tokenExpiresSoon(accessToken)) {
    accessToken = await refreshAccessToken();
  }

  return useToken(accessToken);
}

function createStateNonce() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function beginAuthentication(screenHint: "sign-in" | "sign-up") {
  const state = createStateNonce();
  sessionStorage.setItem(storageKeys.state, state);
  const authorizeUrl = new URL(getApiUrl("/auth/authorize"), window.location.origin);
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("screen_hint", screenHint);
  window.location.assign(authorizeUrl);
}

export async function processAuthenticationCallback() {
  const fragment = new URLSearchParams(window.location.hash.slice(1));
  const code = fragment.get("code");
  const returnedState = fragment.get("state");
  const expectedState = sessionStorage.getItem(storageKeys.state);

  history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
  sessionStorage.removeItem(storageKeys.state);

  if (!code || !returnedState || returnedState !== expectedState) {
    clearAuthentication();
    throw new Error("The authentication callback state was invalid");
  }

  const response = await fetch(getApiUrl("/auth/exchange"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  if (!response.ok) {
    clearAuthentication();
    throw new Error("The authorization code could not be exchanged");
  }

  const authentication = await response.json() as Authentication;
  storeAuthentication(authentication);
  return authentication.user;
}

export async function logout() {
  try {
    await withValidAccessToken((accessToken) => fetch(getApiUrl("/auth/logout"), {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    }));
  } finally {
    clearAuthentication();
  }
}

