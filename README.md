# BEHAVANA — Système de Gestion de Collecte de Vanille

> Application PWA offline-first pour la gestion des avances, réceptions, livraisons et dépenses liées à la collecte de vanille.

---

## Sommaire

- [Présentation](#présentation)
- [Architecture du projet](#architecture-du-projet)
- [Fonctionnalités](#fonctionnalités)
- [Mode Offline & PWA](#mode-offline--pwa)
- [Installation & Déploiement](#installation--déploiement)
- [Workflow de développement](#workflow-de-développement)
- [Notes techniques](#notes-techniques)

---

## Présentation

BEHAVANA est une application web de type **PWA (Progressive Web App)** conçue pour fonctionner **entièrement hors ligne** après le premier chargement. Elle permet de gérer l'ensemble du cycle de collecte de vanille : collecteurs, avances, réceptions, livraisons et dépenses, avec persistance locale via **IndexedDB**.

**Stack technique :** Vanilla JS · CSS3 · IndexedDB · Service Worker · Chart.js · SheetJS  
**Zéro dépendance npm** — aucun bundler requis, déploiement direct.

---

## Architecture du projet

```
.
├── index.html                          # Shell HTML — toutes les sections et modals
├── manifest.json                       # Manifest PWA (icônes, thème, display)
├── sw.js                               # Service Worker (offline, cache-first)
├── logo.jpg                            # Logo entreprise
├── logo-192.png                        # Icône PWA 192×192
├── logo-512.png                        # Icône PWA 512×512
├── logo-maskable.png                   # Icône PWA maskable 512×512
│
├── assets/
│   ├── chart.min.js                    # Chart.js (local, offline)
│   └── xlsx.full.min.js               # SheetJS (local, offline)
│
├── fonts/
│   ├── icon.css                        # Material Icons (local)
│   ├── fa/
│   │   ├── all.min.css                 # Font Awesome (local)
│   │   └── webfonts/
│   │       ├── fa-brands-400.woff2
│   │       ├── fa-regular-400.woff2
│   │       └── fa-solid-900.woff2
│   ├── material-icons-outlined-v110-latin-regular.woff2
│   ├── material-icons-v145-latin-regular.woff2
│   ├── material-symbols-outlined-v325-latin-regular.woff2
│   ├── roboto-condensed-v31-latin-300.woff2
│   ├── roboto-condensed-v31-latin-300italic.woff2
│   ├── roboto-condensed-v31-latin-700.woff2
│   ├── roboto-condensed-v31-latin-700italic.woff2
│   ├── roboto-condensed-v31-latin-regular.woff2
│   └── roboto-v51-latin-regular.woff2
│
└── src/
    ├── main.js                         # Point d'entrée — DOMContentLoaded
    │
    ├── styles/
    │   ├── base.css                    # Variables CSS, reset, typographie
    │   ├── layout.css                  # Sidebar, header, glassmorphism, year-slider
    │   ├── ui.css                      # Boutons, formulaires, modals, tables
    │   └── search.css                  # Styles recherche globale
    │
    ├── core/
    │   ├── state.js                    # État global, cache mémoire, year-slider
    │   ├── db.js                       # IndexedDB : init, CRUD, import/export
    │   ├── router.js                   # Navigation, sidebar, thème clair/sombre
    │   ├── search.js                   # Recherche globale (debounce, résultats)
    │   └── export.js                   # PDF, Excel, reçus, BL, factures
    │
    ├── components/
    │   ├── toast.js                    # Notifications toast (4 types)
    │   ├── modal.js                    # Moteur modal générique
    │   ├── form.js                     # Formulaires CRUD + validation
    │   └── table.js                    # Rendu tables (collecteurs, réceptions…)
    │
    └── pages/
        ├── dashboard.js                # Stats temps réel, 3 graphiques, insights
        ├── collectors.js               # Détails collecteur, export PDF/Excel
        ├── advances.js                 # CRUD avances, remboursements, paiements
        ├── receptions.js               # CRUD réceptions, pesage multi-sac, ajustements
        ├── deliveries.js               # CRUD livraisons, BL/Facture auto, impression
        ├── expenses.js                 # CRUD dépenses, catégories, prix de revient
        ├── analysis.js                 # Tableau analyse, filtres qualité/collecteur
        └── qualities.js               # CRUD qualités de vanille
```

---

## Fonctionnalités

| Module | Fonctionnalités |
|---|---|
| **Dashboard** | Stats temps réel, 3 graphiques Chart.js, insights rentabilité, sélecteur d'année |
| **Collecteurs** | CRUD complet, vue détail avec onglets, solde global/annuel, export PDF/Excel |
| **Avances** | CRUD, filtres date/collecteur, total affiché, remboursements associés |
| **Réceptions** | CRUD, pesage rapide multi-sac, ajustement tri post-réception |
| **Remboursements** | Enregistrement et suivi par collecteur |
| **Paiements effectués** | Historique des paiements de solde créditeur |
| **Livraisons** | CRUD, pesage rapide, auto-numérotation BL/Facture, impression |
| **Dépenses** | CRUD, catégories avec icônes, total affiché, calcul prix de revient |
| **Suivi & Analyse** | Tableau collecteurs, filtres qualité, export PDF/Excel |
| **Paramètres** | Thème clair/sombre, taux rendement, import/export JSON, reset données |
| **Recherche globale** | Recherche temps réel avec debounce sur toutes les entités |
| **PWA** | Installable iOS/Android/Desktop, offline total, bannière mise à jour |

---

## Mode Offline & PWA

### Fonctionnement général

```
Premier chargement (online)
        │
        ▼
  Service Worker s'installe
        │
        ▼
  Précache de TOUS les assets
  (HTML, CSS, JS, fonts, images)
        │
        ▼
  Application disponible offline
  ← toutes les données via IndexedDB →
```

### Service Worker (`sw.js`)

Le Service Worker implémente trois stratégies selon le type de ressource :

| Type de ressource | Stratégie | Comportement |
|---|---|---|
| Navigation (`index.html`) | Network-First + fallback SPA | Réseau prioritaire, cache si offline |
| Assets locaux (JS, CSS, fonts) | Cache-First | Servi depuis le cache, réseau si absent |
| Ressources CDN (fonts.googleapis…) | Stale-While-Revalidate | Cache instantané + mise à jour en fond |

**Robustesse :** le précache utilise `Promise.allSettled()` — un asset manquant ne bloque pas l'installation du SW. Les fallbacks par type de fichier (SVG placeholder, CSS vide…) évitent toute page blanche.

**Versioning :** chaque déploiement incrémente `CACHE_VERSION`. L'ancien cache est supprimé à l'activation. Une bannière UI propose la mise à jour à l'utilisateur sans rechargement forcé.

### IndexedDB (`src/core/db.js`)

Toutes les données sont persistées localement via IndexedDB, organisées en stores :

- `collectors` — collecteurs
- `receptions` — réceptions de vanille
- `advances` — avances accordées
- `deliveries` — livraisons export
- `expenses` — dépenses opérationnelles
- `qualities` — qualités de vanille
- `settings` — paramètres application

Aucun appel réseau n'est nécessaire pour les opérations de données. L'application fonctionne comme une application native après le premier chargement.

### Indicateurs réseau

- **Bannière orange** en haut de page quand `navigator.onLine === false`
- **Bannière violette** en bas de page quand une nouvelle version du SW est disponible
- **Event custom** `behavana:network` dispatchable dans tous les modules JS

---

## Installation & Déploiement

### Prérequis

Aucun outil de build requis. Un simple serveur HTTP statique suffit.

### Développement local

```bash
# Cloner le dépôt
git clone https://github.com/<votre-org>/behavana.git
cd behavana

# Option A — Python (inclus sur macOS/Linux)
python3 -m http.server 8080

# Option B — Node.js
npx serve .

# Option C — VS Code
# Installer l'extension "Live Server" et cliquer sur "Go Live"
```

Ouvrir `http://localhost:8080` dans le navigateur.

> **Important :** le Service Worker nécessite HTTPS ou `localhost`. Ne pas ouvrir `index.html` directement en `file://`.

### Déploiement sur Vercel

**1. Pousser le projet sur GitHub**

```bash
git add .
git commit -m "feat: BEHAVANA production"
git push origin main
```

**2. Importer sur Vercel**

- Aller sur [vercel.com](https://vercel.com) → *New Project*
- Sélectionner le dépôt GitHub
- Framework preset : **Other** (pas de build command)
- Cliquer sur *Deploy*

**3. Ajouter `vercel.json` à la racine**

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        { "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" },
        { "key": "Service-Worker-Allowed", "value": "/" }
      ]
    }
  ]
}
```

> Le header `Cache-Control: no-cache` sur `sw.js` est **critique** : il garantit que le navigateur vérifie toujours si le SW a changé, sans bloquer le cache des autres assets.

---

## Workflow de développement

### Modifier un module existant

```bash
# Exemple : ajouter un champ dans les réceptions
# 1. Modifier le formulaire dans src/components/form.js
# 2. Adapter la logique dans src/pages/receptions.js
# 3. Mettre à jour le store si nécessaire dans src/core/db.js
# 4. Incrémenter CACHE_VERSION dans sw.js
```

### Incrémenter le cache après modification

Dans `sw.js`, mettre à jour la version à chaque déploiement :

```js
const CACHE_VERSION = '3.1.0'; // ← incrémenter ici
```

Cela invalide l'ancien cache et force le rechargement des assets modifiés chez tous les utilisateurs.

### Tester le mode offline

1. Ouvrir les **DevTools** → onglet **Application** → **Service Workers**
2. Vérifier : `Status: activated and running`
3. Onglet **Network** → cocher **Offline**
4. Recharger la page — l'application doit s'afficher normalement
5. Naviguer entre les sections, créer/modifier des données → tout fonctionne via IndexedDB

### Inspecter le cache

**DevTools → Application → Cache Storage :**
```
behavana-v3-static-3.0.0    → assets locaux (JS, CSS, fonts, images)
behavana-v3-runtime-3.0.0   → ressources CDN mises en cache à la volée
```

### Import / Export des données

Depuis l'interface → **Paramètres** :
- **Export JSON** : sauvegarde complète de toutes les données IndexedDB
- **Import JSON** : restauration depuis un fichier de sauvegarde
- **Reset** : remise à zéro complète (avec confirmation)

---

## Notes techniques

- **Vanilla JS pur** — aucun framework, aucun bundler, compatibilité maximale
- **Chargement scripts classique** (pas d'ES Modules) pour compatibilité iOS Safari
- **Fonts 100% locales** — Roboto, Material Icons, Font Awesome en `.woff2` ; CDN en fallback automatique via `onerror`
- **Chart.js et SheetJS** embarqués localement dans `assets/` — aucun CDN requis pour les graphiques et exports Excel
- **Thème clair/sombre** — géré via classes CSS et `localStorage`, persisté entre sessions
- **Year-slider** — filtre toutes les vues par année fiscale, état conservé en mémoire (`state.js`)
- **Pagination** — côté client, configurable par module
- **Recherche globale** — debounce 300ms, recherche sur toutes les entités sans appel réseau
