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

// ── Signature Pad State ───────────────────────────────────────
let _sigCanvas   = null;
let _sigCtx      = null;
let _sigDrawing  = false;
let _sigHasData  = false;

// ── Signature Pad Init ────────────────────────────────────────
function _initSignaturePad() {
    _sigCanvas = document.getElementById('signature-canvas');
    if (!_sigCanvas) return;

    // Calibrer le canvas à sa taille CSS réelle (évite le flou)
    const rect = _sigCanvas.getBoundingClientRect();
    _sigCanvas.width  = rect.width  || 476;
    _sigCanvas.height = rect.height || 200;

    _sigCtx = _sigCanvas.getContext('2d');
    _sigCtx.strokeStyle = '#1a1a2e';
    _sigCtx.lineWidth   = 2.5;
    _sigCtx.lineCap     = 'round';
    _sigCtx.lineJoin    = 'round';
    _sigHasData = false;

    // Nettoyer les anciens listeners en recréant le canvas clone
    const fresh = _sigCanvas.cloneNode(true);
    _sigCanvas.parentNode.replaceChild(fresh, _sigCanvas);
    _sigCanvas = fresh;
    _sigCtx    = _sigCanvas.getContext('2d');
    _sigCtx.strokeStyle = '#1a1a2e';
    _sigCtx.lineWidth   = 2.5;
    _sigCtx.lineCap     = 'round';
    _sigCtx.lineJoin    = 'round';

    function _pos(e) {
        const r = _sigCanvas.getBoundingClientRect();
        const scaleX = _sigCanvas.width  / r.width;
        const scaleY = _sigCanvas.height / r.height;
        const src = e.touches ? e.touches[0] : e;
        return { x: (src.clientX - r.left) * scaleX, y: (src.clientY - r.top) * scaleY };
    }

    function _start(e) {
        e.preventDefault();
        _sigDrawing = true;
        _sigHasData = true;
        const { x, y } = _pos(e);
        _sigCtx.beginPath();
        _sigCtx.moveTo(x, y);
        // Masquer le placeholder dès le premier trait
        const ph = document.getElementById('signature-placeholder');
        if (ph) ph.style.display = 'none';
    }
    function _move(e) {
        e.preventDefault();
        if (!_sigDrawing) return;
        const { x, y } = _pos(e);
        _sigCtx.lineTo(x, y);
        _sigCtx.stroke();
    }
    function _end(e) { e.preventDefault(); _sigDrawing = false; }

    _sigCanvas.addEventListener('mousedown',  _start);
    _sigCanvas.addEventListener('mousemove',  _move);
    _sigCanvas.addEventListener('mouseup',    _end);
    _sigCanvas.addEventListener('mouseleave', _end);
    _sigCanvas.addEventListener('touchstart', _start, { passive: false });
    _sigCanvas.addEventListener('touchmove',  _move,  { passive: false });
    _sigCanvas.addEventListener('touchend',   _end,   { passive: false });
}

function clearSignaturePad() {
    if (!_sigCanvas || !_sigCtx) return;
    _sigCtx.clearRect(0, 0, _sigCanvas.width, _sigCanvas.height);
    _sigHasData = false;
    const ph = document.getElementById('signature-placeholder');
    if (ph) ph.style.display = '';
}

// ── Open Signature Modal ──────────────────────────────────────
function openSignatureModal(advanceId) {
    const advance   = (appData.advances || []).find(a => a.id === advanceId);
    if (!advance) { showToast('Avance introuvable', 'error'); return; }
    const collector = (appData.collectors || []).find(c => c.id === advance.collectorId);

    const infoEl = document.getElementById('signature-advance-info');
    if (infoEl) {
        infoEl.innerHTML = `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 16px;">
                <div>📋 <strong>Réf.</strong> AVA-${String(advance.id).padStart(4,'0')}</div>
                <div>📅 <strong>Date :</strong> ${formatDate(advance.date)}</div>
                <div>👤 <strong>Collecteur :</strong> ${collector ? collector.name : '—'}</div>
                <div>💰 <strong>Montant :</strong> ${Math.abs(advance.amount).toLocaleString('fr-MG')} Ar</div>
            </div>`;
    }

    const hiddenId = document.getElementById('signature-advance-id');
    if (hiddenId) hiddenId.value = advanceId;

    openModal('signature-modal');

    // Init pad après ouverture (le canvas doit être visible pour getBoundingClientRect)
    setTimeout(_initSignaturePad, 80);
}

// ── Save Signature ────────────────────────────────────────────
async function saveSignature() {
    if (!_sigHasData) {
        showToast('Veuillez apposer la signature avant de confirmer.', 'error'); return;
    }

    const advanceId = parseInt(document.getElementById('signature-advance-id')?.value);
    const advance   = (appData.advances || []).find(a => a.id === advanceId);
    if (!advance) { showToast('Avance introuvable', 'error'); return; }

    // Extraire la signature en base64 (PNG transparent)
    const signatureData = _sigCanvas.toDataURL('image/png');

    // Construire l'objet avance mis à jour (put complet requis par IndexedDB)
    const updated = Object.assign({}, advance, {
        signature:   signatureData,
        confirmedAt: new Date().toISOString()
    });

    await saveToDB('advances', updated);
    closeModal('signature-modal');
    showToast('✅ Signature enregistrée — réception confirmée !', 'success');
}

