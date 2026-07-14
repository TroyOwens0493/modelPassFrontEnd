import { writable } from 'svelte/store';

export type AppProfile = {
  id?: string;
  email?: string;
  firstName?: string | null;
  lastName?: string | null;
  name?: string;
  profilePictureUrl?: string | null;
  replyStyle?: string;
  defaultModel?: string;
};

export const profileStore = writable<AppProfile | null>(null);

export function getDisplayName(profile: AppProfile | null | undefined) {
  if (!profile) return 'User';
  return profile.name || [profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.email || 'User';
}

export function getInitials(profile: AppProfile | null | undefined) {
  const displayName = getDisplayName(profile);
  return (displayName || 'U').split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}
