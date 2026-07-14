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

    const router = createRouter([
        { path: "/", component: Home },
        { path: "/chat", component: Chat },
        { path: "/login", component: AuthRedirect },
        { path: "/signup", component: AuthRedirect },
        { path: "/auth/callback", component: Home },
        { path: "/credits", component: Credits },
        { path: "/profile", component: UserProfile },
        { path: "*", component: Home },
    ]);
    const currentRoute = router.current;
    let CurrentRoute = $derived(router.match($currentRoute)?.component ?? Home);
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
                profileStore.set(payload.user ?? null);
            } else {
                profileStore.set(null);
            }
        } catch {
            profileStore.set(null);
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
        <CurrentRoute />
    </main>
</div>