// ── Generate PDF Receipt ──────────────────────────────────────
function generateAdvancePDF(advanceId) {
    const advance   = (appData.advances || []).find(a => a.id === advanceId);
    if (!advance) { showToast('Avance introuvable', 'error'); return; }
    const collector = (appData.collectors || []).find(c => c.id === advance.collectorId);
    const ref       = 'AVA-' + String(advance.id).padStart(4, '0');
    const confirmed = advance.confirmedAt
        ? new Date(advance.confirmedAt).toLocaleString('fr-FR')
        : '—';

    const sigHtml = advance.signature
        ? `<div style="margin-top:8px;">
               <div style="font-size:11px;color:#666;margin-bottom:4px;">Signature du collecteur :</div>
               <img src="${advance.signature}" style="max-width:260px;max-height:110px;border:1px solid #ddd;border-radius:6px;padding:4px;background:#fff;">
           </div>`
        : `<div style="margin-top:12px;padding:10px 16px;border:1px solid #ccc;border-radius:6px;font-style:italic;color:#555;font-size:12px;">
               ✔ Réception confirmée — signature non disponible
           </div>`;

    const html = `<!DOCTYPE html><html lang="fr"><head>
        <meta charset="UTF-8">
        <title>Reçu ${ref}</title>
        <style>
            *{box-sizing:border-box;margin:0;padding:0;}
            body{font-family:'Segoe UI',Arial,sans-serif;font-size:13px;color:#1a1a2e;padding:32px;max-width:600px;margin:0 auto;}
            .header{display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #6750a4;padding-bottom:16px;margin-bottom:24px;}
            .header-title-container{display:flex;align-items:center;gap:10px;}
            .header-logo{width:32px;height:32px;object-fit:contain;}
            .header h1{font-size:20px;color:#6750a4;letter-spacing:.5px;margin:0;}
            .header .sub{font-size:11px;color:#888;margin-top:2px;}
            .badge{background:#6750a4;color:#fff;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;}
            .section{background:#f5f0ff;border-radius:10px;padding:16px;margin-bottom:16px;}
            .section h2{font-size:13px;color:#6750a4;font-weight:700;margin-bottom:10px;display:flex;align-items:center;gap:6px;}
            .row{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #e8e0f7;}
            .row:last-child{border-bottom:none;}
            .row .label{color:#555;}
            .row .val{font-weight:600;}
            .amount{font-size:22px;font-weight:800;color:#6750a4;text-align:center;padding:14px;background:#ede7ff;border-radius:10px;margin:16px 0;letter-spacing:.5px;}
            .footer{margin-top:24px;border-top:1px solid #ddd;padding-top:12px;font-size:11px;color:#999;text-align:center;}
            .motif{background:#fff;border:1px solid #ddd;border-radius:8px;padding:10px 14px;font-style:italic;font-size:12px;color:#444;margin-top:8px;}
            @media print{body{padding:16px;}}
        </style>
    </head><body>
        <div class="header">
            <div>
                <div class="header-title-container">
                    <img src="logo-risevanilla.svg" class="header-logo">
                    <h1>RISEVANILLA</h1>
                </div>
                <div class="sub">Gestion de Collecte de Vanille</div>
            </div>
            <div>
                <div class="badge">${ref}</div>
                <div style="font-size:10px;color:#999;text-align:right;margin-top:4px;">REÇU D'AVANCE</div>
            </div>
        </div>

        <div class="amount">${Math.abs(advance.amount).toLocaleString('fr-MG')} Ar</div>

        <div class="section">
            <h2>📋 Détails de la transaction</h2>
            <div class="row"><span class="label">Collecteur</span><span class="val">${collector ? collector.name : '—'}</span></div>
            <div class="row"><span class="label">Date de l'avance</span><span class="val">${formatDate(advance.date)}</span></div>
            <div class="row"><span class="label">Référence</span><span class="val">${ref}</span></div>
            <div class="row"><span class="label">Confirmation réception</span><span class="val">${confirmed}</span></div>
        </div>

        ${advance.motif ? `<div class="section"><h2>📝 Motif</h2><div class="motif">${advance.motif}</div></div>` : ''}

        <div class="section">
            <h2>✍️ Preuve de réception</h2>
            ${sigHtml}
        </div>

        <div class="footer">
            Document généré le ${new Date().toLocaleString('fr-FR')} — RISEVANILLA © ${new Date().getFullYear()}
        </div>
    </body></html>`;

    const win = window.open('', '_blank', 'width=680,height=820');
    if (!win) { showToast('Autorisez les popups pour générer le reçu.', 'error'); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
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
                ${adv.signature
                    ? `<button class="btn btn-icon" title="Réception confirmée ✓"
                               style="color:#2e7d32;cursor:default;" disabled>
                           <span class="material-icons">verified</span>
                       </button>
                       <button class="btn btn-icon btn-outline" onclick="generateAdvancePDF(${adv.id})" title="Générer le reçu PDF">
                           <span class="material-icons">picture_as_pdf</span>
                       </button>`
                    : `<button class="btn btn-icon btn-outline" onclick="openSignatureModal(${adv.id})" title="Faire signer le collecteur"
                               style="color:var(--md-sys-color-primary);border-color:var(--md-sys-color-primary);">
                           <span class="material-icons">draw</span>
                       </button>`
                }
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
