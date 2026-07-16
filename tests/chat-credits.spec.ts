import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route('**/auth/me', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ user: { id: 'user_123', email: 'sam@example.com' } }),
    })
  })
  await page.route('**/api/billing', async (route) => {
    await route.fulfill({ status: 503, contentType: 'application/json', body: '{}' })
  })
  await page.route('**/api/models', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        models: [{ id: 'openai/gpt-4o-mini', name: 'GPT-4o mini', contextLength: 128000, priceTier: 2 }],
      }),
    })
  })
})

test('chat shows an out-of-credits message when the backend rejects usage', async ({ page }) => {
  await page.route('**/chats/response', async (route) => {
    await route.fulfill({
      status: 402,
      contentType: 'application/json',
      body: JSON.stringify({
        error: 'Your balance is too low for this request. Add credits to continue.',
        code: 'INSUFFICIENT_CREDITS',
      }),
    })
  })
  await page.goto('/chat')

  await page.getByRole('textbox', { name: 'Message' }).fill('Hello Model Pass')
  await page.getByRole('button', { name: 'Send message' }).click()

  await expect(page.getByRole('alert')).toHaveText(
    "You don't have enough credits. Add credits to continue.",
  )
})
