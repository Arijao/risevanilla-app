# BEHAVANA — Système de Gestion de Collecte de Vanille

## Architecture Modulaire (Production Ready)

```
├── index.html              # Shell HTML — 10 sections, tous les modals
├── manifest.json           # PWA manifest
├── sw.js                   # Service Worker (offline support)
├── logo.jpg                # Logo (à placer dans le projet)
├── logo-192.png            # Icône PWA 192×192
├── logo-512.png            # Icône PWA 512×512
├── logo-maskable.png       # Icône PWA maskable
├── assets/
│   ├── chart.min.js        # Chart.js local
│   └── xlsx.full.min.js    # SheetJS local
├── fonts/
│   ├── icon.css            # Material Icons
│   └── fa/                 # Font Awesome local
│       ├── all.min.css
│       └── webfonts/
└── src/
    ├── styles/
    │   ├── base.css        # Variables CSS, reset, typo
    │   ├── layout.css      # Sidebar, header, glassmorphism, year-slider
    │   └── ui.css          # Boutons, formulaires, modals, tables
    ├── core/
    │   ├── state.js        # État global, cache, calculs, year-slider
    │   ├── db.js           # IndexedDB: init, load, save, delete, import/export
    │   ├── router.js       # Navigation, sidebar, thème, search, pagination
    │   └── export.js       # PDF, Excel, reçus, BL/factures
    ├── components/
    │   ├── toast.js        # Notifications toast (4 types)
    │   ├── modal.js        # Moteur modal + collector modal
    │   ├── form.js         # Collector CRUD, Reception CRUD, validation
    │   └── table.js        # Tables collectors, réceptions, qualités
    ├── pages/
    │   ├── dashboard.js    # Stats, insights, 3 graphiques Chart.js
    │   ├── collectors.js   # Détails collecteur, export PDF/Excel
    │   ├── advances.js     # CRUD avances, remboursements, paiements solde
    │   ├── receptions.js   # Ajustement tri post-réception
    │   ├── deliveries.js   # CRUD livraisons, pesage rapide, BL/facture auto
    │   ├── expenses.js     # CRUD dépenses, prix de revient
    │   ├── analysis.js     # Tableau analyse, filtres qualité/collecteur
    │   └── qualities.js    # CRUD qualités de vanille
    └── main.js             # Point d'entrée DOMContentLoaded
```

## Déploiement Vercel

### 1. Structure minimale requise
Placez les fichiers dans votre repo Git avec la structure ci-dessus.

### 2. Assets requis (non générés)
```
logo.jpg          → Logo de l'entreprise
logo-192.png      → Icône PWA (192×192 px)
logo-512.png      → Icône PWA (512×512 px)
logo-maskable.png → Icône PWA maskable (512×512 px)
assets/chart.min.js        → Télécharger depuis cdn.jsdelivr.net/npm/chart.js
assets/xlsx.full.min.js    → Télécharger depuis cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/
fonts/icon.css + webfonts/ → Material Icons (ou utiliser CDN)
fonts/fa/                  → Font Awesome (ou CDN automatique via fallback)
```

### 3. vercel.json (optionnel, pour SPA routing)
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [
    {
      "source": "/sw.js",
      "headers": [{ "key": "Cache-Control", "value": "no-cache" }]
    }
  ]
}
```

### 4. Déploiement
```bash
git add .
git commit -m "feat: architecture modulaire BEHAVANA v2"
git push
# Vercel détecte automatiquement et déploie
```

## Fonctionnalités

| Module | Fonctionnalités |
|--------|----------------|
| **Dashboard** | Stats temps réel, 3 graphiques, insights rentabilité, year-slider |
| **Collecteurs** | CRUD, détails avec onglets, solde global/annuel, export PDF/Excel |
| **Avances** | CRUD, filtres date/collecteur, total affiché, remboursements |
| **Réceptions** | CRUD, pesage rapide multi-sac, ajustement tri post-réception |
| **Livraisons** | CRUD, pesage rapide, auto-numérotation BL/Facture, impression |
| **Dépenses** | CRUD, catégories avec icônes, total affiché, prix de revient |
| **Analyse** | Tableau collecteurs, filtres qualité, export PDF/Excel |
| **Paramètres** | Thème clair/sombre, taux rendement, import/export JSON, reset |
| **PWA** | Offline total (IndexedDB), installable iOS/Android/Desktop |

## Notes techniques
- **Zéro dépendance** npm — vanilla JS pur, pas de bundler requis
- **IndexedDB** pour la persistance locale (offline-first)
- **Service Worker** avec stratégie Cache First
- **Chargement scripts** classique (pas d'ES Modules) pour compatibilité maximale
