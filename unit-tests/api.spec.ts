import { describe, expect, it } from "vitest";
import { getApiPath } from "../src/api";

describe("getApiPath", () => {
  it("keeps API requests on the frontend origin", () => {
    expect(getApiPath("/auth/me")).toBe("/auth/me");
    expect(getApiPath("api/billing")).toBe("/api/billing");
    expect(getApiPath("/chats/response")).toBe("/chats/response");
  });
});
