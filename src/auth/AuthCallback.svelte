<script lang="ts">
  import { onMount } from "svelte";
  import { processAuthenticationCallback } from ".";

  let errorMessage = $state("");

  onMount(async () => {
    try {
      await processAuthenticationCallback();
      window.location.replace("/chat");
    } catch {
      errorMessage = "We could not complete sign-in. Please try again.";
    }
  });
</script>

<section class="empty-panel">
  <h1>{errorMessage ? "Sign-in failed" : "Completing sign-in…"}</h1>
  {#if errorMessage}<p role="alert">{errorMessage}</p>{/if}
</section>
