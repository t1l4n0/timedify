import { useAppBridge } from "@shopify/app-bridge-react";
import type { ClientApplication } from "@shopify/app-bridge";
import { getSessionToken } from "@shopify/app-bridge/utilities";

export interface AuthenticatedFetchOptions extends RequestInit {
  endpoint: string;
  method?: string;
  body?: any;
}

export function useAuthenticatedFetch() {
  const app = useAppBridge();

  return async function authenticatedFetch({
    endpoint,
    method = "GET",
    body,
    ...fetchOptions
  }: AuthenticatedFetchOptions) {
    const token = await getSessionToken(app as unknown as ClientApplication<any>);

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
