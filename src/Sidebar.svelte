<script lang="ts">
    import { profileStore, getDisplayName, getInitials } from "./stores/profile";
    import { billingStore } from "./stores/billing";
    import { chatsStore } from "./stores/chats";

    let {
        goto,
        currentPath,
    }: {
        goto: (path: string, options?: { replace?: boolean }) => void;
        currentPath: string;
    } = $props();

    let profile = $derived($profileStore);
    let displayName = $derived(getDisplayName(profile));
    let initials = $derived(getInitials(profile));
    let creditLabel = $derived(
        $billingStore.loading
            ? "Loading credits…"
            : $billingStore.summary
                ? `${$billingStore.summary.balance.creditBalance.toLocaleString()} credits left`
                : $billingStore.unauthenticated
                    ? "Sign in to view credits"
                    : "Credits unavailable",
    );
    let recentChats = $derived($chatsStore.chats);
    let chatsLoading = $derived($chatsStore.loading && !$chatsStore.loaded);
    let chatsError = $derived($chatsStore.error);

    function openNewChat() {
        goto("/chat");
    }

    function openChat(chatId: string) {
        goto(`/chat/${chatId}`);
    }

    function isActiveChat(chatId: string) {
        return currentPath === `/chat/${chatId}`;
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
        {#if chatsLoading}
            <p class="recent-empty">Loading chats…</p>
        {:else if chatsError}
            <p class="recent-empty">{chatsError}</p>
        {:else if recentChats.length === 0}
            <p class="recent-empty">No chats yet</p>
        {:else}
            {#each recentChats as chat (chat._id)}
                <button
                    class="recent-chat"
                    class:active={isActiveChat(chat._id)}
                    type="button"
                    aria-current={isActiveChat(chat._id) ? "page" : undefined}
                    onclick={() => openChat(chat._id)}
                >
                    {chat.title}
                </button>
            {/each}
        {/if}
    </div>

    <button
        class="profile-summary"
        type="button"
        onclick={() => goto("/profile")}
        aria-label="Open profile"
    >
        <span class="avatar">{initials}</span>
        <span class="profile-copy">
            <span class="profile-name">{displayName}</span>
            <span class="profile-credits">{creditLabel}</span>
        </span>
    </button>
</aside>
