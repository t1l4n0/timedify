import { useCallback } from "react";
import { waitForShopifyAppBridge } from "./shopifyAppBridge";

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
        let cleanupAbortListener: (() => void) | undefined;

        try {
          let tokenAbortSignal: AbortSignal | undefined;

          if (fetchOptions.signal) {
            if (fetchOptions.signal.aborted) {
              const alreadyAbortedController = new AbortController();
              alreadyAbortedController.abort();
              tokenAbortSignal = alreadyAbortedController.signal;
            } else {
              const abortController = new AbortController();
              const propagateAbort = () => abortController.abort();
              fetchOptions.signal.addEventListener("abort", propagateAbort, { once: true });
              cleanupAbortListener = () => fetchOptions.signal?.removeEventListener("abort", propagateAbort);
              tokenAbortSignal = abortController.signal;
            }
          }

          let token: string | undefined;

          const sessionTokenOptions = tokenAbortSignal ? { abort: tokenAbortSignal } : undefined;
          const shopify = await waitForShopifyAppBridge({ signal: tokenAbortSignal });
          const resolvedShopify = shopify ?? window.shopify;

          if (resolvedShopify?.sessionToken?.get) {
            token = await resolvedShopify.sessionToken.get(sessionTokenOptions);
          }

          if (!token && typeof resolvedShopify?.idToken === "function") {
            token = await resolvedShopify.idToken();
          }

          if (token) {
            headers.set("Authorization", `Bearer ${token}`);
          }
        } catch (error) {
          if (
            !(error instanceof DOMException && error.name === "AbortError") &&
            !(error instanceof Error && error.name === "AbortError")
          ) {
            console.warn("Failed to retrieve session token", error);
          }
        } finally {
          cleanupAbortListener?.();
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
    []
  );
}
