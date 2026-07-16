import { readable } from 'svelte/store'
import type { Component } from 'svelte'

export type Route = {
    path: string
    component: Component
}

export type RouteMatch = Route & {
    params: Record<string, string>
}

/** Matches one route pattern and extracts any named path segments. */
function matchRoute(route: Route, path: string) {
    const routeSegments = route.path.split('/').filter(Boolean)
    const pathSegments = path.split('/').filter(Boolean)

    if (routeSegments.length !== pathSegments.length) return null

    const params: Record<string, string> = {}

    for (let index = 0; index < routeSegments.length; index += 1) {
        const routeSegment = routeSegments[index]
        const pathSegment = pathSegments[index]

        if (routeSegment.startsWith(':')) {
            try {
                params[routeSegment.slice(1)] = decodeURIComponent(pathSegment)
            } catch {
                return null
            }
        } else if (routeSegment !== pathSegment) {
            return null
        }
    }

    return { ...route, params } satisfies RouteMatch
}

/** Creates the application's client-side router. */
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

    /** Navigates to a path without reloading the page. */
    function goto(path: string) {
        history.pushState(null, '', path)
        setCurrent?.(location.pathname)
    }

    /** Finds the static or parameterized route for a pathname. */
    function match(path: string) {
        const exactRoute = routes.find((route) => route.path === path)
        if (exactRoute) return { ...exactRoute, params: {} } satisfies RouteMatch

        for (const route of routes) {
            if (route.path === '*' || !route.path.includes(':')) continue

            const matchedRoute = matchRoute(route, path)
            if (matchedRoute) return matchedRoute
        }

        const fallbackRoute = routes.find((route) => route.path === '*')
        return fallbackRoute
            ? { ...fallbackRoute, params: {} } satisfies RouteMatch
            : undefined
    }

    return { current, goto, match }
}
