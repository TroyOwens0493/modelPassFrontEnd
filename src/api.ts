const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

export function getApiUrl(path: string) {
  return `${apiBaseUrl}${path}`;
}
