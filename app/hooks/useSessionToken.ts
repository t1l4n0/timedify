import { useState, useEffect, useCallback } from 'react';

interface SessionTokenData {
  token: string | null;
  loading: boolean;
  error: string | null;
}

export function useSessionToken(): SessionTokenData & {
  getSessionToken: () => Promise<string | null>;
  clearSessionToken: () => void;
} {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSessionToken = useCallback(async (): Promise<string | null> => {
    try {
      setLoading(true);
      setError(null);

      // Prüfe ob App Bridge verfügbar ist
      if (typeof window !== 'undefined' && window.ShopifyApp) {
        try {
          // Echten Session Token von Shopify App Bridge anfordern
          const response = await fetch('/api/session-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'getSessionToken',
              shopifyApp: window.ShopifyApp
            })
          });

          if (response.ok) {
            const data = await response.json();
            if (data.sessionToken) {
              setToken(data.sessionToken);
              return data.sessionToken;
            }
          }
          
          // Fallback: Dummy-Token für Entwicklung
          const dummyToken = 'dummy-session-token-' + Date.now();
          setToken(dummyToken);
          return dummyToken;
        } catch (error) {
          // Fallback: Dummy-Token
          const dummyToken = 'dummy-session-token-' + Date.now();
          setToken(dummyToken);
          return dummyToken;
        }
      }

      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearSessionToken = useCallback(() => {
    setToken(null);
    setError(null);
  }, []);

  // Session Token beim Mount laden
  useEffect(() => {
    getSessionToken();
  }, [getSessionToken]);

  return {
    token,
    loading,
    error,
    getSessionToken,
    clearSessionToken,
  };
}
