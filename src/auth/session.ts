import { getApiPath } from "../api";
import type { AppProfile } from "../stores/profile";

type SessionPayload = {
  user?: AppProfile | null;
};

/** Checks the WorkOS-backed session and redirects when it is not authenticated. */
export async function requireAuthenticatedSession(
  goto: (path: string) => void,
  signal?: AbortSignal,
) {
  const response = await fetch(getApiPath("/auth/me"), {
    credentials: "include",
    signal,
  });

  if (response.status === 401) {
    if (!signal?.aborted) goto("/no-auth");
    return null;
  }

  if (!response.ok) {
    throw new Error(`Session check failed with status ${response.status}`);
  }

  const payload: SessionPayload = await response.json();
  if (!payload.user) {
    if (!signal?.aborted) goto("/no-auth");
    return null;
  }

  return payload.user;
}
