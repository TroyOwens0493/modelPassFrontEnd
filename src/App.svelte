<script lang="ts">
    import { onMount } from "svelte";
    import Sidebar from "./Sidebar.svelte";
    import Home from "./Home.svelte";
    import Chat from "./chat/Chat.svelte";
    import AuthRedirect from "./auth/AuthRedirect.svelte";
    import Credits from "./billing/Credits.svelte";
    import UserProfile from "./pages/UserProfile.svelte";
    import { createRouter } from "./router";
    import { profileStore } from "./stores/profile";
    import { clearBilling, loadBilling } from "./stores/billing";
    import { clearChats, loadChats } from "./stores/chats";

    const router = createRouter([
        { path: "/", component: Home },
        { path: "/chat", component: Chat },
        { path: "/chat/:chatId", component: Chat },
        { path: "/login", component: AuthRedirect },
        { path: "/signup", component: AuthRedirect },
        { path: "/auth/callback", component: Home },
        { path: "/credits", component: Credits },
        { path: "/profile", component: UserProfile },
        { path: "*", component: Home },
    ]);
    const currentRoute = router.current;
    let matchedRoute = $derived(router.match($currentRoute));
    let CurrentRoute = $derived(matchedRoute?.component ?? Home);
    let routeParams = $derived(matchedRoute?.params ?? {});
    let showSidebar = $derived(
        $currentRoute !== "/login" &&
        $currentRoute !== "/signup" &&
        $currentRoute !== "/profile",
    );

    onMount(async () => {
        try {
            const response = await fetch("/auth/me", { credentials: "include" });
            if (response.ok) {
                const payload = await response.json();
                const user = payload.user ?? null;
                profileStore.set(user);
                await loadBilling();
                if (user?.id) {
                    await loadChats(user.id);
                } else {
                    clearChats();
                }
            } else {
                profileStore.set(null);
                clearBilling();
                clearChats();
            }
        } catch {
            profileStore.set(null);
            clearBilling();
            clearChats();
        }
    });
</script>

<div class="app-shell">
    {#if showSidebar}
        <Sidebar goto={router.goto} currentPath={$currentRoute} />
    {/if}

    <main
        class="app-main"
        class:page-route={$currentRoute === "/credits" || $currentRoute === "/profile"}
        class:profile-route={$currentRoute === "/profile"}
        aria-label="Model Pass app content"
    >
        <CurrentRoute {...routeParams} goto={router.goto} />
    </main>
</div>
