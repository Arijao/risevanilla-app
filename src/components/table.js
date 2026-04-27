/* ============================================================
 * TABLE.JS — Tables: Collectors, Receptions, Qualities
 * RISEVANILLA - Gestion de Collecte de Vanille
 *
 * NOTE ARCHITECTURE — les autres tables sont dans:
 *   advances.js   → updateAdvancesTable, updateRemboursementsTable, updatePaiementsTable
 *   deliveries.js → updateDeliveryTable
 *   expenses.js   → updateExpensesTable
 *   analysis.js   → updateAnalysisTable
 * ============================================================ */

'use strict';

// ── Avatar collecteur ─────────────────────────────────────────
/**
 * Génère un élément DOM (div.collector-avatar-cell) affichant
 * la photo du collecteur (ou ses initiales colorées si absent).
 *
 * @param {{ name?: string, photo?: string }|null} collector
 * @param {boolean} withName - afficher le nom à côté de l'avatar
 * @returns {HTMLElement}
 */
function renderCollectorAvatar(collector, withName = true) {
    const wrap = document.createElement('div');
    wrap.className = 'collector-avatar-cell';

    if (collector && collector.photo) {
        const img = document.createElement('img');
        img.className = 'collector-avatar';
        img.src = collector.photo;
        img.alt = collector.name || '';
        img.loading = 'lazy';
        img.title = collector.name || '';
        wrap.appendChild(img);
    } else {
        // Initiales (1 ou 2 lettres)
        const initials = (collector && collector.name)
            ? collector.name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()
            : '?';
        // Couleur déterministe selon le nom — évite les couleurs aléatoires au rechargement
        const hue = (collector && collector.name)
            ? [...collector.name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 360
            : 0;
        const ph = document.createElement('div');
        ph.className = 'collector-avatar-placeholder';
        ph.textContent = initials;
        ph.title = collector && collector.name ? collector.name : '';
        ph.style.background =
            `linear-gradient(135deg, hsl(${hue},55%,42%) 0%, hsl(${(hue + 45) % 360},65%,54%) 100%)`;
        wrap.appendChild(ph);
    }

    if (withName) {
        const span = document.createElement('span');
        span.textContent = (collector && collector.name) ? collector.name : '—';
        wrap.appendChild(span);
    }

    return wrap;
}

// ── Point d'entrée global ─────────────────────────────────────
function updateAllTables() {
    invalidateCache();
    buildCache();
    updateCollectorSelects();
    updateQualitySelect();
    updateAnalysisQualityFilter();
    updateCollectorsTable();
    updateAdvancesTable();
    updateReceptionTable();
    updateDeliveryTable();
    updateExpensesTable();
    updateRemboursementsTable();
    updatePaiementsTable();
    updateAnalysisTable();
    updateQualitiesTable();
    updateEnhancedDashboard();
    updatePrixRevientAnalysis();
    updateCharts();
}

// ── Collector Selects ─────────────────────────────────────────
function updateCollectorSelects() {
    const selectIds = [
        'advance-collector',
        'reception-collector',
        'advance-filter-collector',
        'analysis-filter-collector'
    ];
    selectIds.forEach(id => {
        const select = document.getElementById(id);
        if (!select) return;
        const current = select.value;
        while (select.children.length > 1) select.removeChild(select.lastChild);
        appData.collectors
            .filter(isCollectorAvailableInCurrentYear)
            .forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.textContent = c.name;
                select.appendChild(opt);
            });
        select.value = current;
    });
}

