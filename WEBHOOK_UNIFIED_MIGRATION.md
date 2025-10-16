# Migration zu zentraler Webhook-Route

## Übersicht

Dieses Dokument beschreibt die Migration von 6 separaten Webhook-Routen zu einer einzigen zentralen `webhooks.tsx`-Route.

## Vorteile der zentralen Route

### ✅ Pro
- **Weniger Code-Duplikation:** Fehlerbehandlung und Logging nur einmal definiert
- **Einfacheres Testing:** Ein Test-Setup für alle Webhooks
- **Bessere Wartbarkeit:** Änderungen an einem Ort statt an 6 Dateien
- **Einheitliches Logging:** `[Webhook:TOPIC]` Präfix für alle Logs
- **Übersichtlichere Struktur:** Klare Handler-Funktionen pro Topic

### ⚠️ Contra / Aufwand
- **URL-Änderung:** Webhooks müssen im Partner Dashboard neu registriert werden
- **TOML-Update:** `shopify.app.toml` muss angepasst werden
- **Größere Datei:** Alle Handler in einer Datei (aber gut strukturiert)
- **Initiales Refactoring:** Einmalige Migration erforderlich

## Migration durchführen

### Schritt 1: Neue zentrale Route erstellen

✅ **Bereits erledigt:** `app/routes/webhooks.tsx` wurde erstellt

### Schritt 2: `shopify.app.toml` aktualisieren

**Alt (6 separate Routen):**
```toml
[[webhooks.subscriptions]]
topics = [ "app/uninstalled" ]
uri = "/webhooks/app/uninstalled"

[[webhooks.subscriptions]]
topics = [ "app_subscriptions/update" ]
uri = "/webhooks/app/subscriptions_update"

[[webhooks.subscriptions]]
uri = "/webhooks/customers/data_request"
compliance_topics = [ "customers/data_request" ]

[[webhooks.subscriptions]]
uri = "/webhooks/customers/redact"
compliance_topics = [ "customers/redact" ]

[[webhooks.subscriptions]]
uri = "/webhooks/shop/redact"
compliance_topics = [ "shop/redact" ]
```

**Neu (zentrale Route):**
```toml
[[webhooks.subscriptions]]
topics = [ "app/uninstalled" ]
uri = "/webhooks"

[[webhooks.subscriptions]]
topics = [ "app_subscriptions/update" ]
uri = "/webhooks"

[[webhooks.subscriptions]]
topics = [ "app/scopes_update" ]
uri = "/webhooks"

[[webhooks.subscriptions]]
uri = "/webhooks"
compliance_topics = [ "customers/data_request" ]

[[webhooks.subscriptions]]
uri = "/webhooks"
compliance_topics = [ "customers/redact" ]

[[webhooks.subscriptions]]
uri = "/webhooks"
compliance_topics = [ "shop/redact" ]
```

### Schritt 3: Alte Routen löschen (optional)

Nach erfolgreichem Test können die alten Dateien gelöscht werden:

```bash
rm app/routes/webhooks.app.uninstalled.tsx
rm app/routes/webhooks.app.subscriptions_update.tsx
rm app/routes/webhooks.app.scopes_update.tsx
rm app/routes/webhooks.customers.data_request.tsx
rm app/routes/webhooks.customers.redact.tsx
rm app/routes/webhooks.shop.redact.tsx
```

**⚠️ Wichtig:** Erst löschen, nachdem die zentrale Route produktiv läuft!

### Schritt 4: Tests aktualisieren

**Alt:**
```typescript
// app/__tests__/webhooks.app.uninstalled.test.ts
import { action } from "../routes/webhooks.app.uninstalled";
```

**Neu:**
```typescript
// app/__tests__/webhooks.test.ts
import { action } from "../routes/webhooks";

describe("webhooks", () => {
  it("handles APP/UNINSTALLED", async () => {
    const request = new Request("https://example.com/webhooks", {
      method: "POST",
      body: JSON.stringify({ id: 123 }),
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Hmac-Sha256": "test-hmac",
        "X-Shopify-Topic": "app/uninstalled",
      },
    });

    const response = await action({ request } as any);
    expect(response.status).toBe(200);
  });
});
```

### Schritt 5: Deploy durchführen

```bash
# 1. Build testen
npm run build

# 2. Tests ausführen
npm test

# 3. Deploy zu Fly.io
fly deploy --app timedify

# 4. Webhooks im Partner Dashboard neu registrieren
shopify webhooks update
```

### Schritt 6: Webhooks neu registrieren

**Option A: Via Shopify CLI**
```bash
shopify app config use
# Wähle Production-Umgebung
shopify webhooks update
```

**Option B: Via Partner Dashboard**
1. Gehe zu https://partners.shopify.com/
2. App auswählen: **Timedify**
3. Sidebar: **Webhooks**
4. Für jedes Topic:
   - Altes Webhook löschen
   - Neues Webhook mit URL `/webhooks` erstellen

### Schritt 7: Testen

**Manuelle Tests im Partner Dashboard:**
```bash
# Für jedes Topic "Send test notification" ausführen
# Erwartete Response: 200 OK
```

**Logs prüfen:**
```bash
fly logs --app timedify | grep "\[Webhook"
```

**Erwartete Ausgabe:**
```
[Webhook] Received: APP/UNINSTALLED for shop-name.myshopify.com
[Webhook:APP/UNINSTALLED] Processing cleanup for shop-name.myshopify.com
[Webhook:APP/UNINSTALLED] Cleanup completed for shop-name.myshopify.com
```

## Rollback-Plan

Falls Probleme auftreten, Rollback in 3 Schritten:

