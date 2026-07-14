<script lang="ts">
  import { onMount } from "svelte";
  import {
    BillingApiError,
    createCheckoutSession,
    getBillingSummary,
    getLoginUrl,
    type BillingSummary,
  } from "./api";

  let summary = $state<BillingSummary | null>(null);
  let loading = $state(true);
  let unauthenticated = $state(false);
  let errorMessage = $state("");
  let checkoutError = $state("");
  let purchasingPackageId = $state<string | null>(null);

  const checkoutStatus = new URLSearchParams(window.location.search).get(
    "checkout",
  );

  async function loadBilling() {
    loading = true;
    errorMessage = "";
    unauthenticated = false;

    try {
      summary = await getBillingSummary();
    } catch (error) {
      if (error instanceof BillingApiError && error.status === 401) {
        unauthenticated = true;
      } else {
        errorMessage = "We could not load your billing information.";
      }
    } finally {
      loading = false;
    }
  }

  async function buyPackage(packageId: string) {
    if (purchasingPackageId) return;

    purchasingPackageId = packageId;
    checkoutError = "";

    try {
      const { checkoutUrl } = await createCheckoutSession(packageId);
      window.location.assign(checkoutUrl);
    } catch (error) {
      checkoutError =
        error instanceof BillingApiError
          ? error.message
          : "We could not start checkout. Please try again.";
      purchasingPackageId = null;
    }
  }

  function formatDate(value: string) {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
    }).format(new Date(value));
  }

  onMount(loadBilling);
</script>

<svelte:head>
  <title>Credits | Model Pass</title>
</svelte:head>

