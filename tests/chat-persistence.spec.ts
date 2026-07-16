import { expect, test, type Page } from "@playwright/test";

type SavedMessage = {
    role: string;
    text: string;
};

test.beforeEach(async ({ page }) => {
    await page.route("**/auth/me", async (route) => {
        await route.fulfill({
            contentType: "application/json",
            body: JSON.stringify({ user: { id: "user_123", email: "sam@example.com" } }),
        });
    });
    await page.route("**/api/billing", async (route) => {
        await route.fulfill({ status: 503, contentType: "application/json", body: "{}" });
    });
});

/** Mocks successful generation and records chat persistence requests. */
async function mockChatApi(page: Page) {
    let createCount = 0;
    const savedMessages: SavedMessage[] = [];

    await page.route("**/chats/response", async (route) => {
        await route.fulfill({
            status: 200,
            contentType: "text/plain",
            body: "Model response",
        });
    });
    await page.route("**/chats", async (route) => {
        createCount += 1;
        await route.fulfill({
            status: 201,
            contentType: "application/json",
            body: JSON.stringify({ _id: "507f1f77bcf86cd799439011" }),
        });
    });
    await page.route("**/chats/addMessage/**", async (route) => {
        savedMessages.push(route.request().postDataJSON() as SavedMessage);
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: "{}",
        });
    });

    return {
        getCreateCount: () => createCount,
        savedMessages,
    };
}

test("creates one chat and appends each completed turn", async ({ page }) => {
    const chatApi = await mockChatApi(page);
    await page.goto("/chat");

    const input = page.getByRole("textbox", { name: "Message" });
    const send = page.getByRole("button", { name: "Send message" });

    await input.fill("First prompt");
    await send.click();
    await expect.poll(chatApi.getCreateCount).toBe(1);
    await expect.poll(() => chatApi.savedMessages.length).toBe(2);

    await input.fill("Second prompt");
    await send.click();
    await expect.poll(() => chatApi.savedMessages.length).toBe(4);

    expect(chatApi.getCreateCount()).toBe(1);
    expect(chatApi.savedMessages.map(({ role, text }) => ({ role, text }))).toEqual([
        { role: "user", text: "First prompt" },
        { role: "model", text: "Model response" },
        { role: "user", text: "Second prompt" },
        { role: "model", text: "Model response" },
    ]);
});

test("does not create a chat when generation fails", async ({ page }) => {
    let createCount = 0;
    await page.route("**/chats/response", async (route) => {
        await route.fulfill({
            status: 502,
            contentType: "application/json",
            body: JSON.stringify({ error: "Generation failed" }),
        });
    });
    await page.route("**/chats", async (route) => {
        createCount += 1;
        await route.fulfill({ status: 201, body: "{}" });
    });
    await page.goto("/chat");

    await page.getByRole("textbox", { name: "Message" }).fill("Do not save this");
    await page.getByRole("button", { name: "Send message" }).click();

    await expect(page.getByRole("alert")).toBeVisible();
    expect(createCount).toBe(0);
});
