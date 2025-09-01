import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-remix/server";

// Einfache Memory-basierte Session-Speicherung
class MemorySessionStorage {
  private sessions = new Map();

  async storeSession(session: any) {
    this.sessions.set(session.id, session);
    return Promise.resolve(true);
  }

  async loadSession(id: string) {
    return Promise.resolve(this.sessions.get(id) || undefined);
  }

  async deleteSession(id: string) {
    this.sessions.delete(id);
    return Promise.resolve(true);
  }

  async deleteSessions(ids: string[]) {
    ids.forEach(id => this.sessions.delete(id));
    return Promise.resolve(true);
  }

  async findSessionsByShop(shop: string) {
    const sessions = Array.from(this.sessions.values())
      .filter((session: any) => session.shop === shop);
    return Promise.resolve(sessions);
  }
}

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.July25,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new MemorySessionStorage(),
  distribution: AppDistribution.AppStore,
  future: {
    unstable_newEmbeddedAuthStrategy: true,
    removeRest: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN!] }
    : {}),
});

export default shopify;
export const apiVersion = ApiVersion.July25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
