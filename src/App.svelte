<script lang="ts">
    import Sidebar from "./Sidebar.svelte";
    import Home from "./Home.svelte";
</script>

<div class="app-shell">
    <Sidebar />

    <main class="app-main" aria-label="Model Pass app content">
        <Home />
    </main>
</div>
