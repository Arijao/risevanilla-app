/* ============================================================
 * DELIVERIES.JS — CRUD Livraisons + Pesage Rapide
 * Architecture: Vanilla JS classique (pas d'ES modules)
 * Intègre la logique enrichie du fichier deliveries.js fourni
 * BEHAVANA - Gestion de Collecte de Vanille
 * ============================================================ */

'use strict';

// ── État local ────────────────────────────────────────────────

let _deliveryQuickWeights = [];  // alias local pour clarté

// ── Helpers locaux ────────────────────────────────────────────

function _todayISODelivery() {
    return new Date().toISOString().split('T')[0];
}

function _parseDeliveryNumber(str) {
    if (!str && str !== 0) return 0;
    const n = parseFloat(String(str).replace(',', '.'));
    return isNaN(n) ? 0 : n;
}

/** Auto-numérotation BL / Facture */
function _generateDeliveryNumber(prefix, dateStr) {
    const d    = new Date(dateStr || _todayISODelivery());
    const base = `${prefix}${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
    const same = (appData.deliveries || []).filter(dl => {
        const val = prefix === 'BL' ? dl.bl : dl.invoice;
        return val?.startsWith(base);
    });
    const maxSeq = same.reduce((m, dl) => {
        const val = prefix === 'BL' ? dl.bl : dl.invoice;
        return Math.max(m, parseInt(val?.slice(base.length)) || 0);
    }, 0);
    return `${base}${String(maxSeq + 1).padStart(3, '0')}`;
}

/** Met à jour la datalist des qualités dans le formulaire livraison */
function _populateDeliveryQualityDatalist() {
    const dl = document.getElementById('delivery-quality-list') ||
               document.getElementById('quality-list');
    if (!dl) return;
    dl.innerHTML = (appData.qualities || [])
        .map(q => `<option value="${q.name}">`)
        .join('');
}

// ── Table des livraisons ──────────────────────────────────────

function updateDeliveryTable() {
    const tbody = document.getElementById('delivery-table');
    if (!tbody) return;
    const tableWrapper = tbody.closest('.data-table');
    tbody.innerHTML = '';

    const deliveries = getDeliveriesForCurrentYear()
        .sort((a, b) => b.date.localeCompare(a.date));

    if (!deliveries.length) {
        tbody.innerHTML = `
            <tr><td colspan="7" class="empty-state">
                <div class="material-icons">local_shipping</div>
                <div>Aucune livraison pour ${currentYear}</div>
            </td></tr>`;
        return;
    }

    getPaginatedData(deliveries, 'deliveries').forEach(d => {
        const qualityClass = (d.quality || '').toLowerCase();
        const row = document.createElement('tr');
        const _q = document.getElementById('global-search-input')?.value?.trim() || '';
        row.innerHTML = `
            <td data-label="Date">${formatDate(d.date)}</td>
            <td data-label="N° BL / Facture">
                <div style="font-weight:600;">${BehavanaSearch.highlightText(d.bl || '—', _q)}</div>
                <div style="font-size:11px;opacity:.65;">${BehavanaSearch.highlightText(d.invoice || '', _q)}</div>
            </td>
            <td data-label="Qualité">
                <span class="status-badge status-${qualityClass}">${BehavanaSearch.highlightText(d.quality || '—', _q)}</span>
            </td>
            <td data-label="Poids Net">${(d.weight || 0).toFixed(2)} kg</td>
            <td data-label="Valeur">${formatCurrency(d.totalValue || 0)}</td>
            <td data-label="Exportateur">${BehavanaSearch.highlightText(d.exporter || '—', _q)}</td>
            <td class="actions-cell">
                <button class="btn btn-icon btn-outline"   onclick="openDeliveryModal(${d.id})"             title="Modifier">
                    <span class="material-icons">edit</span>
                </button>
                <button class="btn btn-icon btn-danger"    onclick="deleteDelivery(${d.id})"               title="Supprimer">
                    <span class="material-icons">delete</span>
                </button>
                <button class="btn btn-icon btn-secondary" onclick="generateDeliveryPDF(${d.id},'BL')"     title="BL">
                    <span class="material-icons">description</span>
                </button>
                <button class="btn btn-icon btn-success"   onclick="generateDeliveryPDF(${d.id},'Facture')" title="Facture">
                    <span class="material-icons">receipt</span>
                </button>
            </td>`;
        tbody.appendChild(row);
    });

    let pDiv = tableWrapper?.querySelector('.pagination-controls');
    if (!pDiv && tableWrapper) {
        pDiv = document.createElement('div');
        pDiv.className = 'pagination-controls';
        tableWrapper.appendChild(pDiv);
    }
    if (pDiv) pDiv.innerHTML = createPaginationControls('deliveries', deliveries.length);

    initTableSorting();
}

// ── Modal Livraison ───────────────────────────────────────────

function openDeliveryModal(deliveryId = null) {
    const form = document.getElementById('delivery-form');
    if (!form) return;
    form.reset();
    delete form.dataset.editId;

    // Datalist qualités
    _populateDeliveryQualityDatalist();

    // Reset pesage rapide
    _deliveryQuickWeights = [];
    _renderDeliveryQuickWeights();

    const today = _todayISODelivery();

    // Titre modal
    const titleEl = document.getElementById('delivery-modal-title') ||
                    form.closest('.modal')?.querySelector('.modal-title');
    if (titleEl) titleEl.textContent = deliveryId ? 'Modifier la Livraison' : 'Nouvelle Livraison';

    if (!deliveryId) {
        // Nouvelle livraison
        document.getElementById('delivery-date').value      = today;
        document.getElementById('delivery-bl').value        = _generateDeliveryNumber('BL', today);
        document.getElementById('delivery-invoice').value   = _generateDeliveryNumber('FAC', today);
        document.getElementById('delivery-bag-count').value = '1';
        document.getElementById('delivery-exporter').value  = '';

        const tare = document.getElementById('delivery-quick-tare-input');
        if (tare) tare.value = '';

    } else {
        // Modification
        const delivery = (appData.deliveries || []).find(d => d.id === deliveryId);
        if (delivery) {
            form.dataset.editId = deliveryId;

            document.getElementById('delivery-date').value         = delivery.date;
            document.getElementById('delivery-bl').value           = delivery.bl    || '';
            document.getElementById('delivery-invoice').value      = delivery.invoice || '';
            document.getElementById('delivery-quality').value      = delivery.quality || '';
            document.getElementById('delivery-gross-weight').value = delivery.grossWeight ?? delivery.weight ?? '';
            document.getElementById('delivery-bag-count').value    = delivery.bagCount ?? 1;
            document.getElementById('delivery-bag-weight').value   = delivery.bagWeight ?? '';
            document.getElementById('delivery-weight').value       = delivery.weight ?? '';
            document.getElementById('delivery-price').value        = delivery.price ?? '';
            document.getElementById('delivery-total-value').value  = delivery.totalValue ?? '';
            document.getElementById('delivery-exporter').value     = delivery.exporter || '';

            if (delivery.quickWeights?.length) {
                _deliveryQuickWeights = [...delivery.quickWeights];
                _renderDeliveryQuickWeights();
            }
        }
    }

    openModal('delivery-modal');
    setTimeout(() => document.getElementById('delivery-quick-weight-input')?.focus(), 300);
}

function saveDelivery(event) {
    if (event) event.preventDefault();

    const form     = document.getElementById('delivery-form');
    const editId   = form?.dataset.editId;
    const date     = document.getElementById('delivery-date')?.value;
    const invoice  = document.getElementById('delivery-invoice')?.value?.trim();
    const quality  = document.getElementById('delivery-quality')?.value?.trim();
    const weight   = _parseDeliveryNumber(document.getElementById('delivery-weight')?.value);
    const exporter = document.getElementById('delivery-exporter')?.value?.trim();

    if (!date || !invoice || !weight) {
        showToast('Date, N° Facture et Poids Net sont obligatoires', 'error');
        return;
    }

    const delivery = {
        date,
        bl:          document.getElementById('delivery-bl')?.value?.trim() || '',
        invoice,
        quality,
        grossWeight: _parseDeliveryNumber(document.getElementById('delivery-gross-weight')?.value),
        bagCount:    parseInt(document.getElementById('delivery-bag-count')?.value) || 0,
        bagWeight:   _parseDeliveryNumber(document.getElementById('delivery-bag-weight')?.value),
        weight,
        price:       _parseDeliveryNumber(document.getElementById('delivery-price')?.value),
        totalValue:  _parseDeliveryNumber(document.getElementById('delivery-total-value')?.value),
        exporter,
        quickWeights: [..._deliveryQuickWeights],
        createdAt:   new Date().toISOString()
    };

    if (editId) delivery.id = parseInt(editId);

    saveToDB('deliveries', delivery, () => {
        closeModal('delivery-modal');
        showToast(editId ? 'Livraison modifiée' : 'Livraison enregistrée', 'success');
        _deliveryQuickWeights = [];
    });
}

async function deleteDelivery(id) {
    const ok = await confirmModal({
        title:       'Supprimer la livraison',
        message:     'Cette action est irréversible. La livraison et son BL/Facture seront définitivement supprimés.',
        confirmText: 'Supprimer',
        cancelText:  'Annuler',
        variant:     'danger',
        icon:        'delete_forever'
    });
    if (!ok) return;
    deleteFromDB('deliveries', id, () => showToast('Livraison supprimée.', 'warning'));
}

// ── Calculs Livraison ─────────────────────────────────────────

function calculateDeliveryValues() {
    const gross    = _parseDeliveryNumber(document.getElementById('delivery-gross-weight')?.value);
    const bagCount = parseInt(document.getElementById('delivery-bag-count')?.value) || 0;
    const bagWeight = _parseDeliveryNumber(document.getElementById('delivery-bag-weight')?.value);
    const price    = _parseDeliveryNumber(document.getElementById('delivery-price')?.value);
    const net      = Math.max(0, gross - bagCount * bagWeight);

    const netEl   = document.getElementById('delivery-weight');
    const totalEl = document.getElementById('delivery-total-value');
    if (netEl)   netEl.value   = net.toFixed(2);
    if (totalEl) totalEl.value = Math.round(net * price) || '';
}

function setupDeliveryCalculations() {
    ['delivery-gross-weight', 'delivery-bag-count', 'delivery-bag-weight', 'delivery-price']
        .forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', calculateDeliveryValues);
        });

    // Tare du pesage rapide → recalcul
    const tareEl = document.getElementById('delivery-quick-tare-input');
    if (tareEl) {
        tareEl.addEventListener('input', () => {
            _syncDeliveryFromQuickWeights();
            _renderDeliveryQuickWeights();
        });
    }

    // Enter dans le champ poids rapide
    const qwInput = document.getElementById('delivery-quick-weight-input');
    if (qwInput) {
        qwInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') { e.preventDefault(); addDeliveryQuickWeight(); }
        });
    }
}

// ── Pesage Rapide Livraison ───────────────────────────────────

async function addDeliveryQuickWeight() {
    const input  = document.getElementById('delivery-quick-weight-input');
    const val    = parseFloat((input?.value || '').replace(',', '.'));

    if (isNaN(val) || val <= 0) {
        showToast('Entrez un poids valide (> 0 kg)', 'error', 2000);
        input?.focus();
        return;
    }
    if (val > 100) {
        const ok = await confirmModal({
            title:       'Poids inhabituellement élevé',
            message:     `Le poids saisi est de ${val} kg, ce qui semble anormalement élevé. Confirmer quand même ?`,
            confirmText: 'Confirmer',
            cancelText:  'Corriger',
            variant:     'warning',
            icon:        'warning_amber'
        });
        if (!ok) return;
    }

    _deliveryQuickWeights.push(val);
    if (input) input.value = '';
    input?.focus();
    _renderDeliveryQuickWeights();
    _syncDeliveryFromQuickWeights();
    showToast(`✓ ${val} kg ajouté`, 'success', 1000);
}

function removeDeliveryQuickWeight(index) {
    _deliveryQuickWeights.splice(index, 1);
    _renderDeliveryQuickWeights();
    _syncDeliveryFromQuickWeights();
}

function undoLastDeliveryWeight() {
    if (!_deliveryQuickWeights.length) return;
    const removed = _deliveryQuickWeights.pop();
    _renderDeliveryQuickWeights();
    _syncDeliveryFromQuickWeights();
    showToast(`↩ ${removed} kg retiré`, 'info', 1500);
}

async function clearDeliveryQuickWeights() {
    if (!_deliveryQuickWeights.length) return;
    const ok = await confirmModal({
        title:       'Effacer tous les poids',
        message:     'Tous les poids du pesage rapide seront supprimés. Cette action ne peut pas être annulée.',
        confirmText: 'Effacer tout',
        cancelText:  'Annuler',
        variant:     'warning',
        icon:        'delete_sweep'
    });
    if (!ok) return;
    _deliveryQuickWeights = [];
    _renderDeliveryQuickWeights();
    _syncDeliveryFromQuickWeights();
}

function updateDeliveryFromQuickWeights() {
    _syncDeliveryFromQuickWeights();
    _renderDeliveryQuickWeights();
}

function _syncDeliveryFromQuickWeights() {
    if (!_deliveryQuickWeights.length) return;
    const tare  = _parseDeliveryNumber(document.getElementById('delivery-quick-tare-input')?.value);
    const total = _deliveryQuickWeights.reduce((s, w) => s + w, 0);

    const grossEl = document.getElementById('delivery-gross-weight');
    const bagEl   = document.getElementById('delivery-bag-count');
    const bagWEl  = document.getElementById('delivery-bag-weight');

    if (grossEl) grossEl.value = total.toFixed(2);
    if (bagEl)   bagEl.value   = _deliveryQuickWeights.length;
    if (bagWEl && tare) bagWEl.value = tare;
    calculateDeliveryValues();
}

function _renderDeliveryQuickWeights() {
    const list    = document.getElementById('delivery-quick-weights-list');
    const countEl = document.getElementById('delivery-quick-bag-count');
    const totalEl = document.getElementById('delivery-quick-total-weight');
    const netEl   = document.getElementById('delivery-quick-net-weight');
    const tare    = _parseDeliveryNumber(document.getElementById('delivery-quick-tare-input')?.value);
    const total   = _deliveryQuickWeights.reduce((s, w) => s + w, 0);
    const net     = Math.max(0, total - _deliveryQuickWeights.length * tare);

    if (countEl) countEl.textContent = _deliveryQuickWeights.length;
    if (totalEl) totalEl.textContent = total.toFixed(2);
    if (netEl)   netEl.textContent   = net.toFixed(2);

    if (!list) return;

    if (!_deliveryQuickWeights.length) {
        list.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;color:var(--md-sys-color-on-surface-variant);
                        font-size:13px;padding:8px 4px;opacity:.7;">
                <span class="material-icons" style="font-size:18px;">inbox</span>
                Aucun poids ajouté
            </div>`;
        return;
    }

    list.innerHTML = _deliveryQuickWeights.map((w, i) => `
        <span style="display:inline-flex;align-items:center;gap:4px;
                     background:var(--md-sys-color-primary);color:var(--md-sys-color-on-primary);
                     padding:4px 10px;border-radius:20px;font-size:13px;font-weight:500;
                     cursor:default;user-select:none;">
            <span style="font-size:10px;opacity:.75;">#${i + 1}</span>
            <strong>${w} kg</strong>
            <span class="material-icons" style="font-size:14px;cursor:pointer;"
                  onclick="removeDeliveryQuickWeight(${i})">close</span>
        </span>`).join('');
}

// Initialisation listeners
document.addEventListener('DOMContentLoaded', setupDeliveryCalculations);
