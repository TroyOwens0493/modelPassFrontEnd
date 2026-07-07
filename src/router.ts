import { readable } from 'svelte/store'
import type { Component } from 'svelte'

export type Route = {
    path: string
    component: Component
}

export function createRouter(routes: Route[]) {
    let setCurrent: ((path: string) => void) | undefined

    const current = readable(location.pathname, (set) => {
        setCurrent = set
        const update = () => set(location.pathname)
        addEventListener('popstate', update)
        return () => {
            removeEventListener('popstate', update)
            setCurrent = undefined
        }
    })

    function goto(path: string) {
        history.pushState(null, '', path)
        setCurrent?.(location.pathname)
    }

    function match(path: string) {
        return routes.find((route) => route.path === path) ?? routes.find((route) => route.path === '*')
    }

    return { current, goto, match }
}
