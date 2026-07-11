<script lang="ts">
    import Sidebar from "./Sidebar.svelte";
    import Home from "./Home.svelte";
    import Chat from "./chat/Chat.svelte";
    import Credits from "./billing/Credits.svelte";
    import { createRouter } from "./router";

    const router = createRouter([
        { path: "/", component: Home },
        { path: "/chat", component: Chat },
        { path: "/credits", component: Credits },
        // { path: "/signup", component: SignUp },
        // { path: "/login", component: Login },
        { path: "*", component: Home },
    ]);
    const currentRoute = router.current;
    let CurrentRoute = $derived(router.match($currentRoute)?.component ?? Home);
</script>

<div class="app-shell">
    <Sidebar goto={router.goto}/>

    <main
        class="app-main"
        class:page-route={$currentRoute === "/credits"}
        aria-label="Model Pass app content"
    >
        <CurrentRoute />
    </main>
</div>
