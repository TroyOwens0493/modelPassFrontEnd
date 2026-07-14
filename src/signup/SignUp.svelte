<script lang="ts">
  function goToLogin() {
    window.location.assign('/login');
  }

  function startSignUp() {
    window.location.href = '/auth/signup';
  }
</script>

<section class="auth-shell">
  <div class="auth-card">
    <div class="auth-header">
      <p class="eyebrow">Model Pass</p>
      <h1>Create your account</h1>
      <p>Start buying credits, choosing models, and chatting in minutes.</p>
    </div>

    <button class="auth-button" type="button" on:click={startSignUp}>
      Sign up with WorkOS
    </button>

    <p class="auth-footer">
      Already have an account?
      <button class="link-button" type="button" on:click={goToLogin}>Sign in</button>
    </p>
  </div>
</section>
