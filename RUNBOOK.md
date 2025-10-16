# 🚨 Timedify Runbook - Incident Response

## 🚨 **Roter Alarm - Sofortmaßnahmen**

### 1. **Schnell-Check (30 Sekunden)**
```bash
# Health-Check
./scripts/health-check.sh

# Smoke-Test
curl -fsS https://timedify.fly.dev/health || echo "❌ Smoke-Test fehlgeschlagen"

# Error-Check
timeout 15s fly logs --app timedify | grep -Ei "(error|webhook error|429|5..)"
```

### 2. **Detaillierte Diagnose (2 Minuten)**
```bash
# App-Status
fly status --app timedify

# Letzte Logs
fly logs --app timedify | tail -50

# Dead Letters prüfen
npx tsx scripts/replay-deadletters.ts --list

# Webhook-Aktivität
fly logs --app timedify | grep -E "(APP/|CUSTOMERS/|SHOP/)" | tail -20
```

### 3. **Sofortmaßnahmen**
```bash
# Bei Memory-Problemen
fly scale memory 512 --app timedify

# Bei vielen Dead Letters
npx tsx scripts/replay-deadletters.ts --all

# Bei DB-Problemen
fly ssh console --app timedify
npx prisma migrate status
```

---

## 🔍 **Häufige Probleme & Lösungen**

### **Problem: Webhook gibt 500 zurück**
```bash
# 1. Dead Letters prüfen
npx tsx scripts/replay-deadletters.ts --list

# 2. Spezifischen Fehler replay
npx tsx scripts/replay-deadletters.ts [deadLetterId]

# 3. Logs analysieren
fly logs --app timedify | grep -i "webhook error"
```

### **Problem: Viele 401-Fehler**
```bash
# Das ist normal bei Test-Requests ohne echte Sessions
# Prüfe nur echte Webhook-Fehler:
fly logs --app timedify | grep -E "(APP/|CUSTOMERS/|SHOP/)" | grep -v "401"
```

### **Problem: Langsame Response-Zeiten**
```bash
# Performance-Check
./scripts/health-check.sh

# Memory erhöhen
fly scale memory 512 --app timedify

# DB-Performance prüfen
fly ssh console --app timedify
npx prisma studio
```

### **Problem: App startet nicht**
```bash
# Secrets prüfen
fly secrets list --app timedify

# Logs prüfen
fly logs --app timedify

# Rollback
fly releases --app timedify
fly deploy --app timedify --image [previous-image]
```

---

## 📊 **Monitoring & Alerting**

### **Tägliche Checks**
```bash
# Error-Count
fly logs --app timedify | grep -Ei "error" | wc -l

# Dead Letters
npx tsx scripts/replay-deadletters.ts --list

# Health-Check
./scripts/health-check.sh
```

### **Wöchentliche Checks**
```bash
# Retention-Cleanup
./scripts/retention-cleanup.sh 7

# Performance-Review
./scripts/health-check.sh

# Dead Letter Cleanup
npx tsx scripts/replay-deadletters.ts --cleanup
```

### **Nach jedem Deploy**
```bash
# Synthetic Tests
./scripts/synthetic-webhook-test.sh

# Health-Check
./scripts/health-check.sh

# Live-Monitoring (30s)
./scripts/logs-watch.sh 30
```

---

## 🛠️ **Wartung & Cleanup**

### **Retention-Management**
```bash
# WebhookEvents: 7 Tage
./scripts/retention-cleanup.sh 7

# DeadLetters: Nach erfolgreichem Replay löschen
npx tsx scripts/replay-deadletters.ts --cleanup
```

### **Performance-Optimierung**
```bash
# Memory-Scaling
fly scale memory 512 --app timedify

# DB-Performance
fly ssh console --app timedify
npx prisma studio
```

### **Backup & Recovery**
```bash
# DB-Backup (Provider-Managed)
# Prüfe Provider-Dashboard für Backup-Status

# Migration-Status
fly ssh console --app timedify
npx prisma migrate status
```

---

## 📞 **Eskalation**

### **Level 1: Automatische Checks**
- Health-Check alle 5 Minuten
- Error-Monitoring kontinuierlich
- Dead-Letter-Check täglich

### **Level 2: Manuelle Intervention**
- Webhook-Fehler > 5%
- Response-Zeit > 3s
- Dead Letters > 10

### **Level 3: Kritische Probleme**
- App nicht erreichbar
- DB-Verbindung fehlgeschlagen
- Alle Webhooks fehlgeschlagen

---

## 🎯 **SLOs (Service Level Objectives)**

### **Performance**
- **p95 Webhook-Response:** < 100ms
- **p99 Webhook-Response:** < 500ms
- **Health-Check-Response:** < 1s

### **Reliability**
- **Webhook-Delivery-Rate:** > 99.5%
- **Error-Rate:** < 0.5%
- **Uptime:** > 99.9%

### **Recovery**
- **MTTR (Mean Time To Recovery):** < 5 Minuten
- **Dead-Letter-Processing:** < 1 Stunde
- **Incident-Response:** < 15 Minuten

---

## 🔧 **Nützliche Befehle**

### **Debugging**
```bash
# Live-Logs mit Farben
./scripts/logs-watch.sh 30

# Spezifische Logs
fly logs --app timedify | grep -E "(APP/|CUSTOMERS/|SHOP/)"

# Error-Logs
fly logs --app timedify | grep -Ei "error"
```

### **Management**
```bash
# App-Status
fly status --app timedify

# Secrets
fly secrets list --app timedify

# Releases
fly releases --app timedify
```

### **Testing**
```bash
# Alle Webhooks testen
./scripts/synthetic-webhook-test.sh

# Production-Tests
./scripts/test-webhooks-production.sh

# Health-Check
./scripts/health-check.sh
```

---

## 📚 **Ressourcen**

### **Dokumentation**
- `PRODUCTION_HARDENING_SUMMARY.md` – Hardening-Details
- `GO_LIVE_SUMMARY.md` – Go-Live-Status
- `WEBHOOK_TESTING_GUIDE.md` – Test-Anleitung

### **Skripte**
- `scripts/health-check.sh` – Health-Check
- `scripts/logs-watch.sh` – Live-Monitoring
- `scripts/alerting-check.sh` – CI-Alerting
- `scripts/retention-cleanup.sh` – Cleanup
- `scripts/synthetic-webhook-test.sh` – CI-Tests

### **Tools**
- `scripts/replay-deadletters.ts` – Dead-Letter-Management
- `app/utils/webhookHelpers.ts` – Helper-Funktionen

---

## 🚀 **Quick Reference**

### **Bei Problemen:**
1. `./scripts/health-check.sh`
2. `timeout 15s fly logs --app timedify | grep -Ei "error"`
3. `npx tsx scripts/replay-deadletters.ts --list`
4. Bei Bedarf: `fly scale memory 512 --app timedify`

### **Nach Deploy:**
1. `./scripts/synthetic-webhook-test.sh`
2. `./scripts/health-check.sh`
3. `./scripts/logs-watch.sh 30`

### **Täglich:**
1. `fly logs --app timedify | grep -Ei "error" | wc -l`
2. `npx tsx scripts/replay-deadletters.ts --list`

### **Wöchentlich:**
1. `./scripts/retention-cleanup.sh 7`
2. `npx tsx scripts/replay-deadletters.ts --cleanup`

---

**Letzte Aktualisierung:** 2025-10-16 11:00 UTC  
**Version:** 1.0 (Production Runbook)

🚨 **RUNBOOK BEREIT FÜR INCIDENT RESPONSE!** 🚨
