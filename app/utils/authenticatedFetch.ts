import { useAppBridge } from "@shopify/app-bridge-react";
import { useCallback } from "react";

export interface AuthenticatedFetchOptions extends Omit<RequestInit, "body"> {
  endpoint: string;
  method?: string;
  body?: unknown;
}

/**
 * Hook für authentifizierte Fetch-Requests mit Session-Token aus App Bridge v4.
 * Fordert bevorzugt `shopify.sessionToken.get()` an (Fallback `shopify.idToken()`)
 * und sendet das erhaltene Token automatisch als Bearer-Token im Authorization-Header.
 */
export function useAuthenticatedFetch() {
  const shopify = useAppBridge();

  return useCallback(
    async ({ endpoint, method = "GET", body, ...fetchOptions }: AuthenticatedFetchOptions) => {
      const isGetRequest = method.toUpperCase() === "GET";
      const headers = new Headers(fetchOptions.headers ?? {});

      let serializedBody: BodyInit | undefined;
      if (body !== undefined && !isGetRequest) {
        serializedBody = typeof body === "string" ? body : JSON.stringify(body);
        if (!headers.has("Content-Type")) {
          headers.set("Content-Type", "application/json");
        }
      }

      if (typeof window !== "undefined") {
        try {
          if (typeof shopify.ready !== "undefined") {
            await shopify.ready;
          }

          if (token) {
            headers.set("Authorization", `Bearer ${token}`);
          }
        } catch (error) {
          console.warn("Failed to retrieve session token", error);
        }
      }

      const response = await fetch(endpoint, {
        ...fetchOptions,
        method,
        headers,
        body: serializedBody,
      });

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
    [shopify]
  );
}
