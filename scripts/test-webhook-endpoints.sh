#!/bin/bash

# Test-Script für Webhook-Endpoints
# Testet alle Webhook-Handler mit/ohne HMAC

APP_URL="${1:-https://timedify.fly.dev}"
USE_HMAC="${2:-false}"
SHOP_DOMAIN="${3:-demo-shop.myshopify.com}"

echo "🧪 Testing webhook endpoints for: $APP_URL"
echo "🔐 HMAC mode: $USE_HMAC"
echo "🏪 Shop domain: $SHOP_DOMAIN"
echo ""

# Webhook-Endpoints mit Topics (portabel für macOS/bash v3.2)
ENDPOINTS_LIST=$(cat <<'EOF'
/webhooks/app/scopes_update|app/scopes_update
/webhooks/app/subscriptions/update|app_subscriptions/update
/webhooks/app/uninstalled|app/uninstalled
/webhooks/customers/data_request|customers/data_request
/webhooks/customers/redact|customers/redact
/webhooks/shop/redact|shop/redact
EOF
)

# Teste jeden Endpoint
echo "$ENDPOINTS_LIST" | while IFS='|' read -r endpoint topic; do
  echo "🔍 Testing: $endpoint (topic: $topic)"
  
  if [ "$USE_HMAC" = "true" ] && [ -n "$SHOPIFY_API_SECRET" ]; then
    # Mit HMAC-Signatur testen
    body='{"test":true}'
    sig=$(printf %s "$body" | openssl dgst -sha256 -hmac "$SHOPIFY_API_SECRET" -binary | base64)
    
    response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$APP_URL$endpoint" \
      -H "Content-Type: application/json" \
      -H "X-Shopify-Topic: $topic" \
      -H "X-Shopify-Shop-Domain: $SHOP_DOMAIN" \
      -H "X-Shopify-Hmac-Sha256: $sig" \
      -d "$body")
    
    if [ "$response" = "200" ]; then
      echo "✅ $endpoint -> $response (OK with HMAC)"
    else
      echo "❌ $endpoint -> $response (Expected: 200 with HMAC)"
    fi
  else
    # Ohne HMAC testen
    response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$APP_URL$endpoint" \
      -H "Content-Type: application/json" \
      -H "X-Shopify-Topic: $topic" \
      -H "X-Shopify-Shop-Domain: $SHOP_DOMAIN" \
      -d '{"test": true}')
    
    if [ "$response" = "200" ]; then
      echo "✅ $endpoint -> $response (OK without HMAC)"
    else
      echo "❌ $endpoint -> $response (Expected: 200 without HMAC)"
    fi
  fi
  echo ""
done

echo "🎉 Webhook endpoint testing completed!"
if [ "$USE_HMAC" = "true" ]; then
  echo "💡 All endpoints should return 200 for test requests with HMAC"
else
  echo "💡 All endpoints should return 200 for test requests without HMAC"
fi
echo ""
echo "Usage:"
echo "  Without HMAC: ./scripts/test-webhook-endpoints.sh [APP_URL] false [SHOP_DOMAIN]"
echo "  With HMAC:    SHOPIFY_API_SECRET=xxx ./scripts/test-webhook-endpoints.sh [APP_URL] true [SHOP_DOMAIN]"
