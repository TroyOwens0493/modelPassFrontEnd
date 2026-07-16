<script lang="ts">
    import { onMount } from "svelte";
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
    import { getApiPath } from "./api";

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
    let showSidebar = $derived(
        $currentRoute !== "/login" &&
        $currentRoute !== "/signup" &&
        $currentRoute !== "/profile",
    );

    onMount(async () => {
        try {
            const response = await fetch(getApiPath("/auth/me"), { credentials: "include" });
            if (response.ok) {
                const payload = await response.json();
                profileStore.set(payload.user ?? null);
                await loadBilling();
            } else {
                profileStore.set(null);
                clearBilling();
            }
        } catch {
            profileStore.set(null);
            clearBilling();
        }
    });
</script>

<div class="app-shell">
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
</div>
