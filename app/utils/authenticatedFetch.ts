import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticatedFetch } from "@shopify/app-bridge/utilities";
import { useCallback, useMemo } from "react";

export interface AuthenticatedFetchOptions extends RequestInit {
  endpoint: string;
  method?: string;
  body?: unknown;
}

/**
 * Hook für authentifizierte Fetch-Requests mit Session-Token aus App Bridge v4.
 * Nutzt die offizielle `authenticatedFetch` Utility, damit Tokens immer korrekt übertragen werden.
 */
export function useAuthenticatedFetch() {
  const shopify = useAppBridge();
  const fetchWithToken = useMemo(() => authenticatedFetch(shopify), [shopify]);

  return useCallback(
    async ({ endpoint, method = "GET", body, ...fetchOptions }: AuthenticatedFetchOptions) => {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...fetchOptions.headers,
      };

      const config: RequestInit = {
        ...fetchOptions,
        method,
        headers,
      };

      if (body !== undefined && method !== "GET") {
        config.body = typeof body === "string" ? body : JSON.stringify(body);
      }

      const response = await fetchWithToken(endpoint, config);

      if (response.status === 401) {
        throw new Error("Unauthorized");
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return response.json();
      }

      return response;
    },
    [fetchWithToken]
  );
}
