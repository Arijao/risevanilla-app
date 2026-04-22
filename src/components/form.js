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

// ── Collector Media State ─────────────────────────────────────
// Buffers temporaires pendant l'édition du formulaire.
// Vidés à chaque ouverture du modal.
let _collectorPhotoData = null;    // base64 string ou null
let _collectorDocs      = [];      // [{ id, name, type, size, data, addedAt }]

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

    // Préserver les médias existants en cas d'édition
    const existing = editId ? (appData.collectors.find(c => c.id == editId) || {}) : {};

    const collector = {
        name,
        phone:     phone   || '',
        cin:       cin     || '',
        cinDate:   cinDate || '',
        address:   address || '',
        createdAt: existing.createdAt || new Date().toISOString(),
        // Médias : utiliser le buffer courant (modifié) ou conserver l'existant
        photo:     _collectorPhotoData !== undefined ? _collectorPhotoData : (existing.photo || null),
        documents: _collectorDocs.length || existing.documents
                   ? _collectorDocs.length ? [..._collectorDocs] : (existing.documents || [])
                   : []
    };
    if (editId) collector.id = parseInt(editId);
    saveToDB('collectors', collector);
    closeModal('collector-modal');
    showToast('✅ Collecteur enregistré avec succès!', 'success');
}

// ── Collector Photo ───────────────────────────────────────────

// Flux caméra actif (getUserMedia)
let _cameraStream = null;

/**
 * Ouvre le picker photo.
 * Sur mobile  → input[capture=environment] déclenche la caméra native directement.
 * Sur desktop → tente getUserMedia pour un flux live ; si refus/absent, fallback upload.
 */
function openCollectorCameraPicker() {
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isMobile) {
        // Mobile : laisser le browser gérer la caméra native
        document.getElementById('collector-camera-input').click();
        return;
    }

    // Desktop : tenter getUserMedia pour caméra live
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } })
            .then(stream => {
                _cameraStream = stream;
                const modal = document.getElementById('collector-camera-modal');
                const video = document.getElementById('collector-camera-video');
                video.srcObject = stream;
                modal.style.display = 'flex';
            })
            .catch(err => {
                console.warn('Camera access denied or unavailable:', err);
                // Fallback : ouvrir la galerie
                showToast('Caméra indisponible — sélectionnez une image', 'info', 3000);
                document.getElementById('collector-photo-input').click();
            });
    } else {
        // Pas de mediaDevices → fallback galerie
        document.getElementById('collector-photo-input').click();
    }
}

/** Capturer une frame depuis le flux live (desktop) */
function captureCollectorPhoto() {
    const video  = document.getElementById('collector-camera-video');
    const canvas = document.getElementById('collector-camera-canvas');
    if (!video || !canvas) return;

    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(blob => {
        if (!blob) return;
        const file = new File([blob], 'photo-camera.jpg', { type: 'image/jpeg' });
        closeCollectorCamera();
        // Réutiliser le pipeline de compression existant
        _compressImage(file, 400, 400, 0.82, base64 => {
            _collectorPhotoData = base64;
            _renderCollectorPhotoPreview(base64);
        });
    }, 'image/jpeg', 0.90);
}

/** Fermer le modal caméra et libérer le flux */
function closeCollectorCamera() {
    const modal = document.getElementById('collector-camera-modal');
    if (modal) modal.style.display = 'none';
    if (_cameraStream) {
        _cameraStream.getTracks().forEach(t => t.stop());
        _cameraStream = null;
    }
    const video = document.getElementById('collector-camera-video');
    if (video) video.srcObject = null;
}

/** Gère la sélection de fichier (galerie OU caméra native mobile) */
function handleCollectorPhotoSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
        showToast('Photo trop lourde (max 5 Mo)', 'error'); return;
    }
    _compressImage(file, 400, 400, 0.82, base64 => {
        _collectorPhotoData = base64;
        _renderCollectorPhotoPreview(base64);
    });
    event.target.value = '';
}

function removeCollectorPhoto() {
    _collectorPhotoData = null;
    _renderCollectorPhotoPreview(null);
}

function _renderCollectorPhotoPreview(base64) {
    const preview     = document.getElementById('collector-photo-preview');
    const placeholder = document.getElementById('collector-photo-placeholder');
    const removeBtn   = document.getElementById('collector-photo-remove');
    if (!preview) return;
    if (base64) {
        preview.src               = base64;
        preview.style.display     = 'block';
        placeholder.style.display = 'none';
        removeBtn.style.display   = 'flex';
    } else {
        preview.src               = '';
        preview.style.display     = 'none';
        placeholder.style.display = 'flex';
        removeBtn.style.display   = 'none';
    }
}

// ── Collector Documents ───────────────────────────────────────
function handleCollectorDocSelect(event) {
    Array.from(event.target.files).forEach(file => _addCollectorDoc(file));
    event.target.value = '';
}

function handleCollectorDocDrop(event) {
    event.preventDefault();
    document.getElementById('collector-doc-dropzone').classList.remove('cform-dropzone--over');
    Array.from(event.dataTransfer.files).forEach(file => {
        if (file.type.startsWith('image/') || file.type === 'application/pdf') {
            _addCollectorDoc(file);
        }
    });
}

