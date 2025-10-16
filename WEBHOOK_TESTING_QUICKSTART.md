# Webhook Testing – Quick Start

## 🚀 Sofort loslegen (3 Schritte)

### Schritt 1: Dev-Server starten

```bash
# Terminal 1
npm run dev
```

Warte bis Du siehst:
```
➜  Local:   http://localhost:3000/
```

---

### Schritt 2: Webhooks testen

**Option A: Node.js-Skript (empfohlen)**

```bash
# Terminal 2
npm run test:webhooks
```

**Option B: Shell-Skript (falls tsx Probleme macht)**

```bash
# Terminal 2
./scripts/curl-test-webhooks.sh
```

---

### Schritt 3: Logs prüfen

In **Terminal 1** (Dev-Server) solltest Du sehen:

```
APP/UNINSTALLED: queuing cleanup for test-shop.myshopify.com
APP/UNINSTALLED: cleanup done for test-shop.myshopify.com
APP_SUBSCRIPTIONS/UPDATE: queuing update for test-shop.myshopify.com
APP_SUBSCRIPTIONS/UPDATE payload for test-shop.myshopify.com: {...}
APP/SCOPES_UPDATE: updating scopes for test-shop.myshopify.com
CUSTOMERS/DATA_REQUEST: processing for test-shop.myshopify.com
CUSTOMERS/REDACT: processing for test-shop.myshopify.com
SHOP/REDACT: queuing cleanup for test-shop.myshopify.com
```

In **Terminal 2** (Test-Skript) solltest Du sehen:

```
╔════════════════════════════════════════════╗
║   Webhook Tests - Timedify App            ║
╚════════════════════════════════════════════╝

🧪 Testing: APP/UNINSTALLED
   ✅ Status: 200 OK
   📦 Response: {"ok":true}

🧪 Testing: APP_SUBSCRIPTIONS/UPDATE
   ✅ Status: 200 OK
   📦 Response: {"ok":true}

... (4 weitere Tests)

╔════════════════════════════════════════════╗
║   Tests abgeschlossen                      ║
╚════════════════════════════════════════════╝
```

---

## ✅ Erfolg!

Wenn alle Tests **✅ 200 OK** zeigen, sind die Webhooks bereit für Production:

```bash
fly deploy --app timedify
```

---

## ❌ Troubleshooting

### "Server nicht erreichbar"

```bash
# Prüfe, ob Server läuft
curl http://localhost:3000/health

# Falls nicht, starte neu
npm run dev
```

### "tsx not found"

```bash
# tsx installieren
npm install tsx --save-dev

# Oder Shell-Skript verwenden
./scripts/curl-test-webhooks.sh
```

### "Permission denied"

```bash
# Shell-Skript ausführbar machen
chmod +x scripts/curl-test-webhooks.sh
```

---

## 📚 Weitere Infos

Vollständige Dokumentation: **WEBHOOK_TESTING_GUIDE.md**

- Alle Testmethoden (lokal, Fly.io, Shopify Dashboard)
- Unit-Tests mit Vitest
- Production-Monitoring
- Debugging-Tipps

---

**Status:** Test-Setup bereit  
**Nächster Schritt:** `npm run test:webhooks` ausführen

