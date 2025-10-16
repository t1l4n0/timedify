# Webhook-Testing Guide

Vollständige Anleitung zum Testen aller 6 Webhook-Handler in verschiedenen Umgebungen.

## 🎯 Testmethoden im Überblick

| Methode | Umgebung | Vorteil | Tool |
|---------|----------|---------|------|
| Node.js Script | Lokal | Automatisiert, alle Topics | `npm run test:webhooks` |
| Shell Script (curl) | Lokal | Schnell, keine Dependencies | `./scripts/curl-test-webhooks.sh` |
| Unit Tests | Lokal | CI/CD-Integration | `npm test` |
| Fly.io Logs | Production | Echte Shopify-Webhooks | `fly logs` |
| Partner Dashboard | Production | Manuelle Validierung | Shopify Partners |

---

## 🚀 Methode 1: Automatisiertes Node.js-Skript (Empfohlen)

### Setup

```bash
# Dependencies installieren (falls nicht vorhanden)
npm install tsx --save-dev
```

### Skript hinzufügen in `package.json`

```json
{
  "scripts": {
    "test:webhooks": "tsx scripts/test-webhooks.ts"
  }
}
```

### Verwendung

```bash
# 1. Server starten (Terminal 1)
npm run dev

# 2. Tests ausführen (Terminal 2)
npm run test:webhooks
```

### Erwartete Ausgabe

```
╔════════════════════════════════════════════╗
║   Webhook Tests - Timedify App            ║
╚════════════════════════════════════════════╝

📍 Base URL: http://localhost:3000
🔑 Secret: test-secre...
✅ Server läuft

═══════════════════════════════════════════
  Tests mit HMAC (echte Webhooks)
═══════════════════════════════════════════

🧪 Testing: APP/UNINSTALLED
   URL: http://localhost:3000/webhooks/app/uninstalled
   ✅ Status: 200 OK
   📦 Response: {"ok":true}

🧪 Testing: APP_SUBSCRIPTIONS/UPDATE
   URL: http://localhost:3000/webhooks/app/subscriptions_update
   ✅ Status: 200 OK
   📦 Response: {"ok":true}

[... weitere Tests ...]

╔════════════════════════════════════════════╗
║   Tests abgeschlossen                      ║
╚════════════════════════════════════════════╝
```

### Logs im Dev-Server prüfen

Im Terminal 1 (wo `npm run dev` läuft) solltest Du sehen:

```
APP/UNINSTALLED: queuing cleanup for test-shop.myshopify.com
APP/UNINSTALLED: cleanup done for test-shop.myshopify.com
APP_SUBSCRIPTIONS/UPDATE: queuing update for test-shop.myshopify.com
APP_SUBSCRIPTIONS/UPDATE payload for test-shop.myshopify.com: {"app_subscription":{...}}
```

---

## 🐚 Methode 2: Shell Script mit curl

Keine Node.js-Dependencies, nur curl und OpenSSL.

### Verwendung

```bash
# Ausführbar machen (einmalig)
chmod +x scripts/curl-test-webhooks.sh

# Tests ausführen
./scripts/curl-test-webhooks.sh
```

### Oder einzelne Webhooks testen

```bash
# APP/UNINSTALLED testen
PAYLOAD='{"id":123,"shop_id":456,"shop_domain":"test.myshopify.com"}'
HMAC=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SHOPIFY_API_SECRET" -binary | base64)

curl -i -X POST http://localhost:3000/webhooks/app/uninstalled \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Topic: app/uninstalled" \
  -H "X-Shopify-Hmac-Sha256: $HMAC" \
  -H "X-Shopify-Shop-Domain: test.myshopify.com" \
  -d "$PAYLOAD"
```

---

## 🧪 Methode 3: Unit Tests mit Vitest

### Vorhandene Tests ausführen

```bash
# Alle Tests
npm test

# Nur Webhook-Tests
npm test -- webhooks

# Mit Watch-Mode
npm test -- --watch
```

### Neuen Test hinzufügen

Beispiel: `app/__tests__/webhooks.app.subscriptions_update.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { action } from "../routes/webhooks.app.subscriptions_update";

describe("webhooks.app.subscriptions_update", () => {
  it("returns 200 OK for valid webhook", async () => {
    const request = new Request("https://example.com", {
      method: "POST",
      body: JSON.stringify({
        app_subscription: {
          id: 123,
          name: "Pro Plan",
          status: "ACTIVE",
        },
      }),
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Hmac-Sha256": "test-hmac",
      },
    });

    const response = await action({ request } as any);
    expect(response.status).toBe(200);
  });
});
```

---

## 🌐 Methode 4: Production-Tests auf Fly.io

### Nach Deploy testen

```bash
# 1. Deploy
fly deploy --app timedify

# 2. Logs in Echtzeit beobachten
fly logs --app timedify

# 3. Webhook aus Partner Dashboard senden
# (siehe Methode 5)
```

### Log-Filter

```bash
# Nur Webhooks
fly logs --app timedify | grep -E "\[Webhook|APP/|CUSTOMERS/|SHOP/"

# Nur Fehler
fly logs --app timedify | grep -i error

# Spezifisches Topic
fly logs --app timedify | grep "APP/UNINSTALLED"
```

### cURL gegen Production