<section class="credits-page">
  <header class="page-header">
    <div>
      <p class="eyebrow">Billing</p>
      <h1>Credits</h1>
      <p>Buy credits and track your Model Pass usage.</p>
    </div>
    <a href="/chat">Back to chat</a>
  </header>

  {#if checkoutStatus === "success"}
    <div class="status-message success" role="status">
      Payment received. Your credits may take a moment to appear.
    </div>
  {:else if checkoutStatus === "canceled"}
    <div class="status-message" role="status">
      Checkout was canceled. No credits were added.
    </div>
  {/if}

  {#if loading}
    <div class="state-card" aria-live="polite">Loading billing information…</div>
  {:else if unauthenticated}
    <div class="state-card">
      <h2>Sign in to manage credits</h2>
      <p>Your balance and purchases are linked to your Model Pass account.</p>
      <a class="primary-link" href={getLoginUrl()}>Sign in</a>
    </div>
  {:else if errorMessage}
    <div class="state-card" role="alert">
      <h2>Billing is temporarily unavailable</h2>
      <p>{errorMessage}</p>
      <button type="button" onclick={loadBilling}>Try again</button>
    </div>
  {:else if summary}
    <section class="balance-card" aria-label="Credit balance">
      <div>
        <span>Available balance</span>
        <strong>{summary.balance.creditBalance.toLocaleString()}</strong>
        <small>credits</small>
      </div>
      <p>
        {summary.balance.creditBalance === 0
          ? "You are out of credits. Packages will be available when checkout launches."
          : "Your credits are ready to use across supported models."}
      </p>
    </section>

    <section class="packages-section" aria-labelledby="packages-heading">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Top up</p>
          <h2 id="packages-heading">Choose a credit package</h2>
        </div>
        {#if !summary.fulfillmentEnabled}
          <span class="setup-badge">Checkout setup in progress</span>
        {/if}
      </div>

      <div class="package-grid">
        {#each summary.packages as creditPackage}
          <article class:highlight={creditPackage.highlight} class="package-card">
            {#if creditPackage.highlight}
              <span class="value-label">Best value</span>
            {/if}
            <h3>{creditPackage.name}</h3>
            <div class="credit-amount">
              {creditPackage.credits.toLocaleString()}
              <span>credits</span>
            </div>
            <p class="price">{creditPackage.price}</p>
            <button
              type="button"
              disabled={!creditPackage.checkoutAvailable || purchasingPackageId !== null}
              onclick={() => buyPackage(creditPackage.id)}
              aria-label={`Buy ${creditPackage.name} package`}
            >
              {purchasingPackageId === creditPackage.id
                ? "Opening checkout…"
                : creditPackage.checkoutAvailable
                  ? `Buy ${creditPackage.name}`
                  : "Coming soon"}
            </button>
          </article>
        {/each}
      </div>

      {#if checkoutError}
        <p class="checkout-error" role="alert">{checkoutError}</p>
      {/if}

      {#if !summary.fulfillmentEnabled}
        <p class="setup-note">
          {summary.packages.some((creditPackage) => creditPackage.checkoutAvailable)
            ? "Sandbox checkout is available. Test purchases will not add credits until webhook fulfillment is configured."
            : "Product cards are ready. Add Polar sandbox credentials and product IDs to enable test checkout."}
        </p>
      {/if}
    </section>

    <section class="activity-section" aria-labelledby="activity-heading">
      <div class="section-heading">
        <div>
          <p class="eyebrow">History</p>
          <h2 id="activity-heading">Recent activity</h2>
        </div>
      </div>

      {#if summary.transactions.length === 0}
        <div class="empty-activity">No credit activity yet.</div>
      {:else}
        <div class="transaction-list">
          {#each summary.transactions as transaction}
            <div class="transaction-row">
              <div>
                <strong>{transaction.description ?? transaction.type}</strong>
                <span>{formatDate(transaction.createdAt)}</span>
              </div>
              <div class="transaction-amount">
                <strong>{transaction.credits > 0 ? "+" : ""}{transaction.credits}</strong>
                <span>{transaction.balanceAfter} after</span>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </section>

    <section class="explanation">
      <h2>How credits work</h2>
      <p>
        Credits are prepaid. Different models and longer conversations may use
        different amounts. Payment details are securely handled by Polar and are
        never stored by Model Pass.
      </p>
    </section>
  {/if}
</section>

<style>
  .credits-page {
    width: min(100%, 980px);
    display: grid;
    gap: 28px;
    margin: 0 auto;
    color: #f2ece4;
  }

  .page-header,
  .section-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
  }

  .page-header h1 {
    margin: 0;
    font-size: clamp(32px, 5vw, 48px);
    letter-spacing: -0.04em;
  }

  .page-header p:not(.eyebrow),
  .state-card p,
  .explanation p {
    margin: 6px 0 0;
    color: var(--muted);
  }

  .page-header a {
    color: var(--soft);
    font-size: 14px;
    text-decoration: none;
  }

  .status-message,
  .state-card,
  .balance-card,
  .package-card,
  .empty-activity,
  .transaction-list,
  .explanation {
    border: 1px solid var(--border);
    border-radius: 16px;
    background: var(--panel);
  }

  .status-message {
    padding: 14px 18px;
    color: var(--soft);
  }

  .status-message.success {
    border-color: rgba(232, 160, 77, 0.32);
    color: #f0c48f;
  }

  .state-card {
    padding: 42px;
    text-align: center;
  }

  .state-card h2 {
    margin: 0;
  }

  .state-card button,
  .primary-link {
    display: inline-block;
    margin-top: 20px;
    border: 0;
    border-radius: 10px;
    padding: 10px 18px;
    background: var(--accent);
    color: #1a1714;
    font-weight: 700;
    text-decoration: none;
  }

  .balance-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 28px;
    padding: 26px 30px;
    background:
      radial-gradient(circle at top right, rgba(232, 160, 77, 0.13), transparent 45%),
      var(--panel);
  }

  .balance-card div {
    min-width: 180px;
  }

  .balance-card span,
  .balance-card small {
    display: block;
    color: var(--muted);
    font-size: 13px;
  }

  .balance-card strong {
    display: inline-block;
    margin-top: 4px;
    color: var(--accent);
    font-size: 42px;
    line-height: 1;
  }

  .balance-card small {
    display: inline;
    margin-left: 7px;
  }

  .balance-card p {
    max-width: 420px;
    margin: 0;
    color: var(--soft);
    line-height: 1.55;
  }

  .packages-section,
  .activity-section {
    display: grid;
    gap: 16px;
  }

  .section-heading h2,
  .explanation h2 {
    margin: 0;
    font-size: 21px;
  }

  .section-heading .eyebrow {
    margin-bottom: 3px;
  }

  .setup-badge,
  .value-label {
    border-radius: 999px;
    padding: 5px 10px;
    background: rgba(232, 160, 77, 0.12);
    color: #eac18f;
    font-size: 11px;
    font-weight: 700;
  }

  .package-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
  }

  .package-card {
    position: relative;
    display: grid;
    gap: 14px;
    padding: 22px;
  }

  .package-card.highlight {
    border-color: rgba(232, 160, 77, 0.38);
  }

  .value-label {
    position: absolute;
    top: 14px;
    right: 14px;
  }

  .package-card h3 {
    margin: 0;
    font-size: 16px;
  }

  .credit-amount {
    margin-top: 12px;
    font-size: 30px;
    font-weight: 700;
  }

  .credit-amount span {
    display: block;
    color: var(--muted);
    font-size: 12px;
    font-weight: 500;
  }

  .price {
    margin: 0;
    color: var(--soft);
    font-size: 18px;
  }

  .package-card button {
    width: 100%;
    margin-top: 8px;
    border: 0;
    border-radius: 10px;
    padding: 11px;
    background: var(--accent);
    color: #1a1714;
    font-weight: 700;
  }

  .package-card button:disabled {
    cursor: not-allowed;
    background: #302a24;
    color: #81766a;
  }

  .setup-note,
  .checkout-error {
    margin: 0;
    color: var(--muted);
    font-size: 13px;
  }

  .checkout-error {
    color: #e6a38d;
  }

  .empty-activity {
    padding: 24px;
    color: var(--muted);
    text-align: center;
  }

  .transaction-list {
    overflow: hidden;
  }

  .transaction-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 14px 18px;
    border-bottom: 1px solid var(--border);
  }

  .transaction-row:last-child {
    border-bottom: 0;
  }

  .transaction-row span {
    display: block;
    margin-top: 2px;
    color: var(--muted);
    font-size: 12px;
  }

  .transaction-amount {
    text-align: right;
  }

  .explanation {
    padding: 22px;
  }

  .explanation p {
    line-height: 1.6;
  }

  @media (max-width: 840px) {
    .package-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 600px) {
    .page-header,
    .balance-card,
    .section-heading {
      align-items: flex-start;
      flex-direction: column;
    }

    .balance-card {
      padding: 22px;
    }

    .setup-badge {
      align-self: flex-start;
    }
  }
</style>
