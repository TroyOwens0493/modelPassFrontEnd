# Model Pass

Svelte + Vite app for the Model Pass chat experience.

## Authentication

Model Pass uses WorkOS AuthKit with backend authorization-code exchange and refresh. Access and rotating refresh tokens live only in `sessionStorage`, so they are available to same-origin JavaScript, are not shared with new tabs, and are destroyed when the tab closes. Each new tab must sign in independently.

Without a custom authentication API domain, WorkOS AuthKit session tokens use `https://api.workos.com/` as their issuer and the application client ID in the `client_id` claim. If a custom authentication API domain is added later, set its issuer in `WORKOS_JWT_ISSUER`. WorkOS must allow `https://modelpassbackend.onrender.com/auth/token-callback` as a callback URL.

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

Routing lives in `src/router.ts` and is wired from `src/App.svelte`.

To add a page:

1. Create the page component, for example `src/signup/SignUp.svelte`.
2. Import it in `src/App.svelte`.
3. Add it to the route list:

```ts
const router = createRouter([
  { path: "/", component: Home },
  { path: "/signup", component: SignUp },
  { path: "*", component: Home },
]);
```

Use `router.goto("/signup")` for in-app navigation. The router uses exact path
matches, so `/signup` and `/signup/` are different routes.

Keep shared app chrome in `App.svelte`; route components should only own the
main page content:

```svelte
<div class="app-shell">
  <Sidebar />
  <main class="app-main">
    <CurrentRoute />
  </main>
</div>
```

## Development

```sh
pnpm install
pnpm run dev
pnpm run check
pnpm run build
```
