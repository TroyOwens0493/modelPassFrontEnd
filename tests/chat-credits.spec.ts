import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const payload = btoa(JSON.stringify({ exp: 4_102_444_800 }))
    sessionStorage.setItem('modelpass.accessToken', `header.${payload}.signature`)
    sessionStorage.setItem('modelpass.refreshToken', 'refresh_test')
    sessionStorage.setItem('modelpass.user', JSON.stringify({ id: 'user_123' }))
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

test('chat streaming request uses bearer auth and no cookies', async ({ page }) => {
  let headers: Record<string, string> = {}
  await page.route('**/chats/response', async (route) => {
    headers = route.request().headers()
    await route.fulfill({ status: 200, contentType: 'text/plain', body: 'streamed response' })
  })
  await page.goto('/chat')
  await page.getByRole('textbox', { name: 'Message' }).fill('Hello Model Pass')
  await page.getByRole('button', { name: 'Send message' }).click()

  await expect(page.getByText('streamed response')).toBeVisible()
  expect(headers.authorization).toMatch(/^Bearer /)
  expect(headers.cookie).toBeUndefined()
})
