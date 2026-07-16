import { getApiPath } from "../api";

export function getLoginUrl() {
  return getApiPath("/auth/login");
}

export function getSignUpUrl() {
  return getApiPath("/auth/signup");
}

export function getLogoutUrl() {
  return getApiPath("/auth/logout");
}
