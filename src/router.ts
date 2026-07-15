import { readable } from 'svelte/store'
import type { Component } from 'svelte'

export type Route = {
    path: string
    component: Component
}

export type RouteMatch = {
    component: Component
    params: Record<string, string>
}

function matchRoutePattern(pattern: string, path: string): Record<string, string> | null {
    if (pattern === '*' || !pattern.includes(':')) {
        return null
    }

    const patternParts = pattern.split('/').filter(Boolean)
    const pathParts = path.split('/').filter(Boolean)

    if (patternParts.length !== pathParts.length) {
        return null
    }

    const params: Record<string, string> = {}

    for (let index = 0; index < patternParts.length; index += 1) {
        const patternPart = patternParts[index]
        const pathPart = pathParts[index]

        if (patternPart.startsWith(':')) {
            params[patternPart.slice(1)] = decodeURIComponent(pathPart)
            continue
        }

        if (patternPart !== pathPart) {
            return null
        }
    }

    return params
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

    function goto(path: string, options?: { replace?: boolean }) {
        if (options?.replace) {
            history.replaceState(null, '', path)
        } else {
            history.pushState(null, '', path)
        }
        setCurrent?.(location.pathname)
    }

    function match(path: string): RouteMatch | undefined {
        for (const route of routes) {
            if (route.path === '*') {
                continue
            }

            if (route.path === path) {
                return { component: route.component, params: {} }
            }

            const params = matchRoutePattern(route.path, path)
            if (params) {
                return { component: route.component, params }
            }
        }

        const wildcard = routes.find((route) => route.path === '*')
        return wildcard
            ? { component: wildcard.component, params: {} }
            : undefined
    }

    return { current, goto, match }
}
