/* ============================================================
 * FORM.JS — Form Setup, Collector CRUD, Reception CRUD
 *           + Reception Quick Weights, Validation
 * NOTE: Advance/Delivery/Expense CRUD → dans leurs pages dédiées
 * RISEVANILLA - Gestion de Collecte de Vanille
 * ============================================================ */

'use strict';

// ── Setup All Form Handlers ───────────────────────────────────
function setupFormHandlers() {
    // Collector form
    const collectorForm = document.getElementById('collector-form');
    if (collectorForm) collectorForm.addEventListener('submit', e => { e.preventDefault(); saveCollector(); });

    // Advance form — délégué à advances.js
    const advanceForm = document.getElementById('advance-form');
    if (advanceForm) advanceForm.addEventListener('submit', e => { e.preventDefault(); saveAdvance(e); });

    // Reception form
    const receptionForm = document.getElementById('reception-form');
    if (receptionForm) receptionForm.addEventListener('submit', e => { e.preventDefault(); saveReception(); });

    // Delivery form — délégué à deliveries.js
    const deliveryForm = document.getElementById('delivery-form');
    if (deliveryForm) deliveryForm.addEventListener('submit', e => { e.preventDefault(); saveDelivery(e); });

    // Expense form — délégué à expenses.js
    const expenseForm = document.getElementById('expense-form');
    if (expenseForm) expenseForm.addEventListener('submit', e => { e.preventDefault(); saveExpense(e); });
}

// ── Utilities ─────────────────────────────────────────────────
function setCurrentDate() {
    const today = new Date().toISOString().split('T')[0];
    ['advance-date', 'reception-date', 'delivery-date', 'expense-date'].forEach(id => {
        const el = document.getElementById(id);
        if (el && !el.value) el.value = today;
    });
}

function formatPhoneNumber(e) {
    const input   = e.target;
    const cursor  = input.selectionStart;
    const prevLen = input.value.length;

    // Extraire les chiffres bruts (max 10)
    const digits = input.value.replace(/\D/g, '').substring(0, 10);

    // Formatage progressif : 032 12 345 67
    let formatted = digits;
    if (digits.length > 3) formatted = digits.slice(0, 3) + ' ' + digits.slice(3);
    if (digits.length > 5) formatted = formatted.slice(0, 6) + ' ' + formatted.slice(6);
    if (digits.length > 8) formatted = formatted.slice(0, 10) + ' ' + formatted.slice(10);

    input.value = formatted;

    // Restaurer la position du curseur après reformatage
    const added = formatted.length - prevLen;
    input.setSelectionRange(Math.max(0, cursor + added), Math.max(0, cursor + added));
}

function formatPhoneNumberForDisplay(phoneString) {
    if (!phoneString) return 'N/A';
    const c = phoneString.replace(/\s/g, '');
    if (c.length === 10 && /^\d+$/.test(c))
        return `${c.substring(0,3)} ${c.substring(3,5)} ${c.substring(5,8)} ${c.substring(8,10)}`;
    return phoneString;
}

// Utilisé dans les formulaires : formate sans insérer 'N/A' si vide
function formatPhoneForInput(phoneString) {
    if (!phoneString) return '';
    const c = phoneString.replace(/\s/g, '');
    if (c.length === 10 && /^\d+$/.test(c))
        return `${c.substring(0,3)} ${c.substring(3,5)} ${c.substring(5,8)} ${c.substring(8,10)}`;
    return phoneString;
}

