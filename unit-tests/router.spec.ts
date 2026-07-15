import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Component } from 'svelte'
import { createRouter } from '../src/router'

const Home = {} as Component
const Chat = {} as Component
const NotFound = {} as Component

describe('createRouter', () => {
  beforeEach(() => {
    const locationStub = { pathname: '/' }

    vi.stubGlobal('location', locationStub)
    vi.stubGlobal('history', {
      pushState: vi.fn((_state, _title, path: string) => {
        locationStub.pathname = path
      }),
      replaceState: vi.fn((_state, _title, path: string) => {
        locationStub.pathname = path
      }),
    })
    vi.stubGlobal('addEventListener', vi.fn())
    vi.stubGlobal('removeEventListener', vi.fn())
  })

  it('matches exact routes before falling back to wildcard route', () => {
    const router = createRouter([
      { path: '/', component: Home },
      { path: '/chat', component: Chat },
      { path: '*', component: NotFound },
    ])

    expect(router.match('/')?.component).toBe(Home)
    expect(router.match('/chat')?.component).toBe(Chat)
    expect(router.match('/missing')?.component).toBe(NotFound)
  })

  it('matches parameterized chat routes and extracts the chat id', () => {
    const router = createRouter([
      { path: '/chat', component: Chat },
      { path: '/chat/:chatId', component: Chat },
      { path: '*', component: NotFound },
    ])

    expect(router.match('/chat')).toEqual({
      component: Chat,
      params: {},
    })
    expect(router.match('/chat/abc123')).toEqual({
      component: Chat,
      params: { chatId: 'abc123' },
    })
  })

  it('updates subscribers when navigating with goto', () => {
    const router = createRouter([
      { path: '/', component: Home },
      { path: '/chat', component: Chat },
    ])
    const seenPaths: string[] = []

    const unsubscribe = router.current.subscribe((path) => {
      seenPaths.push(path)
    })

    router.goto('/chat')

    expect(history.pushState).toHaveBeenCalledWith(null, '', '/chat')
    expect(seenPaths).toEqual(['/', '/chat'])

    unsubscribe()
  })

  it('can replace the current history entry', () => {
    const router = createRouter([
      { path: '/chat', component: Chat },
      { path: '/chat/:chatId', component: Chat },
    ])

    router.goto('/chat/chat_123', { replace: true })

    expect(history.replaceState).toHaveBeenCalledWith(null, '', '/chat/chat_123')
    expect(history.pushState).not.toHaveBeenCalled()
  })

  it('removes the popstate listener after the last subscriber unsubscribes', () => {
    const router = createRouter([{ path: '/', component: Home }])

    const unsubscribe = router.current.subscribe(() => {})
    unsubscribe()

    expect(removeEventListener).toHaveBeenCalledWith('popstate', expect.any(Function))
  })
})