// ── Collectors Table ──────────────────────────────────────────
function updateCollectorsTable() {
    const tbody = document.getElementById('collectors-table');
    if (!tbody) return;
    const tableWrapper = tbody.closest('.data-table');
    tbody.innerHTML = '';

    const available = appData.collectors.filter(isCollectorAvailableInCurrentYear);

    if (!available.length) {
        tbody.innerHTML = `
            <tr><td colspan="8" class="empty-state">
                <div class="material-icons">people_outline</div>
                <div>Aucun collecteur pour l'année ${currentYear}</div>
            </td></tr>`;
        return;
    }

    getPaginatedData(available, 'collectors').forEach(c => {
        const balance = getCachedBalance(c.id);
        const status  = getCollectorStatus(balance);
        const row = document.createElement('tr');
        const _q = document.getElementById('global-search-input')?.value?.trim() || '';
        row.innerHTML = `
            <td data-label="Nom"></td>
            <td data-label="Téléphone">${RiseVanillaSearch.highlightText(formatPhoneNumberForDisplay(c.phone), _q)}</td>
            <td data-label="C.I.N">${RiseVanillaSearch.highlightText(c.cin || '', _q)}</td>
            <td data-label="Délivré le">${c.cinDate ? formatDate(c.cinDate) : ''}</td>
            <td data-label="Adresse">${RiseVanillaSearch.highlightText(c.address || '', _q)}</td>
            <td data-label="Statut">
                <span class="status-badge status-${status.class}">${status.label}</span>
            </td>
            <td data-label="Solde">${formatCurrency(Math.abs(balance))}</td>
            <td class="actions-cell">
                <button class="btn btn-icon btn-outline"
                        onclick="openCollectorModal(${c.id})" title="Modifier">
                    <span class="material-icons">edit</span>
                </button>
                <button class="btn btn-icon btn-danger"
                        onclick="deleteCollector(${c.id})" title="Supprimer">
                    <span class="material-icons">delete</span>
                </button>
                <button class="btn btn-icon btn-secondary"
                        onclick="showCollectorDetails(${c.id})" title="Voir détails">
                    <span class="material-icons">visibility</span>
                </button>
            </td>`;
        // Injecter avatar dans la cellule Nom
        const nameTd = row.querySelector('td[data-label="Nom"]');
        if (nameTd) {
            nameTd.dataset.noHighlight = '1'; // ← protège l'avatar du highlightTable
            const avatarCell = renderCollectorAvatar(c, false);
            const nameSpan = document.createElement('span');
            nameSpan.innerHTML = RiseVanillaSearch.highlightText(c.name, _q);
            avatarCell.appendChild(nameSpan);
            nameTd.appendChild(avatarCell);
        }
        tbody.appendChild(row);
    });

    _setPagination(tableWrapper, 'collectors', available.length);
    initTableSorting();
}

// ── Receptions Table ──────────────────────────────────────────
function updateReceptionTable() {
    const tbody = document.getElementById('reception-table');
    if (!tbody) return;
    const tableWrapper = tbody.closest('.data-table');
    tbody.innerHTML = '';

    const recs = getReceptionsForCurrentYear();

    if (!recs.length) {
        tbody.innerHTML = `
            <tr><td colspan="8" class="empty-state">
                <div class="material-icons">inventory</div>
                <div>Aucune réception pour ${currentYear}</div>
            </td></tr>`;
        return;
    }

    getPaginatedData(recs, 'receptions').forEach(r => {
        const collector  = appData.collectors.find(c => c.id === r.collectorId);
        const grossWeight = parseFloat((r.grossWeight || 0).toFixed(2));
        const netWeight   = parseFloat((r.netWeight   || 0).toFixed(2));
        const price       = parseFloat((r.price       || 0).toFixed(0));
        const totalValue  = parseFloat((r.totalValue  || 0).toFixed(0));
        const qualClass   = (r.quality || '').toLowerCase();

        const row = document.createElement('tr');
        const _q = document.getElementById('global-search-input')?.value?.trim() || '';
        row.innerHTML = `
            <td data-label="Date">${formatDate(r.date)}</td>
            <td data-label="Collecteur"></td>
            <td data-label="Poids Brut">${grossWeight} kg</td>
            <td data-label="Poids Net">${netWeight} kg</td>
            <td data-label="Qualité">
                <span class="status-badge status-${qualClass}">${RiseVanillaSearch.highlightText(r.quality || '—', _q)}</span>
            </td>
            <td data-label="Prix/kg">${formatCurrency(price)}/kg</td>
            <td data-label="Valeur">${formatCurrency(totalValue)}</td>
            <td class="actions-cell">
                <button class="btn btn-icon btn-secondary"
                        onclick="openAdjustModal(${r.id})" title="Ajuster tri">
                    <span class="material-icons">tune</span>
                </button>
                <button class="btn btn-icon btn-outline"
                        onclick="openReceptionModal(${r.id})" title="Modifier">
                    <span class="material-icons">edit</span>
                </button>
                <button class="btn btn-icon btn-danger"
                        onclick="deleteReception(${r.id})" title="Supprimer">
                    <span class="material-icons">delete</span>
                </button>
                <button class="btn btn-icon btn-secondary"
                        onclick="generateReceipt(${r.id})" title="Imprimer reçu">
                    <span class="material-icons">print</span>
                </button>
            </td>`;
        // Avatar collecteur
        const collTd = row.querySelector('td[data-label="Collecteur"]');
        if (collTd) {
            if (collector) {
                collTd.dataset.noHighlight = '1'; // ← protège l'avatar du highlightTable
                const avatarCell = renderCollectorAvatar(collector, false);
                const nameSpan = document.createElement('span');
                nameSpan.innerHTML = RiseVanillaSearch.highlightText(collector.name, _q);
                avatarCell.appendChild(nameSpan);
                collTd.appendChild(avatarCell);
            } else {
                collTd.innerHTML = '<em style="opacity:.6">Supprimé</em>';
            }
        }
        tbody.appendChild(row);
    });

    _setPagination(tableWrapper, 'receptions', recs.length);
    initTableSorting();
}

