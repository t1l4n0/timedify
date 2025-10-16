import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-remix/server";
// Session storage wird direkt über Prisma implementiert
import prisma from "./db.server";

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.October23,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: {
    async storeSession(session) {
      await prisma.session.upsert({
        where: { id: session.id },
        update: {
          shop: session.shop,
          state: session.state,
          isOnline: session.isOnline,
          scope: session.scope,
          expires: session.expires,
          accessToken: session.accessToken || "",
          userId: (session as any).userId || null,
          firstName: (session as any).firstName || null,
          lastName: (session as any).lastName || null,
          email: (session as any).email || null,
          accountOwner: (session as any).accountOwner || false,
          locale: (session as any).locale || null,
          collaborator: (session as any).collaborator || null,
          emailVerified: (session as any).emailVerified || null,
        },
        create: {
          id: session.id,
          shop: session.shop,
          state: session.state,
          isOnline: session.isOnline,
          scope: session.scope,
          expires: session.expires,
          accessToken: session.accessToken || "",
          userId: (session as any).userId || null,
          firstName: (session as any).firstName || null,
          lastName: (session as any).lastName || null,
          email: (session as any).email || null,
          accountOwner: (session as any).accountOwner || false,
          locale: (session as any).locale || null,
          collaborator: (session as any).collaborator || null,
          emailVerified: (session as any).emailVerified || null,
        },
      });
      return true;
    },
    async loadSession(id) {
      const session = await prisma.session.findUnique({
        where: { id },
      });
      if (!session) return undefined;
      
      // Erstelle ein Session-Objekt mit allen erforderlichen Methoden
      const sessionObj = {
        id: session.id,
        shop: session.shop,
        state: session.state,
        isOnline: session.isOnline,
        scope: session.scope,
        expires: session.expires,
        accessToken: session.accessToken,
        isExpired: () => {
          if (!session.expires) return false;
          return new Date(session.expires) < new Date();
        },
        isActive: () => true,
        isScopeChanged: () => false,
        toObject: () => session,
        equals: (other: any) => other?.id === session.id,
        toPropertyArray: () => Object.entries(session),
      } as any;
      
      return sessionObj;
    },
    async deleteSession(id) {
      await prisma.session.delete({
        where: { id },
      });
      return true;
    },
    async deleteSessions(ids) {
      await prisma.session.deleteMany({
        where: { id: { in: ids } },
      });
      return true;
    },
    async findSessionsByShop(shop) {
      const sessions = await prisma.session.findMany({
        where: { shop },
      });
      return sessions.map(session => {
        const sessionObj = {
          id: session.id,
          shop: session.shop,
          state: session.state,
          isOnline: session.isOnline,
          scope: session.scope,
          expires: session.expires,
          accessToken: session.accessToken || "",
          isExpired: () => {
            if (!session.expires) return false;
            return new Date(session.expires) < new Date();
          },
          isActive: () => true,
          isScopeChanged: () => false,
          toObject: () => session,
          equals: (other: any) => other?.id === session.id,
          toPropertyArray: () => Object.entries(session),
        } as any;
        
        return sessionObj;
      });
    },
  },
  distribution: AppDistribution.AppStore,
  future: {
    unstable_newEmbeddedAuthStrategy: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN!] }
    : {}),
});

export default shopify;
export const apiVersion = ApiVersion.October23;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
