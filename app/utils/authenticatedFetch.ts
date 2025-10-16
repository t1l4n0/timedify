import { useAppBridge } from "@shopify/app-bridge-react";

export interface AuthenticatedFetchOptions extends RequestInit {
  endpoint: string;
  method?: string;
  body?: any;
}

/**
 * Hook für authentifizierte Fetch-Requests mit Session-Token aus App Bridge v4.
 * Verwendet automatisch das Bearer-Token für alle API-Calls.
 */
export function useAuthenticatedFetch() {
  const shopify = useAppBridge();

  return async ({
    endpoint,
    method = "GET",
    body,
    ...fetchOptions
  }: AuthenticatedFetchOptions) => {
    // Session-Token von App Bridge v4 holen
    const token = await shopify.idToken();

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...fetchOptions.headers,
    };

    const config: RequestInit = {
      method,
      headers,
      ...fetchOptions,
    };

    if (body && method !== "GET") {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(endpoint, config);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  };
}
