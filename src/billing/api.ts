export type CreditPackage = {
  id: string;
  name: string;
  credits: number;
  price: string;
  highlight: boolean;
  checkoutAvailable: boolean;
};

export type CreditTransaction = {
  id: string;
  type: "purchase" | "usage" | "refund" | "adjustment" | "bonus";
  credits: number;
  balanceAfter: number;
  description?: string;
  createdAt: string;
};

export type BillingSummary = {
  balance: {
    creditBalance: number;
    creditsUsed: number;
    tokensUsed: number;
  };
  packages: CreditPackage[];
  transactions: CreditTransaction[];
  fulfillmentEnabled: boolean;
};

export class BillingApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
  }
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

async function parseResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new BillingApiError(
      body.error ?? "The billing request failed",
      response.status,
      body.code,
    );
  }

  return body as T;
}

export async function getBillingSummary() {
  const response = await fetch(`${apiBaseUrl}/api/billing`, {
    credentials: "include",
  });

  return parseResponse<BillingSummary>(response);
}

export async function createCheckoutSession(packageId: string) {
  const response = await fetch(`${apiBaseUrl}/api/billing/checkout`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ packageId }),
  });

  return parseResponse<{ checkoutUrl: string }>(response);
}

export function getLoginUrl() {
  return `${apiBaseUrl}/auth/login`;
}
