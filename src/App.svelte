<script lang="ts">
    import Sidebar from "./Sidebar.svelte";
    import Home from "./Home.svelte";
    import Chat from "./chat/Chat.svelte";
    import AuthRedirect from "./auth/AuthRedirect.svelte";
    import Credits from "./billing/Credits.svelte";
    import UserProfile from "./pages/UserProfile.svelte";
    import UnAuthenticated from "./UnAuthenticated.svelte";
    import { createRouter } from "./router";
    import { profileStore } from "./stores/profile";
    import { clearBilling, loadBilling } from "./stores/billing";
    import { requireAuthenticatedSession } from "./auth/session";

    type AuthStatus = "checking" | "authenticated" | "unauthenticated" | "error";

    const publicRoutes = new Set(["/no-auth", "/login", "/signup", "/auth/callback"]);

    const router = createRouter([
        { path: "/", component: Home },
        { path: "/chat", component: Chat },
        { path: "/chat/:chatId", component: Chat },
        { path: "/login", component: AuthRedirect },
        { path: "/signup", component: AuthRedirect },
        { path: "/auth/callback", component: Home },
        { path: "/credits", component: Credits },
        { path: "/profile", component: UserProfile },
        { path: "/no-auth", component: UnAuthenticated },
        { path: "*", component: Home },
    ]);
    const currentRoute = router.current;
    let routeMatch = $derived(router.match($currentRoute));
    let CurrentRoute = $derived(routeMatch?.component ?? Home);
    let routeChatId = $derived(routeMatch?.params.chatId ?? null);
    let authStatus = $state<AuthStatus>("checking");
    let authenticatedRoute = $state<string | null>(null);
    let canRenderRoute = $derived(
        publicRoutes.has($currentRoute) || authenticatedRoute === $currentRoute,
    );
    let showSidebar = $derived(
        $currentRoute !== "/login" &&
        $currentRoute !== "/signup" &&
        $currentRoute !== "/profile",
    );

    /** Verifies the current WorkOS session before protected content mounts. */
    async function authenticate(path: string, signal: AbortSignal) {
        try {
            const user = await requireAuthenticatedSession(router.goto, signal);
            if (signal.aborted) return;

            if (!user) {
                authStatus = "unauthenticated";
                profileStore.set(null);
                clearBilling();
                return;
            }

            authStatus = "authenticated";
            authenticatedRoute = path;
            profileStore.set(user);
            void loadBilling();
        } catch (error) {
            if (signal.aborted || (error instanceof DOMException && error.name === "AbortError")) {
                return;
            }

            authStatus = "error";
            profileStore.set(null);
            clearBilling();
        }

    }

    /** Retries session validation after a transient backend or network failure. */
    function retryAuthentication() {
        authStatus = "checking";
        void authenticate($currentRoute, new AbortController().signal);
    }

    $effect(() => {
        const path = $currentRoute;
        if (publicRoutes.has(path)) return;

        authStatus = "checking";
        authenticatedRoute = null;
        const controller = new AbortController();
        void authenticate(path, controller.signal);

        return () => controller.abort();
    });
</script>

<div class="app-shell">
    {#if canRenderRoute}
        {#if showSidebar}
            <Sidebar goto={router.goto}/>
        {/if}

        <main
            class="app-main"
            class:page-route={$currentRoute === "/credits" || $currentRoute === "/profile"}
            class:profile-route={$currentRoute === "/profile"}
            aria-label="Model Pass app content"
        >
            {#if $currentRoute === "/no-auth"}
                <UnAuthenticated goto={router.goto} />
            {:else if CurrentRoute === Chat}
                {#key $currentRoute}
                    <Chat chatId={routeChatId} />
                {/key}
            {:else}
                <CurrentRoute />
            {/if}
        </main>
    {:else}
        <main class="app-main" aria-label="Model Pass app content">
            <section class="empty-panel" aria-live="polite">
                <p class="eyebrow">Model Pass</p>
                {#if authStatus === "error"}
                    <h1>We couldn't verify your session.</h1>
                    <p>Please check your connection and try again.</p>
                    <div class="auth-actions">
                        <button class="auth-button auth-button-primary" type="button" onclick={retryAuthentication}>Try again</button>
                    </div>
                {:else}
                    <h1>Checking your session...</h1>
                {/if}
            </section>
        </main>
    {/if}
</div>
