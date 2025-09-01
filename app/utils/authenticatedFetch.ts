import { useSessionToken } from "~/hooks/useSessionToken";

export interface AuthenticatedFetchOptions extends RequestInit {
  endpoint: string;
  method?: string;
  body?: any;
}

export function useAuthenticatedFetch() {
  const { token, loading, error } = useSessionToken();

  const authenticatedFetch = async (options: AuthenticatedFetchOptions) => {
    if (!token) {
      throw new Error("No session token available");
    }



    const { endpoint, method = "GET", body, ...fetchOptions } = options;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
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

    try {
      const response = await fetch(endpoint, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Authenticated fetch error:", error);
      throw error;
    }
  };

  return {
    authenticatedFetch,
    token,
    loading,
    error,
  };
}

// Server-seitige Version für Loader/Action
export async function serverAuthenticatedFetch(
  endpoint: string, 
  sessionToken: string, 
  options: RequestInit = {}
) {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${sessionToken}`,
    ...options.headers,
  };

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(endpoint, config);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Server authenticated fetch error:", error);
    throw error;
  }
}
