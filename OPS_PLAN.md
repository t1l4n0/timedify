# Timedify Ops-Plan (7/14/30-Tage)

## 🎯 **Einzeiliges Ops-Dashboard**

```bash
npm run ops-dashboard
```

**Zeigt auf einen Blick:**
- ✅ App-Status (Machines, Health)
- ✅ Health-Check (200 OK)
- ✅ Secrets (Anzahl)
- ✅ Error-Logs (letzte 5 Min)
- ✅ Dead-Letters (unverarbeitete)
- ✅ Webhook-Aktivität (letzte 10 Min)
- ✅ Performance (Response Time)
- ✅ Zusammenfassung mit Status-Bewertung

---

## 📅 **Tägliche Ops (Copy & Paste)**

### **1. Alerting-Check (CI/Cron)**
```bash
npm run alerting-check
```

### **2. Error-Log-Scan**
```bash
timeout 15s fly logs --app timedify | grep -Ei "(error|webhook error)" || true
```

### **3. Quick-Status (30 Sekunden)**
```bash
npm run ops-dashboard
```

---

## 📅 **Wöchentliche Ops (Copy & Paste)**

### **1. Retention-Cleanup (14 Tage)**
```bash
./scripts/retention-cleanup.sh 14
```

### **2. Dead-Letters bereinigen**
```bash
npx tsx scripts/replay-deadletters.ts --cleanup
```

### **3. Vollständiger Health-Check**
```bash
./scripts/health-check.sh
```

### **4. Wöchentlicher Status-Report**
```bash
npm run ops-dashboard
echo "=== Wöchentlicher Report ==="
fly releases --app timedify | head -5
```

---

## 📅 **Monatliche Ops (Copy & Paste)**

### **1. Release-Tagging**
```bash
# Version taggen
git tag -a v1.0.0 -m "Release v1.0.0"
git push --tags

# Changelog aktualisieren
echo "## v1.0.0 ($(date +%Y-%m-%d))" >> CHANGELOG.md
echo "- Feature: XYZ" >> CHANGELOG.md
echo "- Fix: ABC" >> CHANGELOG.md
```

### **2. Release-History prüfen**
```bash
fly releases --app timedify
```

### **3. Rollback-Test (optional)**
```bash
# Vorherige Version deployen (Test)
fly deploy --app timedify --image <previous-image-id>

# Zurück zur aktuellen Version
fly deploy --app timedify
```

---

## 🔍 **Sicherheits-/Konfig-Audit (1 Minute)**

```bash
# Secrets prüfen
fly secrets list --app timedify | wc -l      # Anzahl stimmt mit Doku?

# App-Status prüfen
fly status --app timedify                     # 1/1 machines healthy

# Health-Endpoint prüfen
curl -fsS https://timedify.fly.dev/health    # 200
```

---

## 🚨 **Disaster-Recovery-Mini-Drill (vierteljährlich, 5 Min)**

### **1. Datenbank-Backup verifizieren**
- Provider-Dashboard öffnen
- Letztes Backup prüfen
- Backup-Integrität testen

### **2. Cold-Start-Probe**
```bash
# App neu starten
fly apps restart timedify

# Health-Check
curl -fsS https://timedify.fly.dev/health
```

### **3. Webhook-Smoke-Test**
```bash
npm run test:synthetic || echo "Synthetic non-blocking"
```

### **4. Vollständiger System-Check**
```bash
npm run ops-dashboard
```

---

## 📊 **Beobachtung (KPIs)**

### **Performance-Ziele:**
- ✅ **p95 Webhook-Response:** < 100 ms
- ✅ **Error-Rate:** < 0,5%
- ✅ **Uptime:** > 99,9%
- ✅ **Dead-Letters:** = 0

### **Monitoring:**
```bash
# Response Time prüfen
curl -s -o /dev/null -w "%{time_total}" https://timedify.fly.dev/health

# Error-Rate prüfen
timeout 60s fly logs --app timedify | grep -c "error" || echo "0"

# Dead-Letters prüfen
npx tsx scripts/replay-deadletters.ts --list | grep -c "unverarbeitete" || echo "0"
```

---

## 🆘 **Wenn doch etwas rot wird**

### **1. Quick-Diagnose**
```bash
./scripts/health-check.sh || true
timeout 15s fly logs --app timedify | grep -Ei "(error|webhook error|5..|429)" || true
npx tsx scripts/replay-deadletters.ts --list
```

### **2. Erweiterte Diagnose**
```bash
# Vollständiger Status
npm run ops-dashboard

# App neu starten
fly apps restart timedify

# Logs live verfolgen
fly logs --app timedify
```

### **3. Notfall-Rollback**
```bash
# Vorherige Version deployen
fly releases --app timedify
fly deploy --app timedify --image <previous-image-id>
```

---

## 🛠️ **Hilfreiche Commands**

### **Monitoring:**
```bash
npm run ops-dashboard          # Alles auf einen Blick
npm run health-check          # Vollständiger Health-Check
npm run logs-watch            # Live-Logs mit Farben
```

### **Maintenance:**
```bash
npm run retention-cleanup     # Alte Daten bereinigen
npm run alerting-check        # Error-Scan
```

### **Webhooks:**
```bash
npm run test:webhooks         # Lokale Webhook-Tests
npm run test:synthetic        # Produktions-Webhook-Tests
npx tsx scripts/replay-deadletters.ts --list  # Dead-Letters verwalten
```

### **Deployment:**
```bash
fly deploy --app timedify     # Standard-Deploy
fly status --app timedify     # App-Status
fly logs --app timedify       # Logs anzeigen
```

---

## 📋 **Checkliste für neue Releases**

- [ ] **Pre-Deploy:**
  - [ ] Tests laufen (`npm test`)
  - [ ] Build erfolgreich (`npm run build`)
  - [ ] Changelog aktualisiert

- [ ] **Deploy:**
  - [ ] `fly deploy --app timedify`
  - [ ] Release-Command erfolgreich
  - [ ] Health-Check bestanden

- [ ] **Post-Deploy:**
  - [ ] `npm run post-deploy-smoke`
  - [ ] `npm run ops-dashboard`
  - [ ] Webhook-Tests im Partner Dashboard

- [ ] **Monitoring:**
  - [ ] Error-Logs prüfen (erste 30 Min)
  - [ ] Performance-Metriken prüfen
  - [ ] Dead-Letters = 0

---

**Status: ✅ Production-Ready Ops-Plan**

*Timedify ist bereit für den produktiven Betrieb mit vollständiger Operational Excellence.*
