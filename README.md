# Timedify

Eine Shopify-App, die zeitgesteuerte Inhalte für Shopify-Shops bereitstellt.

## 🚀 Features

- **Admin-Bereich**: Vollständige Verwaltung über Shopify Admin
- **Theme Integration**: Nahtlose Integration in Shopify-Themes
- **Zeitsteuerung**: Inhalte basierend auf Zeit und Datum anzeigen/verstecken
- **Built for Shopify**: Vollständig Shopify-konform

## 🏗️ Projektstruktur

Dieses Projekt kombiniert eine **Shopify Admin-App** (Remix) mit einer **Shopify Theme App Extension** in einem einzigen Repository:

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

## 🛠️ Entwicklung

### Voraussetzungen

- Node.js 18.20+ oder 20.10+ oder 21.0+
- Shopify CLI
- Fly.io CLI (für Admin-App Deployment)

### Installation

```bash
npm install
```

### Admin-App (Remix) starten

```bash
npm run dev          # Development-Server starten
npm run build        # Production-Build erstellen
npm start            # Production-Server starten
```

### Theme Extension entwickeln

```bash
npm run extension:dev    # Extension im Development-Modus
npm run extension:build  # Extension bauen
npm run extension:info   # Extension-Informationen anzeigen
```

### Beide gleichzeitig bauen

```bash
npm run build:all        # Admin-App + Extension bauen
```

## 🚀 Deployment

### Admin-App (Fly.io)

```bash
fly deploy              # Admin-App auf Fly.io deployen
```

### Theme Extension (Shopify)

```bash
npm run extension:deploy # Extension auf Shopify deployen
```

### Beide deployen

```bash
npm run deploy:all       # Admin-App + Extension deployen
```

## 📚 Dokumentation

- [Extension Integration Guide](EXTENSION_INTEGRATION.md) - Detaillierte Anleitung zur Integration
- [Shopify App Development](https://shopify.dev/docs/apps) - Offizielle Shopify-Dokumentation
- [Theme App Extensions](https://shopify.dev/docs/apps/online-store/theme-app-extensions) - Theme Extension Guide

## 🔧 Technologie-Stack

- **Admin-App**: Remix, React, Shopify Polaris, Prisma
- **Theme Extension**: Liquid, JavaScript, CSS
- **Deployment**: Fly.io (Admin-App), Shopify (Extension)
- **Authentication**: Shopify Session Token

## 📄 Lizenz

Private - Alle Rechte vorbehalten
