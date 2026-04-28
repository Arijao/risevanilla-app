/**
 * RISEVANILLA — Recherche Analytique Intelligente
 * Fichier : src/core/search-analytics.js
 *
 * Ajoute une couche d'agrégation contextuelle au moteur de recherche existant.
 * Ce module est autonome : il ne modifie aucun fichier existant.
 *
 * ── INTÉGRATION (3 étapes) ────────────────────────────────────────────────
 *
 * 1. Copier ce fichier dans : src/core/search-analytics.js
 *
 * 2. Dans index.html, ajouter APRÈS le tag <script src="src/core/search.js"> :
 *      <script src="src/core/search-analytics.js"></script>
 *
 * 3. Dans chaque page (receptions.js, advances.js, etc.), après avoir appelé
 *    RiseVanillaSearch.filter() ou mis à jour le tableau, ajouter :
 *
 *      // Exemple dans receptions.js, après le rendu du tableau :
 *      SearchAnalytics.analyze(currentQuery, filteredItems, 'receptions');
 *
 *    Si la query est vide ou les résultats vides, le panneau se ferme seul.
 *
 * ── MODULES SUPPORTÉS ────────────────────────────────────────────────────
 *    'receptions' | 'advances' | 'remboursements' | 'paiements' | 'livraisons'
 *    | 'depenses' | 'auto' (détection automatique par heuristique sur les clés)
 *
 * ── API PUBLIQUE ──────────────────────────────────────────────────────────
 *    SearchAnalytics.analyze(query, results, moduleHint?)  → affiche le panneau
 *    SearchAnalytics.close()                               → ferme le panneau
 * ─────────────────────────────────────────────────────────────────────────
 */

