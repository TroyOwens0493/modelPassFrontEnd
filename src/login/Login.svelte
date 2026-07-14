<script lang="ts">
  import { getLoginUrl } from '../billing/api';

  function goToSignUp() {
    window.location.assign('/signup');
  }

  function startLogin() {
    window.location.href = getLoginUrl();
  }
</script>

<section class="auth-shell">
  <div class="auth-card">
    <div class="auth-header">
      <p class="eyebrow">Model Pass</p>
      <h1>Welcome back</h1>
      <p>Sign in to continue chatting with your favorite AI models.</p>
    </div>

    <button class="auth-button" type="button" on:click={startLogin}>
      Continue with WorkOS
    </button>

    <p class="auth-footer">
      Need an account?
      <button class="link-button" type="button" on:click={goToSignUp}>Create one</button>
    </p>
  </div>
</section>
