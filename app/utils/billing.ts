/**
 * Billing utilities for Timedify app
 * Handles subscription status synchronization with Shopify Metafields
 */

export interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  isTrialActive: boolean;
  subscriptions: Array<{
    id: string;
    name: string;
    status: string;
    currentPeriodEnd: string;
  }>;
}

/**
 * Retrieves current subscription status from Shopify Admin API
 */
export async function getSubscriptionStatus(admin: any): Promise<SubscriptionStatus> {
  try {
    console.log("🔍 Fetching subscription status from Shopify Admin API...");
    
    const response = await admin.graphql(`#graphql
      query getAppInstallation {
        currentAppInstallation {
          activeSubscriptions {
            id
            name
            status
            currentPeriodEnd
          }
        }
      }
    `);
    
    const { data } = await response.json();
    const subscriptions = data?.currentAppInstallation?.activeSubscriptions ?? [];
    
    console.log("📊 Raw subscription data:", JSON.stringify(data, null, 2));
    console.log("📋 Found subscriptions:", subscriptions.length);
    
    const now = new Date();
    const hasActiveSubscription = subscriptions.some((sub: any) => {
      const isActive = sub.status === "ACTIVE";
      const isNotExpired = new Date(sub.currentPeriodEnd) > now;
      const result = isActive && isNotExpired;
      
      console.log(`🔍 Subscription ${sub.id}:`, {
        name: sub.name,
        status: sub.status,
        currentPeriodEnd: sub.currentPeriodEnd,
        isActive,
        isNotExpired,
        result
      });
      
      return result;
    });
    
    // For now, we don't have trial logic, but keeping the interface consistent
    const isTrialActive = false;
    
    console.log("✅ Final subscription status:", {
      hasActiveSubscription,
      isTrialActive,
      subscriptionCount: subscriptions.length
    });
    
    return {
      hasActiveSubscription,
      isTrialActive,
      subscriptions
    };
  } catch (error) {
    console.error("❌ Error fetching subscription status:", error);
    return {
      hasActiveSubscription: false,
      isTrialActive: false,
      subscriptions: []
    };
  }
}

/**
 * Syncs subscription status to shop metafield
 * This allows Theme App Extensions to check subscription status via Liquid
 */
export async function syncSubscriptionStatusToMetafield(admin: any, shopGid: string): Promise<{ success: boolean; error?: string; metafieldId?: string }> {
  try {
    console.log("🔄 Starting metafield sync for shop:", shopGid);
    
    const subscriptionStatus = await getSubscriptionStatus(admin);
    
    // Consider both active subscriptions and trials as "active"
    const isActive = subscriptionStatus.hasActiveSubscription || subscriptionStatus.isTrialActive;
    
    console.log("📝 Metafield data to set:", {
      ownerId: shopGid,
      namespace: "timedify",
      key: "subscription_active",
      value: isActive.toString(),
      type: "boolean"
    });
    
    const response = await admin.graphql(`#graphql
      mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields { 
            id 
            namespace 
            key 
            value 
            type 
          }
          userErrors { 
            field 
            message 
            code 
          }
        }
      }
    `, {
      variables: {
        metafields: [{
          ownerId: shopGid,
          namespace: "timedify",
          key: "subscription_active",
          value: isActive.toString(),
          type: "boolean"
        }]
      }
    });
    
    const { data } = await response.json();
    
    console.log("📊 Metafield response:", JSON.stringify(data, null, 2));
    
    if (data?.metafieldsSet?.userErrors?.length > 0) {
      console.error("❌ Metafield errors:", data.metafieldsSet.userErrors);
      return { 
        success: false, 
        error: data.metafieldsSet.userErrors.map((e: any) => e.message).join(", ")
      };
    }
    
    const metafieldId = data?.metafieldsSet?.metafields?.[0]?.id;
    console.log(`✅ Subscription status synced to metafield: ${isActive} (ID: ${metafieldId})`);
    
    return { 
      success: true, 
      metafieldId 
    };
    
  } catch (error) {
    console.error("❌ Error syncing subscription status to metafield:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
