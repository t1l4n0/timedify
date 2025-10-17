#!/usr/bin/env node

/**
 * Idempotentes Re-Provisioning-Script für Webhooks
 * Registriert alle Webhooks mit der aktuellen API-Version (2025-10) neu
 */

import { shopifyApp } from "@shopify/shopify-app-remix/server";
import { ApiVersion } from "@shopify/shopify-api";
import prisma from "../app/db.server.ts";

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.October25,
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
          userId: session.userId || null,
          firstName: session.firstName || null,
          lastName: session.lastName || null,
          email: session.email || null,
          accountOwner: session.accountOwner || false,
          locale: session.locale || null,
          collaborator: session.collaborator || null,
          emailVerified: session.emailVerified || null,
        },
        create: {
          id: session.id,
          shop: session.shop,
          state: session.state,
          isOnline: session.isOnline,
          scope: session.scope,
          expires: session.expires,
          accessToken: session.accessToken || "",
          userId: session.userId || null,
          firstName: session.firstName || null,
          lastName: session.lastName || null,
          email: session.email || null,
          accountOwner: session.accountOwner || false,
          locale: session.locale || null,
          collaborator: session.collaborator || null,
          emailVerified: session.emailVerified || null,
        },
      });
      return true;
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
        isExpired: () => {
          if (!session.expires) return false;
          return new Date(session.expires) < new Date();
        },
        isActive: () => true,
        isScopeChanged: () => false,
        toObject: () => session,
        equals: (other) => other?.id === session.id,
        toPropertyArray: () => Object.entries(session),
      };
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
      return sessions.map(session => ({
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
        equals: (other) => other?.id === session.id,
        toPropertyArray: () => Object.entries(session),
      }));
    },
  },
  distribution: "AppStore",
  future: {
    unstable_newEmbeddedAuthStrategy: true,
  },
});

async function reProvisionWebhooks() {
  console.log("🔄 Starting webhook re-provisioning for API version 2025-10...");
  
  try {
    // Alle aktiven Sessions laden
    const sessions = await prisma.session.findMany({
      where: {
        isOnline: false, // Offline sessions für Webhooks
        accessToken: { not: "" },
      },
    });

    if (sessions.length === 0) {
      console.log("ℹ️  No active sessions found. Please install the app first.");
      return;
    }

    console.log(`📊 Found ${sessions.length} active sessions`);

    for (const session of sessions) {
      try {
        console.log(`🔧 Re-provisioning webhooks for shop: ${session.shop}`);
        
        // Webhooks mit aktueller API-Version registrieren
        await shopify.registerWebhooks({
          session,
          webhooks: [
            {
              topic: "app/scopes_update",
              uri: "/webhooks/app/scopes_update",
            },
            {
              topic: "app_subscriptions/update",
              uri: "/webhooks/app/subscriptions_update",
            },
            {
              topic: "app/uninstalled",
              uri: "/webhooks/app/uninstalled",
            },
            {
              topic: "customers/data_request",
              uri: "/webhooks/customers/data_request",
            },
            {
              topic: "customers/redact",
              uri: "/webhooks/customers/redact",
            },
            {
              topic: "shop/redact",
              uri: "/webhooks/shop/redact",
            },
          ],
        });

        console.log(`✅ Webhooks re-provisioned for ${session.shop}`);
      } catch (error) {
        console.error(`❌ Failed to re-provision webhooks for ${session.shop}:`, error.message);
      }
    }

    console.log("🎉 Webhook re-provisioning completed!");
    console.log("💡 Check webhook deliveries in Partner Dashboard to verify API version 2025-10");
    console.log("🧹 Note: Old webhooks on /app/webhooks/* paths may need manual cleanup to avoid duplicates");
    
  } catch (error) {
    console.error("❌ Re-provisioning failed:", error);
    process.exit(1);
  }
}

// Script ausführen
reProvisionWebhooks().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
