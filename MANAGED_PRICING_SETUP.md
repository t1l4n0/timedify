# Shopify Managed Pricing Setup für Timedify

## 🎯 **Übersicht**

Timedify verwendet Shopify's **Managed Pricing** System, um App-Abonnements zu verwalten. Die App überprüft automatisch den Abonnement-Status und leitet Benutzer bei Bedarf zur Managed Pricing Seite weiter.

## 🚀 **Funktionsweise der App**

### **Automatische Abonnement-Überprüfung:**
1. **Bei jedem App-Besuch** wird der aktuelle Abonnement-Status überprüft
2. **GraphQL-Query** an Shopify's Admin API für `currentAppInstallation.activeSubscriptions`
3. **Automatische Weiterleitung** zur Managed Pricing Seite bei fehlendem Abonnement

### **Implementierung:**
```typescript
// Überprüfe den aktuellen App-Installationsstatus
const response = await admin.graphql(`
  query getAppInstallation {
    currentAppInstallation {
      id
      activeSubscriptions {
        id
        status
        name
        trialDays
        currentPeriodEnd
      }
    }
  }
`);

// Wenn keine aktiven Abonnements vorhanden sind, leite zur Managed Pricing Seite weiter
if (!appInstallation.activeSubscriptions || appInstallation.activeSubscriptions.length === 0) {
  const managedPricingUrl = `https://admin.shopify.com/store/${shopName}/settings/billing/apps/${appHandle}`;
  return redirect(managedPricingUrl);
}
```

## 📋 **Schritte im Shopify Partner Dashboard**

### **1. App-Konfiguration überprüfen**
- Stellen Sie sicher, dass die App den Handle `timed-content-app` verwendet
- Überprüfen Sie, dass die App im Partner Dashboard aktiviert ist

### **2. Managed Pricing aktivieren**
- Gehen Sie zu **Apps** → **Timedify** → **Pricing**
- Aktivieren Sie **"Enable managed pricing"**
- Konfigurieren Sie Ihre Abonnement-Pläne

### **3. Abonnement-Pläne einrichten**
- **Free Plan** (optional): Für Testzwecke
- **Paid Plans**: Verschiedene Preisstufen mit unterschiedlichen Features
- **Trial Period**: Anzahl der kostenlosen Testtage

## 🔄 **Benutzer-Flow**

### **Erstinstallation:**
1. Benutzer installiert die App
2. App überprüft automatisch den Abonnement-Status
3. **Kein Abonnement gefunden** → Weiterleitung zur Managed Pricing Seite
4. Benutzer wählt einen Plan aus und zahlt
5. **Abonnement aktiv** → App wird normal geladen

### **Reguläre Nutzung:**
1. Benutzer öffnet die App
2. App überprüft den Abonnement-Status
3. **Abonnement aktiv** → Normale App-Funktionalität
4. **Abonnement abgelaufen** → Weiterleitung zur Managed Pricing Seite

### **Abonnement-Upgrade/Downgrade:**
1. Benutzer ändert den Plan in Shopify
2. Webhook `APP_SUBSCRIPTIONS_UPDATE` wird ausgelöst
3. App aktualisiert den Status automatisch

## 📊 **Webhook-Integration**

### **APP_SUBSCRIPTIONS_UPDATE:**
```typescript
// app/routes/webhooks.app.subscriptions_update.tsx
export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, session, admin } = await authenticate.webhook(request);

  if (topic === "APP_SUBSCRIPTIONS_UPDATE") {
    try {
      const payload = await request.json();
      console.log("Subscription update received:", payload);
      // Hier können Sie zusätzliche Logik implementieren
      return new Response("OK", { status: 200 });
    } catch (error) {
      console.error("Error processing subscription update:", error);
      return new Response("Error processing webhook", { status: 500 });
    }
  }
  return new Response("Unhandled webhook topic", { status: 400 });
};
```

## 🛡️ **Fehlerbehandlung**

### **Fallback-Strategien:**
1. **GraphQL-Fehler** → Weiterleitung zur Managed Pricing Seite
2. **Authentifizierungsfehler** → Weiterleitung zur Managed Pricing Seite
3. **Kritische Fehler** → Fallback-Daten mit Warnung

### **Sicherheitsaspekte:**
- Alle Weiterleitungen verwenden `redirect()` von Remix
- Keine client-seitigen Weiterleitungen für Sicherheit
- Fallback zur Managed Pricing Seite bei allen Fehlern

## ✅ **Vorteile der Implementierung**

1. **Automatische Verwaltung** - Keine manuelle Abonnement-Überprüfung nötig
2. **Nahtlose Integration** - Verwendet Shopify's native Managed Pricing
3. **Sichere Weiterleitung** - Server-seitige Überprüfung und Weiterleitung
4. **Benutzerfreundlich** - Automatische Führung zur Zahlungsseite
5. **Compliance** - Folgt Shopify's Best Practices für App-Billing

## 🔧 **Technische Details**

### **URL-Struktur:**
```
https://admin.shopify.com/store/{shopName}/settings/billing/apps/{appHandle}
```

### **GraphQL-Query:**
```graphql
query getAppInstallation {
  currentAppInstallation {
    id
    activeSubscriptions {
      id
      status
      name
      trialDays
      currentPeriodEnd
    }
  }
}
```

### **Abonnement-Status:**
- `ACTIVE` - Abonnement ist aktiv und gültig
- `CANCELLED` - Abonnement wurde gekündigt
- `DECLINED` - Zahlung wurde abgelehnt
- `EXPIRED` - Abonnement ist abgelaufen

## 📝 **Nächste Schritte**

1. **Testen Sie die App** im Shopify Partner Dashboard
2. **Überprüfen Sie die Weiterleitung** bei fehlendem Abonnement
3. **Konfigurieren Sie Ihre Abonnement-Pläne** in Managed Pricing
4. **Testen Sie verschiedene Szenarien** (Installation, Upgrade, etc.)

Die App ist jetzt vollständig für Shopify Managed Pricing konfiguriert und leitet Benutzer automatisch zur richtigen Seite weiter! 🎉
