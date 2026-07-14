<script lang="ts">
  import { onMount } from "svelte";
  import { getLoginUrl, getSignUpUrl } from "./api";

  onMount(() => {
    const authUrl = window.location.pathname === "/signup"
      ? getSignUpUrl()
      : getLoginUrl();

    window.location.replace(authUrl);
  });
</script>
