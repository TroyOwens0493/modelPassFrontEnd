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

async function mockAuthenticatedBilling(page: Page, chats: Array<{ _id: string; title: string }> = []) {
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
  await page.route('**/chats/all/**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(chats),
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
  await expect(page.getByText('No chats yet')).toBeVisible()
  await expect(page.getByText('Saturday dinner party menu')).toHaveCount(0)
})

test('sidebar lists persisted chats from the database', async ({ page }) => {
  await mockAuthenticatedBilling(page, [
    { _id: 'chat_1', title: 'Lisbon trip planning' },
    { _id: 'chat_2', title: 'Mortgage rate explainer' },
  ])

  await page.goto('/')

  await expect(page.getByRole('button', { name: 'Lisbon trip planning' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Mortgage rate explainer' })).toBeVisible()
  await expect(page.getByText('No chats yet')).toHaveCount(0)
})

test('clicking a sidebar chat opens it and continues the conversation', async ({ page }) => {
  const updateBodies: Record<string, unknown>[] = []

  await mockAuthenticatedBilling(page, [
    { _id: 'chat_1', title: 'Lisbon trip planning' },
  ])
  await page.route('**/chats/chat_1', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          _id: 'chat_1',
          title: 'Lisbon trip planning',
          model: 'openai/gpt-4o-mini',
          messages: [
            {
              role: 'user',
              text: 'Plan a Lisbon trip',
              timestamp: '2026-07-15T12:00:00.000Z',
            },
            {
              role: 'model',
              text: 'Start in Alfama.',
              timestamp: '2026-07-15T12:00:01.000Z',
            },
          ],
        }),
      })
      return
    }

    if (route.request().method() === 'PUT') {
      updateBodies.push(route.request().postDataJSON())
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ _id: 'chat_1' }),
      })
      return
    }

    await route.fallback()
  })
  await page.route('**/chats/response', async (route) => {
    await route.fulfill({
      contentType: 'text/plain',
      body: 'Also visit Belem.',
    })
  })

  await page.goto('/')
  await page.getByRole('button', { name: 'Lisbon trip planning' }).click()

  await expect(page).toHaveURL('/chat/chat_1')
  await expect(page.getByText('Plan a Lisbon trip')).toBeVisible()
  await expect(page.getByText('Start in Alfama.')).toBeVisible()

  const messageInput = page.getByRole('textbox', { name: 'Message' })
  await messageInput.fill('What else should I see?')
  await page.getByRole('button', { name: 'Send message' }).click()

  await expect(page.getByText('Also visit Belem.')).toBeVisible()
  await expect.poll(() => updateBodies.length).toBe(1)
  expect(updateBodies[0].messages).toHaveLength(4)
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

test('saves completed chats after streaming and updates later turns', async ({ page }) => {
  let releaseFirstResponse!: () => void
  const firstResponseGate = new Promise<void>((resolve) => {
    releaseFirstResponse = resolve
  })
  const createBodies: Record<string, unknown>[] = []
  const updateBodies: Record<string, unknown>[] = []
  let responseCount = 0
  let listedChats: Array<{ _id: string; title: string }> = []

  await mockAuthenticatedBilling(page)
  await page.route('**/chats/response', async (route) => {
    responseCount += 1
    if (responseCount === 1) {
      await firstResponseGate
    }
    await route.fulfill({
      contentType: 'text/plain',
      body: `Model answer ${responseCount}`,
    })
  })
  await page.route('**/chats', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.fallback()
      return
    }

    createBodies.push(route.request().postDataJSON())
    listedChats = [{ _id: 'chat_123', title: 'First saved question' }]
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ _id: 'chat_123' }),
    })
  })
  await page.route('**/chats/chat_123', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          _id: 'chat_123',
          title: 'First saved question',
          messages: createBodies[0]?.messages ?? [],
        }),
      })
      return
    }

    updateBodies.push(route.request().postDataJSON())
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ _id: 'chat_123' }),
    })
  })
  await page.route('**/chats/all/**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(listedChats),
    })
  })

  await page.goto('/chat')
  const messageInput = page.getByRole('textbox', { name: 'Message' })

  await messageInput.fill('First saved question')
  await page.getByRole('button', { name: 'Send message' }).click()
  await expect.poll(() => responseCount).toBe(1)
  expect(createBodies).toHaveLength(0)

  releaseFirstResponse()
  await expect(page.getByText('Model answer 1')).toBeVisible()
  await expect.poll(() => createBodies.length).toBe(1)
  expect(createBodies[0]).toMatchObject({
    title: 'First saved question',
    model: 'openai/gpt-4o-mini',
  })
  expect(createBodies[0].messages).toHaveLength(2)
  await expect(page).toHaveURL('/chat/chat_123')
  await expect(page.getByRole('button', { name: 'First saved question' })).toBeVisible()

  await messageInput.fill('Second saved question')
  await page.getByRole('button', { name: 'Send message' }).click()
  await expect(page.getByText('Model answer 2')).toBeVisible()
  await expect.poll(() => updateBodies.length).toBe(1)
  expect(createBodies).toHaveLength(1)
  expect(updateBodies[0].messages).toHaveLength(4)
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

test('profile uses the same dynamic balance and usage totals', async ({ page }) => {
  await mockAuthenticatedBilling(page)

  await page.goto('/profile')

  await expect(page.getByText('475 credits left')).toHaveCount(2)
  await expect(page.getByText('25', { exact: true })).toBeVisible()
  await expect(page.getByText('12,000', { exact: true })).toBeVisible()
})
