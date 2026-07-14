<script lang="ts">
    const search = new URLSearchParams(window.location.search);
    const code = search.get('code');
</script>

<section class="empty-panel">
    <p class="eyebrow">Model Pass</p>
    <h1>{code ? 'Authentication complete' : 'Howdy'}</h1>
    <p>{code ? 'You can return to the app and continue signing in.' : 'Please create a new chat to start working with AI.'}</p>
</section>
