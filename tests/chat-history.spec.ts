import { expect, test } from "@playwright/test";

const chatId = "507f1f77bcf86cd799439011";

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

test("loads a persisted chat and appends new messages to it", async ({ page }) => {
    let createCount = 0;
    const appendUrls: string[] = [];

    await page.route(`**/chats/${chatId}`, async (route) => {
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
                _id: chatId,
                title: "Persisted conversation",
                model: "openai/gpt-4o-mini",
                messages: [
                    {
                        role: "user",
                        text: "Previously saved question",
                        timestamp: "2026-07-15T12:00:00.000Z",
                    },
                    {
                        role: "model",
                        text: "Previously saved answer",
                        timestamp: "2026-07-15T12:00:01.000Z",
                    },
                ],
            }),
        });
    });
    await page.route("**/chats/response", async (route) => {
        await route.fulfill({
            status: 200,
            contentType: "text/plain",
            body: "A new answer",
        });
    });
    await page.route("**/chats/addMessage/**", async (route) => {
        appendUrls.push(route.request().url());
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: "{}",
        });
    });
    await page.route("**/chats", async (route) => {
        createCount += 1;
        await route.fulfill({ status: 201, body: "{}" });
    });

    await page.goto(`/chat/${chatId}`);

    await expect(page.getByText("Previously saved question")).toBeVisible();
    await expect(page.getByText("Previously saved answer")).toBeVisible();
    await expect(page.locator("time")).toHaveCount(2);

    await page.getByRole("textbox", { name: "Message" }).fill("A new question");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect.poll(() => appendUrls.length).toBe(2);

    expect(createCount).toBe(0);
    expect(appendUrls).toEqual([
        expect.stringContaining(`/chats/addMessage/${chatId}`),
        expect.stringContaining(`/chats/addMessage/${chatId}`),
    ]);
});

test("shows an unavailable state when a persisted chat cannot be loaded", async ({ page }) => {
    await page.route(`**/chats/${chatId}`, async (route) => {
        await route.fulfill({
            status: 404,
            contentType: "application/json",
            body: JSON.stringify({ error: "Not found" }),
        });
    });

    await page.goto(`/chat/${chatId}`);

    await expect(page.getByRole("alert")).toContainText("This chat could not be loaded.");
    await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Message" })).toHaveCount(0);
});