function capitalizeWords(str) {
    return str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

function capitalizeLive(input) {
    const pos = input.selectionStart;
    input.value = input.value.split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    input.setSelectionRange(pos, pos);
}

function formatCIN(input) {
    let v = input.value.replace(/\D/g, '');
    if (v.length > 12) v = v.slice(0, 12);
    v = v.replace(/(\d{3})(?=\d)/g, '$1 ').trim();
    input.value = v;
}

// ── Collector Save ────────────────────────────────────────────
function saveCollector() {
    const form    = document.getElementById('collector-form');
    const name    = capitalizeWords(document.getElementById('collector-name').value.trim());
    const phone   = document.getElementById('collector-phone').value.replace(/\s/g, '');
    const cin     = document.getElementById('collector-cin').value.trim();
    const cinDate = document.getElementById('collector-cin-date').value;
    const address = document.getElementById('collector-address').value;
    const editId  = form.dataset.editId;

    if (phone && (phone.length !== 10 || !phone.startsWith('0'))) {
        showToast('Le numéro de téléphone doit contenir 10 chiffres et commencer par 0.', 'error');
        return;
    }
    if (appData.collectors.some(c => (editId ? c.id != editId : true) && c.name.toLowerCase() === name.toLowerCase())) {
        showToast('❌ Un collecteur avec ce nom existe déjà!', 'error'); return;
    }
    if (cin && appData.collectors.some(c => (editId ? c.id != editId : true) && c.cin && c.cin.toLowerCase() === cin.toLowerCase())) {
        showToast('❌ Un collecteur avec ce N° CIN existe déjà!', 'error'); return;
    }

    const collector = {
        name,
        phone:   phone   || '',
        cin:     cin     || '',
        cinDate: cinDate || '',
        address: address || '',
        createdAt: new Date().toISOString()
    };
    if (editId) collector.id = parseInt(editId);
    saveToDB('collectors', collector);
    closeModal('collector-modal');
    showToast('✅ Collecteur enregistré avec succès!', 'success');
}

async function deleteCollector(id) {
    const ok = await confirmModal({
        title:       'Supprimer le collecteur',
        message:     'Toutes les données associées (avances, réceptions, remboursements) resteront intactes. Cette action est irréversible.',
        confirmText: 'Supprimer',
        cancelText:  'Annuler',
        variant:     'danger',
        icon:        'person_off'
    });
    if (!ok) return;
    deleteFromDB('collectors', id, () => showToast('Collecteur supprimé.', 'warning'));
}

// ── Reception Sync (pour le modal réception) ──────────────────
async function syncReceptionModuleData() {
    if (!db) return;
    const storesToSync = ['receptions','collectors','qualities','advances','remboursements','paiements'];
    try {
        const results = await Promise.all(storesToSync.map(storeName =>
            new Promise((resolve, reject) => {
                const tx      = db.transaction(storeName, 'readonly');
                const store   = tx.objectStore(storeName);
                const request = store.getAll();
                request.onsuccess = () => resolve({ storeName, data: request.result || [] });
                request.onerror   = () => reject({ storeName, data: [] });
            })
        ));
        results.forEach(r => { if (r.storeName) appData[r.storeName] = r.data; });
    } catch (e) { console.warn('syncReceptionModuleData:', e); }
}

// ── Reception Modal ───────────────────────────────────────────
async function openReceptionModal(receptionId = null) {
    await syncReceptionModuleData();
    const form = document.getElementById('reception-form');
    form.reset();
    delete form.dataset.editId;
    quickWeights = [];
    renderQuickWeights();
    setCurrentDate();
    updateQualitySelect();
    updateCollectorSelects();

    const titleEl = form.closest('.modal')?.querySelector('.modal-title');
    if (titleEl) titleEl.textContent = receptionId ? 'Modifier Réception' : 'Nouvelle Réception';

    if (receptionId) {
        const reception = appData.receptions.find(r => r.id === receptionId);
        if (reception) {
            form.dataset.editId = receptionId;
            document.getElementById('reception-collector').value    = reception.collectorId;
            document.getElementById('reception-date').value         = reception.date;
            document.getElementById('reception-gross-weight').value = reception.grossWeight || '';
            document.getElementById('reception-bag-count').value    = reception.bagCount || 1;
            document.getElementById('reception-bag-weight').value   = reception.bagWeight || '';
            document.getElementById('reception-net-weight').value   = reception.netWeight || '';
            document.getElementById('reception-quality').value      = reception.quality || '';
            document.getElementById('reception-price').value        = reception.price || '';
            document.getElementById('reception-total-value').value  = reception.totalValue || '';
            if (reception.quickWeights) { quickWeights = [...reception.quickWeights]; renderQuickWeights(); }
            updateCollectorBalanceDisplay();
        }
    }
    openModal('reception-modal');
}

async function saveReception() {
    await syncReceptionModuleData();

    const collectorId = parseInt(document.getElementById('reception-collector').value);
    const date        = document.getElementById('reception-date').value;
    const grossWeight = parseFloat(document.getElementById('reception-gross-weight').value) || 0;
    const bagCount    = parseInt(document.getElementById('reception-bag-count').value) || 0;
    const bagWeight   = parseFloat(document.getElementById('reception-bag-weight').value) || 0;
    const netWeight   = parseFloat(document.getElementById('reception-net-weight').value) || 0;
    const quality     = document.getElementById('reception-quality').value;
    const priceInput  = document.getElementById('reception-price').value;
    const price       = (!priceInput || priceInput === '') ? 0 : parseFloat(priceInput);
    const totalValue  = parseFloat(document.getElementById('reception-total-value').value) || 0;

    if (!collectorId || !date || isNaN(netWeight) || !quality) {
        showToast('Veuillez remplir tous les champs obligatoires', 'error');
        return;
    }

    const form      = document.getElementById('reception-form');
    const isEditing = form.dataset.editId;
    const reception = {
        collectorId, date, grossWeight, bagCount, bagWeight, netWeight, quality, price, totalValue,
        quickWeights: [...quickWeights],
        year: new Date(date).getFullYear()
    };

    if (isEditing) {
        reception.id = parseInt(form.dataset.editId);
    } else {
        reception.id = Math.max(...(appData.receptions.map(r => r.id || 0)), 0) + 1;
    }

    try {
        await saveToDB('receptions', reception);
        closeModal('reception-modal');
        showToast(isEditing ? 'Réception modifiée!' : 'Réception enregistrée!', 'success');
    } catch (e) {
        showToast('Erreur lors de la sauvegarde', 'error');
    }
}

async function deleteReception(id) {
    const ok = await confirmModal({
        title:       'Supprimer la réception',
        message:     'Cette réception sera définitivement supprimée. Le solde du collecteur sera recalculé automatiquement.',
        confirmText: 'Supprimer',
        cancelText:  'Annuler',
        variant:     'danger',
        icon:        'delete_forever'
    });
    if (!ok) return;
    deleteFromDB('receptions', id, () => showToast('Réception supprimée.', 'warning'));
}

// ── Reception Calculations ────────────────────────────────────
function setupReceptionCalculations() {
    ['reception-gross-weight','reception-bag-count','reception-bag-weight','reception-price','reception-net-weight']
        .forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', calculateReceptionValues);
        });
}

