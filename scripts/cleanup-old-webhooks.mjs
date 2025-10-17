#!/usr/bin/env node

/**
 * Cleanup-Script für alte Webhook-Subscriptions
 * Entfernt doppelte Webhooks auf /webhooks/* Pfaden (ohne /app)
 * Stellt sicher, dass nur /app/webhooks/* Pfade aktiv sind
 */

import { shopifyApp } from "@shopify/shopify-app-remix/server";
import { ApiVersion } from "@shopify/shopify-api";
import prisma from "../app/db.server.js";

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
        equals: (other: any) => other?.id === session.id,
        toPropertyArray: () => Object.entries(session),
      } as any;
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
        equals: (other: any) => other?.id === session.id,
        toPropertyArray: () => Object.entries(session),
      } as any));
    },
  },
  distribution: "AppStore",
  future: {
    unstable_newEmbeddedAuthStrategy: true,
  },
});

async function cleanupOldWebhooks() {
  const APP_URL = new URL(process.env.SHOPIFY_APP_URL || "");
  const DRY_RUN = (process.env.DRY_RUN || "false").toLowerCase() === "true";
  const sameOrigin = (url) => {
    try { return new URL(url).origin === APP_URL.origin; } catch { return false; }
  };
  
  console.log("🧹 Starting cleanup of old webhook subscriptions...");
  if (DRY_RUN) {
    console.log("🔒 DRY-RUN mode: No webhooks will be deleted");
  }
  
  try {
    // Alle aktiven Sessions laden
    const sessions = await prisma.session.findMany({
      where: {
        isOnline: false, // Offline sessions für Webhooks
        accessToken: { not: "" },
      },
    });

    if (sessions.length === 0) {
      console.log("ℹ️  No active sessions found.");
      return;
    }

    console.log(`📊 Found ${sessions.length} active sessions`);

    // Topics die auf /webhooks/* (ohne /app) registriert sein könnten
    const oldWebhookTopics = [
      "app/scopes_update",
      "app_subscriptions/update", 
      "app/uninstalled",
      "customers/data_request",
      "customers/redact",
      "shop/redact",
    ];

    for (const session of sessions) {
      try {
        console.log(`🔍 Checking webhooks for shop: ${session.shop}`);
        
        // GraphQL Query um alle Webhook-Subscriptions zu holen (mit Pagination)
        const client = new shopify.api.clients.Graphql({ session });
        let cursor = null, total = 0;
        do {
          const result = await client.request(`#graphql
            query Subscriptions($after: String) {
              webhookSubscriptions(first: 100, after: $after) {
                pageInfo { hasNextPage endCursor }
                edges {
                  node {
                    id topic callbackUrl
                    apiVersion { handle }
                  }
                }
              }
            }`,
            { variables: { after: cursor } }
          );
          const page = result.body?.data?.webhookSubscriptions;
          const edges = page?.edges ?? [];
          total += edges.length;

          for (const { node: webhook } of edges) {
            const isOldPath = webhook.callbackUrl.includes('/webhooks/') && !webhook.callbackUrl.includes('/app/webhooks/');
            const isOldTopic = oldWebhookTopics.includes(webhook.topic);
            const isOldApiVersion = webhook.apiVersion?.handle !== '2025-10';
            const isSameApp = sameOrigin(webhook.callbackUrl);

            if (isSameApp && ((isOldPath && isOldTopic) || isOldApiVersion)) {
            const action = DRY_RUN ? "DRY-RUN delete" : "Deleting";
            console.log(`🗑️  ${action}: ${webhook.topic} -> ${webhook.callbackUrl} (${webhook.apiVersion?.handle})`);
            
            try {
              if (DRY_RUN) continue;
              await client.request(`#graphql
                mutation webhookSubscriptionDelete($id: ID!) {
                  webhookSubscriptionDelete(id: $id) {
                    deletedWebhookSubscriptionId
                    userErrors {
                      field
                      message
                    }
                  }
                }
              `, { variables: { id: webhook.id } });
              
              console.log(`✅ Deleted webhook: ${webhook.topic}`);
            } catch (deleteError) {
              console.error(`❌ Failed to delete webhook ${webhook.topic}:`, deleteError.message);
            }
          }
          cursor = page?.pageInfo?.hasNextPage ? page.pageInfo.endCursor : null;
        } while (cursor);
        console.log(`📋 Scanned ${total} webhook subscriptions`);

        console.log(`✅ Cleanup completed for ${session.shop}`);
      } catch (error) {
        console.error(`❌ Failed to cleanup webhooks for ${session.shop}:`, error.message);
      }
    }

    console.log("🎉 Webhook cleanup completed!");
    if (DRY_RUN) {
      console.log("💡 DRY-RUN: No webhooks were actually deleted");
    } else {
      console.log("💡 Only /app/webhooks/* paths with API version 2025-10 should remain");
    }
    
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
    process.exit(1);
  }
}

// Script ausführen
cleanupOldWebhooks().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