window.SearchAnalytics = (() => {
  'use strict';

  /* ══════════════════════════════════════════════════════════════════════════
   * 1. FORMATAGE
   * ══════════════════════════════════════════════════════════════════════════ */

  const fmt = {
    /** Poids en kg avec 3 décimales et séparateur français */
    kg(v) {
      const n = parseFloat(v) || 0;
      return n.toLocaleString('fr-FR', { minimumFractionDigits: 3, maximumFractionDigits: 3 }) + ' kg';
    },
    /** Montant en Ariary, arrondi à l'entier */
    ar(v) {
      return Math.round(parseFloat(v) || 0).toLocaleString('fr-FR') + ' Ar';
    },
    /** Entier simple */
    int(v) {
      return Math.round(parseFloat(v) || 0).toLocaleString('fr-FR');
    },
  };

  /* ══════════════════════════════════════════════════════════════════════════
   * 2. UTILITAIRES
   * ══════════════════════════════════════════════════════════════════════════ */

  /** Somme d'un champ sur un tableau, en ignorant NaN */
  function sum(arr, key) {
    return arr.reduce((acc, row) => acc + (parseFloat(row[key]) || 0), 0);
  }

  /**
   * Cherche la première clé d'un objet dont le nom (en minuscules)
   * contient l'un des termes candidats.
   * Retourne le nom original de la clé, ou null.
   */
  function findKey(obj, candidates) {
    const entries = Object.keys(obj).map(k => ({ orig: k, low: k.toLowerCase() }));
    for (const term of candidates) {
      const found = entries.find(e => e.low.includes(term));
      if (found) return found.orig;
    }
    return null;
  }

  /**
   * Regroupe les items par la valeur d'une clé donnée.
   * Retourne un Map { valeur → [items...] }
   */
  function groupBy(items, key) {
    const map = new Map();
    items.forEach(item => {
      const val = item[key] || 'Inconnu';
      if (!map.has(val)) map.set(val, []);
      map.get(val).push(item);
    });
    return map;
  }

  /* ══════════════════════════════════════════════════════════════════════════
   * 3. DÉTECTION DE MODULE
   * ══════════════════════════════════════════════════════════════════════════ */

  /**
   * Identifie le module source à partir des clés des items.
   * Utilisé quand moduleHint = 'auto' ou non fourni.
   */
  function detectModule(items) {
    if (!items?.length) return 'generic';
    const keys = Object.keys(items[0]).map(k => k.toLowerCase()).join(' ');

    if (keys.includes('qualite') || keys.includes('quality') ||
        (keys.includes('poids') && keys.includes('reception')))        return 'receptions';
    if (keys.includes('avance') || (keys.includes('montant') && keys.includes('type') && !keys.includes('livraison')))
                                                                       return 'advances';
    if (keys.includes('rembours'))                                     return 'remboursements';
    if (keys.includes('paiement') || (keys.includes('montant') && keys.includes('solde')))
                                                                       return 'paiements';
    if (keys.includes('livraison') || (keys.includes('poids') && keys.includes('client')))
                                                                       return 'livraisons';
    if (keys.includes('depense') || keys.includes('categorie'))        return 'depenses';
    return 'generic';
  }

  /* ══════════════════════════════════════════════════════════════════════════
   * 4. AGRÉGATEURS PAR MODULE
   *    Chaque agrégateur retourne un objet { icon, module, cards, sections }
   *    cards   → [{ label, value, accent? }]       — statistiques globales
   *    sections → [{ title, icon, rows }]           — tableaux de répartition
   *    rows    → [{ label, cols: [{label, value}] }]
   * ══════════════════════════════════════════════════════════════════════════ */

  const aggregators = {

    /* ── Réceptions ─────────────────────────────────────────────────────── */
    receptions(results) {
      const s = results[0];
      const kPoids    = findKey(s, ['poids', 'weight', 'kg', 'masse']);
      const kQualite  = findKey(s, ['qualite', 'quality', 'type_vanille', 'type']);
      const kValeur   = findKey(s, ['valeur', 'prix_total', 'montant', 'total']);
      const kPrixUnit = findKey(s, ['prix_unit', 'prix_kg', 'prix_par_kg', 'prixkg', 'prix']);
      const kCollect  = findKey(s, ['collecteur', 'collector', 'nom_collecteur', 'nom']);

      const totalPoids  = kPoids  ? sum(results, kPoids)  : null;
      const totalValeur = kValeur ? sum(results, kValeur) :
        (kPoids && kPrixUnit)
          ? results.reduce((a, r) => a + (parseFloat(r[kPoids]) || 0) * (parseFloat(r[kPrixUnit]) || 0), 0)
          : null;

      /* Répartition par qualité */
      const byQualite = {};
      if (kQualite) {
        results.forEach(r => {
          const q = r[kQualite] || 'Inconnue';
          if (!byQualite[q]) byQualite[q] = { poids: 0, valeur: 0, count: 0 };
          byQualite[q].count++;
          byQualite[q].poids  += parseFloat(r[kPoids]) || 0;
          byQualite[q].valeur += kValeur
            ? parseFloat(r[kValeur]) || 0
            : (parseFloat(r[kPoids]) || 0) * (parseFloat(r[kPrixUnit]) || 0);
        });
      }

      /* Répartition par collecteur (seulement si ≥ 2 collecteurs distincts) */
      const byCollect = {};
      if (kCollect) {
        results.forEach(r => {
          const c = r[kCollect] || 'Inconnu';
          if (!byCollect[c]) byCollect[c] = { poids: 0, valeur: 0, count: 0 };
          byCollect[c].count++;
          byCollect[c].poids  += parseFloat(r[kPoids]) || 0;
          byCollect[c].valeur += kValeur
            ? parseFloat(r[kValeur]) || 0
            : (parseFloat(r[kPoids]) || 0) * (parseFloat(r[kPrixUnit]) || 0);
        });
      }

      return {
        icon: 'scale',
        module: 'Réceptions',
        cards: [
          totalPoids  !== null && { label: 'Poids total',      value: fmt.kg(totalPoids),  accent: true },
          totalValeur !== null && { label: 'Valeur totale',    value: fmt.ar(totalValeur), accent: false },
          { label: 'Nb de lots', value: fmt.int(results.length), accent: false },
        ].filter(Boolean),
        sections: [
          Object.keys(byQualite).length > 0 && {
            title: 'Par qualité',
            icon: 'category',
            cols: ['Poids', 'Valeur', 'Lots'],
            rows: Object.entries(byQualite)
              .sort((a, b) => b[1].poids - a[1].poids)
              .map(([q, d]) => ({
                label: q,
                cols: [fmt.kg(d.poids), fmt.ar(d.valeur), fmt.int(d.count)],
              })),
          },
          Object.keys(byCollect).length > 1 && {
            title: 'Par collecteur',
            icon: 'person',
            cols: ['Poids', 'Valeur', 'Lots'],
            rows: Object.entries(byCollect)
              .sort((a, b) => b[1].poids - a[1].poids)
              .map(([c, d]) => ({
                label: c,
                cols: [fmt.kg(d.poids), fmt.ar(d.valeur), fmt.int(d.count)],
              })),
          },
        ].filter(Boolean),
      };
    },

    /* ── Avances ────────────────────────────────────────────────────────── */
    advances(results) {
      const s = results[0];
      const kMontant = findKey(s, ['montant', 'amount', 'somme', 'valeur']);
      const kCollect = findKey(s, ['collecteur', 'collector', 'nom_collecteur', 'nom']);
      const kStatut  = findKey(s, ['statut', 'status', 'etat']);

      const total = kMontant ? sum(results, kMontant) : null;

      const byCollect = {};
      if (kCollect && kMontant) {
        results.forEach(r => {
          const c = r[kCollect] || 'Inconnu';
          if (!byCollect[c]) byCollect[c] = { montant: 0, count: 0 };
          byCollect[c].montant += parseFloat(r[kMontant]) || 0;
          byCollect[c].count++;
        });
      }

      const byStatut = {};
      if (kStatut && kMontant) {
        results.forEach(r => {
          const st = r[kStatut] || 'Inconnu';
          if (!byStatut[st]) byStatut[st] = { montant: 0, count: 0 };
          byStatut[st].montant += parseFloat(r[kMontant]) || 0;
          byStatut[st].count++;
        });
      }

      return {
        icon: 'payments',
        module: 'Avances',
        cards: [
          total !== null && { label: 'Total avancé',  value: fmt.ar(total),          accent: true },
          { label: 'Nb d\'avances', value: fmt.int(results.length), accent: false },
        ].filter(Boolean),
        sections: [
          Object.keys(byStatut).length > 1 && {
            title: 'Par statut',
            icon: 'info',
            cols: ['Montant', 'Avances'],
            rows: Object.entries(byStatut)
              .sort((a, b) => b[1].montant - a[1].montant)
              .map(([st, d]) => ({
                label: st,
                cols: [fmt.ar(d.montant), fmt.int(d.count)],
              })),
          },
          Object.keys(byCollect).length > 1 && {
            title: 'Par collecteur',
            icon: 'person',
            cols: ['Montant', 'Avances'],
            rows: Object.entries(byCollect)
              .sort((a, b) => b[1].montant - a[1].montant)
              .map(([c, d]) => ({
                label: c,
                cols: [fmt.ar(d.montant), fmt.int(d.count)],
              })),
          },
        ].filter(Boolean),
      };
    },

    /* ── Remboursements ─────────────────────────────────────────────────── */
    remboursements(results) {
      const s = results[0];
      const kMontant = findKey(s, ['montant', 'rembours', 'amount', 'valeur']);
      const kCollect = findKey(s, ['collecteur', 'collector', 'nom_collecteur', 'nom']);

      const total = kMontant ? sum(results, kMontant) : null;

      const byCollect = {};
      if (kCollect && kMontant) {
        results.forEach(r => {
          const c = r[kCollect] || 'Inconnu';
          if (!byCollect[c]) byCollect[c] = { montant: 0, count: 0 };
          byCollect[c].montant += parseFloat(r[kMontant]) || 0;
          byCollect[c].count++;
        });
      }

      return {
        icon: 'undo',
        module: 'Remboursements',
        cards: [
          total !== null && { label: 'Total remboursé',      value: fmt.ar(total),          accent: true },
          { label: 'Nb de remboursements', value: fmt.int(results.length), accent: false },
        ].filter(Boolean),
        sections: [
          Object.keys(byCollect).length > 1 && {
            title: 'Par collecteur',
            icon: 'person',
            cols: ['Montant', 'Remb.'],
            rows: Object.entries(byCollect)
              .sort((a, b) => b[1].montant - a[1].montant)
              .map(([c, d]) => ({
                label: c,
                cols: [fmt.ar(d.montant), fmt.int(d.count)],
              })),
          },
        ].filter(Boolean),
      };
    },

    /* ── Paiements ──────────────────────────────────────────────────────── */
    paiements(results) {
      const s = results[0];
      const kMontant = findKey(s, ['montant', 'paiement', 'amount', 'solde', 'valeur']);
      const kCollect = findKey(s, ['collecteur', 'collector', 'nom_collecteur', 'nom']);

      const total = kMontant ? sum(results, kMontant) : null;

      const byCollect = {};
      if (kCollect && kMontant) {
        results.forEach(r => {
          const c = r[kCollect] || 'Inconnu';
          if (!byCollect[c]) byCollect[c] = { montant: 0, count: 0 };
          byCollect[c].montant += parseFloat(r[kMontant]) || 0;
          byCollect[c].count++;
        });
      }

      return {
        icon: 'account_balance_wallet',
        module: 'Paiements',
        cards: [
          total !== null && { label: 'Total payé',     value: fmt.ar(total),          accent: true },
          { label: 'Nb de paiements', value: fmt.int(results.length), accent: false },
        ].filter(Boolean),
        sections: [
          Object.keys(byCollect).length > 1 && {
            title: 'Par collecteur',
            icon: 'person',
            cols: ['Montant', 'Paiements'],
            rows: Object.entries(byCollect)
              .sort((a, b) => b[1].montant - a[1].montant)
              .map(([c, d]) => ({
                label: c,
                cols: [fmt.ar(d.montant), fmt.int(d.count)],
              })),
          },
        ].filter(Boolean),
      };
    },

    /* ── Livraisons ─────────────────────────────────────────────────────── */
    livraisons(results) {
      const s = results[0];
      const kPoids   = findKey(s, ['poids', 'weight', 'kg', 'masse']);
      const kMontant = findKey(s, ['montant', 'total', 'valeur', 'prix_total']);
      const kClient  = findKey(s, ['client', 'destinataire', 'acheteur', 'nom_client']);
      const kQualite = findKey(s, ['qualite', 'quality', 'type']);

      const totalPoids  = kPoids   ? sum(results, kPoids)   : null;
      const totalValeur = kMontant ? sum(results, kMontant) : null;

      const byClient = {};
      if (kClient) {
        results.forEach(r => {
          const c = r[kClient] || 'Inconnu';
          if (!byClient[c]) byClient[c] = { poids: 0, valeur: 0, count: 0 };
          byClient[c].count++;
          byClient[c].poids  += parseFloat(r[kPoids])   || 0;
          byClient[c].valeur += parseFloat(r[kMontant]) || 0;
        });
      }

      return {
        icon: 'local_shipping',
        module: 'Livraisons',
        cards: [
          totalPoids  !== null && { label: 'Poids total',   value: fmt.kg(totalPoids),  accent: true },
          totalValeur !== null && { label: 'Valeur totale', value: fmt.ar(totalValeur), accent: false },
          { label: 'Nb de BL', value: fmt.int(results.length), accent: false },
        ].filter(Boolean),
        sections: [
          Object.keys(byClient).length > 1 && {
            title: 'Par client',
            icon: 'store',
            cols: ['Poids', 'Valeur', 'BL'],
            rows: Object.entries(byClient)
              .sort((a, b) => b[1].poids - a[1].poids)
              .map(([c, d]) => ({
                label: c,
                cols: [fmt.kg(d.poids), fmt.ar(d.valeur), fmt.int(d.count)],
              })),
          },
        ].filter(Boolean),
      };
    },

    /* ── Dépenses ───────────────────────────────────────────────────────── */
    depenses(results) {
      const s = results[0];
      const kMontant  = findKey(s, ['montant', 'amount', 'valeur', 'cout', 'cost']);
      const kCateg    = findKey(s, ['categorie', 'category', 'type']);

      const total = kMontant ? sum(results, kMontant) : null;

      const byCateg = {};
      if (kCateg && kMontant) {
        results.forEach(r => {
          const c = r[kCateg] || 'Autre';
          if (!byCateg[c]) byCateg[c] = { montant: 0, count: 0 };
          byCateg[c].montant += parseFloat(r[kMontant]) || 0;
          byCateg[c].count++;
        });
      }

      return {
        icon: 'receipt_long',
        module: 'Dépenses',
        cards: [
          total !== null && { label: 'Total dépensé', value: fmt.ar(total), accent: true },
          { label: 'Nb de dépenses', value: fmt.int(results.length), accent: false },
        ].filter(Boolean),
        sections: [
          Object.keys(byCateg).length > 1 && {
            title: 'Par catégorie',
            icon: 'label',
            cols: ['Montant', 'Nb'],
            rows: Object.entries(byCateg)
              .sort((a, b) => b[1].montant - a[1].montant)
              .map(([c, d]) => ({
                label: c,
                cols: [fmt.ar(d.montant), fmt.int(d.count)],
              })),
          },
        ].filter(Boolean),
      };
    },

    /* ── Suivi & Analyse (collecteurs agrégés) ──────────────────────────── */
    analysis(results) {
      // Les items sont construits par analysis.js avec les clés :
      // { collecteur, totalDebits, totalCredits, solde, statut }
      const totalDebits  = sum(results, 'totalDebits');
      const totalCredits = sum(results, 'totalCredits');
      const soldeNet     = totalCredits - totalDebits;

      const byStatut = {};
      results.forEach(r => {
        const st = r.statut || 'Inconnu';
        if (!byStatut[st]) byStatut[st] = { debits: 0, credits: 0, count: 0 };
        byStatut[st].debits  += parseFloat(r.totalDebits)  || 0;
        byStatut[st].credits += parseFloat(r.totalCredits) || 0;
        byStatut[st].count++;
      });

      return {
        icon: 'analytics',
        module: 'Suivi & Analyse',
        cards: [
          { label: 'Collecteurs',    value: fmt.int(results.length), accent: false },
          { label: 'Total crédits', value: fmt.ar(totalCredits),    accent: true  },
          { label: 'Total débits',  value: fmt.ar(totalDebits),     accent: false },
          { label: 'Solde net',     value: fmt.ar(soldeNet),        accent: false },
        ],
        sections: [
          Object.keys(byStatut).length > 0 && {
            title: 'Par statut',
            icon: 'info',
            cols: ['Débits', 'Crédits', 'Nb'],
            rows: Object.entries(byStatut)
              .sort((a, b) => b[1].count - a[1].count)
              .map(([st, d]) => ({
                label: st,
                cols: [fmt.ar(d.debits), fmt.ar(d.credits), fmt.int(d.count)],
              })),
          },
        ].filter(Boolean),
      };
    },

    /* ── Générique (fallback) ───────────────────────────────────────────── */
    generic(results) {
      return {
        icon: 'analytics',
        module: 'Résultats',
        cards: [
          { label: 'Résultats trouvés', value: fmt.int(results.length), accent: true },
        ],
        sections: [],
      };
    },
  };

  /* ══════════════════════════════════════════════════════════════════════════
   * 5. STYLES CSS — injectés une seule fois dans <head>
   * ══════════════════════════════════════════════════════════════════════════ */

  function injectStyles() {
    if (document.getElementById('sa-styles')) return;
    const s = document.createElement('style');
    s.id = 'sa-styles';
    s.textContent = `
/* ── Search Analytics Panel ───────────────────────────────────────────── */
#sa-panel {
  position: fixed;
  top: 72px;
  right: 20px;
  width: 340px;
  max-height: calc(100vh - 96px);
  overflow-y: auto;
  z-index: 1500;
  background: var(--md-sys-color-surface);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: 20px;
  box-shadow:
    0 8px 32px rgba(0,0,0,0.16),
    0 2px 8px rgba(0,0,0,0.08),
    inset 0 1px 0 rgba(255,255,255,0.12);
  transform: translateX(calc(100% + 28px));
  opacity: 0;
  transition:
    transform 0.32s cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity   0.22s ease;
  pointer-events: none;
  scrollbar-width: thin;
  scrollbar-color: var(--md-sys-color-outline-variant) transparent;
}
#sa-panel.sa-visible {
  transform: translateX(0);
  opacity: 1;
  pointer-events: auto;
}

/* ── Header ── */
.sa-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px 12px;
  background: linear-gradient(135deg,
    var(--md-sys-color-primary-container),
    var(--md-sys-color-tertiary-container, var(--md-sys-color-secondary-container)));
  border-radius: 19px 19px 0 0;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  position: relative;
}
.sa-module-icon {
  font-size: 22px !important;
  color: var(--md-sys-color-primary);
  flex-shrink: 0;
}
.sa-header-text {
  flex: 1;
  min-width: 0;
}
.sa-module-name {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: var(--md-sys-color-on-primary-container);
  line-height: 1.2;
}
.sa-query-tag {
  display: inline-block;
  margin-top: 3px;
  font-size: 11px;
  color: var(--md-sys-color-on-surface-variant);
  background: rgba(0,0,0,0.06);
  border-radius: 6px;
  padding: 1px 7px;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}
[data-theme="dark"] .sa-query-tag {
  background: rgba(255,255,255,0.08);
}
.sa-close {
  background: rgba(0,0,0,0.07);
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--md-sys-color-on-surface-variant);
  flex-shrink: 0;
  transition: background 0.18s;
  font-size: 18px !important;
  padding: 0;
  line-height: 1;
}
.sa-close:hover {
  background: rgba(0,0,0,0.13);
}
[data-theme="dark"] .sa-close { background: rgba(255,255,255,0.08); }
[data-theme="dark"] .sa-close:hover { background: rgba(255,255,255,0.15); }

/* ── Cards de stats ── */
.sa-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(88px, 1fr));
  gap: 8px;
  padding: 12px 12px 0;
}
.sa-card {
  background: var(--md-sys-color-surface-variant);
  border-radius: 12px;
  padding: 10px 10px 8px;
  text-align: center;
}
.sa-card--accent {
  background: var(--md-sys-color-primary-container);
}
.sa-card-label {
  display: block;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--md-sys-color-on-surface-variant);
  margin-bottom: 4px;
}
.sa-card--accent .sa-card-label {
  color: var(--md-sys-color-on-primary-container);
  opacity: 0.75;
}
.sa-card-value {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: var(--md-sys-color-on-surface);
  line-height: 1.2;
  word-break: break-all;
}
.sa-card--accent .sa-card-value {
  color: var(--md-sys-color-primary);
  font-size: 14px;
}

/* ── Sections de répartition ── */
.sa-sections {
  padding: 8px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.sa-section {
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: 12px;
  overflow: hidden;
}
.sa-section-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  background: var(--md-sys-color-surface-variant);
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
}
.sa-section-icon {
  font-size: 16px !important;
  color: var(--md-sys-color-primary);
}
.sa-section-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--md-sys-color-on-surface-variant);
}
.sa-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
.sa-table th {
  padding: 5px 8px;
  text-align: right;
  font-weight: 600;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: var(--md-sys-color-on-surface-variant);
  background: var(--md-sys-color-surface-variant);
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
}
.sa-table th:first-child {
  text-align: left;
  padding-left: 10px;
}
.sa-table td {
  padding: 7px 8px;
  text-align: right;
  color: var(--md-sys-color-on-surface);
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  white-space: nowrap;
}
.sa-table tr:last-child td {
  border-bottom: none;
}
.sa-table td:first-child {
  text-align: left;
  padding-left: 10px;
  font-weight: 500;
  color: var(--md-sys-color-on-surface);
  white-space: normal;
  max-width: 120px;
}
.sa-table tr:hover td {
  background: var(--md-sys-color-surface-variant);
}

/* ── État vide ── */
.sa-empty {
  padding: 20px 16px;
  text-align: center;
  color: var(--md-sys-color-on-surface-variant);
  font-size: 13px;
}
.sa-empty .material-icons {
  font-size: 32px;
  display: block;
  margin: 0 auto 8px;
  opacity: 0.4;
}

/* ── Mobile ── */
@media (max-width: 600px) {
  #sa-panel {
    top: auto;
    bottom: 80px;
    right: 12px;
    left: 12px;
    width: auto;
    max-height: 55vh;
    border-radius: 16px;
  }
}
    `;
    document.head.appendChild(s);
  }

  /* ══════════════════════════════════════════════════════════════════════════
   * 6. CONSTRUCTION DU DOM
   * ══════════════════════════════════════════════════════════════════════════ */

  /** Crée ou récupère le panneau #sa-panel */
  function getOrCreatePanel() {
    let panel = document.getElementById('sa-panel');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'sa-panel';
      panel.setAttribute('role', 'complementary');
      panel.setAttribute('aria-label', 'Analyse de recherche');
      document.body.appendChild(panel);
    }
    return panel;
  }

  /** Construit le HTML interne du panneau à partir des données agrégées */
  function buildPanelContent(data, query) {
    /* ── Cards ── */
    const cardsHTML = `
      <div class="sa-cards">
        ${data.cards.map(c => `
          <div class="sa-card${c.accent ? ' sa-card--accent' : ''}">
            <span class="sa-card-label">${c.label}</span>
            <span class="sa-card-value">${c.value}</span>
          </div>
        `).join('')}
      </div>`;

    /* ── Sections ── */
    const sectionsHTML = data.sections.length ? `
      <div class="sa-sections">
        ${data.sections.map(sec => `
          <div class="sa-section">
            <div class="sa-section-header">
              <i class="material-icons sa-section-icon">${sec.icon}</i>
              <span class="sa-section-title">${sec.title}</span>
            </div>
            <table class="sa-table">
              <thead>
                <tr>
                  <th></th>
                  ${sec.cols.map(c => `<th>${c}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${sec.rows.map(row => `
                  <tr>
                    <td>${row.label}</td>
                    ${row.cols.map(v => `<td>${v}</td>`).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `).join('')}
      </div>` : '';

    /* ── Assemblage ── */
    const escapedQuery = query.replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    return `
      <div class="sa-header">
        <i class="material-icons sa-module-icon">${data.icon}</i>
        <div class="sa-header-text">
          <span class="sa-module-name">${data.module}</span>
          <span class="sa-query-tag" title="${escapedQuery}">« ${escapedQuery} »</span>
        </div>
        <button class="sa-close material-icons" onclick="SearchAnalytics.close()" aria-label="Fermer">close</button>
      </div>
      ${cardsHTML}
      ${sectionsHTML}
    `;
  }

  /* ══════════════════════════════════════════════════════════════════════════
   * 7. API PUBLIQUE
   * ══════════════════════════════════════════════════════════════════════════ */

  let _currentTimer = null;

  /**
   * Lance l'analyse et affiche le panneau.
   *
   * @param {string} query       — terme recherché (doit être non vide)
   * @param {Array}  results     — items filtrés retournés par RiseVanillaSearch.filter()
   * @param {string} [module]    — 'receptions'|'advances'|...|'auto' (défaut: 'auto')
   */
  function analyze(query, results, module) {
    injectStyles();

    /* Fermer si aucune query ou aucun résultat */
    if (!query || query.trim().length < 1 || !results || results.length === 0) {
      close();
      return;
    }

    /* Détermination du module */
    const mod = (module && module !== 'auto' && aggregators[module])
      ? module
      : detectModule(results);

    /* Agrégation */
    let data;
    try {
      data = (aggregators[mod] || aggregators.generic)(results);
    } catch (e) {
      console.warn('[SearchAnalytics] Erreur d\'agrégation :', e);
      data = aggregators.generic(results);
    }

    /* Rendu */
    const panel = getOrCreatePanel();
    panel.innerHTML = buildPanelContent(data, query.trim());

    /* Animation d'entrée (légèrement différée pour laisser le DOM se rendre) */
    clearTimeout(_currentTimer);
    _currentTimer = setTimeout(() => panel.classList.add('sa-visible'), 10);
  }

  /** Ferme et masque le panneau */
  function close() {
    const panel = document.getElementById('sa-panel');
    if (!panel) return;
    panel.classList.remove('sa-visible');
  }

  /* Fermeture sur Échap (si le panneau est ouvert) */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      const p = document.getElementById('sa-panel');
      if (p && p.classList.contains('sa-visible')) close();
    }
  });

  return { analyze, close };

})();

