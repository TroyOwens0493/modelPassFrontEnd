<script lang="ts">
  import { onMount } from "svelte";
  import { beginAuthentication } from ".";

  onMount(() => {
    beginAuthentication(window.location.pathname === "/signup" ? "sign-up" : "sign-in");
  });
</script>

<p>Redirecting to sign in…</p>