function calculateReceptionValues() {
    const gross     = parseFloat(document.getElementById('reception-gross-weight').value?.replace(',','.')) || 0;
    const bagCount  = parseInt(document.getElementById('reception-bag-count').value) || 0;
    const bagWeight = parseFloat(document.getElementById('reception-bag-weight').value?.replace(',','.')) || 0;
    const price     = parseFloat(document.getElementById('reception-price').value?.replace(',','.')) || 0;
    const netWeight = Math.max(0, gross - (bagCount * bagWeight));
    document.getElementById('reception-net-weight').value  = netWeight.toFixed(2);
    document.getElementById('reception-total-value').value = Math.round(netWeight * price) || '';
}

// ── Reception Quick Weights ───────────────────────────────────
function addQuickWeight() {
    const input  = document.getElementById('quick-weight-input');
    const val    = parseFloat((input?.value || '').replace(',', '.'));
    if (isNaN(val) || val <= 0) { showToast('Poids invalide (> 0 kg)', 'error', 2000); return; }
    quickWeights.push(val);
    if (input) input.value = '';
    input?.focus();
    renderQuickWeights();
    updateReceptionFromQuickWeights();
}

function renderQuickWeights() {
    const list     = document.getElementById('quick-weights-list');
    const countEl  = document.getElementById('quick-bag-count');
    const totalEl  = document.getElementById('quick-total-weight');
    const netEl    = document.getElementById('quick-net-weight');
    const tareEl   = document.getElementById('quick-tare-input');
    if (!list) return;

    const tare  = parseFloat(tareEl?.value?.replace(',', '.')) || 0;
    const total = quickWeights.reduce((s, w) => s + w, 0);
    const net   = Math.max(0, total - quickWeights.length * tare);

    if (countEl) countEl.textContent = quickWeights.length;
    if (totalEl) totalEl.textContent = total.toFixed(2);
    if (netEl)   netEl.textContent   = net.toFixed(2);

    list.innerHTML = quickWeights.length
        ? quickWeights.map((w, i) => `
            <span style="display:inline-flex;align-items:center;gap:4px;
                         background:var(--md-sys-color-primary);color:var(--md-sys-color-on-primary);
                         padding:4px 10px;border-radius:20px;font-size:13px;font-weight:500;">
                <strong>${w} kg</strong>
                <span class="material-icons" style="font-size:14px;cursor:pointer;"
                      onclick="removeQuickWeight(${i})">close</span>
            </span>`).join('')
        : `<div style="opacity:.6;font-size:13px;padding:4px;">
               Aucun poids ajouté — saisir ci-dessus
           </div>`;
}

