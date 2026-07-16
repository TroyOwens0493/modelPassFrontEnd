<script lang="ts">
    import { onMount } from "svelte";
    import { profileStore, getDisplayName, getInitials } from "./stores/profile";
    import { billingStore } from "./stores/billing";
    import { getChats, type ChatSummary } from "./chat/api";

    let { goto }: { goto: (path: string) => void } = $props();
    let chats = $state<ChatSummary[]>([]);
    let chatsLoading = $state(true);
    let chatsUnavailable = $state(false);

    let profile = $derived($profileStore);
    let displayName = $derived(getDisplayName(profile));
    let initials = $derived(getInitials(profile));
    let creditLabel = $derived(
        $billingStore.summary
            ? `${$billingStore.summary.balance.creditBalance.toLocaleString()} credits left`
            : $billingStore.loading
                ? "Loading credits…"
                : $billingStore.unauthenticated
                    ? "Sign in to view credits"
                    : "Credits unavailable",
    );

    /** Opens an empty conversation. */
    function openNewChat() {
        goto("/chat");
    }

    /** Loads all chats owned by the authenticated profile. */
    async function loadChats() {
        const userId = profile?.id;

        if (!userId) {
            chatsLoading = false;
            chatsUnavailable = true;
            return;
        }

        try {
            chats = await getChats(userId);
        } catch (error) {
            console.error(error);
            chatsUnavailable = true;
        } finally {
            chatsLoading = false;
        }
    }

    /** Starts loading chat summaries after the sidebar mounts. */
    function initializeChats() {
        void loadChats();
    }

    onMount(initializeChats);
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
            <p class="recent-status" role="status">Loading chats...</p>
        {:else if chatsUnavailable}
            <p class="recent-status">Chats unavailable.</p>
        {:else if chats.length === 0}
            <p class="recent-status">No chats yet.</p>
        {:else}
            {#each chats as chat (chat._id)}
                <button
                    class="recent-chat"
                    type="button"
                    onclick={() => goto(`/chat/${encodeURIComponent(chat._id)}`)}
                >{chat.title}</button>
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
