<script lang="ts">
  const user = {
    name: 'ModelPass User',
    email: 'user@example.com',
    createdAt: 'July 2026',
  }

  const usage = {
    creditBalance: 100,
    creditsUsed: 25,
    tokensUsed: 12000,
  }

  const models = [
    {
      slug: 'openai/gpt-4o-mini',
      name: 'GPT-4o Mini',
      description: 'Fast, affordable model for everyday chats.',
    },
    {
      slug: 'anthropic/claude-3.5-sonnet',
      name: 'Claude 3.5 Sonnet',
      description: 'Strong reasoning model for detailed responses.',
    },
  ]

  const replyStyles = [
    { value: 'balanced', label: 'Balanced' },
    { value: 'concise', label: 'Concise' },
    { value: 'detailed', label: 'Detailed' },
    { value: 'creative', label: 'Creative' },
  ]

  let defaultModel = models[0].slug
  let replyStyle = 'balanced'
  let savedMessage = ''
  let isSaving = false

  function savePreferences() {
    isSaving = true
    savedMessage = ''

    window.setTimeout(() => {
      isSaving = false
      savedMessage = 'Preferences saved for this session.'
    }, 500)
  }
</script>

<section class="profile-page">
  <header class="profile-header">
    <p class="eyebrow">ModelPass account</p>
    <h1>Profile</h1>
    <p>Manage your ModelPass preferences and account details.</p>
  </header>

  <div class="profile-grid">
    <section class="card account-card">
      <div>
        <h2>Account</h2>
        <p class="card-description">Your login identity is managed through WorkOS.</p>
      </div>

      <dl class="details-list">
        <div>
          <dt>Name</dt>
          <dd>{user.name}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{user.email}</dd>
        </div>
        <div>
          <dt>Member since</dt>
          <dd>{user.createdAt}</dd>
        </div>
      </dl>
    </section>

    <section class="card preferences-card">
      <div>
        <h2>Preferences</h2>
        <p class="card-description">Set the defaults that new chats should start with.</p>
      </div>

      <form on:submit|preventDefault={savePreferences}>
        <label>
          Default model
          <select bind:value={defaultModel}>
            {#each models as model}
              <option value={model.slug}>{model.name}</option>
            {/each}
          </select>
        </label>

        <label>
          Reply style
          <select bind:value={replyStyle}>
            {#each replyStyles as style}
              <option value={style.value}>{style.label}</option>
            {/each}
          </select>
        </label>

        <button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save preferences'}
        </button>

        {#if savedMessage}
          <p class="success-message">{savedMessage}</p>
        {/if}
      </form>
    </section>

    <section class="card usage-card">
      <div>
        <h2>Usage</h2>
        <p class="card-description">A quick summary of your current ModelPass usage.</p>
      </div>

      <div class="usage-stats">
        <div>
          <span>Credit balance</span>
          <strong>{usage.creditBalance}</strong>
        </div>
        <div>
          <span>Credits used</span>
          <strong>{usage.creditsUsed}</strong>
        </div>
        <div>
          <span>Tokens used</span>
          <strong>{usage.tokensUsed.toLocaleString()}</strong>
        </div>
      </div>

      <a class="credits-link" href="/credits">Manage credits</a>
    </section>
  </div>
</section>

<style>
  .profile-page {
    box-sizing: border-box;
    width: 100%;
    max-width: 960px;
    margin: 0 auto;
    padding: 3rem 2rem;
    text-align: left;
  }

  .profile-header {
    margin-bottom: 2rem;
  }

  .eyebrow {
    margin-bottom: 0.5rem;
    color: var(--accent);
    font-size: 0.85rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .profile-header h1 {
    margin: 0 0 0.5rem;
  }

  .profile-grid {
    display: grid;
    gap: 1rem;
  }

  .card {
    display: grid;
    gap: 1.25rem;
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 1.5rem;
    background: var(--bg);
    box-shadow: var(--shadow);
  }

  .card h2 {
    margin: 0 0 0.35rem;
  }

  .card-description {
    color: var(--text);
  }

  .details-list {
    display: grid;
    gap: 1rem;
    margin: 0;
  }

  .details-list div {
    display: grid;
    gap: 0.25rem;
  }

  .details-list dt,
  .usage-stats span {
    color: var(--text);
    font-size: 0.85rem;
    font-weight: 700;
    text-transform: uppercase;
  }

  .details-list dd {
    margin: 0;
    color: var(--text-h);
    font-weight: 600;
  }

  form {
    display: grid;
    gap: 1rem;
  }

  label {
    display: grid;
    gap: 0.4rem;
    color: var(--text-h);
    font-weight: 700;
  }

  select {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 0.75rem;
    color: var(--text-h);
    background: var(--bg);
    font: inherit;
  }

  button {
    width: fit-content;
    border: none;
    border-radius: 10px;
    padding: 0.8rem 1rem;
    color: white;
    background: #111827;
    font: inherit;
    font-weight: 700;
    cursor: pointer;
  }

  button:hover:not(:disabled) {
    background: #374151;
  }

  button:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }

  .success-message {
    color: #15803d;
    font-weight: 700;
  }

  .usage-stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1rem;
  }

  .usage-stats div {
    display: grid;
    gap: 0.35rem;
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1rem;
  }

  .usage-stats strong {
    color: var(--text-h);
    font-size: 1.5rem;
  }

  .credits-link {
    width: fit-content;
    color: var(--accent);
    font-weight: 700;
  }

  @media (max-width: 720px) {
    .profile-page {
      padding: 2rem 1rem;
    }

    .usage-stats {
      grid-template-columns: 1fr;
    }

    button {
      width: 100%;
    }
  }
</style>