import { withValidAccessToken } from "./auth";
import { getApiUrl } from "./apiUrl";

export { getApiUrl } from "./apiUrl";

const tokenErrorCodes = new Set(["MISSING_TOKEN", "INVALID_TOKEN", "TOKEN_EXPIRED"]);

async function isTokenAuthenticationFailure(response: Response) {
  if (response.status !== 401) return false;

  try {
    const body = await response.clone().json();
    return !body.code || tokenErrorCodes.has(body.code);
  } catch {
    return true;
  }
}

export async function authenticatedFetch(path: string, init: RequestInit = {}) {
  const request = (accessToken: string) => fetch(getApiUrl(path), {
    ...init,
    headers: {
      ...Object.fromEntries(new Headers(init.headers).entries()),
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const response = await withValidAccessToken(request);
  if (!(await isTokenAuthenticationFailure(response))) return response;

  return withValidAccessToken(request, true);
}
