/* ============================================================
 * DELIVERIES.JS — CRUD Livraisons + Pesage Rapide
 * Architecture: Vanilla JS classique (pas d'ES modules)
 * Intègre la logique enrichie du fichier deliveries.js fourni
 * RISEVANILLA - Gestion de Collecte de Vanille
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

/** Met à jour la datalist des qualités dans le formulaire livraison
 *  et ajoute un avertissement temps réel si qualité verte sélectionnée */
function _populateDeliveryQualityDatalist() {
    const dl = document.getElementById('delivery-quality-list') ||
               document.getElementById('quality-list');
    if (!dl) return;
    dl.innerHTML = (appData.qualities || [])
        .map(q => `<option value="${q.name}">`)
        .join('');

    // ── Avertissement temps réel sur le champ qualité ──────────────────
    const qualityInput = document.getElementById('delivery-quality');
    if (qualityInput && !qualityInput._typeWarnBound) {
        qualityInput._typeWarnBound = true;
        qualityInput.addEventListener('input', _checkDeliveryQualityType);
        qualityInput.addEventListener('change', _checkDeliveryQualityType);
    }
}

// ── Avertissement visuel qualité verte dans le formulaire livraison ───

function _checkDeliveryQualityType() {
    const qualityInput = document.getElementById('delivery-quality');
    const warningEl    = document.getElementById('delivery-quality-warning');
    if (!qualityInput || !warningEl) return;

    const val = qualityInput.value.trim();
    if (!val) { warningEl.style.display = 'none'; return; }

    if (!isQualityLivrable(val)) {
        warningEl.innerHTML = `
            <span class="material-icons" style="font-size:16px;vertical-align:middle;color:var(--md-sys-color-error);">warning</span>
            <strong>"${val}"</strong> est une vanille <strong>verte</strong> — non livrable à l'exportateur.
            Elle doit d'abord être préparée.`;
        warningEl.style.display = 'flex';
    } else {
        warningEl.innerHTML = `
            <span class="material-icons" style="font-size:16px;vertical-align:middle;color:var(--md-sys-color-success);">check_circle</span>
            <strong>"${val}"</strong> — vanille préparée, livraison autorisée.`;
        warningEl.style.display = 'flex';
        // Masquer le message positif après 3s
        setTimeout(() => { if (warningEl) warningEl.style.display = 'none'; }, 3000);
    }
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
                <div style="font-weight:600;">${RiseVanillaSearch.highlightText(d.bl || '—', _q)}</div>
                <div style="font-size:11px;opacity:.65;">${RiseVanillaSearch.highlightText(d.invoice || '', _q)}</div>
            </td>
            <td data-label="Qualité">
                <span class="status-badge status-${qualityClass}">${RiseVanillaSearch.highlightText(d.quality || '—', _q)}</span>
            </td>
            <td data-label="Poids Net">${(d.weight || 0).toFixed(2)} kg</td>
            <td data-label="Valeur">${formatCurrency(d.totalValue || 0)}</td>
            <td data-label="Exportateur">${RiseVanillaSearch.highlightText(d.exporter || '—', _q)}</td>
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
                _deliveryQuickWeights = _normalizeDeliveryQuickWeights(delivery.quickWeights);
                _renderDeliveryQuickWeights();
            }
        }
    }

    openModal('delivery-modal', { noBackdropClose: true });
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

    // ── Règle métier : une livraison = vanille préparée uniquement ──────
    if (quality && !isQualityLivrable(quality)) {
        showToast(`"${quality}" est une vanille verte — non livrable à l'exportateur. Veuillez d'abord la faire préparer.`, 'error', 5000);
        document.getElementById('delivery-quality')?.focus();
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
        quickWeights: _deliveryQuickWeights.map(e => ({ weight: e.weight, tare: e.tare })),
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
            _renderDeliveryQuickWeights();
            _syncDeliveryFromQuickWeights();
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
// _deliveryQuickWeights est un tableau d'objets {weight, tare}.
// La tare par défaut est lue depuis le champ global delivery-quick-tare-input.
// Rétrocompatibilité : les anciennes entrées sous forme de nombre brut
// sont normalisées à l'ouverture du modal (voir openDeliveryModal).

function _normalizeDeliveryQuickWeights(arr) {
    return (arr || []).map(entry =>
        (typeof entry === 'object' && entry !== null && 'weight' in entry)
            ? entry
            : { weight: entry, tare: null }  // null = héritera de la tare globale à l'affichage
    );
}

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

    const globalTare = _parseDeliveryNumber(document.getElementById('delivery-quick-tare-input')?.value);
    _deliveryQuickWeights.push({ weight: val, tare: globalTare });
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

function updateDeliveryIndividualTare(index, value) {
    if (_deliveryQuickWeights[index] === undefined) return;
    const t = parseFloat(String(value).replace(',', '.'));
    _deliveryQuickWeights[index].tare = isNaN(t) ? 0 : Math.max(0, t);
    // Mise à jour du net affiché sans re-render complet (préserve le focus)
    const list = document.getElementById('delivery-quick-weights-list');
    if (!list) return;
    const entry    = _deliveryQuickWeights[index];
    const netSpans = list.querySelectorAll('span > span > span:last-of-type');
    if (netSpans[index]) {
        const netW = Math.max(0, entry.weight - _deliveryQuickWeights[index].tare).toFixed(2);
        netSpans[index].textContent = `→ ${netW} kg net`;
    }
    _syncDeliveryFromQuickWeights();
}

function undoLastDeliveryWeight() {
    if (!_deliveryQuickWeights.length) return;
    const removed = _deliveryQuickWeights.pop();
    _renderDeliveryQuickWeights();
    _syncDeliveryFromQuickWeights();
    showToast(`↩ ${removed.weight} kg retiré`, 'info', 1500);
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
    _renderDeliveryQuickWeights();
    _syncDeliveryFromQuickWeights();
}

function _syncDeliveryFromQuickWeights() {
    if (!_deliveryQuickWeights.length) return;

    const globalTare = _parseDeliveryNumber(document.getElementById('delivery-quick-tare-input')?.value);
    const total      = _deliveryQuickWeights.reduce((s, e) => s + e.weight, 0);

    // Tare totale exacte (somme des tares individuelles)
    const totalTare = _deliveryQuickWeights.reduce((s, e) => {
        const t = (e.tare !== null && e.tare !== undefined) ? e.tare : globalTare;
        return s + t;
    }, 0);
    const avgTare = _deliveryQuickWeights.length
        ? parseFloat((totalTare / _deliveryQuickWeights.length).toFixed(3))
        : globalTare;

    const grossEl = document.getElementById('delivery-gross-weight');
    const bagEl   = document.getElementById('delivery-bag-count');
    const bagWEl  = document.getElementById('delivery-bag-weight');

    if (grossEl) {
        grossEl.value = total.toFixed(2);
        // Stocker la tare totale réelle pour saveDelivery
        grossEl.dataset.totalTare = parseFloat(totalTare.toFixed(3));
    }
    if (bagEl)  bagEl.value  = _deliveryQuickWeights.length;
    if (bagWEl) bagWEl.value = avgTare;
    calculateDeliveryValues();
}

function _renderDeliveryQuickWeights() {
    const list    = document.getElementById('delivery-quick-weights-list');
    const countEl = document.getElementById('delivery-quick-bag-count');
    const totalEl = document.getElementById('delivery-quick-total-weight');
    const netEl   = document.getElementById('delivery-quick-net-weight');
    const tareEl  = document.getElementById('delivery-quick-tare-input');
    if (!list) return;

    const globalTare = _parseDeliveryNumber(tareEl?.value);
    const total      = _deliveryQuickWeights.reduce((s, e) => s + e.weight, 0);
    const net        = Math.max(0, _deliveryQuickWeights.reduce((s, e) => {
        const t = (e.tare !== null && e.tare !== undefined) ? e.tare : globalTare;
        return s + Math.max(0, e.weight - t);
    }, 0));

    if (countEl) countEl.textContent = _deliveryQuickWeights.length;
    if (totalEl) totalEl.textContent = total.toFixed(2);
    if (netEl)   netEl.textContent   = net.toFixed(2);

    if (!_deliveryQuickWeights.length) {
        list.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;color:var(--md-sys-color-on-surface-variant);
                        font-size:13px;padding:8px 4px;opacity:.7;">
                <span class="material-icons" style="font-size:18px;">inbox</span>
                Aucun poids ajouté
            </div>`;
        return;
    }

    list.innerHTML = _deliveryQuickWeights.map((entry, i) => {
        const indivTare = (entry.tare !== null && entry.tare !== undefined) ? entry.tare : globalTare;
        const netW      = Math.max(0, entry.weight - indivTare).toFixed(2);
        return `
        <span style="display:inline-flex;align-items:center;gap:6px;
                     background:var(--md-sys-color-primary);color:var(--md-sys-color-on-primary);
                     padding:4px 10px 4px 12px;border-radius:20px;font-size:13px;font-weight:500;
                     flex-wrap:nowrap;">
            <strong>${entry.weight} kg</strong>
            <span style="display:inline-flex;align-items:center;gap:2px;opacity:.85;font-size:11px;font-weight:400;">
                <span style="opacity:.7;">tare:</span>
                <input type="number"
                       value="${indivTare}"
                       min="0" step="0.01"
                       title="Tare pour ce poids (kg)"
                       style="width:46px;background:rgba(0,0,0,.25);border:1px solid rgba(240,237,244,.35);
                              border-radius:6px;color:inherit;font-size:11px;padding:1px 4px;
                              text-align:center;-moz-appearance:textfield;"
                       oninput="updateDeliveryIndividualTare(${i}, this.value)"
                       onclick="event.stopPropagation()">
                <span style="opacity:.7;">&#8594; ${netW} kg net</span>
            </span>
            <span class="material-icons" style="font-size:14px;cursor:pointer;opacity:.85;"
                  onclick="removeDeliveryQuickWeight(${i})">close</span>
        </span>`;
    }).join('');
}

// Initialisation listeners
document.addEventListener('DOMContentLoaded', setupDeliveryCalculations);
