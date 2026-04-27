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

