declare module "*.css";

// Shopify App Bridge v4 global types
declare global {
  interface Window {
    shopify?: {
      reviews?: {
        request(): Promise<{
          success: boolean;
          code?: string;
          message?: string;
        }>;
      };
    };
  }
}
