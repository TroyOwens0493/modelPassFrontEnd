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

Copy `.env.example` to `.env.local` if the backend is not running at
`http://localhost:3000`. Browser API calls stay on the frontend origin and Vite
reverse-proxies `/auth`, `/api`, and `/chats` to `API_PROXY_URL`.

For Netlify production builds, add `API_PROXY_URL` to the site's environment
variables with the production backend origin. The build emits matching proxy
rewrites into `dist/_redirects` before deployment.

```sh
pnpm install
pnpm run dev
pnpm run check
pnpm run build
```