/* ══════════════════════════════════════════════════════════════════════════
 * HOOK AUTONOME — Recherche contextuelle par module + fermeture automatique
 *
 * Ce bloc s'installe une fois le DOM prêt.
 * Il ne modifie aucune fonction existante.
 *
 * Responsabilités :
 *   1. Écouter l'input de recherche GLOBALE pour déclencher l'analyse
 *      sur le MODULE ACTUELLEMENT ACTIF (respects la contexte)
 *   2. Filtrer les données UNIQUEMENT du module actif
 *   3. Fermer le panneau au changement de section, vide la recherche, ou changement d'année
 *
 * MODULES SUPPORTÉS :
 *   'reception' → Réceptions
 *   'advances' → Avances  
 *   'remboursements' → Remboursements
 *   'paiements' → Paiements
 *   'expenses' → Dépenses
 *   'delivery' → Livraisons
 *   'analysis' → Suivi & Analyse
 * ══════════════════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  const searchInput = document.getElementById('global-search-input');
  if (!searchInput) return;

  // ── Détection de la section active ──
  function _getActiveSection() {
    const active = document.querySelector('.content-section.active');
    return active ? active.id : null;
  }

  // ── Analyseurs par module ──
  // Chacun filtre UNIQUEMENT les données de son module et appelle SearchAnalytics.analyze()

  function _analyzeReceptions(query) {
    if (!appData?.receptions) { SearchAnalytics.close(); return; }
    
    // Filtrer UNIQUEMENT par année actuelle (cohérence avec les autres analyseurs)
    const dataForYear = (appData.receptions || []).filter(r => {
      if (!r.date) return false;
      const d = new Date(r.date);
      if (Number.isNaN(d.getTime())) return false;
      return d.getFullYear() === (typeof currentYear !== 'undefined' ? currentYear : new Date().getFullYear());
    });
    
    const RECEPTION_FIELDS = ['quality', 'date', 'note', 'collectorName', 'collector', 'collecteurNom'];
    let filtered = RiseVanillaSearch.filter(dataForYear, query, RECEPTION_FIELDS);
    
    // Recherche par collecteur si aucun résultat sur les champs principaux
    if (!filtered.length && appData.collectors) {
      const nq = RiseVanillaSearch.normalize(query);
      filtered = dataForYear.filter(r => {
        const col = appData.collectors.find(c => c.id === r.collectorId);
        return col && RiseVanillaSearch.normalize(col.name).includes(nq);
      });
    }
    
    if (!filtered.length) { SearchAnalytics.close(); return; }
    
    // Enrichir avec le nom du collecteur (requis par l'agrégateur)
    const enriched = filtered.map(r => {
      const col = (appData.collectors || []).find(c => c.id === r.collectorId);
      return { ...r, collecteur: col ? col.name : 'Inconnu' };
    });
    
    SearchAnalytics.analyze(query, enriched, 'receptions');
  }

  function _analyzeAdvances(query) {
    if (!appData?.advances) { SearchAnalytics.close(); return; }
    
    // Filtrer UNIQUEMENT par année (pas de filtres supplémentaires comme collecteur/dates)
    const dataForYear = (appData.advances || []).filter(a => {
      if (!a.date) return false;
      const d = new Date(a.date);
      if (Number.isNaN(d.getTime())) return false;
      return d.getFullYear() === (typeof currentYear !== 'undefined' ? currentYear : new Date().getFullYear());
    });
    
    const ADVANCE_FIELDS = ['motif', 'type', 'note', 'collectorName', 'collector'];
    let filtered = RiseVanillaSearch.filter(dataForYear, query, ADVANCE_FIELDS);
    
    // Recherche par collecteur si aucun résultat
    if (!filtered.length && appData.collectors) {
      const nq = RiseVanillaSearch.normalize(query);
      filtered = dataForYear.filter(a => {
        const col = appData.collectors.find(c => c.id === a.collectorId);
        return col && RiseVanillaSearch.normalize(col.name).includes(nq);
      });
    }
    
    if (!filtered.length) { SearchAnalytics.close(); return; }
    
    const enriched = filtered.map(a => {
      const col = (appData.collectors || []).find(c => c.id === a.collectorId);
      return { ...a, collecteur: col ? col.name : 'Inconnu' };
    });
    
    SearchAnalytics.analyze(query, enriched, 'advances');
  }

  function _analyzeRemboursements(query) {
    if (!appData?.remboursements) { SearchAnalytics.close(); return; }
    
    const dataForYear = (appData.remboursements || []).filter(r => {
      if (!r.date) return false;
      const d = new Date(r.date);
      if (Number.isNaN(d.getTime())) return false;
      return d.getFullYear() === (typeof currentYear !== 'undefined' ? currentYear : new Date().getFullYear());
    });
    
    const REM_FIELDS = ['note', 'montant', 'collectorName', 'collector'];
    let filtered = RiseVanillaSearch.filter(dataForYear, query, REM_FIELDS);
    
    if (!filtered.length && appData.collectors) {
      const nq = RiseVanillaSearch.normalize(query);
      filtered = dataForYear.filter(r => {
        const col = appData.collectors.find(c => c.id === r.collectorId);
        return col && RiseVanillaSearch.normalize(col.name).includes(nq);
      });
    }
    
    if (!filtered.length) { SearchAnalytics.close(); return; }
    
    const enriched = filtered.map(r => {
      const col = (appData.collectors || []).find(c => c.id === r.collectorId);
      return { ...r, collecteur: col ? col.name : 'Inconnu' };
    });
    
    SearchAnalytics.analyze(query, enriched, 'remboursements');
  }

  function _analyzePaiements(query) {
    if (!appData?.paiements) { SearchAnalytics.close(); return; }
    
    const dataForYear = (appData.paiements || []).filter(p => {
      if (!p.date) return false;
      const d = new Date(p.date);
      if (Number.isNaN(d.getTime())) return false;
      return d.getFullYear() === (typeof currentYear !== 'undefined' ? currentYear : new Date().getFullYear());
    });
    
    const PAI_FIELDS = ['note', 'montant', 'solde', 'collectorName', 'collector'];
    let filtered = RiseVanillaSearch.filter(dataForYear, query, PAI_FIELDS);
    
    if (!filtered.length && appData.collectors) {
      const nq = RiseVanillaSearch.normalize(query);
      filtered = dataForYear.filter(p => {
        const col = appData.collectors.find(c => c.id === p.collectorId);
        return col && RiseVanillaSearch.normalize(col.name).includes(nq);
      });
    }
    
    if (!filtered.length) { SearchAnalytics.close(); return; }
    
    const enriched = filtered.map(p => {
      const col = (appData.collectors || []).find(c => c.id === p.collectorId);
      return { ...p, collecteur: col ? col.name : 'Inconnu' };
    });
    
    SearchAnalytics.analyze(query, enriched, 'paiements');
  }

  function _analyzeExpenses(query) {
    if (!appData?.expenses) { SearchAnalytics.close(); return; }
    
    const dataForYear = (appData.expenses || []).filter(e => {
      if (!e.date) return false;
      const d = new Date(e.date);
      if (Number.isNaN(d.getTime())) return false;
      return d.getFullYear() === (typeof currentYear !== 'undefined' ? currentYear : new Date().getFullYear());
    });
    
    const EXP_FIELDS = ['description', 'categorie', 'category', 'note'];
    let filtered = RiseVanillaSearch.filter(dataForYear, query, EXP_FIELDS);
    
    if (!filtered.length) { SearchAnalytics.close(); return; }
    
    SearchAnalytics.analyze(query, filtered, 'depenses');
  }

  function _analyzeDeliveries(query) {
    if (!appData?.deliveries) { SearchAnalytics.close(); return; }
    
    const dataForYear = (appData.deliveries || []).filter(d => {
      if (!d.date) return false;
      const date = new Date(d.date);
      if (Number.isNaN(date.getTime())) return false;
      return date.getFullYear() === (typeof currentYear !== 'undefined' ? currentYear : new Date().getFullYear());
    });
    
    const DEL_FIELDS = ['quality', 'client', 'destinataire', 'acheteur', 'nom_client', 'note'];
    let filtered = RiseVanillaSearch.filter(dataForYear, query, DEL_FIELDS);
    
    if (!filtered.length) { SearchAnalytics.close(); return; }
    
    const enriched = filtered.map(del => {
      const col = (appData.collectors || []).find(c => c.id === del.collectorId);
      return { ...del, collecteur: col ? col.name : 'Inconnu' };
    });
    
    SearchAnalytics.analyze(query, enriched, 'livraisons');
  }

  function _analyzeAnalysis(query) {
    if (!appData?.collectors) { SearchAnalytics.close(); return; }
    
    const nq = RiseVanillaSearch.normalize(query);
    const currentYr = typeof currentYear !== 'undefined' ? currentYear : new Date().getFullYear();
    
    // Filtrer les collecteurs par nom
    let filtered = appData.collectors.filter(c => {
      // Filtrer par année de création
      if (c.createdAt) {
        const cYear = new Date(c.createdAt).getFullYear();
        if (cYear > currentYr) return false;
      }
      // Filtrer par correspondance du nom
      return RiseVanillaSearch.normalize(c.name).includes(nq);
    });
    
    if (!filtered.length) { SearchAnalytics.close(); return; }
    
    // Pré-calculer les maps une seule fois (efficacité)
    const paiMap = {}, rembMap = {}, recMap = {}, advMap = {};
    
    if (appData.paiements) {
      appData.paiements
        .filter(p => p.date && new Date(p.date).getFullYear() === currentYr)
        .forEach(p => { paiMap[p.collectorId] = (paiMap[p.collectorId] || 0) + (p.amount || 0); });
    }
    
    if (appData.remboursements) {
      appData.remboursements
        .filter(r => r.date && new Date(r.date).getFullYear() === currentYr)
        .forEach(r => { rembMap[r.collectorId] = (rembMap[r.collectorId] || 0) + (r.amount || 0); });
    }
    
    if (appData.receptions) {
      appData.receptions
        .filter(r => r.date && new Date(r.date).getFullYear() === currentYr)
        .forEach(r => { recMap[r.collectorId] = (recMap[r.collectorId] || 0) + (r.totalValue || 0); });
    }
    
    if (appData.advances) {
      appData.advances
        .filter(a => a.date && new Date(a.date).getFullYear() === currentYr)
        .forEach(a => { advMap[a.collectorId] = (advMap[a.collectorId] || 0) + (a.amount || 0); });
    }
    
    // Enrichir avec les données financières pre-calculées
    const enriched = filtered.map(c => {
      const totalDebits = (advMap[c.id] || 0) + (paiMap[c.id] || 0);
      const totalCredits = (recMap[c.id] || 0) + (rembMap[c.id] || 0);
      const solde = totalCredits - totalDebits;
      
      return {
        collecteur: c.name,
        totalDebits,
        totalCredits,
        solde,
        statut: solde < 0 ? 'Débiteur' : (solde > 0 ? 'Créditeur' : 'Équilibré'),
      };
    });
    
    SearchAnalytics.analyze(query, enriched, 'analysis');
  }

  // ── Map : section → analyseur ──
  const ANALYZERS = {
    'reception': _analyzeReceptions,
    'advances': _analyzeAdvances,
    'remboursements': _analyzeRemboursements,
    'paiements': _analyzePaiements,
    'expenses': _analyzeExpenses,
    'delivery': _analyzeDeliveries,
    'analysis': _analyzeAnalysis,
  };

  // ── Débounce et dispatch contextuel ──
  let _saTimer = null;
  searchInput.addEventListener('input', function () {
    clearTimeout(_saTimer);
    _saTimer = setTimeout(function () {
      const query = searchInput.value.trim();
      
      if (!query) {
        SearchAnalytics.close();
        return;
      }
      
      const activeSection = _getActiveSection();
      const analyzer = ANALYZERS[activeSection];
      
      if (analyzer && typeof SearchAnalytics !== 'undefined') {
        try {
          analyzer(query);
        } catch (e) {
          console.warn('[SearchAnalytics] Erreur d\'analyse pour la section ' + activeSection + ':', e);
          SearchAnalytics.close();
        }
      } else {
        SearchAnalytics.close();
      }
    }, 200);
  });

  // ── Fermeture au changement de section ──
  document.querySelectorAll('.nav-link[data-section]').forEach(function (link) {
    link.addEventListener('click', function () {
      if (typeof SearchAnalytics !== 'undefined') SearchAnalytics.close();
    });
  });

  // ── Fermeture au changement d'année ──
  document.addEventListener('risevanilla:yearchange', function () {
    if (typeof SearchAnalytics !== 'undefined') SearchAnalytics.close();
  });
  
  const yearEl = document.getElementById('yearMobileRange');
  if (yearEl) {
    yearEl.addEventListener('change', function () {
      if (typeof SearchAnalytics !== 'undefined') SearchAnalytics.close();
    });
  }
});
