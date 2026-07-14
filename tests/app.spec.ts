import { expect, test } from '@playwright/test'

for (const routeName of ['login', 'signup']) {
  test(`${routeName} route redirects to the backend WorkOS endpoint`, async ({ page }) => {
    await page.route(`**/auth/${routeName}`, async (route) => {
      await route.fulfill({ contentType: 'text/html', body: `WorkOS ${routeName}` })
    })

    await page.goto(`/${routeName}`)

    await expect(page).toHaveURL(new RegExp(`/auth/${routeName}$`))
  })
}

test('home page renders the app shell and empty state', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('complementary', { name: 'Primary' })).toBeVisible()
  await expect(page.getByText('Model Pass').first()).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Howdy' })).toBeVisible()
  await expect(page.getByText('Please create a new chat to start working with AI.')).toBeVisible()
})

test('profile sign out redirects to the backend logout endpoint', async ({ page }) => {
  await page.route('**/auth/logout', async (route) => {
    await route.fulfill({ contentType: 'text/html', body: 'WorkOS logout' })
  })

  await page.goto('/profile')
  await page.getByRole('button', { name: 'Sign out' }).click()

  await expect(page).toHaveURL(/\/auth\/logout$/)
})

test('new chat button navigates to the chat page', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'New chat' }).click()

  await expect(page).toHaveURL('/chat')
  await expect(page.getByRole('heading', { name: /Good evening, Sam/ })).toBeVisible()
  await expect(page.getByLabel('New chat')).toBeVisible()
})

test('chat composer enables send after typing and clears after sending', async ({ page }) => {
  await page.goto('/chat')

  const messageInput = page.getByRole('textbox', { name: 'Message' })
  const sendButton = page.getByRole('button', { name: 'Send message' })

  await expect(sendButton).toBeDisabled()

  await messageInput.fill('Hello Model Pass')
  await expect(sendButton).toBeEnabled()

  await sendButton.click()
  await expect(messageInput).toHaveValue('')
  await expect(sendButton).toBeDisabled()
})

test('chat page shows model selector and starter suggestions', async ({ page }) => {
  await page.goto('/chat')

  await expect(page.getByRole('button', { name: 'Selected model' })).toContainText('GPT-5.5')
  await expect(page.getByRole('button', { name: 'Write a quick message' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Explain something simply' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Plan my week' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Help me decide' })).toBeVisible()
})

test('credits page shows configured packages in pre-launch mode', async ({ page }) => {
  await page.route('**/api/billing', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        balance: {
          creditBalance: 0,
          creditsUsed: 0,
          tokensUsed: 0,
        },
        packages: [
          {
            id: 'starter',
            name: 'Starter',
            credits: 100,
            price: '$5.00',
            highlight: false,
            checkoutAvailable: false,
          },
          {
            id: 'plus',
            name: 'Plus',
            credits: 500,
            price: '$20.00',
            highlight: true,
            checkoutAvailable: false,
          },
        ],
        transactions: [],
        fulfillmentEnabled: false,
      }),
    })
  })

  await page.goto('/credits')

  await expect(page.getByRole('heading', { name: 'Credits', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Choose a credit package' })).toBeVisible()
  await expect(page.getByText('Checkout setup in progress')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Buy Starter package' })).toBeDisabled()
})
