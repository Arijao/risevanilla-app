/* ============================================================
 * ADVANCES.JS — CRUD Avances + Remboursements
 * Architecture: Vanilla JS classique (pas d'ES modules)
 * Intègre la logique enrichie du fichier advances.js fourni
 * RISEVANILLA - Gestion de Collecte de Vanille
 * ============================================================ */

'use strict';

// ── Guard SearchAnalytics ─────────────────────────────────────
// Centralise tous les appels à SearchAnalytics.
// Sécurise contre un chargement manquant ou un ordre inattendu.
// Ne fait rien si SearchAnalytics n'est pas disponible ou si
// aucune recherche n'est active (query vide).
function _sa(query, items, module) {
    if (typeof SearchAnalytics === 'undefined') return;
    if (query && items && items.length) {
        SearchAnalytics.analyze(query, items, module);
    } else {
        SearchAnalytics.close();
    }
}

// ── Helpers locaux ────────────────────────────────────────────

/** Retourne la date du jour au format YYYY-MM-DD */
function _todayISO() {
    return new Date().toISOString().split('T')[0];
}

/** Parse un montant depuis un string, retourne 0 si invalide */
function _parseAmount(str) {
    const raw = String(str || '').replace(/\D/g, '');
    return parseInt(raw, 10) || 0;
}

/** Recharge le select collecteur dans le formulaire avance */
function _populateAdvanceCollectorSelect() {
    const select = document.getElementById('advance-collector');
    if (!select) return;
    const current = select.value;
    while (select.children.length > 1) select.removeChild(select.lastChild);
    (appData.collectors || [])
        .filter(isCollectorAvailableInCurrentYear)
        .forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.name;
            select.appendChild(opt);
        });
    select.value = current;
}

/** Recharge le select collecteur dans les filtres */
function _populateAdvanceFilterSelect() {
    const select = document.getElementById('advance-filter-collector');
    if (!select) return;
    const current = select.value;
    while (select.children.length > 1) select.removeChild(select.lastChild);
    (appData.collectors || [])
        .filter(isCollectorAvailableInCurrentYear)
        .forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.name;
            select.appendChild(opt);
        });
    select.value = current;
}

/** Affiche le solde du collecteur sélectionné dans le formulaire avance */
function _updateAdvanceCollectorBalance() {
    const collectorId = parseInt(document.getElementById('advance-collector')?.value);
    const infoEl      = document.getElementById('advance-collector-balance-info');
    const textEl      = document.getElementById('advance-balance-text');
    const iconEl      = document.getElementById('advance-balance-icon');
    if (!infoEl || !textEl || !iconEl) return;

    if (!collectorId) {
        infoEl.style.display = 'none';
        return;
    }

    const balance = calculateCollectorBalance(collectorId);
    const absVal  = Math.abs(balance).toLocaleString('fr-MG') + ' Ar';

    if (balance < 0) {
        // Le collecteur est débiteur : il doit de l'argent à RiseVanilla
        infoEl.style.cssText = 'display:flex;align-items:center;gap:8px;margin-top:10px;padding:10px 14px;border-radius:10px;font-size:13px;background:rgba(var(--md-sys-color-error-rgb,176,0,32),0.12);color:var(--md-sys-color-error);border:1px solid rgba(var(--md-sys-color-error-rgb,176,0,32),0.25);';
        iconEl.textContent = 'warning';
        textEl.innerHTML   = `Doit encore <strong>${absVal}</strong> à RiseVanilla`;
    } else if (balance > 0) {
        // Le collecteur est créditeur : RiseVanilla lui doit de l'argent
        infoEl.style.cssText = 'display:flex;align-items:center;gap:8px;margin-top:10px;padding:10px 14px;border-radius:10px;font-size:13px;background:rgba(46,125,50,0.10);color:#2e7d32;border:1px solid rgba(46,125,50,0.22);';
        iconEl.textContent = 'check_circle';
        textEl.innerHTML   = `Solde créditeur : <strong>${absVal}</strong> à percevoir`;
    } else {
        // Solde équilibré
        infoEl.style.cssText = 'display:flex;align-items:center;gap:8px;margin-top:10px;padding:10px 14px;border-radius:10px;font-size:13px;background:rgba(103,80,164,0.08);color:var(--md-sys-color-on-surface-variant);border:1px solid var(--md-sys-color-outline-variant);';
        iconEl.textContent = 'balance';
        textEl.innerHTML   = 'Solde équilibré — aucune avance en cours';
    }
}