function removeQuickWeight(index) {
    quickWeights.splice(index, 1);
    renderQuickWeights();
    updateReceptionFromQuickWeights();
}

function undoLastWeight() {
    if (!quickWeights.length) return;
    const removed = quickWeights.pop();
    renderQuickWeights();
    updateReceptionFromQuickWeights();
    showToast(`↩ ${removed} kg retiré`, 'info', 1500);
}

async function clearQuickWeights() {
    if (!quickWeights.length) return;
    const ok = await confirmModal({
        title:       'Effacer tous les poids',
        message:     'Tous les poids du pesage rapide seront supprimés.',
        confirmText: 'Effacer tout',
        cancelText:  'Annuler',
        variant:     'warning',
        icon:        'delete_sweep'
    });
    if (!ok) return;
    quickWeights = [];
    renderQuickWeights();
    updateReceptionFromQuickWeights();
}

function updateReceptionFromQuickWeights() {
    const total    = quickWeights.reduce((s, w) => s + w, 0);
    const tare     = parseFloat(document.getElementById('quick-tare-input')?.value?.replace(',', '.')) || 0;
    document.getElementById('reception-gross-weight').value = total.toFixed(2);
    document.getElementById('reception-bag-count').value    = quickWeights.length;
    document.getElementById('reception-bag-weight').value   = tare;
    calculateReceptionValues();
}

// ── Collector Balance Display ─────────────────────────────────
function updateCollectorBalanceDisplay() {
    const collectorId = parseInt(document.getElementById('reception-collector')?.value);
    const balEl = document.getElementById('reception-collector-balance');
    if (!balEl) return;
    if (!collectorId) { balEl.value = ''; return; }
    const balance = calculateCollectorBalance(collectorId);
    const status  = getCollectorStatus(balance);
    balEl.value   = `${formatCurrency(Math.abs(balance))} (${status.label})`;
}

// ── Live Validation ───────────────────────────────────────────
function validateCollectorNameLive() {
    const nameInput = document.getElementById('collector-name');
    if (!nameInput) return;
    nameInput.addEventListener('input', function () {
        const name   = this.value.trim();
        const editId = document.getElementById('collector-form').dataset.editId;
        const exists = appData.collectors.some(c => {
            if (editId && c.id == editId) return false;
            return c.name.toLowerCase() === name.toLowerCase();
        });
        let errEl = this.parentElement.querySelector('.error-message');
        if (exists) {
            if (!errEl) {
                errEl = Object.assign(document.createElement('small'), {
                    className: 'error-message',
                    style: 'color:var(--md-sys-color-error);font-size:12px;'
                });
                this.parentElement.appendChild(errEl);
            }
            errEl.textContent = '⚠️ Ce nom existe déjà';
            this.style.borderColor = 'var(--md-sys-color-error)';
        } else {
            if (errEl) errEl.remove();
            this.style.borderColor = '';
        }
    });
}

function validateCollectorCINLive() {
    const cinInput = document.getElementById('collector-cin');
    if (!cinInput) return;
    cinInput.addEventListener('input', function () {
        const cin    = this.value.trim();
        const editId = document.getElementById('collector-form').dataset.editId;
        if (!cin) return;
        const exists = appData.collectors.some(c => {
            if (editId && c.id == editId) return false;
            return c.cin && c.cin.toLowerCase() === cin.toLowerCase();
        });
        let errEl = this.parentElement.querySelector('.error-message');
        if (exists) {
            if (!errEl) {
                errEl = Object.assign(document.createElement('small'), {
                    className: 'error-message',
                    style: 'color:var(--md-sys-color-error);font-size:12px;'
                });
                this.parentElement.appendChild(errEl);
            }
            errEl.textContent = '⚠️ Ce CIN existe déjà';
            this.style.borderColor = 'var(--md-sys-color-error)';
        } else {
            if (errEl) errEl.remove();
            this.style.borderColor = '';
        }
    });
}