```bash
# Achtung: Produktions-HMAC erforderlich!
PAYLOAD='{"shop_domain":"real-shop.myshopify.com"}'
HMAC=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SHOPIFY_API_SECRET" -binary | base64)

curl -i -X POST https://timedify.fly.dev/webhooks/app/uninstalled \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Hmac-Sha256: $HMAC" \
  -H "X-Shopify-Topic: app/uninstalled" \
  -d "$PAYLOAD"
```

---

## 🏢 Methode 5: Shopify Partner Dashboard

### Test-Webhooks senden

1. Gehe zu: https://partners.shopify.com/
2. Wähle App: **Timedify**
3. Sidebar: **Webhooks**
4. Für jedes Topic:
   - Klicke auf das Topic (z.B. `app/uninstalled`)
   - Button: **"Send test notification"**
   - Prüfe Status: Sollte **"200 OK"** sein

### Delivery-Status prüfen

Im Partner Dashboard siehst Du:
- **Delivered:** Webhook wurde erfolgreich zugestellt
- **Failed:** Fehler (z.B. Timeout, 500-Error)
- **Retry Count:** Anzahl der Wiederholungsversuche

### Erwartete Ergebnisse

| Topic | Erwarteter Status | Hinweis |
|-------|-------------------|---------|
| `app/uninstalled` | 200 OK | Sessions werden gelöscht |
| `app_subscriptions/update` | 200 OK | Payload wird geloggt |
| `app/scopes_update` | 200 OK | Scopes werden aktualisiert |
| `customers/data_request` | 200 OK | TODO-Log erscheint |
| `customers/redact` | 200 OK | TODO-Log erscheint |
| `shop/redact` | 200 OK | Sessions werden gelöscht |

---

## 🔍 Debugging-Tipps

### Problem: "Server nicht erreichbar"

```bash
# Prüfe, ob Server läuft
curl http://localhost:3000/health

# Starte Server
npm run dev

# Prüfe Port
lsof -i :3000
```

### Problem: "HMAC-Verifikation schlägt fehl"

```bash
# Prüfe Secret
echo $SHOPIFY_API_SECRET

# Im Code: console.log den empfangenen HMAC
# In app/routes/webhooks.*.tsx:
const hmac = request.headers.get("X-Shopify-Hmac-Sha256");
console.log("Received HMAC:", hmac);
```

### Problem: "Webhook gibt 404 zurück"

```bash
# Prüfe Route-Pfad
curl -I http://localhost:3000/webhooks/app/uninstalled

# Sollte 405 (Method Not Allowed) für GET geben
# 200 für POST ist korrekt
```

### Problem: "DB-Fehler in Logs"

```bash
# Prisma-Client neu generieren
npx prisma generate

# Datenbank migrieren
npx prisma migrate dev
```

---

## 📊 Checkliste für Production-Deployment

Vor dem Deploy:

- [ ] Alle lokalen Tests bestehen (`npm run test:webhooks`)
- [ ] Unit-Tests grün (`npm test`)
- [ ] Build erfolgreich (`npm run build`)
- [ ] Keine Linter-Fehler (`npm run lint`)
- [ ] `.env` hat korrektes `SHOPIFY_API_SECRET`

Nach dem Deploy:

- [ ] `fly logs` zeigt keine Fehler
- [ ] Test-Webhook aus Partner Dashboard erfolgreich
- [ ] Alle 6 Topics geben 200 OK zurück
- [ ] Logs zeigen erwartete Ausgaben (z.B. "cleanup done")

---

## 🎓 Best Practices

### 1. Teste lokal vor jedem Deploy

```bash
npm run test:webhooks && npm test && npm run build
```

### 2. Verwende strukturierte Logs

```typescript
console.log(`[Webhook:${topic}] ${message} for ${shop}`);
```

### 3. Simuliere echte Payloads

Nutze echte Shopify-Payload-Beispiele aus der Dokumentation:
https://shopify.dev/docs/api/webhooks

### 4. Teste Fehlerszenarien

```typescript
// In test-webhooks.ts: Ungültiges Payload
{
  name: "INVALID_PAYLOAD",
  url: "/webhooks/app/uninstalled",
  topic: "app/uninstalled",
  payload: "invalid-json",
}
```

### 5. Monitoring nach Deploy

```bash
# Webhook-Fehlerrate
fly logs --app timedify | grep "webhook error" | wc -l

# Response-Zeiten (wenn geloggt)
fly logs --app timedify | grep "completed in"
```

---

## 🛠️ Troubleshooting-Kommandos

```bash
# Server-Status
curl -I http://localhost:3000/health

# Webhook-Route testen (ohne HMAC)
curl -X POST http://localhost:3000/webhooks/app/uninstalled \
  -H "Content-Type: application/json" \
  -d '{"shop":"test.myshopify.com"}'

# Logs filtern (Production)
fly logs --app timedify | grep "APP/UNINSTALLED"

# Prisma-Verbindung testen
npx prisma db pull

# Fly-Secrets prüfen
fly secrets list --app timedify
```

---

## 📚 Weitere Ressourcen

- **Shopify Webhook-Docs:** https://shopify.dev/docs/api/webhooks
- **Remix Testing:** https://remix.run/docs/en/main/guides/testing
- **Vitest Docs:** https://vitest.dev/guide/
- **Fly.io Logs:** https://fly.io/docs/flyctl/logs/

---

**Status:** Test-Setup vollständig eingerichtet  
**Nächster Schritt:** `npm run test:webhooks` ausführen

