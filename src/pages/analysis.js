/* ============================================================
 * ANALYSIS.JS — Analysis table, Prix de Revient, filters
 * RISEVANILLA - Gestion de Collecte de Vanille
 * ============================================================ */

'use strict';

function updateAnalysisTable() {
    const tbody = document.getElementById('analysis-table');
    if (!tbody) return;
    const tableWrapper = tbody.closest('.data-table');
    tbody.innerHTML = '';

    const available = appData.collectors.filter(isCollectorAvailableInCurrentYear);
    if (!available.length) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-state"><div class="material-icons">analytics</div><div>Aucun collecteur pour ${currentYear}</div></td></tr>`;
        if (typeof SearchAnalytics !== 'undefined') SearchAnalytics.close();
        return;
    }

    const filterCollector = document.getElementById('analysis-filter-collector')?.value;
    const filterQuality   = document.getElementById('analysis-filter-quality')?.value;

    let toShow = filterCollector ? available.filter(c => c.id == filterCollector) : available;

    const paiementsYear      = getPaiementsForCurrentYear();
    const remboursementsYear = getRemboursementsForCurrentYear();
    const receptionsYear     = getReceptionsForCurrentYear();

    const paiMap  = {}, rembMap = {}, recMap = {};
    paiementsYear.forEach(p => { paiMap[p.collectorId] = (paiMap[p.collectorId]||0) + p.amount; });
    remboursementsYear.forEach(r => { rembMap[r.collectorId] = (rembMap[r.collectorId]||0) + r.amount; });
    receptionsYear.forEach(r => {
        if (filterQuality && r.quality !== filterQuality) return;
        recMap[r.collectorId] = (recMap[r.collectorId]||0) + r.totalValue;
    });

    // Only show collectors with at least one transaction
    toShow = toShow.filter(c => {
        const adv = getTotalAdvances(c.id);
        return adv > 0 || (paiMap[c.id]||0) > 0 || (recMap[c.id]||0) > 0 || (rembMap[c.id]||0) > 0;
    });

    if (!toShow.length) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-state"><div class="material-icons">inbox</div><div>Aucune transaction pour ${currentYear}</div></td></tr>`;
        if (typeof SearchAnalytics !== 'undefined') SearchAnalytics.close();
        return;
    }

    const fragment = document.createDocumentFragment();
    getPaginatedData(toShow, 'analysis').forEach(c => {
        const totalAdv    = getTotalAdvances(c.id);
        const totalPai    = paiMap[c.id]  || 0;
        const totalDebits = totalAdv + totalPai;
        const totalRec    = recMap[c.id]  || 0;
        const totalRemb   = rembMap[c.id] || 0;
        const totalCred   = totalRec + totalRemb;
        const balance     = totalCred - totalDebits;
        const status      = getCollectorStatus(balance);

        let actionBtn = '';
        if (status.class === 'debiteur') {
            actionBtn = `<button class="btn btn-icon btn-success" onclick="openRemboursementModal(${c.id})" title="Enregistrer remboursement"><span class="material-icons" style="color:white;">paid</span></button>`;
        } else if (status.class === 'crediteur' && balance > 0) {
            actionBtn = `<button class="btn btn-icon btn-primary" onclick="payCollectorCredit(${c.id})" title="Payer solde créditeur"><span class="material-icons">payments</span></button>`;
        }

        const _q = document.getElementById('global-search-input')?.value?.trim() || '';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td data-label="Collecteur"></td>
            <td data-label="Total Débits">${formatCurrency(totalDebits)}</td>
            <td data-label="Total Crédits">${formatCurrency(totalCred)}</td>
            <td data-label="Solde">${formatCurrency(balance)}</td>
            <td data-label="Statut"><span class="status-badge status-${status.class}">${status.label}</span></td>
            <td class="actions-cell">
                <button class="btn btn-icon btn-outline" onclick="showCollectorDetails(${c.id})" title="Détails"><span class="material-icons">visibility</span></button>
                ${actionBtn}
            </td>`;
        // Avatar collecteur
        const collTd = row.querySelector('td[data-label="Collecteur"]');
        if (collTd) {
            collTd.dataset.noHighlight = '1'; // ← protège l'avatar du highlightTable
            const avatarCell = renderCollectorAvatar(c, false);
            const nameSpan = document.createElement('span');
            nameSpan.innerHTML = RiseVanillaSearch.highlightText(c.name, _q);
            avatarCell.appendChild(nameSpan);
            collTd.appendChild(avatarCell);
        }
        fragment.appendChild(row);
    });

    tbody.appendChild(fragment);

    let pDiv = tableWrapper?.querySelector('.pagination-controls');
    if (!pDiv && tableWrapper) { pDiv = document.createElement('div'); pDiv.className='pagination-controls'; tableWrapper.appendChild(pDiv); }
    if (pDiv) pDiv.innerHTML = createPaginationControls('analysis', toShow.length);
    initTableSorting();

    // ── SearchAnalytics : synthèse collecteurs filtrés si recherche active
    if (typeof SearchAnalytics !== 'undefined') {
        const _qA = document.getElementById('global-search-input')?.value?.trim() || '';
        if (_qA && toShow.length) {
            const _analyticsItems = toShow.map(c => ({
                collecteur:   c.name,
                totalDebits:  getTotalAdvances(c.id) + (paiMap[c.id] || 0),
                totalCredits: (recMap[c.id] || 0) + (rembMap[c.id] || 0),
                solde:        ((recMap[c.id] || 0) + (rembMap[c.id] || 0)) -
                              (getTotalAdvances(c.id) + (paiMap[c.id] || 0)),
                statut:       getCollectorStatus(
                                  ((recMap[c.id] || 0) + (rembMap[c.id] || 0)) -
                                  (getTotalAdvances(c.id) + (paiMap[c.id] || 0))
                              ).label,
            }));
            SearchAnalytics.analyze(_qA, _analyticsItems, 'analysis');
        } else {
            SearchAnalytics.close();
        }
    }
}

function filterAnalysisByStatus(statusClass) {
    const tbody = document.getElementById('analysis-table');
    if (!tbody) return;
    tbody.querySelectorAll('tr').forEach(row => {
        if (row.querySelector('.empty-state')) return;
        const badge = row.querySelector('.status-badge');
        if (badge) row.style.display = badge.classList.contains(`status-${statusClass}`) ? '' : 'none';
    });
}

function filterAnalysisForDebtors() { filterAnalysisByStatus('debiteur'); }

function resetAnalysisView() {
    const selC = document.getElementById('analysis-filter-collector');
    const selQ = document.getElementById('analysis-filter-quality');
    if (selC) selC.value = '';
    if (selQ) selQ.value = '';
    updateAnalysisTable();
    document.querySelectorAll('#analysis-table tr').forEach(r => r.style.display = '');
    showToast('Filtres réinitialisés.', 'success', 2000);
}

function showAllInAnalysis() {
    const selC = document.getElementById('analysis-filter-collector');
    const selQ = document.getElementById('analysis-filter-quality');
    if (selC) selC.value = '';
    if (selQ) selQ.value = '';
    updateAnalysisTable();
    document.querySelectorAll('#analysis-table tr').forEach(r => r.style.display = '');
    showToast('Affichage de tous les collecteurs.', 'success', 2000);
}


/* ============================================================
 * PRIX DE REVIENT — Analyse des poids par type de vanille
 * Peuple #prix-revient-container
 * Appelé par updateAllTables() via table.js ligne 79
 * ============================================================ */

function updatePrixRevientAnalysis() {
    const container = document.getElementById('prix-revient-container');
    if (!container) return;

    const receptionsYear = getReceptionsForCurrentYear();
    const expensesYear   = getExpensesForCurrentYear();

    if (!receptionsYear.length) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="material-icons">hourglass_empty</span>
                <div>Aucune réception de vanille pour calculer le prix de revient.</div>
            </div>`;
        return;
    }

    // ── Filtrage strict par vanilleType (source de vérité : qualities.js) ──
    const recVerte    = receptionsYear.filter(r => getVanilleType(r.quality) === 'verte');
    const recPreparee = receptionsYear.filter(r => getVanilleType(r.quality) === 'preparee');

    // ── Agrégats ────────────────────────────────────────────────────────────
    const poidsVerte   = recVerte.reduce((s, r)    => s + (r.netWeight  || 0), 0);
    const valeurVerte  = recVerte.reduce((s, r)    => s + (r.totalValue || 0), 0);
    const prixMoyVerte = poidsVerte > 0 ? valeurVerte / poidsVerte : 0;

    const poidsPrep    = recPreparee.reduce((s, r) => s + (r.netWeight  || 0), 0);
    const valeurPrep   = recPreparee.reduce((s, r) => s + (r.totalValue || 0), 0);
    const prixMoyPrep  = poidsPrep > 0 ? valeurPrep / poidsPrep : 0;

    const totalDepenses = expensesYear.reduce((s, e) => s + (e.amount || 0), 0);
    const poidsTotal    = poidsVerte + poidsPrep;
    const valeurTotal   = valeurVerte + valeurPrep;
    const prixRevient   = poidsTotal > 0 ? (valeurTotal + totalDepenses) / poidsTotal : 0;

    // ── Helper : badge qualité ───────────────────────────────────────────────
    function qualBadges(recs) {
        return [...new Set(recs.map(r => r.quality))]
            .map(q => `<span class="status-badge status-${q.toLowerCase()}"
                              style="font-size:10px;padding:2px 7px;">${q}</span>`)
            .join('');
    }

    // ── Helper : ligne métrique ──────────────────────────────────────────────
    function metricRow(icon, label, value) {
        return `
        <div style="display:flex;align-items:center;gap:10px;padding:8px 0;
                    border-bottom:1px solid var(--md-sys-color-outline-variant);">
            <span class="material-icons"
                  style="font-size:17px;color:var(--md-sys-color-on-surface-variant);flex-shrink:0;">${icon}</span>
            <span style="flex:1;font-size:12px;color:var(--md-sys-color-on-surface-variant);">${label}</span>
            <strong style="font-size:13px;color:var(--md-sys-color-on-surface);white-space:nowrap;">${value}</strong>
        </div>`;
    }

    // ── Helper : carte glassmorphism ─────────────────────────────────────────
    function buildCard({ accentColor, icon, iconBg, titleLabel, subtitle,
                         metrics, emptyMsg, badges, badgeCount, badgeTotal }) {
        const metricsHtml = metrics.length
            ? metrics.map(m => metricRow(m.icon, m.label, m.value)).join('')
            : `<div style="display:flex;align-items:center;gap:8px;padding:12px 0;
                           color:var(--md-sys-color-on-surface-variant);font-size:13px;opacity:.7;">
                   <span class="material-icons" style="font-size:18px;">inbox</span>${emptyMsg}
               </div>`;

        const badgesHtml = badges
            ? `<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:14px;padding-top:10px;
                           border-top:1px solid var(--md-sys-color-outline-variant);">
                   <span style="font-size:11px;color:var(--md-sys-color-on-surface-variant);
                                align-self:center;margin-right:2px;">${badgeCount} réc. ·</span>
                   ${badges}
               </div>`
            : '';

        return `
        <div style="
            flex:1;min-width:220px;
            background:var(--md-sys-color-surface);
            border:1px solid var(--md-sys-color-outline-variant);
            border-top:3px solid ${accentColor};
            border-radius:16px;
            padding:20px;
            box-shadow:0 2px 12px rgba(0,0,0,0.06);
            display:flex;flex-direction:column;gap:0;
            transition:box-shadow .2s ease;
            position:relative;overflow:hidden;">

            <!-- Halo décoratif subtil -->
            <div style="
                position:absolute;top:-32px;right:-32px;
                width:90px;height:90px;border-radius:50%;
                background:${iconBg};opacity:.18;pointer-events:none;"></div>

            <!-- En-tête -->
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
                <div style="
                    width:38px;height:38px;border-radius:10px;
                    background:${iconBg};
                    display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                    <span class="material-icons" style="font-size:20px;color:${accentColor};">${icon}</span>
                </div>
                <div>
                    <div style="font-size:11px;font-weight:700;letter-spacing:.6px;
                                color:${accentColor};text-transform:uppercase;">${titleLabel}</div>
                    <div style="font-size:11px;color:var(--md-sys-color-on-surface-variant);margin-top:1px;">${subtitle}</div>
                </div>
            </div>

            <!-- Métriques -->
            <div style="flex:1;">${metricsHtml}</div>

            <!-- Badges qualités -->
            ${badgesHtml}
        </div>`;
    }

    // ── Construction des 3 cartes ────────────────────────────────────────────
    const cardVerte = buildCard({
        accentColor: '#2e7d32',
        icon:        'grass',
        iconBg:      'rgba(46,125,50,.12)',
        titleLabel:  'Analyse des poids — Vanille Verte',
        subtitle:    'Réceptions non préparées',
        metrics: poidsVerte > 0 ? [
            { icon: 'scale',        label: 'Poids total reçu',     value: `${poidsVerte.toFixed(2)} kg` },
            { icon: 'payments',     label: 'Valeur totale',         value: formatCurrency(Math.round(valeurVerte)) },
            { icon: 'trending_up',  label: "Prix moyen d'achat",   value: `${formatCurrency(Math.round(prixMoyVerte))}/kg` },
        ] : [],
        emptyMsg:   `Aucune réception verte pour ${currentYear}`,
        badges:     poidsVerte > 0 ? qualBadges(recVerte) : null,
        badgeCount: recVerte.length,
    });

    const cardPreparee = buildCard({
        accentColor: 'var(--md-sys-color-primary)',
        icon:        'verified',
        iconBg:      'rgba(103,80,164,.12)',
        titleLabel:  'Analyse des poids — Vanille Préparée',
        subtitle:    'Réceptions livrables à l\'exportateur',
        metrics: poidsPrep > 0 ? [
            { icon: 'scale',        label: 'Poids total reçu',     value: `${poidsPrep.toFixed(2)} kg` },
            { icon: 'payments',     label: 'Valeur totale',         value: formatCurrency(Math.round(valeurPrep)) },
            { icon: 'trending_up',  label: "Prix moyen d'achat",   value: `${formatCurrency(Math.round(prixMoyPrep))}/kg` },
        ] : [],
        emptyMsg:   `Aucune réception préparée pour ${currentYear}`,
        badges:     poidsPrep > 0 ? qualBadges(recPreparee) : null,
        badgeCount: recPreparee.length,
    });

    const cardGlobal = buildCard({
        accentColor: 'var(--md-sys-color-tertiary)',
        icon:        'calculate',
        iconBg:      'rgba(125,82,96,.12)',
        titleLabel:  'Prix de Revient Global',
        subtitle:    'Toutes qualités confondues',
        metrics: [
            { icon: 'scale',         label: 'Poids total (toutes qualités)', value: `${poidsTotal.toFixed(2)} kg` },
            { icon: 'receipt_long',  label: 'Total dépenses opérations',     value: formatCurrency(Math.round(totalDepenses)) },
            { icon: 'price_check',   label: 'Prix de revient/kg',            value: `${formatCurrency(Math.round(prixRevient))}/kg` },
        ],
        emptyMsg:   '',
        badges:     null,
        badgeCount: 0,
    });

    container.innerHTML = `
        <div style="display:flex;flex-wrap:wrap;gap:16px;">
            ${cardVerte}
            ${cardPreparee}
            ${cardGlobal}
        </div>`;
}
