import { readable } from 'svelte/store'
import type { Component } from 'svelte'

export type Route = {
    path: string
    component: Component
}

export function createRouter(routes: Route[]) {
    const current = readable(location.pathname, (set) => {
        const update = () => set(location.pathname)
        addEventListener('popstate', update)
        return () => removeEventListener('popstate', update)
    })

    function goto(path: string) {
        history.pushState(null, '', path)
        dispatchEvent(new PopStateEvent('popstate'))
    }

    function match(path: string) {
        return routes.find((route) => route.path === path) ?? routes.find((route) => route.path === '*')
    }

    return { current, goto, match }
}
