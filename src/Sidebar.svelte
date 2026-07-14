<script lang="ts">
    let { goto }: { goto: (path: string) => void } = $props();
    const recentChats = [
        "Saturday dinner party menu",
        "Explain mortgage rates simply",
        "Lisbon trip - 4 days",
        "Kids' science questions",
    ];

    function openNewChat() {
        goto("/chat");
    }
</script>

<aside class="sidebar" aria-label="Primary">
    <div class="brand">
        <div class="brand-mark">m</div>
        <div class="brand-name">Model Pass</div>
    </div>

    <button class="new-chat" type="button" onclick={openNewChat}>
        <span aria-hidden="true">+</span>
        New chat
    </button>

    <label class="chat-search">
        <span aria-hidden="true">⌕</span>
        <input
            type="search"
            placeholder="Search chats"
            aria-label="Search chats"
        />
    </label>

    <div class="recent">
        <div class="section-label">Recent</div>
        {#each recentChats as chat}
            <button class="recent-chat" type="button">{chat}</button>
        {/each}
    </div>

    <button
        class="profile-summary"
        type="button"
        onclick={() => goto("/profile")}
        aria-label="Open profile"
    >
        <span class="avatar">SR</span>
        <span class="profile-copy">
            <span class="profile-name">Sam Rivera</span>
            <span class="profile-credits">1,240 credits left</span>
        </span>
    </button>
</aside>