function _addCollectorDoc(file) {
    if (file.size > 5 * 1024 * 1024) {
        showToast(`"${file.name}" dépasse 5 Mo`, 'error'); return;
    }
    if (_collectorDocs.length >= 10) {
        showToast('Maximum 10 documents par collecteur', 'error'); return;
    }
    const allowed = ['image/jpeg','image/png','image/webp','image/gif','application/pdf'];
    if (!allowed.includes(file.type)) {
        showToast(`Type non supporté : ${file.name}`, 'error'); return;
    }
    const reader = new FileReader();
    reader.onload = e => {
        const doc = {
            id:      Date.now() + Math.random(),
            name:    file.name,
            type:    file.type,
            size:    file.size,
            data:    e.target.result,  // base64
            addedAt: new Date().toISOString()
        };
        _collectorDocs.push(doc);
        _renderCollectorDocList();
    };
    reader.readAsDataURL(file);
}

function removeCollectorDoc(docId) {
    _collectorDocs = _collectorDocs.filter(d => d.id !== docId);
    _renderCollectorDocList();
}

function _renderCollectorDocList() {
    const list     = document.getElementById('collector-doc-list');
    const countBadge = document.getElementById('cform-doc-count');
    if (!list) return;
    if (countBadge) countBadge.textContent = _collectorDocs.length;

    if (!_collectorDocs.length) {
        list.innerHTML = '';
        return;
    }
    list.innerHTML = _collectorDocs.map(doc => {
        const isPdf   = doc.type === 'application/pdf';
        const sizeStr = doc.size < 1024 * 1024
            ? `${(doc.size / 1024).toFixed(0)} Ko`
            : `${(doc.size / (1024*1024)).toFixed(1)} Mo`;
        const thumb   = isPdf
            ? `<span class="material-icons" style="font-size:28px;color:var(--md-sys-color-error);">picture_as_pdf</span>`
            : `<img src="${doc.data}" alt="${doc.name}"
                    style="width:40px;height:40px;object-fit:cover;border-radius:6px;flex-shrink:0;">`;
        return `
        <div class="cform-doc-item" data-doc-id="${doc.id}">
            <div class="cform-doc-item__thumb">${thumb}</div>
            <div class="cform-doc-item__info">
                <div class="cform-doc-item__name" title="${doc.name}">${doc.name}</div>
                <div class="cform-doc-item__meta">${sizeStr}</div>
            </div>
            <div class="cform-doc-item__actions">
                <button type="button" class="btn-icon btn-outline" title="Aperçu"
                        onclick="previewCollectorDoc(${doc.id})">
                    <span class="material-icons" style="font-size:16px;">visibility</span>
                </button>
                <button type="button" class="btn-icon btn-danger" title="Supprimer"
                        onclick="removeCollectorDoc(${doc.id})">
                    <span class="material-icons" style="font-size:16px;">delete</span>
                </button>
            </div>
        </div>`;
    }).join('');
}

function previewCollectorDoc(docId) {
    const doc = _collectorDocs.find(d => d.id === docId);
    if (!doc) return;
    _openDocPreviewModal(doc);
}

// ── Doc Preview Modal (générique) ────────────────────────────
function _openDocPreviewModal(doc) {
    let modal = document.getElementById('doc-preview-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'modal';
        modal.id        = 'doc-preview-modal';
        document.body.appendChild(modal);
    }
    const isPdf = doc.type === 'application/pdf';
    const content = isPdf
        ? `<iframe src="${doc.data}" style="width:100%;height:70vh;border:none;border-radius:8px;"></iframe>`
        : `<img src="${doc.data}" alt="${doc.name}"
                style="max-width:100%;max-height:72vh;object-fit:contain;border-radius:8px;display:block;margin:0 auto;">`;
    modal.innerHTML = `
        <div class="modal-content" style="max-width:860px;width:95%;">
            <div class="modal-header">
                <h3 class="modal-title" style="display:flex;align-items:center;gap:8px;">
                    <span class="material-icons" style="color:var(--md-sys-color-primary);">${isPdf ? 'picture_as_pdf' : 'image'}</span>
                    ${doc.name}
                </h3>
                <button class="close-btn" onclick="closeModal('doc-preview-modal')">
                    <span class="material-icons">close</span>
                </button>
            </div>
            <div style="padding:8px 0 4px;">${content}</div>
            <div style="display:flex;justify-content:flex-end;padding-top:12px;border-top:1px solid var(--md-sys-color-outline-variant);margin-top:12px;">
                <a class="btn btn-outline" href="${doc.data}" download="${doc.name}">
                    <span class="material-icons">download</span> Télécharger
                </a>
                <button class="btn btn-primary" style="margin-left:10px;" onclick="closeModal('doc-preview-modal')">Fermer</button>
            </div>
        </div>`;
    openModal('doc-preview-modal');
}

// ── Reset media buffers (à appeler à chaque ouverture du modal) ──
function resetCollectorMediaBuffers(collector) {
    // collector = objet existant (édition) ou null (création)
    _collectorPhotoData = collector ? (collector.photo || null) : null;
    _collectorDocs      = collector ? [...(collector.documents || [])] : [];
    _renderCollectorPhotoPreview(_collectorPhotoData);
    _renderCollectorDocList();
    // reset le badge
    const badge = document.getElementById('cform-doc-count');
    if (badge) badge.textContent = _collectorDocs.length;
}

// ── Image compression ────────────────────────────────────────
function _compressImage(file, maxW, maxH, quality, callback) {
    const reader = new FileReader();
    reader.onload = e => {
        const img = new Image();
        img.onload = () => {
            let { width, height } = img;
            if (width > maxW || height > maxH) {
                const ratio = Math.min(maxW / width, maxH / height);
                width  = Math.round(width  * ratio);
                height = Math.round(height * ratio);
            }
            const canvas = document.createElement('canvas');
            canvas.width  = width;
            canvas.height = height;
            canvas.getContext('2d').drawImage(img, 0, 0, width, height);
            callback(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
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
