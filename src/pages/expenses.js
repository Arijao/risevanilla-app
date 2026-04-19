/* ============================================================
 * EXPENSES.JS — CRUD Dépenses Opérationnelles
 * Architecture: Vanilla JS classique (pas d'ES modules)
 * Intègre la logique enrichie du fichier expenses.js fourni
 * BEHAVANA - Gestion de Collecte de Vanille
 * ============================================================ */

'use strict';

// ── Helpers locaux ────────────────────────────────────────────

function _todayISOExpense() {
    return new Date().toISOString().split('T')[0];
}

function _parseExpenseAmount(str) {
    const raw = String(str || '').replace(/\D/g, '');
    return parseInt(raw, 10) || 0;
}

// ── Table des dépenses ────────────────────────────────────────

function updateExpensesTable() {
    const tbody = document.getElementById('expenses-table');
    if (!tbody) return;
    const tableWrapper = tbody.closest('.data-table');
    tbody.innerHTML = '';

    const expenses = getExpensesForCurrentYear()
        .sort((a, b) => b.date.localeCompare(a.date));

    if (!expenses.length) {
        tbody.innerHTML = `
            <tr><td colspan="5" class="empty-state">
                <div class="material-icons">receipt_long</div>
                <div>Aucune dépense pour ${currentYear}</div>
            </td></tr>`;
        _setExpensesTotal(0);
        return;
    }

    getPaginatedData(expenses, 'expenses').forEach(e => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td data-label="Date">${formatDate(e.date)}</td>
            <td data-label="Catégorie">
                <span style="display:inline-flex;align-items:center;gap:6px;">
                    <span class="material-icons" style="font-size:16px;opacity:.7;">${_getExpenseCategoryIcon(e.category)}</span>
                    ${e.category || '—'}
                </span>
            </td>
            <td data-label="Description">${e.description || '—'}</td>
            <td data-label="Montant" style="font-weight:600;">${formatCurrency(e.amount)}</td>
            <td class="actions-cell">
                <button class="btn btn-icon btn-outline" onclick="openExpenseModal(${e.id})" title="Modifier">
                    <span class="material-icons">edit</span>
                </button>
                <button class="btn btn-icon btn-danger" onclick="deleteExpense(${e.id})" title="Supprimer">
                    <span class="material-icons">delete</span>
                </button>
            </td>`;
        tbody.appendChild(row);
    });

    // Pagination
    let pDiv = tableWrapper?.querySelector('.pagination-controls');
    if (!pDiv && tableWrapper) {
        pDiv = document.createElement('div');
        pDiv.className = 'pagination-controls';
        tableWrapper.appendChild(pDiv);
    }
    if (pDiv) pDiv.innerHTML = createPaginationControls('expenses', expenses.length);

    // Total
    _setExpensesTotal(expenses.reduce((s, e) => s + (e.amount || 0), 0));

    initTableSorting();
}

function _setExpensesTotal(total) {
    const el = document.getElementById('expenses-total');
    if (el) el.textContent = formatCurrency(total);
}

/** Icône Material selon la catégorie de dépense */
function _getExpenseCategoryIcon(category) {
    const icons = {
        'Paiement Collecteur': 'payments',
        'Salaire':             'badge',
        'Transport':           'directions_car',
        'Nourriture':          'restaurant',
        'Ristourne':           'receipt',
        'Carburant':           'local_gas_station',
        'Logistique':          'inventory_2',
        'Administratif':       'admin_panel_settings',
        'Autre':               'more_horiz',
    };
    return icons[category] || 'receipt_long';
}

// ── Modal Dépense ─────────────────────────────────────────────

function openExpenseModal(expenseId = null) {
    const form = document.getElementById('expense-form');
    if (!form) return;
    form.reset();
    delete form.dataset.editId;

    // Titre modal
    const titleEl = document.getElementById('expense-modal-title') ||
                    form.closest('.modal')?.querySelector('.modal-title');
    if (titleEl) titleEl.textContent = expenseId ? 'Modifier la Dépense' : 'Nouvelle Dépense';

    // Date par défaut
    const dateEl = document.getElementById('expense-date');
    if (dateEl) dateEl.value = _todayISOExpense();

    if (expenseId) {
        const expense = (appData.expenses || []).find(e => e.id === expenseId);
        if (expense) {
            form.dataset.editId = expenseId;
            if (dateEl) dateEl.value = expense.date;

            const catEl  = document.getElementById('expense-category');
            const descEl = document.getElementById('expense-description');
            const amtEl  = document.getElementById('expense-amount');

            if (catEl)  catEl.value  = expense.category    || '';
            if (descEl) descEl.value = expense.description || '';
            // Afficher le montant formaté
            if (amtEl)  amtEl.value  = expense.amount.toLocaleString('fr-MG');
        }
    }

    openModal('expense-modal');
    setTimeout(() => document.getElementById('expense-date')?.focus(), 200);
}

function saveExpense(event) {
    if (event) event.preventDefault();

    const form    = document.getElementById('expense-form');
    const editId  = form?.dataset.editId;
    const date    = document.getElementById('expense-date')?.value;
    const category    = document.getElementById('expense-category')?.value?.trim() || '';
    const description = document.getElementById('expense-description')?.value?.trim() || '';
    const amount  = _parseExpenseAmount(document.getElementById('expense-amount')?.value);

    if (!date || !amount) {
        showToast('La date et le montant sont requis', 'error');
        return;
    }
    if (!category) {
        showToast('Veuillez sélectionner une catégorie', 'error');
        return;
    }

    const data = {
        date,
        category,
        description,
        amount,
        createdAt: new Date().toISOString()
    };
    if (editId) data.id = parseInt(editId);

    saveToDB('expenses', data, () => {
        closeModal('expense-modal');
        showToast(editId ? 'Dépense modifiée' : 'Dépense enregistrée', 'success');
    });
}

async function deleteExpense(id) {
    const ok = await confirmModal({
        title:       'Supprimer la dépense',
        message:     'Cette action est irréversible. La dépense sera définitivement supprimée.',
        confirmText: 'Supprimer',
        cancelText:  'Annuler',
        variant:     'danger',
        icon:        'delete_forever'
    });
    if (!ok) return;
    deleteFromDB('expenses', id, () => showToast('Dépense supprimée.', 'warning'));
}

// ── Prix de revient (Analysis) ────────────────────────────────

function updatePrixRevientAnalysis() {
    const container = document.getElementById('prix-revient-container');
    if (!container) return;
    container.innerHTML = '';

    const BONNES = ['Lava', 'Fendue'];
    const totalCost = (appData.advances  || []).reduce((s, a) => s + (a.amount || 0), 0) +
                      (appData.expenses  || []).reduce((s, e) => s + (e.amount || 0), 0);

    let poidsBon = 0, valeurBon = 0, poidsMauvais = 0, valeurMauvais = 0;
    (appData.receptions || []).forEach(r => {
        if (BONNES.includes(r.quality)) {
            poidsBon    += (r.netWeight  || 0);
            valeurBon   += (r.totalValue || 0);
        } else {
            poidsMauvais  += (r.netWeight  || 0);
            valeurMauvais += (r.totalValue || 0);
        }
    });

    const totalPoids = poidsBon + poidsMauvais;
    if (totalPoids === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="material-icons">inventory_2</span>
                <div>Aucune réception enregistrée. Calcul impossible.</div>
            </div>`;
        return;
    }

    const rendRate    = parseFloat(document.getElementById('rendement-rate')?.value) || 25;
    const poidsSec    = poidsBon * (rendRate / 100);
    const prixRevient = poidsSec > 0 ? totalCost / poidsSec : 0;

    container.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px;">

            <div class="insight-item"
                 style="flex-direction:column;align-items:flex-start;
                        background:var(--md-sys-color-error-container);">
                <div class="insight-text"
                     style="font-size:14px;color:var(--md-sys-color-on-error-container);font-weight:600;">
                    💸 COÛT TOTAL (ARGENT SORTI)
                </div>
                <div style="font-size:26px;font-weight:700;
                            color:var(--md-sys-color-on-error-container);margin-top:8px;">
                    ${formatCurrency(totalCost)}
                </div>
                <div style="font-size:12px;margin-top:10px;
                            color:var(--md-sys-color-on-error-container);opacity:.8;">
                    Avances + Dépenses Opérationnelles
                </div>
            </div>

            <div class="insight-item"
                 style="flex-direction:column;align-items:flex-start;
                        background:var(--md-sys-color-primary-container);">
                <div class="insight-text"
                     style="font-size:14px;color:var(--md-sys-color-on-primary-container);font-weight:600;">
                    ⚖️ ANALYSE DES POIDS (VANILLE VERTE)
                </div>
                <div style="font-size:26px;font-weight:700;
                            color:var(--md-sys-color-on-primary-container);margin-top:8px;">
                    ${totalPoids.toFixed(2)} kg
                </div>
                <div style="font-size:12px;margin-top:10px;
                            color:var(--md-sys-color-on-primary-container);opacity:.8;">
                    Dont <b>${poidsBon.toFixed(2)} kg</b> bonne qualité
                    et <b>${poidsMauvais.toFixed(2)} kg</b> qualité inférieure.
                </div>
            </div>

            <div class="insight-item"
                 style="flex-direction:column;align-items:flex-start;
                        background:linear-gradient(135deg,
                            var(--md-sys-color-tertiary-container),
                            var(--md-sys-color-tertiary));">
                <div class="insight-text"
                     style="font-size:14px;color:var(--md-sys-color-on-tertiary-container);font-weight:600;">
                    🏷️ PRIX DE REVIENT RÉÉVALUÉ
                </div>
                <div style="font-size:26px;font-weight:700;
                            color:var(--md-sys-color-on-tertiary-container);margin-top:8px;">
                    ${formatCurrency(prixRevient)} / kg
                </div>
                <div style="font-size:12px;margin-top:10px;
                            color:var(--md-sys-color-on-tertiary-container);opacity:.8;">
                    Calculé sur <b>${poidsSec.toFixed(2)} kg</b> de vanille sèche
                    (bonne qualité, rendement <b>${rendRate}%</b>).
                </div>
            </div>

        </div>`;
}

// ── Live format montant ───────────────────────────────────────

function _initExpenseAmountLiveFormat() {
    const el = document.getElementById('expense-amount');
    if (!el || el._expenseFormatBound) return;
    el._expenseFormatBound = true;
    el.addEventListener('input', function (e) {
        let raw = e.target.value.replace(/\D/g, '');
        if (!raw) { e.target.value = ''; return; }
        e.target.value = Number(raw).toLocaleString('fr-MG');
    });
}

// Initialiser les formatages une fois le DOM prêt
document.addEventListener('DOMContentLoaded', _initExpenseAmountLiveFormat);