### 1. Alte Routen wiederherstellen
```bash
git checkout HEAD~1 -- app/routes/webhooks.*.tsx
```

### 2. Alte TOML-Konfiguration wiederherstellen
```bash
git checkout HEAD~1 -- shopify.app.toml
```

### 3. Deploy
```bash
fly deploy --app timedify
shopify webhooks update
```

## Vergleich: Alt vs. Neu

### Code-Zeilen
- **Alt:** ~280 Zeilen (6 Dateien à ~47 Zeilen)
- **Neu:** ~270 Zeilen (1 Datei)
- **Ersparnis:** Minimal, aber deutlich bessere Wartbarkeit

### Struktur
- **Alt:** Jedes Topic hat eine eigene Datei mit duplizierter Fehlerbehandlung
- **Neu:** Zentrale Fehlerbehandlung, klare Handler-Funktionen

### Testing
- **Alt:** 6 separate Test-Dateien mit jeweils eigenem Mock-Setup
- **Neu:** 1 Test-Datei mit einheitlichem Setup für alle Topics

### Logging
- **Alt:** Inkonsistente Log-Formate (`APP/UNINSTALLED:`, `APP_SUBSCRIPTIONS_UPDATE:`)
- **Neu:** Einheitliches Format (`[Webhook:TOPIC]`)

## Best Practices für die zentrale Route

### 1. Handler-Funktionen klein halten
Jede Handler-Funktion sollte fokussiert sein:
```typescript
async function handleAppUninstalled(shop: string): Promise<void> {
  // Nur Cleanup-Logik, keine generischen Fehler-Handler
}
```

### 2. Generische Fehlerbehandlung im Action
```typescript
export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    // Webhook verarbeiten
  } catch (err) {
    // Zentrale Fehlerbehandlung
    console.error("[Webhook] Handler error:", err);
    return json({ ok: true }, { status: 200 });
  }
};
```

### 3. Strukturiertes Logging
```typescript
console.log(`[Webhook] Received: ${topic} for ${shop}`);
console.log(`[Webhook:${topic}] Processing for ${shop}`);
console.log(`[Webhook:${topic}] Completed for ${shop}`);
console.error(`[Webhook:${topic}] Error:`, err);
```

### 4. Payload-Validierung
```typescript
async function handleAppSubscriptionsUpdate(shop: string, payload: any): Promise<void> {
  if (!payload?.app_subscription) {
    console.warn(`[Webhook:APP_SUBSCRIPTIONS/UPDATE] Invalid payload for ${shop}`);
    return;
  }
  // Verarbeitung
}
```

### 5. Idempotenz sicherstellen
```typescript
// Cleanup-Operationen sind idempotent
await prisma.session.deleteMany({ where: { shop } }); // OK bei wiederholtem Aufruf

// Nicht-idempotente Operationen absichern
const existing = await prisma.subscription.findUnique({ where: { shop } });
if (!existing) {
  // Nur erstellen, wenn nicht vorhanden
}
```

## Monitoring

### Log-Queries für Fly.io

```bash
# Alle Webhooks
fly logs --app timedify | grep "\[Webhook"

# Nur Fehler
fly logs --app timedify | grep "\[Webhook.*error"

# Spezifisches Topic
fly logs --app timedify | grep "\[Webhook:APP/UNINSTALLED"

# Response-Zeiten (wenn implementiert)
fly logs --app timedify | grep "\[Webhook.*completed in"
```

### Metrics tracken

Optional: Response-Zeiten loggen
```typescript
const startTime = Date.now();
await handleWebhook(topic, shop, payload, session);
const duration = Date.now() - startTime;
console.log(`[Webhook:${topic}] Completed in ${duration}ms for ${shop}`);
```

## Weitere Optimierungen

### 1. Type-Safety für Payloads

```typescript
// webhooks.types.ts
export interface AppSubscriptionPayload {
  app_subscription: {
    id: number;
    name: string;
    status: "ACTIVE" | "CANCELLED" | "DECLINED";
    trial_ends_on: string | null;
    current_period_end: string;
  };
}

// webhooks.tsx
async function handleAppSubscriptionsUpdate(
  shop: string, 
  payload: AppSubscriptionPayload
): Promise<void> {
  // TypeScript-Fehler bei falschen Payload-Zugriffen
}
```

### 2. Webhook-Queue für Heavy Processing

Bei rechenintensiven Operationen:
```typescript
import { Queue } from "bullmq"; // oder ähnlich

const webhookQueue = new Queue("webhooks", {
  connection: { host: "redis", port: 6379 }
});

async function handleAppUninstalled(shop: string): Promise<void> {
  await webhookQueue.add("cleanup", { shop });
}
```

### 3. Retry-Logic für DB-Operationen

```typescript
import pRetry from "p-retry";

async function handleAppUninstalled(shop: string): Promise<void> {
  await pRetry(
    async () => {
      await prisma.$transaction([
        prisma.session.deleteMany({ where: { shop } }),
      ]);
    },
    { retries: 3 }
  );
}
```

## Zusammenfassung

Die zentrale Webhook-Route bietet:
- ✅ Bessere Wartbarkeit
- ✅ Einheitliches Logging
- ✅ Weniger Code-Duplikation
- ✅ Einfacheres Testing
- ✅ Production-Ready

**Empfehlung:** Migration durchführen, wenn die aktuellen Handler stabil laufen (nach 1-2 Wochen Produktiv-Betrieb).

---

**Status:** Template erstellt, bereit für Migration  
**Nächster Schritt:** `shopify.app.toml` aktualisieren und deployen

