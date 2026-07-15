import { get } from "svelte/store";
import { writable } from "svelte/store";
import {
  BillingApiError,
  getBillingSummary,
  type BillingSummary,
} from "../billing/api";

export type BillingState = {
  summary: BillingSummary | null;
  loading: boolean;
  error: string | null;
  unauthenticated: boolean;
};

const initialState: BillingState = {
  summary: null,
  loading: false,
  error: null,
  unauthenticated: false,
};

export const billingStore = writable<BillingState>(initialState);

let pendingLoad: Promise<BillingSummary | null> | null = null;
let requestGeneration = 0;

export function clearBilling() {
  requestGeneration += 1;
  pendingLoad = null;
  billingStore.set(initialState);
}

export async function loadBilling(force = false) {
  const current = get(billingStore);

  if (!force && current.summary) {
    return current.summary;
  }

  if (pendingLoad) {
    const activeLoad = pendingLoad;

    if (!force) {
      return activeLoad;
    }

    await activeLoad;
    return loadBilling(true);
  }

  billingStore.update((state) => ({
    ...state,
    loading: true,
    error: null,
    unauthenticated: false,
  }));
  const generation = ++requestGeneration;

  pendingLoad = getBillingSummary()
    .then((summary) => {
      if (generation !== requestGeneration) {
        return null;
      }

      billingStore.set({
        summary,
        loading: false,
        error: null,
        unauthenticated: false,
      });
      return summary;
    })
    .catch((error) => {
      if (generation !== requestGeneration) {
        return null;
      }

      const unauthenticated =
        error instanceof BillingApiError && error.status === 401;

      billingStore.set({
        summary: null,
        loading: false,
        error: unauthenticated
          ? null
          : "We could not load your billing information.",
        unauthenticated,
      });
      return null;
    })
    .finally(() => {
      if (generation === requestGeneration) {
        pendingLoad = null;
      }
    });

  return pendingLoad;
}

export function refreshBilling() {
  return loadBilling(true);
}
