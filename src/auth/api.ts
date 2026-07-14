import { getApiUrl } from "../api";

export function getLoginUrl() {
  return getApiUrl("/auth/login");
}

export function getSignUpUrl() {
  return getApiUrl("/auth/signup");
}

export function getLogoutUrl() {
  return getApiUrl("/auth/logout");
}
