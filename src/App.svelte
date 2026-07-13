<script lang="ts">
    import Sidebar from "./Sidebar.svelte";
    import Home from "./Home.svelte";
    import Chat from "./chat/Chat.svelte";
    import Login from "./login/Login.svelte";
    import SignUp from "./signup/SignUp.svelte";
    import { createRouter } from "./router";

    const router = createRouter([
        { path: "/", component: Home },
        { path: "/chat", component: Chat },
        { path: "/login", component: Login },
        { path: "/signup", component: SignUp },
        { path: "/auth/callback", component: Home },
        { path: "*", component: Home },
    ]);
    const currentRoute = router.current;
    let CurrentRoute = $derived(router.match($currentRoute)?.component ?? Home);
    let showSidebar = $derived($currentRoute !== "/login" && $currentRoute !== "/signup");
</script>

<div class="app-shell">
    {#if showSidebar}
        <Sidebar goto={router.goto}/>
    {/if}

    <main class="app-main" aria-label="Model Pass app content">
        <CurrentRoute />
    </main>
</div>
