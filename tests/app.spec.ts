import { expect, test, type Page } from '@playwright/test'

const billingSummary = {
  balance: {
    creditBalance: 475,
    creditsUsed: 25,
    tokensUsed: 12_000,
  },
  packages: [
    {
      id: 'starter',
      name: 'Starter',
      credits: 100,
      price: '$5.00',
      highlight: false,
      checkoutAvailable: true,
    },
    {
      id: 'plus',
      name: 'Plus',
      credits: 500,
      price: '$20.00',
      highlight: true,
      checkoutAvailable: true,
    },
    {
      id: 'pro',
      name: 'Pro',
      credits: 1_200,
      price: '$40.00',
      highlight: false,
      checkoutAvailable: true,
    },
  ],
  transactions: [
    {
      id: 'transaction_1',
      type: 'purchase',
      credits: 500,
      balanceAfter: 500,
      description: 'Plus credit package',
      createdAt: '2026-07-15T12:00:00.000Z',
    },
    {
      id: 'transaction_2',
      type: 'usage',
      credits: -25,
      balanceAfter: 475,
      description: 'GPT response',
      createdAt: '2026-07-15T12:05:00.000Z',
    },
  ],
  fulfillmentEnabled: true,
}

async function mockAuthenticatedBilling(page: Page) {
  await page.route('**/auth/me', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        user: {
          id: 'user_123',
          email: 'sam@example.com',
          firstName: 'Sam',
          lastName: 'Rivera',
        },
      }),
    })
  })
  await page.route('**/api/billing', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(billingSummary),
    })
  })
}

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

test('credits page and sidebar show persisted accounting values', async ({ page }) => {
  await mockAuthenticatedBilling(page)

  await page.goto('/credits')

  await expect(page.getByRole('heading', { name: 'Credits', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Choose a credit package' })).toBeVisible()
  await expect(page.getByText('475 credits left')).toBeVisible()
  await expect(page.getByText('Plus credit package')).toBeVisible()
  await expect(page.getByText('GPT response')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Buy Starter package' })).toBeEnabled()
})

test('credits page preserves the current balance during background refreshes', async ({ page }) => {
  let delayBilling = false
  let signalRefreshStarted: () => void = () => undefined
  let releaseRefresh: () => void = () => undefined
  const refreshStarted = new Promise<void>((resolve) => {
    signalRefreshStarted = resolve
  })
  const refreshReleased = new Promise<void>((resolve) => {
    releaseRefresh = resolve
  })

  await page.route('**/auth/me', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ user: { id: 'user_123', email: 'sam@example.com' } }),
    })
  })
  await page.route('**/api/billing', async (route) => {
    if (delayBilling) {
      signalRefreshStarted()
      await refreshReleased
    }

    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(billingSummary),
    })
  })

  await page.goto('/credits?checkout=success')
  await expect(page.getByLabel('Credit balance')).toContainText('475')

  delayBilling = true
  await refreshStarted

  await expect(page.getByLabel('Credit balance')).toContainText('475')
  await expect(page.getByText('475 credits left')).toBeVisible()
  await expect(page.getByText('Loading billing information…')).toHaveCount(0)
  await expect(page.getByText('Loading credits…')).toHaveCount(0)

  releaseRefresh()
})

test('signed-out credits page preserves the billing unauthenticated state', async ({ page }) => {
  await page.route('**/auth/me', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 100))
    await route.fulfill({ status: 401, contentType: 'application/json', body: '{}' })
  })
  await page.route('**/api/billing', async (route) => {
    await route.fulfill({ status: 401, contentType: 'application/json', body: '{}' })
  })

  await page.goto('/credits')

  await expect(page.getByRole('heading', { name: 'Sign in to manage credits' })).toBeVisible()
})

test('profile uses the same dynamic balance and usage totals', async ({ page }) => {
  await mockAuthenticatedBilling(page)

  await page.goto('/profile')

  await expect(page.getByText('475 credits left')).toHaveCount(2)
  await expect(page.getByText('25', { exact: true })).toBeVisible()
  await expect(page.getByText('12,000', { exact: true })).toBeVisible()
})
