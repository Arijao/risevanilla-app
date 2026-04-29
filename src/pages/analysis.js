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

    // ── Séparer strictement verte vs préparée via vanilleType ──────────
    // getVanilleType() est défini dans qualities.js — retourne 'verte'|'preparee'
    const recVerte    = receptionsYear.filter(r => getVanilleType(r.quality) === 'verte');
    const recPreparee = receptionsYear.filter(r => getVanilleType(r.quality) === 'preparee');

    // ── Agrégats verte ──────────────────────────────────────────────────
    const poidsVerte    = recVerte.reduce((s, r)    => s + (r.netWeight  || 0), 0);
    const valeurVerte   = recVerte.reduce((s, r)    => s + (r.totalValue || 0), 0);
    const prixMoyVerte  = poidsVerte > 0 ? valeurVerte / poidsVerte : 0;

    // ── Agrégats préparée ───────────────────────────────────────────────
    const poidsPrep    = recPreparee.reduce((s, r) => s + (r.netWeight  || 0), 0);
    const valeurPrep   = recPreparee.reduce((s, r) => s + (r.totalValue || 0), 0);
    const prixMoyPrep  = poidsPrep > 0 ? valeurPrep / poidsPrep : 0;

    // ── Total dépenses (charge opérationnelle partagée) ─────────────────
    const totalDepenses = expensesYear.reduce((s, e) => s + (e.amount || 0), 0);

    // ── Prix de revient global (réceptions + dépenses) ──────────────────
    const poidsTotal  = poidsVerte + poidsPrep;
    const valeurTotal = valeurVerte + valeurPrep;
    const prixRevient = poidsTotal > 0
        ? (valeurTotal + totalDepenses) / poidsTotal
        : 0;

    // ── Rendu ───────────────────────────────────────────────────────────
    container.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;">

            <!-- Carte VANILLE VERTE — données strictement filtrées -->
            <div class="summary-insight-card" style="
                border-left: 4px solid #2e7d32;
                background: var(--md-sys-color-surface);">
                <div class="insight-header" style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
                    <span class="material-icons" style="color:#2e7d32;">grass</span>
                    <span style="font-weight:700;font-size:13px;letter-spacing:.5px;color:#2e7d32;">
                        ANALYSE DES POIDS (VANILLE VERTE)
                    </span>
                </div>
                ${poidsVerte > 0 ? `
                <div class="insight-detail" style="margin-bottom:6px;">
                    <span class="material-icons" style="font-size:16px;vertical-align:middle;">scale</span>
                    Poids total reçu : <strong>${poidsVerte.toFixed(2)} kg</strong>
                </div>
                <div class="insight-detail" style="margin-bottom:6px;">
                    <span class="material-icons" style="font-size:16px;vertical-align:middle;">payments</span>
                    Valeur totale : <strong>${formatCurrency(Math.round(valeurVerte))}</strong>
                </div>
                <div class="insight-detail" style="margin-bottom:6px;">
                    <span class="material-icons" style="font-size:16px;vertical-align:middle;">trending_up</span>
                    Prix moyen d'achat : <strong>${formatCurrency(Math.round(prixMoyVerte))}/kg</strong>
                </div>
                <div class="insight-detail" style="font-size:11px;opacity:.7;margin-top:8px;">
                    ${recVerte.length} réception(s) — qualité(s) :
                    ${[...new Set(recVerte.map(r => r.quality))].map(q =>
                        `<span class="status-badge status-${q.toLowerCase()}" style="font-size:10px;">${q}</span>`
                    ).join(' ')}
                </div>` : `
                <div class="insight-detail" style="opacity:.6;">
                    <span class="material-icons" style="font-size:16px;vertical-align:middle;">inbox</span>
                    Aucune réception de vanille verte pour ${currentYear}.
                </div>`}
            </div>

            <!-- Carte VANILLE PRÉPARÉE -->
            <div class="summary-insight-card" style="
                border-left: 4px solid var(--md-sys-color-primary);
                background: var(--md-sys-color-surface);">
                <div class="insight-header" style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
                    <span class="material-icons" style="color:var(--md-sys-color-primary);">verified</span>
                    <span style="font-weight:700;font-size:13px;letter-spacing:.5px;color:var(--md-sys-color-primary);">
                        ANALYSE DES POIDS (VANILLE PRÉPARÉE)
                    </span>
                </div>
                ${poidsPrep > 0 ? `
                <div class="insight-detail" style="margin-bottom:6px;">
                    <span class="material-icons" style="font-size:16px;vertical-align:middle;">scale</span>
                    Poids total reçu : <strong>${poidsPrep.toFixed(2)} kg</strong>
                </div>
                <div class="insight-detail" style="margin-bottom:6px;">
                    <span class="material-icons" style="font-size:16px;vertical-align:middle;">payments</span>
                    Valeur totale : <strong>${formatCurrency(Math.round(valeurPrep))}</strong>
                </div>
                <div class="insight-detail" style="margin-bottom:6px;">
                    <span class="material-icons" style="font-size:16px;vertical-align:middle;">trending_up</span>
                    Prix moyen d'achat : <strong>${formatCurrency(Math.round(prixMoyPrep))}/kg</strong>
                </div>
                <div class="insight-detail" style="font-size:11px;opacity:.7;margin-top:8px;">
                    ${recPreparee.length} réception(s) — qualité(s) :
                    ${[...new Set(recPreparee.map(r => r.quality))].map(q =>
                        `<span class="status-badge status-${q.toLowerCase()}" style="font-size:10px;">${q}</span>`
                    ).join(' ')}
                </div>` : `
                <div class="insight-detail" style="opacity:.6;">
                    <span class="material-icons" style="font-size:16px;vertical-align:middle;">inbox</span>
                    Aucune réception de vanille préparée pour ${currentYear}.
                </div>`}
            </div>

            <!-- Carte PRIX DE REVIENT GLOBAL -->
            <div class="summary-insight-card" style="
                border-left: 4px solid var(--md-sys-color-tertiary);
                background: var(--md-sys-color-surface);">
                <div class="insight-header" style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
                    <span class="material-icons" style="color:var(--md-sys-color-tertiary);">calculate</span>
                    <span style="font-weight:700;font-size:13px;letter-spacing:.5px;color:var(--md-sys-color-tertiary);">
                        PRIX DE REVIENT GLOBAL
                    </span>
                </div>
                <div class="insight-detail" style="margin-bottom:6px;">
                    <span class="material-icons" style="font-size:16px;vertical-align:middle;">scale</span>
                    Poids total toutes qualités : <strong>${poidsTotal.toFixed(2)} kg</strong>
                </div>
                <div class="insight-detail" style="margin-bottom:6px;">
                    <span class="material-icons" style="font-size:16px;vertical-align:middle;">receipt_long</span>
                    Total dépenses : <strong>${formatCurrency(Math.round(totalDepenses))}</strong>
                </div>
                <div class="insight-detail" style="margin-bottom:6px;">
                    <span class="material-icons" style="font-size:16px;vertical-align:middle;">price_check</span>
                    Prix de revient/kg : <strong>${formatCurrency(Math.round(prixRevient))}</strong>
                    <span style="font-size:11px;opacity:.65;"> (achats + charges)</span>
                </div>
                <div class="insight-detail" style="font-size:11px;opacity:.7;margin-top:8px;">
                    <span class="material-icons" style="font-size:14px;vertical-align:middle;">info</span>
                    (Valeur achats + Dépenses) ÷ Poids total
                </div>
            </div>

        </div>`;
}
