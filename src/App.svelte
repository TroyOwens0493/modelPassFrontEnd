<script>
  import UserProfile from './pages/UserProfile.svelte'

  const path = window.location.pathname
</script>

{#if path === '/profile'}
  <UserProfile />
{:else}
  <section class="home-page">
    <p class="eyebrow">ModelPass</p>
    <h1>Welcome to ModelPass</h1>
    <p>Use this starter route to jump into the profile page while the rest of the app is being built.</p>
    <a class="profile-link" href="/profile">Open profile page</a>
  </section>
{/if}

<style>
  .home-page {
    display: grid;
    place-items: center;
    align-content: center;
    gap: 1rem;
    min-height: 100svh;
    padding: 2rem;
    text-align: center;
  }

  .home-page h1 {
    margin: 0;
  }

  .home-page p {
    max-width: 560px;
  }

  .eyebrow {
    margin: 0;
    color: var(--accent);
    font-size: 0.85rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .profile-link {
    border-radius: 10px;
    padding: 0.8rem 1rem;
    color: white;
    background: #111827;
    font-weight: 700;
    text-decoration: none;
  }

  .profile-link:hover {
    background: #374151;
  }
</style>