// ── Table des avances ─────────────────────────────────────────

function updateAdvancesTable() {
    const tbody = document.getElementById('advances-table');
    if (!tbody) return;
    const tableWrapper = tbody.closest('.data-table');
    tbody.innerHTML = '';

    const filtered = _filterAdvancesData();

    if (!filtered.length) {
        tbody.innerHTML = `
            <tr><td colspan="5" class="empty-state">
                <div class="material-icons">account_balance_wallet</div>
                <div>Aucune avance enregistrée</div>
            </td></tr>`;
        // Total = 0
        _setAdvancesTotal(0);
        _sa('', null, 'advances');   // ferme le panneau
        return;
    }

    getPaginatedData(filtered, 'advances').forEach(adv => {
        const collector = (appData.collectors || []).find(c => c.id === adv.collectorId);
        const row = document.createElement('tr');
        const _q = document.getElementById('global-search-input')?.value?.trim() || '';
        row.innerHTML = `
            <td data-label="Date">${formatDate(adv.date)}</td>
            <td data-label="Collecteur"></td>
            <td data-label="Montant">${formatCurrency(adv.amount)}</td>
            <td data-label="Motif">${RiseVanillaSearch.highlightText(adv.motif || '—', _q)}</td>
            <td class="actions-cell">
                <button class="btn btn-icon btn-outline" onclick="openAdvanceModal(${adv.id})" title="Modifier">
                    <span class="material-icons">edit</span>
                </button>
                <button class="btn btn-icon btn-danger" onclick="deleteAdvance(${adv.id})" title="Supprimer">
                    <span class="material-icons">delete</span>
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

    // Pagination
    let pDiv = tableWrapper?.querySelector('.pagination-controls');
    if (!pDiv && tableWrapper) {
        pDiv = document.createElement('div');
        pDiv.className = 'pagination-controls';
        tableWrapper.appendChild(pDiv);
    }
    if (pDiv) pDiv.innerHTML = createPaginationControls('advances', filtered.length);

    // Total
    _setAdvancesTotal(filtered.reduce((s, a) => s + (a.amount || 0), 0));

    initTableSorting();

    // ── SearchAnalytics : agrégats avances si recherche active ──────────
    const _q = document.getElementById('global-search-input')?.value?.trim() || '';
    if (_q) {
        const _enriched = filtered.map(a => {
            const c = (appData.collectors || []).find(col => col.id === a.collectorId);
            return Object.assign({}, a, { collecteur: c ? c.name : 'Inconnu' });
        });
        _sa(_q, _enriched, 'advances');
    } else {
        _sa('', null, 'advances');
    }
}

function _filterAdvancesData() {
    let data = getAdvancesForCurrentYear();

    const collectorFilter = document.getElementById('advance-filter-collector')?.value;
    const startDate       = document.getElementById('advance-filter-start')?.value;
    const endDate         = document.getElementById('advance-filter-end')?.value;

    if (collectorFilter) data = data.filter(a => String(a.collectorId) === String(collectorFilter));
    if (startDate)       data = data.filter(a => a.date >= startDate);
    if (endDate)         data = data.filter(a => a.date <= endDate);

    return data.sort((a, b) => b.date.localeCompare(a.date));
}

function _setAdvancesTotal(total) {
    const el = document.getElementById('advances-total');
    if (el) el.textContent = formatCurrency(total);
}

// Alias pour compatibilité avec updateAllTables()
// (notre table.js appelle updateAdvancesTable directement)

// ── Filtres avances ───────────────────────────────────────────

function filterAdvances() {
    return _filterAdvancesData();
}

function filterAdvancesByDate() {
    updateAdvancesTable();
}

function setDateFilter(period) {
    const now   = new Date();
    const today = _todayISO();
    let start   = today, end = today;

    if (period === 'week') {
        const d = new Date(now);
        d.setDate(d.getDate() - d.getDay());
        start = d.toISOString().split('T')[0];
    } else if (period === 'month') {
        start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    } else if (period === 'year') {
        start = `${now.getFullYear()}-01-01`;
        end   = `${now.getFullYear()}-12-31`;
    }

    const s = document.getElementById('advance-filter-start');
    const e = document.getElementById('advance-filter-end');
    if (s) s.value = start;
    if (e) e.value = end;
    updateAdvancesTable();
}

function clearDateFilter() {
    const s = document.getElementById('advance-filter-start');
    const e = document.getElementById('advance-filter-end');
    if (s) s.value = '';
    if (e) e.value = '';
    updateAdvancesTable();
}

function resetAdvancesFilters() {
    ['advance-filter-collector', 'advance-filter-start', 'advance-filter-end']
        .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    updateAdvancesTable();
}

// ── Modal Avance ──────────────────────────────────────────────

function openAdvanceModal(advanceId = null) {
    const form = document.getElementById('advance-form');
    if (!form) return;
    form.reset();
    delete form.dataset.editId;

    // Titre dynamique
    const titleEl = document.getElementById('advance-modal-title') ||
                    form.closest('.modal')?.querySelector('.modal-title');
    if (titleEl) titleEl.textContent = advanceId ? 'Modifier l\'Avance' : 'Nouvelle Avance';

    // Populate select collecteur
    _populateAdvanceCollectorSelect();

    // Date par défaut
    const dateEl = document.getElementById('advance-date');
    if (dateEl && !advanceId) dateEl.value = _todayISO();

    if (advanceId) {
        const advance = (appData.advances || []).find(a => a.id === advanceId);
        if (advance) {
            form.dataset.editId = advanceId;
            document.getElementById('advance-date').value      = advance.date;
            document.getElementById('advance-collector').value = advance.collectorId;
            // Afficher le montant formaté
            const amtEl = document.getElementById('advance-amount');
            if (amtEl) amtEl.value = advance.amount.toLocaleString('fr-MG');
            document.getElementById('advance-motif').value     = advance.motif || '';
        }
    }

    // Afficher le solde du collecteur (mode édition : après peuplement ; mode création : réinitialise)
    _updateAdvanceCollectorBalance();

    openModal('advance-modal');
    setTimeout(() => document.getElementById('advance-date')?.focus(), 200);
}

function saveAdvance(event) {
    if (event) event.preventDefault();
    const form        = document.getElementById('advance-form');
    const editId      = form?.dataset.editId;
    const date        = document.getElementById('advance-date')?.value;
    const collectorId = parseInt(document.getElementById('advance-collector')?.value);
    const amount      = _parseAmount(document.getElementById('advance-amount')?.value);
    const motif       = document.getElementById('advance-motif')?.value?.trim() || '';

    if (!date || !collectorId || !amount) {
        showToast('Veuillez remplir tous les champs obligatoires', 'error');
        return;
    }

    const data = { date, collectorId, amount, motif, createdAt: new Date().toISOString() };
    if (editId) data.id = parseInt(editId);

    saveToDB('advances', data, () => {
        closeModal('advance-modal');
        showToast(editId ? 'Avance modifiée' : 'Avance enregistrée', 'success');
    });
}

async function deleteAdvance(id) {
    const ok = await confirmModal({
        title:       'Supprimer l\'avance',
        message:     'Cette action est irréversible. L\'avance sera définitivement supprimée.',
        confirmText: 'Supprimer',
        cancelText:  'Annuler',
        variant:     'danger',
        icon:        'delete_forever'
    });
    if (!ok) return;
    deleteFromDB('advances', id, () => showToast('Avance supprimée.', 'warning'));
}

// ── Modal Remboursement ───────────────────────────────────────

function openRemboursementModal(collectorId, remboursementId = null) {
    const form = document.getElementById('remboursement-form');
    if (!form) return;
    form.reset();

    const editIdEl = document.getElementById('remboursement-edit-id');
    if (editIdEl) editIdEl.value = '';

    const collector = (appData.collectors || []).find(c => c.id === collectorId);
    const nameEl    = document.getElementById('remboursement-collector-name');
    const idEl      = document.getElementById('remboursement-collector-id');
    const dateEl    = document.getElementById('remboursement-date');

    if (idEl)   idEl.value   = collectorId;
    if (nameEl) nameEl.value = collector ? collector.name : '';
    if (dateEl) dateEl.value = _todayISO();

    if (remboursementId) {
        const remb = (appData.remboursements || []).find(r => r.id === remboursementId);
        if (remb) {
            if (editIdEl) editIdEl.value = remboursementId;
            const amtEl  = document.getElementById('remboursement-amount');
            const noteEl = document.getElementById('remboursement-note');
            if (amtEl)  amtEl.value  = remb.amount.toLocaleString('fr-MG');
            if (dateEl) dateEl.value = remb.date;
            if (noteEl) noteEl.value = remb.note || '';
        }
    }

    openModal('remboursement-modal');
}

function openRemboursementModalToEdit(remboursementId) {
    const remb = (appData.remboursements || []).find(r => r.id === remboursementId);
    if (remb) openRemboursementModal(remb.collectorId, remboursementId);
}

function saveRemboursement(event) {
    if (event) event.preventDefault();

    const editIdEl    = document.getElementById('remboursement-edit-id');
    const collectorId = parseInt(document.getElementById('remboursement-collector-id')?.value);
    const amount      = _parseAmount(document.getElementById('remboursement-amount')?.value);
    const date        = document.getElementById('remboursement-date')?.value;
    const note        = document.getElementById('remboursement-note')?.value?.trim() || '';

    if (!date || !collectorId || !amount) {
        showToast('Veuillez remplir tous les champs obligatoires', 'error');
        return;
    }

    const data = { collectorId, amount, date, note, createdAt: new Date().toISOString() };
    if (editIdEl && editIdEl.value) data.id = parseInt(editIdEl.value);

    saveToDB('remboursements', data, () => {
        closeModal('remboursement-modal');
        showToast('Remboursement enregistré', 'success');
    });
}

async function deleteRemboursement(id) {
    const ok = await confirmModal({
        title:       'Supprimer le remboursement',
        message:     'Cette action est irréversible. Le remboursement sera définitivement supprimé.',
        confirmText: 'Supprimer',
        cancelText:  'Annuler',
        variant:     'danger',
        icon:        'delete_forever'
    });
    if (!ok) return;
    deleteFromDB('remboursements', id, () => showToast('Remboursement supprimé.', 'warning'));
}

// ── Remboursements Table ──────────────────────────────────────

function updateRemboursementsTable() {
    const tbody = document.getElementById('remboursements-table');
    if (!tbody) return;
    tbody.innerHTML = '';

    const rembs = getRemboursementsForCurrentYear()
        .sort((a, b) => b.date.localeCompare(a.date));

    if (!rembs.length) {
        tbody.innerHTML = `
            <tr><td colspan="5" class="empty-state">
                <div class="material-icons">paid</div>
                <div>Aucun remboursement pour ${currentYear}</div>
            </td></tr>`;
        _sa('', null, 'remboursements');   // ferme le panneau
        return;
    }

    rembs.forEach(r => {
        const collector = (appData.collectors || []).find(c => c.id === r.collectorId);
        const row = document.createElement('tr');
        const _q = document.getElementById('global-search-input')?.value?.trim() || '';
        row.innerHTML = `
            <td data-label="Date">${formatDate(r.date)}</td>
            <td data-label="Collecteur"></td>
            <td data-label="Montant Remboursé">${formatCurrency(r.amount)}</td>
            <td data-label="Note">${RiseVanillaSearch.highlightText(r.note || '—', _q)}</td>
            <td class="actions-cell">
                <button class="btn btn-icon btn-outline" onclick="openRemboursementModalToEdit(${r.id})" title="Modifier">
                    <span class="material-icons">edit</span>
                </button>
                <button class="btn btn-icon btn-danger" onclick="deleteRemboursement(${r.id})" title="Supprimer">
                    <span class="material-icons">delete</span>
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

    // ── SearchAnalytics : agrégats remboursements si recherche active ───
    const _qR = document.getElementById('global-search-input')?.value?.trim() || '';
    if (_qR) {
        const _enrichedR = rembs.map(r => {
            const c = (appData.collectors || []).find(col => col.id === r.collectorId);
            return Object.assign({}, r, { collecteur: c ? c.name : 'Inconnu' });
        });
        _sa(_qR, _enrichedR, 'remboursements');
    } else {
        _sa('', null, 'remboursements');
    }
}

// ── Paiements Solde Créditeur ─────────────────────────────────

function payCollectorCredit(collectorId) {
    const collector = (appData.collectors || []).find(c => c.id === collectorId);
    const balance   = calculateCollectorBalance(collectorId);
    if (balance <= 0) {
        showToast('Ce collecteur n\'a pas de solde créditeur.', 'error');
        return;
    }
    const nameEl   = document.getElementById('credit-payment-collector-name');
    const idEl     = document.getElementById('credit-payment-collector-id');
    const balEl    = document.getElementById('credit-payment-balance');
    const dateEl   = document.getElementById('credit-payment-date');
    const amtEl    = document.getElementById('credit-payment-amount');
    const noteEl   = document.getElementById('credit-payment-note');

    if (idEl)   idEl.value   = collectorId;
    if (nameEl) nameEl.value = collector ? collector.name : '';
    if (balEl)  balEl.value  = formatCurrency(balance);
    if (dateEl) dateEl.value = _todayISO();
    if (amtEl)  amtEl.value  = '';
    if (noteEl) noteEl.value = '';

    openModal('credit-payment-modal');
}

function setCreditPaymentToFullBalance() {
    const collectorId = parseInt(document.getElementById('credit-payment-collector-id')?.value);
    if (!collectorId) return;
    const balance = calculateCollectorBalance(collectorId);
    const amtEl   = document.getElementById('credit-payment-amount');
    if (amtEl) amtEl.value = Math.abs(balance).toLocaleString('fr-MG');
}

function formatCreditPaymentAmount(input) {
    let raw = input.value.replace(/\D/g, '');
    if (!raw) { input.value = ''; return; }
    input.value = Number(raw).toLocaleString('fr-MG');
}

function submitCreditPayment(event) {
    if (event) event.preventDefault();
    const collectorId = parseInt(document.getElementById('credit-payment-collector-id')?.value);
    const amount      = _parseAmount(document.getElementById('credit-payment-amount')?.value);
    const date        = document.getElementById('credit-payment-date')?.value;
    const note        = document.getElementById('credit-payment-note')?.value?.trim() || '';

    if (!date || !collectorId || !amount) {
        showToast('Veuillez remplir tous les champs obligatoires', 'error');
        return;
    }

    const data = { collectorId, amount, date, note, createdAt: new Date().toISOString() };
    saveToDB('paiements', data, () => {
        closeModal('credit-payment-modal');
        showToast('Paiement enregistré!', 'success');
    });
}

async function deletePaiement(id) {
    const ok = await confirmModal({
        title:       'Supprimer le paiement',
        message:     'Cette action est irréversible. Le paiement de solde sera définitivement supprimé.',
        confirmText: 'Supprimer',
        cancelText:  'Annuler',
        variant:     'danger',
        icon:        'delete_forever'
    });
    if (!ok) return;
    deleteFromDB('paiements', id, () => showToast('Paiement supprimé.', 'warning'));
}

function updatePaiementsTable() {
    const tbody = document.getElementById('paiements-table');
    if (!tbody) return;
    tbody.innerHTML = '';

    const paiements = getPaiementsForCurrentYear()
        .sort((a, b) => b.date.localeCompare(a.date));

    if (!paiements.length) {
        tbody.innerHTML = `
            <tr><td colspan="5" class="empty-state">
                <div class="material-icons">payments</div>
                <div>Aucun paiement pour ${currentYear}</div>
            </td></tr>`;
        _sa('', null, 'paiements');   // ferme le panneau
        return;
    }

    paiements.forEach(p => {
        const collector = (appData.collectors || []).find(c => c.id === p.collectorId);
        const row = document.createElement('tr');
        const _q = document.getElementById('global-search-input')?.value?.trim() || '';
        row.innerHTML = `
            <td data-label="Date">${formatDate(p.date)}</td>
            <td data-label="Collecteur"></td>
            <td data-label="Montant Payé">${formatCurrency(p.amount)}</td>
            <td data-label="Note">${RiseVanillaSearch.highlightText(p.note || '—', _q)}</td>
            <td class="actions-cell">
                <button class="btn btn-icon btn-danger" onclick="deletePaiement(${p.id})" title="Supprimer">
                    <span class="material-icons">delete</span>
                </button>
            </td>`;
        // Avatar collecteur
        const collTdP = row.querySelector('td[data-label="Collecteur"]');
        if (collTdP) {
            if (collector) {
                collTdP.dataset.noHighlight = '1'; // ← protège l'avatar du highlightTable
                const avatarCell = renderCollectorAvatar(collector, false);
                const nameSpan = document.createElement('span');
                nameSpan.innerHTML = RiseVanillaSearch.highlightText(collector.name, _q);
                avatarCell.appendChild(nameSpan);
                collTdP.appendChild(avatarCell);
            } else {
                collTdP.innerHTML = '<em style="opacity:.6">Supprimé</em>';
            }
        }
        tbody.appendChild(row);
    });

    // ── SearchAnalytics : agrégats paiements si recherche active ────────
    const _qP = document.getElementById('global-search-input')?.value?.trim() || '';
    if (_qP) {
        const _enrichedP = paiements.map(p => {
            const c = (appData.collectors || []).find(col => col.id === p.collectorId);
            return Object.assign({}, p, { collecteur: c ? c.name : 'Inconnu' });
        });
        _sa(_qP, _enrichedP, 'paiements');
    } else {
        _sa('', null, 'paiements');
    }
}

// ── Live formatting pour champs montant ───────────────────────

function _initAdvanceAmountLiveFormat() {
    const el = document.getElementById('advance-amount');
    if (!el || el._advanceFormatBound) return;
    el._advanceFormatBound = true;
    el.addEventListener('input', function (e) {
        let raw = e.target.value.replace(/\D/g, '');
        if (!raw) { e.target.value = ''; return; }
        e.target.value = Number(raw).toLocaleString('fr-MG');
    });
}

function _initRemboursementAmountLiveFormat() {
    const el = document.getElementById('remboursement-amount');
    if (!el || el._rembFormatBound) return;
    el._rembFormatBound = true;
    el.addEventListener('input', function (e) {
        let raw = e.target.value.replace(/\D/g, '');
        if (!raw) { e.target.value = ''; return; }
        e.target.value = Number(raw).toLocaleString('fr-MG');
    });
}

// Initialiser les formatages une fois le DOM prêt
document.addEventListener('DOMContentLoaded', function () {
    _initAdvanceAmountLiveFormat();
    _initRemboursementAmountLiveFormat();

    // Écouter les changements de filtre collecteur
    const filterSelect = document.getElementById('advance-filter-collector');
    if (filterSelect) {
        filterSelect.addEventListener('change', updateAdvancesTable);
    }
});