// ── Qualities Table ───────────────────────────────────────────
function updateQualitiesTable() {
    const tbody = document.getElementById('qualities-table');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!appData.qualities || !appData.qualities.length) {
        tbody.innerHTML = `
            <tr><td colspan="3" class="empty-state">
                <div class="material-icons">grade</div>
                <div>Aucune qualité définie.</div>
            </td></tr>`;
        return;
    }

    appData.qualities.forEach(q => {
        const row = document.createElement('tr');
        const _q = document.getElementById('global-search-input')?.value?.trim() || '';
        row.innerHTML = `
            <td data-label="Nom">${RiseVanillaSearch.highlightText(q.name, _q)}</td>
            <td data-label="Description">${RiseVanillaSearch.highlightText(q.description || '', _q)}</td>
            <td class="actions-cell">
                <button class="btn btn-icon btn-outline"
                        onclick="openQualityModal(${q.id})" title="Modifier">
                    <span class="material-icons">edit</span>
                </button>
                <button class="btn btn-icon btn-danger"
                        onclick="deleteQuality(${q.id})" title="Supprimer">
                    <span class="material-icons">delete</span>
                </button>
            </td>`;
        tbody.appendChild(row);
    });
}

// ── Quality Datalist & Filters ────────────────────────────────
function updateQualitySelect() {
    const datalist = document.getElementById('quality-list');
    if (!datalist) return;
    datalist.innerHTML = '';
    (appData.qualities || []).forEach(q => {
        const opt = document.createElement('option');
        opt.value = q.name;
        datalist.appendChild(opt);
    });
    // Sync delivery quality datalist too
    const dlDelivery = document.getElementById('delivery-quality-list');
    if (dlDelivery) dlDelivery.innerHTML = datalist.innerHTML;
}

function updateAnalysisQualityFilter() {
    const select = document.getElementById('analysis-filter-quality');
    if (!select) return;
    const current = select.value;
    while (select.children.length > 1) select.removeChild(select.lastChild);
    (appData.qualities || []).forEach(q => {
        const opt = document.createElement('option');
        opt.value = q.name;
        opt.textContent = q.name;
        select.appendChild(opt);
    });
    select.value = current;
}

// ── Table Sorting ─────────────────────────────────────────────
function initTableSorting() {
    document.querySelectorAll('.data-table th').forEach(th => {
        if (th._sortBound) return;
        th._sortBound = true;
        th.style.cursor = 'pointer';
        th.addEventListener('click', function () {
            const table = this.closest('table');
            const idx   = [...this.parentElement.children].indexOf(this);
            const asc   = this.classList.contains('asc');

            table.querySelectorAll('th').forEach(h => h.classList.remove('asc', 'desc'));
            this.classList.toggle('asc', !asc);
            this.classList.toggle('desc', asc);

            const tbody = table.querySelector('tbody');
            const rows  = [...tbody.querySelectorAll('tr')].filter(r => !r.querySelector('.empty-state'));

            rows.sort((a, b) => {
                const av = a.cells[idx]?.textContent.trim() || '';
                const bv = b.cells[idx]?.textContent.trim() || '';
                const an = parseFloat(av.replace(/[^0-9.-]/g, ''));
                const bn = parseFloat(bv.replace(/[^0-9.-]/g, ''));
                if (!isNaN(an) && !isNaN(bn)) return asc ? bn - an : an - bn;
                return asc ? bv.localeCompare(av, 'fr') : av.localeCompare(bv, 'fr');
            });

            rows.forEach(r => tbody.appendChild(r));
        });
    });
}

// ── Pagination Helper ─────────────────────────────────────────
function _setPagination(tableWrapper, tableName, totalItems) {
    if (!tableWrapper) return;
    let pDiv = tableWrapper.querySelector('.pagination-controls');
    if (!pDiv) {
        pDiv = document.createElement('div');
        pDiv.className = 'pagination-controls';
        tableWrapper.appendChild(pDiv);
    }
    pDiv.innerHTML = createPaginationControls(tableName, totalItems);
}
