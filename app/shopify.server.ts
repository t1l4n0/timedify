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
  apiVersion: ApiVersion.July25,
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
          accessToken: session.accessToken,
          userId: session.userId,
          firstName: session.firstName,
          lastName: session.lastName,
          email: session.email,
          accountOwner: session.accountOwner,
          locale: session.locale,
          collaborator: session.collaborator,
          emailVerified: session.emailVerified,
        },
        create: {
          id: session.id,
          shop: session.shop,
          state: session.state,
          isOnline: session.isOnline,
          scope: session.scope,
          expires: session.expires,
          accessToken: session.accessToken,
          userId: session.userId,
          firstName: session.firstName,
          lastName: session.lastName,
          email: session.email,
          accountOwner: session.accountOwner,
          locale: session.locale,
          collaborator: session.collaborator,
          emailVerified: session.emailVerified,
        },
      });
    },
    async loadSession(id) {
      const session = await prisma.session.findUnique({
        where: { id },
      });
      if (!session) return undefined;
      return {
        id: session.id,
        shop: session.shop,
        state: session.state,
        isOnline: session.isOnline,
        scope: session.scope,
        expires: session.expires,
        accessToken: session.accessToken,
        userId: session.userId,
        firstName: session.firstName,
        lastName: session.lastName,
        email: session.email,
        accountOwner: session.accountOwner,
        locale: session.locale,
        collaborator: session.collaborator,
        emailVerified: session.emailVerified,
        isExpired: () => {
          if (!session.expires) return false;
          return new Date(session.expires) < new Date();
        },
      };
    },
    async deleteSession(id) {
      await prisma.session.delete({
        where: { id },
      });
    },
    async deleteSessions(ids) {
      await prisma.session.deleteMany({
        where: { id: { in: ids } },
      });
    },
    async findSessionsByShop(shop) {
      const sessions = await prisma.session.findMany({
        where: { shop },
      });
      return sessions.map(session => ({
        id: session.id,
        shop: session.shop,
        state: session.state,
        isOnline: session.isOnline,
        scope: session.scope,
        expires: session.expires,
        accessToken: session.accessToken,
        userId: session.userId,
        firstName: session.firstName,
        lastName: session.lastName,
        email: session.email,
        accountOwner: session.accountOwner,
        locale: session.locale,
        collaborator: session.collaborator,
        emailVerified: session.emailVerified,
        isExpired: () => {
          if (!session.expires) return false;
          return new Date(session.expires) < new Date();
        },
      }));
    },
  },
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
