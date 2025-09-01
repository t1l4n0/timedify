# Timedify - Admin App + Theme Extension Integration

Dieses Projekt kombiniert eine Shopify Admin-App (Remix) mit einer Shopify Theme App Extension in einem einzigen Repository.

## Projektstruktur

```
timedify/
├── app/                    # Remix Admin-App (Fly.io Deployment)
├── extensions/            # Shopify Extensions
│   └── timed-content-app/ # Theme App Extension
├── package.json           # Haupt-Package mit allen Dependencies
├── shopify.app.toml       # Admin-App Konfiguration
├── fly.toml              # Fly.io Deployment
└── README.md
```

## Entwicklung

### Admin-App (Remix) starten
```bash
npm run dev          # Startet die Remix Admin-App
npm run build        # Baut die Admin-App
npm start            # Startet den Production-Server
```

### Theme Extension entwickeln
```bash
npm run extension:dev    # Startet die Extension im Development-Modus
npm run extension:build  # Baut die Extension
npm run extension:info   # Zeigt Extension-Informationen
```

### Beide gleichzeitig bauen
```bash
npm run build:all        # Baut Admin-App + Extension
```

## Deployment

### Admin-App (Fly.io)
```bash
fly deploy              # Deployed die Admin-App auf Fly.io
```

### Theme Extension (Shopify)
```bash
npm run extension:deploy # Deployed die Extension auf Shopify
```

### Beide deployen
```bash
npm run deploy:all       # Deployed Admin-App + Extension
```

## Workflow

1. **Entwicklung**: Beide Teile können gleichzeitig entwickelt werden
2. **Testing**: Extension lokal testen mit `npm run extension:dev`
3. **Building**: Beide Teile separat oder zusammen bauen
4. **Deployment**: Admin-App auf Fly.io, Extension auf Shopify

## Vorteile der Integration

- ✅ Ein Repository für beide Teile
- ✅ Geteilte Dependencies
- ✅ Einheitliche Versionierung
- ✅ Einfache Verwaltung
- ✅ Separate Deployments möglich

## Wichtige Dateien

- `app/` - Remix Admin-App Code
- `extensions/timed-content-app/` - Theme Extension Code
- `shopify.app.toml` - Admin-App Konfiguration
- `extensions/timed-content-app/shopify.extension.toml` - Extension Konfiguration
