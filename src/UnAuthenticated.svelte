<script lang="ts">
    let { goto }: { goto?: (path: string) => void } = $props();
</script>

<section class="empty-panel">
    <p class="eyebrow">Model Pass</p>
    <h1>It looks like you haven't signed in yet.</h1>
    <div class="auth-actions">
        <button class="auth-button auth-button-primary" type="button" onclick={() => goto?.("/login")}>Log in</button>
        <button class="auth-button auth-button-secondary" type="button" onclick={() => goto?.("/signup")}>Sign up</button>
    </div>
</section>
