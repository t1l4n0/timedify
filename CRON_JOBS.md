# ⏰ Cron Jobs & Automation

## 📋 **Empfohlene Cron-Jobs**

### **Täglich (Retention & Cleanup)**
```bash
# Retention-Cleanup (7 Tage)
0 2 * * * cd /path/to/timedify && ./scripts/retention-cleanup.sh 7

# Dead Letter Cleanup
0 3 * * * cd /path/to/timedify && npx tsx scripts/replay-deadletters.ts --cleanup
```

### **Alle 5 Minuten (Health-Check)**
```bash
# Health-Check mit Alerting
*/5 * * * * cd /path/to/timedify && ./scripts/alerting-check.sh || echo "Health-Check failed" | mail -s "Timedify Alert" admin@example.com
```

### **Nach jedem Deploy (CI/CD)**
```bash
# Post-Deploy Tests
./scripts/synthetic-webhook-test.sh
./scripts/health-check.sh
```

---

## 🔧 **CI/CD Integration**

### **GitHub Actions Example**
```yaml
name: Post-Deploy Tests
on:
  push:
    branches: [main]

jobs:
  post-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Synthetic Webhook Tests
        run: ./scripts/synthetic-webhook-test.sh
      - name: Health Check
        run: ./scripts/health-check.sh
```

### **Fly.io Deploy Hook**
```bash
# In fly.toml
[deploy]
  release_command = "./scripts/synthetic-webhook-test.sh"
```

---

## 📊 **Monitoring & Alerting**

### **Exit-Codes für Alerting**
- **0:** Alles OK
- **1:** Health-Check fehlgeschlagen
- **2:** Fehler in Logs gefunden

### **Alerting-Integration**
```bash
# Slack-Webhook
./scripts/alerting-check.sh || curl -X POST -H 'Content-type: application/json' --data '{"text":"Timedify Health-Check failed"}' $SLACK_WEBHOOK_URL

# Email
./scripts/alerting-check.sh || echo "Health-Check failed" | mail -s "Timedify Alert" admin@example.com
```

---

## 🎯 **SLO-Monitoring**

### **Performance-Tracking**
```bash
# Response-Zeit-Monitoring
curl -w "@curl-format.txt" -o /dev/null -s https://timedify.fly.dev/health

# curl-format.txt:
#     time_namelookup:  %{time_namelookup}\n
#        time_connect:  %{time_connect}\n
#     time_appconnect:  %{time_appconnect}\n
#    time_pretransfer:  %{time_pretransfer}\n
#       time_redirect:  %{time_redirect}\n
#  time_starttransfer:  %{time_starttransfer}\n
#                     ----------\n
#          time_total:  %{time_total}\n
```

### **Error-Rate-Monitoring**
```bash
# Tägliche Error-Rate
ERROR_COUNT=$(fly logs --app timedify | grep -Ei "error" | wc -l)
TOTAL_REQUESTS=$(fly logs --app timedify | grep -E "(GET|POST)" | wc -l)
ERROR_RATE=$(echo "scale=2; $ERROR_COUNT * 100 / $TOTAL_REQUESTS" | bc)
echo "Error Rate: $ERROR_RATE%"
```

---

## 🛠️ **Wartung & Cleanup**

### **Wöchentliche Wartung**
```bash
# Montags um 2:00 Uhr
0 2 * * 1 cd /path/to/timedify && ./scripts/retention-cleanup.sh 14

# Sonntags um 3:00 Uhr
0 3 * * 0 cd /path/to/timedify && npx tsx scripts/replay-deadletters.ts --cleanup
```

### **Monatliche Wartung**
```bash
# 1. des Monats um 1:00 Uhr
0 1 1 * * cd /path/to/timedify && ./scripts/retention-cleanup.sh 30
```

---

## 📚 **Nützliche Befehle**

### **Quick-Status**
```bash
# Alles in einem
./scripts/health-check.sh && echo "✅ All OK" || echo "❌ Issues found"
```

### **Debug-Mode**
```bash
# Verbose-Logs
fly logs --app timedify --verbose

# Live-Monitoring
./scripts/logs-watch.sh 60
```

### **Emergency-Commands**
```bash
# Memory erhöhen
fly scale memory 512 --app timedify

# Rollback
fly releases --app timedify
fly deploy --app timedify --image [previous-image]

# Restart
fly apps restart timedify
```

---

**Letzte Aktualisierung:** 2025-10-16 11:05 UTC  
**Version:** 1.0 (Cron Jobs & Automation)

⏰ **AUTOMATION BEREIT!** ⏰
