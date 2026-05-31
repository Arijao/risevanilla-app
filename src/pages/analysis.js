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

    let toShow = available;

    const paiementsYear      = getPaiementsForCurrentYear();
    const remboursementsYear = getRemboursementsForCurrentYear();
    const receptionsYear     = getReceptionsForCurrentYear();

    const paiMap  = {}, rembMap = {}, recMap = {};
    paiementsYear.forEach(p => { paiMap[p.collectorId] = (paiMap[p.collectorId]||0) + p.amount; });
    remboursementsYear.forEach(r => { rembMap[r.collectorId] = (rembMap[r.collectorId]||0) + r.amount; });
    receptionsYear.forEach(r => {
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
    updateAnalysisTable();
    document.querySelectorAll('#analysis-table tr').forEach(r => r.style.display = '');
    showToast('Filtres réinitialisés.', 'success', 2000);
}

function showAllInAnalysis() {
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

            <!-- ── CARTE VANILLE VERTE ── -->
            <div class="summary-insight-card summary-insight-card--verte">
                <div class="card-accent-bar"></div>

                <div class="insight-header-v2">
                    <div class="insight-icon-wrap">
                        <span class="material-icons">grass</span>
                    </div>
                    <div>
                        <div class="insight-title-text">Analyse des Poids</div>
                        <div class="insight-title-sub">Vanille Verte</div>
                    </div>
                </div>

                ${poidsVerte > 0 ? `
                <div class="insight-metrics">
                    <div class="insight-metric-row">
                        <div class="insight-metric-left">
                            <span class="material-icons">scale</span>
                            <span class="insight-metric-label">Poids total reçu</span>
                        </div>
                        <span class="insight-metric-value">${poidsVerte.toFixed(2)} kg</span>
                    </div>
                    <div class="insight-metric-row">
                        <div class="insight-metric-left">
                            <span class="material-icons">payments</span>
                            <span class="insight-metric-label">Valeur totale</span>
                        </div>
                        <span class="insight-metric-value">${formatCurrency(Math.round(valeurVerte))}</span>
                    </div>
                    <div class="insight-metric-row insight-metric-row--highlight">
                        <div class="insight-metric-left">
                            <span class="material-icons">trending_up</span>
                            <span class="insight-metric-label">Prix moyen d'achat</span>
                        </div>
                        <span class="insight-metric-value">${formatCurrency(Math.round(prixMoyVerte))}/kg</span>
                    </div>
                </div>

                <div class="insight-footer-v2">
                    <span class="insight-rec-count">${recVerte.length} réception${recVerte.length > 1 ? 's' : ''}</span>
                    <span class="insight-footer-label">Qualités :</span>
                    ${[...new Set(recVerte.map(r => r.quality))].map(q => {
                        const qRecs = recVerte.filter(r => r.quality === q);
                        const qPoids = qRecs.reduce((s,r) => s+(r.netWeight||0),0);
                        const qVal   = qRecs.reduce((s,r) => s+(r.totalValue||0),0);
                        return `<span class="status-badge status-${q.toLowerCase().replace(/\s+/g, '-')} quality-badge-clickable" style="font-size:10px;cursor:pointer;" onclick="showQualityDetail('${q}','verte',${qPoids.toFixed(3)},${Math.round(qVal)},${qRecs.length})" title="Voir détail ${q}">${q}</span>`;
                    }).join('')}
                </div>` : `
                <div class="insight-metric-row" style="opacity:.6;">
                    <div class="insight-metric-left">
                        <span class="material-icons">inbox</span>
                        <span class="insight-metric-label">Aucune réception pour ${currentYear}.</span>
                    </div>
                </div>`}
            </div>

            <!-- ── CARTE VANILLE PRÉPARÉE ── -->
            <div class="summary-insight-card summary-insight-card--preparee">
                <div class="card-accent-bar"></div>

                <div class="insight-header-v2">
                    <div class="insight-icon-wrap">
                        <span class="material-icons">verified</span>
                    </div>
                    <div>
                        <div class="insight-title-text">Analyse des Poids</div>
                        <div class="insight-title-sub">Vanille Préparée</div>
                    </div>
                </div>

                ${poidsPrep > 0 ? `
                <div class="insight-metrics">
                    <div class="insight-metric-row">
                        <div class="insight-metric-left">
                            <span class="material-icons">scale</span>
                            <span class="insight-metric-label">Poids total reçu</span>
                        </div>
                        <span class="insight-metric-value">${poidsPrep.toFixed(2)} kg</span>
                    </div>
                    <div class="insight-metric-row">
                        <div class="insight-metric-left">
                            <span class="material-icons">payments</span>
                            <span class="insight-metric-label">Valeur totale</span>
                        </div>
                        <span class="insight-metric-value">${formatCurrency(Math.round(valeurPrep))}</span>
                    </div>
                    <div class="insight-metric-row insight-metric-row--highlight">
                        <div class="insight-metric-left">
                            <span class="material-icons">trending_up</span>
                            <span class="insight-metric-label">Prix moyen d'achat</span>
                        </div>
                        <span class="insight-metric-value">${formatCurrency(Math.round(prixMoyPrep))}/kg</span>
                    </div>
                </div>

                <div class="insight-footer-v2">
                    <span class="insight-rec-count">${recPreparee.length} réception${recPreparee.length > 1 ? 's' : ''}</span>
                    <span class="insight-footer-label">Qualités :</span>
                    ${[...new Set(recPreparee.map(r => r.quality))].map(q => {
                        const qRecs = recPreparee.filter(r => r.quality === q);
                        const qPoids = qRecs.reduce((s,r) => s+(r.netWeight||0),0);
                        const qVal   = qRecs.reduce((s,r) => s+(r.totalValue||0),0);
                        return `<span class="status-badge status-${q.toLowerCase().replace(/\s+/g, '-')} quality-badge-clickable" style="font-size:10px;cursor:pointer;" onclick="showQualityDetail('${q}','preparee',${qPoids.toFixed(3)},${Math.round(qVal)},${qRecs.length})" title="Voir détail ${q}">${q}</span>`;
                    }).join('')}
                </div>` : `
                <div class="insight-metric-row" style="opacity:.6;">
                    <div class="insight-metric-left">
                        <span class="material-icons">inbox</span>
                        <span class="insight-metric-label">Aucune réception pour ${currentYear}.</span>
                    </div>
                </div>`}
            </div>

            <!-- ── CARTE PRIX DE REVIENT GLOBAL ── -->
            <div class="summary-insight-card summary-insight-card--global">
                <div class="card-accent-bar"></div>

                <div class="insight-header-v2">
                    <div class="insight-icon-wrap">
                        <span class="material-icons">calculate</span>
                    </div>
                    <div>
                        <div class="insight-title-text">Prix de Revient Global</div>
                        <div class="insight-title-sub">Toutes qualités</div>
                    </div>
                </div>

                <div class="insight-metrics">
                    <div class="insight-metric-row">
                        <div class="insight-metric-left">
                            <span class="material-icons">scale</span>
                            <span class="insight-metric-label">Poids total</span>
                        </div>
                        <span class="insight-metric-value">${poidsTotal.toFixed(2)} kg</span>
                    </div>
                    <div class="insight-metric-row">
                        <div class="insight-metric-left">
                            <span class="material-icons">receipt_long</span>
                            <span class="insight-metric-label">Total dépenses</span>
                        </div>
                        <span class="insight-metric-value">${formatCurrency(Math.round(totalDepenses))}</span>
                    </div>
                    <div class="insight-metric-row insight-metric-row--highlight">
                        <div class="insight-metric-left">
                            <span class="material-icons">price_check</span>
                            <span class="insight-metric-label">Prix de revient/kg</span>
                        </div>
                        <span class="insight-metric-value">${formatCurrency(Math.round(prixRevient))}/kg</span>
                    </div>
                </div>

                <div class="insight-info-note">
                    <span class="material-icons">info</span>
                    (Valeur achats + Dépenses) ÷ Poids total
                </div>
            </div>

        </div>`;
}

/* ============================================================
 * QUALITY DETAIL POPUP — Clic sur badge qualité dans les cards
 * ============================================================ */

function showQualityDetail(quality, type, poids, valeur, nbRec) {
    const titleEl = document.getElementById('quality-detail-modal-title');
    const bodyEl  = document.getElementById('quality-detail-modal-body');
    if (!titleEl || !bodyEl) return;

    const typeLabel  = type === 'verte' ? 'Vanille Verte' : 'Vanille Préparée';
    const typeIcon   = type === 'verte' ? 'grass' : 'verified';
    const prixMoy    = poids > 0 ? Math.round(valeur / poids) : 0;

    titleEl.innerHTML = `<span class="material-icons">${typeIcon}</span> ${quality}`;

    bodyEl.innerHTML = `
        <div class="quality-detail-type-label">${typeLabel}</div>
        <div class="quality-detail-metrics">
            <div class="quality-detail-row">
                <div class="quality-detail-row__left">
                    <span class="material-icons">tag</span>
                    <span>Réceptions</span>
                </div>
                <span class="quality-detail-row__value">${nbRec} réception${nbRec > 1 ? 's' : ''}</span>
            </div>
            <div class="quality-detail-row">
                <div class="quality-detail-row__left">
                    <span class="material-icons">scale</span>
                    <span>Poids total</span>
                </div>
                <span class="quality-detail-row__value">${Number(poids).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg</span>
            </div>
            <div class="quality-detail-row">
                <div class="quality-detail-row__left">
                    <span class="material-icons">payments</span>
                    <span>Valeur totale</span>
                </div>
                <span class="quality-detail-row__value">${formatCurrency(valeur)}</span>
            </div>
            <div class="quality-detail-row quality-detail-row--highlight">
                <div class="quality-detail-row__left">
                    <span class="material-icons">trending_up</span>
                    <span>Prix moyen</span>
                </div>
                <span class="quality-detail-row__value">${formatCurrency(prixMoy)}/kg</span>
            </div>
        </div>`;

    openModal('quality-detail-modal');
}
