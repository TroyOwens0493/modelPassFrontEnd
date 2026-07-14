<script lang="ts">
  type UserProfile = {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    name?: string;
    profilePictureUrl?: string | null;
    replyStyle?: string;
    defaultModel?: string;
  };

  const recentChats = [
    'Saturday dinner party menu',
    'Explain mortgage rates simply',
    'Lisbon trip - 4 days',
    "Kids' science questions",
  ];

  const models = [
    {
      slug: 'openai/gpt-4o-mini',
      name: 'GPT-4o mini',
      description: 'Quick answers for everyday questions',
    },
    {
      slug: 'anthropic/claude-3.5-sonnet',
      name: 'Claude Sonnet',
      description: 'Thoughtful writing and clear explanations',
    },
    {
      slug: 'google/gemini-flash',
      name: 'Gemini Flash',
      description: 'Speedy and great with long documents',
    },
  ];

  const replyStyles = [
    { value: 'balanced', label: 'Balanced' },
    { value: 'concise', label: 'Concise' },
    { value: 'detailed', label: 'Detailed' },
    { value: 'creative', label: 'Creative' },
  ];

  let user: UserProfile | null = null;
  let defaultModel = models[0].slug;
  let replyStyle = replyStyles[0].value;
  let savedMessage = '';
  let isSaving = false;
  let isLoading = true;
  let errorMessage = '';

  $: selectedModel = models.find((model) => model.slug === defaultModel) ?? models[0];
  $: displayName = user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'User';
  $: initials = (displayName || 'U').split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();

  async function loadProfile() {
    isLoading = true;
    errorMessage = '';

    try {
      const response = await fetch('/auth/me', { credentials: 'include' });
      if (!response.ok) {
        throw new Error('Not signed in');
      }

      const payload = await response.json();
      user = payload.user;
      defaultModel = user?.defaultModel ?? models[0].slug;
      replyStyle = user?.replyStyle ?? replyStyles[0].value;
    } catch {
      errorMessage = 'We could not load your profile. Please sign in again.';
      user = null;
    } finally {
      isLoading = false;
    }
  }

  async function savePreferences() {
    if (!user) return;

    isSaving = true;
    savedMessage = '';
    errorMessage = '';

    try {
      const response = await fetch('/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: displayName, replyStyle, defaultModel }),
      });

      if (!response.ok) {
        throw new Error('Unable to save');
      }

      const payload = await response.json();
      user = payload.user;
      savedMessage = 'Preferences saved';
    } catch {
      errorMessage = 'We could not save your preferences.';
    } finally {
      isSaving = false;
    }
  }

  async function handleLogout() {
    try {
      await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
      window.location.assign('/login');
    } catch {
      window.location.assign('/login');
    }
  }

  loadProfile();
</script>

