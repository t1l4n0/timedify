import { useEffect, useState } from "react";

export const APP_BRIDGE_SCRIPT_ID = "shopify-app-bridge" as const;
export const APP_BRIDGE_CDN_SOURCE = "https://cdn.shopify.com/shopifycloud/app-bridge.js" as const;

export interface WaitForShopifyAppBridgeOptions {
  timeout?: number;
  signal?: AbortSignal;
}

function findAppBridgeScript() {
  return (
    (typeof document !== "undefined"
      ? (document.getElementById(APP_BRIDGE_SCRIPT_ID) as HTMLScriptElement | null)
      : null) ??
    (typeof document !== "undefined"
      ? document.querySelector<HTMLScriptElement>(`script[src="${APP_BRIDGE_CDN_SOURCE}"]`)
      : null)
  );
}

export function waitForShopifyAppBridge({
  timeout = 2000,
  signal,
}: WaitForShopifyAppBridgeOptions = {}): Promise<Window["shopify"] | undefined> {
  if (typeof window === "undefined") {
    return Promise.resolve(undefined);
  }

  if (window.shopify) {
    return Promise.resolve(window.shopify);
  }

  return new Promise(resolve => {
    let settled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (intervalId) {
        clearInterval(intervalId);
      }
      const script = findAppBridgeScript();
      script?.removeEventListener("load", handleReady);
      signal?.removeEventListener("abort", handleAbort);
    };

    const handleReady = () => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      resolve(window.shopify);
    };

    const handleAbort = () => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      resolve(window.shopify);
    };

    const script = findAppBridgeScript();
    script?.addEventListener("load", handleReady, { once: true });

    intervalId = setInterval(() => {
      if (window.shopify) {
        handleReady();
      }
    }, 30);

    if (timeout > 0) {
      timeoutId = setTimeout(handleReady, timeout);
    }

    signal?.addEventListener("abort", handleAbort, { once: true });

    queueMicrotask(() => {
      if (window.shopify) {
        handleReady();
      }
    });
  });
}

export function useShopifyAppBridge() {
  const [shopify, setShopify] = useState<Window["shopify"] | undefined>(() =>
    typeof window === "undefined" ? undefined : window.shopify
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    waitForShopifyAppBridge({ signal: controller.signal }).then(instance => {
      if (isMounted && instance) {
        setShopify(instance);
      }
    });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  return shopify;
}
