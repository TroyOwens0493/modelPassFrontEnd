# Model Pass

Svelte + Vite app for the Model Pass chat experience.

## Current App Shell

`src/App.svelte` owns the signed-in shell:

- Persistent warm-dark app layout.
- Left sidebar.
- Main content outlet area.

`src/Sidebar.svelte` owns the sidebar UI:

- Model Pass brand.
- New chat button.
- Search chats field.
- Static recent-chat examples.
- Profile and credits summary pinned at the bottom.

The main content is intentionally a placeholder. Chat, signup, login, profile,
and credits pages will be added later.

## Routing

Minimal routing is wired through `src/router.ts`. Only routes with real page
components should be active; planned routes can stay commented out until their
pages exist.

When pages are added, keep routing simple:

1. `App.svelte` should keep owning the app shell.
2. The router should choose only the active page component for the main content
   area.
3. Shared chrome, including the sidebar and profile/credits summary, should stay
   outside page components.
4. Page components should own their own content and behavior.

The intended shape is:

```svelte
<div class="app-shell">
  <Sidebar />
  <main class="app-main">
    <svelte:component this={route.component} />
  </main>
</div>
```

`src/router.ts` contains a small browser-history router helper. Before wiring it
in, read the `router.current` store value into a local reactive value; `router`
itself is not a Svelte store.

```svelte
<script lang="ts">
  const router = createRouter(routes)
  const currentRoute = router.current
  $: pathname = $currentRoute
  $: route = router.match(pathname)
</script>
```

Do not use `$router.current`; that tries to subscribe to `router`, not to
`router.current`.

Use a routing library only when this small helper becomes painful: nested
routes, route params, auth guards, loaders, or complicated link state.

## Development

```sh
pnpm install
pnpm run dev
pnpm run check
pnpm run build
```