<section class="profile-shell">
  <aside class="sidebar" aria-label="ModelPass navigation">
    <div class="brand">
      <div class="brand-mark">m</div>
      <span>Model Pass</span>
    </div>

    <a class="new-chat" href="/">
      <span aria-hidden="true">+</span>
      New chat
    </a>

    <div class="search-box">Search chats</div>

    <nav class="recent-list" aria-label="Recent chats">
      <p>Recent</p>
      {#each recentChats as chat}
        <a href="/">{chat}</a>
      {/each}
    </nav>

    <div class="sidebar-user" aria-current="page">
      <div class="avatar small">{initials}</div>
      <div>
        <strong>{displayName}</strong>
        <span>1,240 credits left</span>
      </div>
    </div>
  </aside>

  <main class="profile-main">
    <header class="topbar">
      <h1>Profile</h1>
    </header>

    <div class="profile-content">
      <section class="identity-card" aria-label="Profile summary">
        <div class="avatar large">{initials}</div>
        <div class="identity-copy">
          <h2>{displayName}</h2>
          <p>{user?.email ?? 'Loading profile...'}</p>
          <div class="meta-row">
            <span class="plan-pill"><span></span>Pay-as-you-go</span>
            <span>{isLoading ? 'Loading account...' : 'Account active'}</span>
          </div>
        </div>
      </section>

      <section class="settings-section">
        <p class="section-label">Your details</p>
        <div class="settings-card">
          <div class="settings-row">
            <span>Name</span>
            <strong>{displayName}</strong>
          </div>
          <div class="settings-row">
            <span>Email</span>
            <strong>{user?.email ?? 'Loading...'}</strong>
          </div>
          <div class="settings-row">
            <span>Account</span>
            <strong>WorkOS managed</strong>
          </div>
        </div>
      </section>

      <section class="settings-section">
        <p class="section-label">Chat preferences</p>
        <form class="settings-card" on:submit|preventDefault={savePreferences}>
          <label class="settings-row preference-row">
            <span>Default model</span>
            <span class="model-control">
              <span class="model-dot"></span>
              <select bind:value={defaultModel} aria-label="Default model">
                {#each models as model}
                  <option value={model.slug}>{model.name}</option>
                {/each}
              </select>
            </span>
          </label>

          <div class="settings-row preference-row">
            <span>Reply style</span>
            <div class="segmented-control" aria-label="Reply style">
              {#each replyStyles as style}
                <button
                  class:active={replyStyle === style.value}
                  type="button"
                  on:click={() => (replyStyle = style.value)}
                >
                  {style.label}
                </button>
              {/each}
            </div>
          </div>

          <div class="save-row">
            <div>
              <strong>{selectedModel.name}</strong>
              <span>{selectedModel.description}</span>
            </div>
            <button class="save-button" type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
        {#if savedMessage}
          <p class="save-message">{savedMessage}</p>
        {/if}
      </section>

      <section class="credits-mini">
        <div>
          <h2>1,240 credits left</h2>
          <p>About 400 everyday messages</p>
        </div>
        <a href="/credits">Manage credits</a>
      </section>

      <section class="usage-strip" aria-label="Usage summary">
        <div>
          <span>Credits used</span>
          <strong>3,760</strong>
        </div>
        <div>
          <span>Tokens used</span>
          <strong>12,000</strong>
        </div>
      </section>

      {#if errorMessage}
        <p class="save-message">{errorMessage}</p>
      {/if}

      <button class="sign-out" type="button" on:click={handleLogout}>Sign out</button>
    </div>
  </main>
</section>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&display=swap');

  :global(body) {
    background: #241f1a;
  }

  .profile-shell {
    --accent: #e8a04d;
    --screen: #1a1714;
    --sidebar: #161310;
    --panel: #201c18;
    --panel-2: #211d19;
    --input: #1a1714;
    --line: rgba(255, 240, 220, 0.06);
    --line-strong: rgba(255, 240, 220, 0.12);
    --text: #f2ece4;
    --muted: #8e8478;
    --muted-2: #6b6358;

    display: flex;
    min-height: 760px;
    overflow: hidden;
    border: 1px solid var(--line);
    border-radius: 16px;
    background: var(--screen);
    box-shadow: 0 30px 60px -22px rgba(0, 0, 0, 0.55);
    color: var(--text);
    font-family: 'Hanken Grotesk', system-ui, sans-serif;
    text-align: left;
  }

  .sidebar {
    display: flex;
    flex: 0 0 248px;
    flex-direction: column;
    gap: 14px;
    border-right: 1px solid var(--line);
    background: var(--sidebar);
    padding: 18px 14px;
  }

  .brand,
  .sidebar-user,
  .new-chat {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .brand {
    padding: 2px 6px 4px;
    font-size: 15.5px;
    font-weight: 650;
    letter-spacing: -0.015em;
  }

  .brand-mark {
    display: grid;
    width: 27px;
    height: 27px;
    place-items: center;
    border-radius: 9px;
    background: var(--accent);
    color: var(--screen);
    font-weight: 700;
  }

  .new-chat {
    border-radius: 11px;
    padding: 11px 14px;
    background: var(--accent);
    color: var(--screen);
    font-size: 13.5px;
    font-weight: 650;
    text-decoration: none;
  }

  .search-box {
    border: 1px solid rgba(255, 240, 220, 0.05);
    border-radius: 10px;
    padding: 9px 12px;
    background: var(--panel-2);
    color: var(--muted);
    font-size: 13px;
  }

  .recent-list {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 1px;
    overflow: hidden;
  }

  .recent-list p,
  .section-label {
    margin: 0;
    color: var(--muted-2);
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.07em;
    text-transform: uppercase;
  }

  .recent-list p {
    padding: 10px 10px 6px;
  }

  .recent-list a {
    overflow: hidden;
    border-radius: 9px;
    padding: 9px 11px;
    color: #9a9084;
    font-size: 13px;
    text-decoration: none;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .recent-list a:hover {
    background: color-mix(in srgb, var(--accent) 10%, transparent);
    color: var(--text);
  }

  .sidebar-user {
    border-top: 1px solid var(--line);
    border-radius: 10px;
    padding: 9px 8px;
    background: color-mix(in srgb, var(--accent) 13%, transparent);
  }

  .sidebar-user strong {
    display: block;
    color: #e8ddcf;
    font-size: 13px;
    font-weight: 500;
  }

  .sidebar-user span {
    color: #7c7163;
    font-size: 11px;
  }

  .avatar {
    display: grid;
    flex-shrink: 0;
    place-items: center;
    border-radius: 50%;
    background: #3a322a;
    color: #f2ece4;
    font-weight: 650;
  }

  .avatar.small {
    width: 30px;
    height: 30px;
    font-size: 12.5px;
  }

  .avatar.large {
    width: 58px;
    height: 58px;
    font-size: 21px;
  }

  .profile-main {
    display: flex;
    min-width: 0;
    flex: 1;
    flex-direction: column;
  }

  .topbar {
    display: flex;
    height: 54px;
    flex-shrink: 0;
    align-items: center;
    border-bottom: 1px solid rgba(255, 240, 220, 0.05);
    padding: 0 26px;
  }

  .topbar h1 {
    margin: 0;
    color: #e8ddcf;
    font-size: 14px;
    font-weight: 650;
    letter-spacing: -0.01em;
  }

  .profile-content {
    display: flex;
    width: 100%;
    max-width: 560px;
    flex-direction: column;
    gap: 22px;
    margin: 0 auto;
    padding: 30px 24px;
  }

  .identity-card,
  .settings-card,
  .credits-mini,
  .usage-strip {
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--panel);
  }

  .identity-card {
    display: flex;
    align-items: center;
    gap: 17px;
    padding: 20px;
  }

  .identity-copy {
    min-width: 0;
    flex: 1;
  }

  .identity-copy h2 {
    margin: 0;
    color: var(--text);
    font-size: 18px;
    font-weight: 650;
    letter-spacing: -0.01em;
  }

  .identity-copy p {
    margin: 2px 0 0;
    color: var(--muted);
    font-size: 13.5px;
  }

  .meta-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-top: 9px;
    color: #7c7163;
    font-size: 12px;
  }

  .plan-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border-radius: 999px;
    padding: 3px 9px;
    background: color-mix(in srgb, var(--accent) 14%, transparent);
    color: #e0c89a;
    font-size: 11.5px;
  }

  .plan-pill span,
  .model-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--accent);
  }

  .ghost-button,
  .save-button,
  .segmented-control button,
  .sign-out {
    font: inherit;
    cursor: pointer;
  }

  .ghost-button {
    border: 1px solid var(--line-strong);
    border-radius: 9px;
    padding: 8px 14px;
    background: transparent;
    color: #cdc4b8;
    font-size: 13px;
    font-weight: 550;
  }

  .settings-section {
    display: grid;
    gap: 9px;
  }

  .section-label {
    padding: 0 2px;
  }

  .settings-card {
    overflow: hidden;
  }

  .settings-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    border-bottom: 1px solid rgba(255, 240, 220, 0.05);
    padding: 14px 16px;
  }

  .settings-row:last-child {
    border-bottom: none;
  }

  .settings-row > span:first-child {
    color: var(--muted);
    font-size: 13.5px;
  }

  .settings-row strong {
    color: #e8ddcf;
    font-size: 13.5px;
    font-weight: 550;
  }

  .preference-row {
    margin: 0;
  }

  .model-control {
    display: flex;
    align-items: center;
    gap: 9px;
  }

  .model-control select {
    max-width: 160px;
    border: none;
    background: transparent;
    color: #e8ddcf;
    font: inherit;
    font-size: 13.5px;
    font-weight: 550;
  }

  .segmented-control {
    display: flex;
    gap: 2px;
    border: 1px solid var(--line);
    border-radius: 9px;
    background: var(--input);
    padding: 3px;
  }

  .segmented-control button {
    border: none;
    border-radius: 7px;
    padding: 5px 12px;
    background: transparent;
    color: #9a9084;
    font-size: 12.5px;
    font-weight: 600;
  }

  .segmented-control button.active {
    background: var(--accent);
    color: var(--screen);
  }

  .save-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 13px 16px;
  }

  .save-row strong,
  .save-row span {
    display: block;
  }

  .save-row strong {
    color: #e8ddcf;
    font-size: 13.5px;
  }

  .save-row span {
    color: var(--muted);
    font-size: 12px;
  }

  .save-button {
    border: none;
    border-radius: 9px;
    padding: 8px 14px;
    background: var(--accent);
    color: var(--screen);
    font-size: 13px;
    font-weight: 700;
  }

  .save-button:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }

  .save-message {
    margin: -4px 2px 0;
    color: #e0c89a;
    font-size: 12.5px;
    font-weight: 650;
  }

  .credits-mini {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    padding: 16px 18px;
  }

  .credits-mini h2 {
    margin: 0;
    color: #e8ddcf;
    font-size: 13.5px;
    font-weight: 600;
  }

  .credits-mini p {
    margin: 2px 0 0;
    color: var(--muted);
    font-size: 12px;
  }

  .credits-mini a {
    flex-shrink: 0;
    border: 1px solid color-mix(in srgb, var(--accent) 50%, transparent);
    border-radius: 9px;
    padding: 9px 15px;
    color: var(--accent);
    font-size: 13px;
    font-weight: 650;
    text-decoration: none;
  }

  .usage-strip {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    overflow: hidden;
  }

  .usage-strip div {
    display: grid;
    gap: 3px;
    padding: 14px 16px;
  }

  .usage-strip div + div {
    border-left: 1px solid rgba(255, 240, 220, 0.05);
  }

  .usage-strip span {
    color: var(--muted);
    font-size: 12px;
  }

  .usage-strip strong {
    color: #e8ddcf;
    font-size: 15px;
  }

  .sign-out {
    align-self: flex-start;
    border: none;
    background: transparent;
    color: #b08068;
    font-size: 13.5px;
    font-weight: 550;
    padding: 2px;
  }

  @media (max-width: 820px) {
    .profile-shell {
      min-height: 100svh;
      border-radius: 0;
    }

    .sidebar {
      display: none;
    }

    .profile-content {
      max-width: none;
    }
  }

  @media (max-width: 560px) {
    .identity-card,
    .credits-mini,
    .settings-row,
    .save-row {
      align-items: flex-start;
      flex-direction: column;
    }

    .ghost-button,
    .credits-mini a,
    .save-button {
      width: 100%;
      text-align: center;
    }

    .segmented-control,
    .model-control select {
      width: 100%;
    }

    .usage-strip {
      grid-template-columns: 1fr;
    }

    .usage-strip div + div {
      border-top: 1px solid rgba(255, 240, 220, 0.05);
      border-left: none;
    }
  }
</style>