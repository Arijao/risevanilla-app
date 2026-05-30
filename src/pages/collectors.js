/* ============================================================
 * COLLECTORS.JS — Collector Details, Export Report
 * RISEVANILLA - Gestion de Collecte de Vanille
 * ============================================================ */

'use strict';

// ── Open / Edit collector modal ───────────────────────────────
function openCollectorModal(collectorId) {
    const form = document.getElementById('collector-form');
    if (!form) return;
    form.reset();
    delete form.dataset.editId;

    const titleEl = document.querySelector('#collector-modal .modal-title');

    if (collectorId) {
        const c = appData.collectors.find(c => c.id === collectorId);
        if (!c) return;
        form.dataset.editId = collectorId;
        if (titleEl) titleEl.textContent = 'Modifier Collecteur';
        document.getElementById('collector-name').value    = c.name    || '';
        
        // Gérer les téléphones multiples
        const phoneContainer = document.getElementById('collector-phone-container');
        if (phoneContainer) {
            phoneContainer.innerHTML = '';
            const phones = Array.isArray(c.phone) ? c.phone : (c.phone ? [c.phone] : []);
            if (phones.length > 0) {
                phones.forEach(p => addCollectorPhoneField(p));
            } else {
                addCollectorPhoneField('');
            }
        }

        document.getElementById('collector-cin').value      = formatCINForInput(c.cin);
        document.getElementById('collector-cin-date').value  = c.cinDate  || '';
        const cinPlaceEl = document.getElementById('collector-cin-place');
        if (cinPlaceEl) cinPlaceEl.value = c.cinPlace || '';
        document.getElementById('collector-address').value   = c.address  || '';
        // Charger les médias existants dans les buffers
        resetCollectorMediaBuffers(c);
    } else {
        if (titleEl) titleEl.textContent = 'Ajouter Collecteur';
        resetCollectorMediaBuffers(null);
        
        // Initialiser avec un champ de téléphone vide
        const phoneContainer = document.getElementById('collector-phone-container');
        if (phoneContainer) {
            phoneContainer.innerHTML = '';
            addCollectorPhoneField('');
        }
    }
    openModal('collector-modal');
}

function showCollectorDetails(collectorId) {
    const collector = appData.collectors.find(c => c.id === collectorId);
    if (!collector) { showToast('Collecteur introuvable.', 'error'); return; }

    const advances       = getAdvancesForCurrentYear().filter(a => a.collectorId === collectorId);
    const receptions     = getReceptionsForCurrentYear().filter(r => r.collectorId === collectorId);
    const remboursements = getRemboursementsForCurrentYear().filter(r => r.collectorId === collectorId);
    const paiements      = getPaiementsForCurrentYear().filter(p => p.collectorId === collectorId);

    const totalAdvances      = advances.reduce((s, a) => s + a.amount, 0);
    const totalDeliveries    = receptions.reduce((s, r) => s + r.totalValue, 0);
    const totalRemboursements = remboursements.reduce((s, r) => s + r.amount, 0);
    const totalPaiements     = paiements.reduce((s, p) => s + p.amount, 0);
    const balance            = calculateCollectorBalance(collectorId);
    const globalBalance      = calculateCollectorBalanceGlobal(collectorId);
    const status             = getCollectorStatus(balance);
    const globalStatus       = getCollectorStatus(globalBalance);

    const tableStyle = 'width:100%;border-collapse:collapse;';
    const thStyle    = 'padding:8px;text-align:left;background:var(--md-sys-color-surface-variant);color:var(--md-sys-color-on-surface-variant);';
    const tdStyle    = 'padding:8px;color:var(--md-sys-color-on-surface);border-bottom:1px solid var(--md-sys-color-outline-variant);';

    function makeTable(cols, rows, total) {
        if (!rows.length) return `<div style="text-align:center;padding:20px;opacity:.6;">Aucune donnée</div>`;
        return `<table style="${tableStyle}">
            <thead><tr>${cols.map(c => `<th style="${thStyle}${c.right ? 'text-align:right;' : ''}">${c.label}</th>`).join('')}</tr></thead>
            <tbody>
                ${rows.map(r => `<tr>${r.map((v, i) => `<td style="${tdStyle}${cols[i]?.right ? 'text-align:right;' : ''}">${v}</td>`).join('')}</tr>`).join('')}
                ${total ? `<tr style="font-weight:bold;background:var(--md-sys-color-surface-variant);">${total}</tr>` : ''}
            </tbody>
        </table>`;
    }

    const advTable  = makeTable(
        [{label:'Date'},{label:'Motif'},{label:'Montant',right:true}],
        advances.sort((a,b)=>new Date(a.date)-new Date(b.date)).map(a=>[formatDate(a.date),a.motif||'',formatCurrency(a.amount)]),
        `<td colspan="2" style="${tdStyle}">TOTAL</td><td style="${tdStyle}text-align:right;">${formatCurrency(totalAdvances)}</td>`
    );
    // ── Résumé réceptions segmenté par vanilleType ──────────────────
    const recVerte    = receptions.filter(r => getVanilleType(r.quality) === 'verte');
    const recPreparee = receptions.filter(r => getVanilleType(r.quality) === 'preparee');
    const poidsVerte  = recVerte.reduce((s, r) => s + (r.netWeight || 0), 0);
    const valVerte    = recVerte.reduce((s, r) => s + (r.totalValue || 0), 0);
    const poidsPrep   = recPreparee.reduce((s, r) => s + (r.netWeight || 0), 0);
    const valPrep     = recPreparee.reduce((s, r) => s + (r.totalValue || 0), 0);

    const recSummary = `
        <div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:14px;">
            <div style="flex:1;min-width:160px;display:flex;align-items:center;gap:10px;
                        padding:10px 14px;border-radius:10px;background:rgba(152,144,168,.13);">
                <span class="material-icons" style="color:#64dd17;font-size:18px;">grass</span>
                <div>
                    <div style="font-size:10px;font-weight:700;color:#64dd17;text-transform:uppercase;letter-spacing:.4px;">Vanille Verte</div>
                    <div style="font-size:13px;font-weight:600;">${poidsVerte.toFixed(2)} kg</div>
                    <div style="font-size:11px;opacity:.7;">${formatCurrency(Math.round(valVerte))}</div>
                </div>
            </div>
            <div style="flex:1;min-width:160px;display:flex;align-items:center;gap:10px;
                        padding:10px 14px;border-radius:10px;background:rgba(152,144,168,.10);">
                <span class="material-icons" style="color:var(--md-sys-color-primary);font-size:18px;">verified</span>
                <div>
                    <div style="font-size:10px;font-weight:700;color:var(--md-sys-color-primary);text-transform:uppercase;letter-spacing:.4px;">Vanille Préparée</div>
                    <div style="font-size:13px;font-weight:600;">${poidsPrep.toFixed(2)} kg</div>
                    <div style="font-size:11px;opacity:.7;">${formatCurrency(Math.round(valPrep))}</div>
                </div>
            </div>
            <div style="flex:1;min-width:160px;display:flex;align-items:center;gap:10px;
                        padding:10px 14px;border-radius:10px;
                        background:var(--md-sys-color-surface-variant);
                        border:1px solid var(--md-sys-color-outline-variant);">
                <span class="material-icons" style="color:var(--md-sys-color-on-surface-variant);font-size:18px;">summarize</span>
                <div>
                    <div style="font-size:10px;font-weight:700;color:var(--md-sys-color-on-surface-variant);text-transform:uppercase;letter-spacing:.4px;">Total</div>
                    <div style="font-size:13px;font-weight:600;">${(poidsVerte+poidsPrep).toFixed(2)} kg</div>
                    <div style="font-size:11px;opacity:.7;">${formatCurrency(Math.round(valVerte+valPrep))}</div>
                </div>
            </div>
        </div>`;

    const recTable  = recSummary + makeTable(
        [{label:'Date'},{label:'Poids Net',right:true},{label:'Qualité'},{label:'Type'},{label:'Prix/kg',right:true},{label:'Valeur',right:true}],
        receptions.sort((a,b)=>new Date(a.date)-new Date(b.date)).map(r => {
            const vt = getVanilleType(r.quality);
            const badge = vt === 'verte'
                ? '<span style="display:inline-flex;align-items:center;gap:3px;font-size:10px;padding:1px 6px;border-radius:20px;background:rgba(152,144,168,.18);color:#9890A8;font-weight:600;"><span class="material-icons" style="font-size:11px;">grass</span>Verte</span>'
                : '<span style="display:inline-flex;align-items:center;gap:3px;font-size:10px;padding:1px 6px;border-radius:20px;background:rgba(152,144,168,.10);color:var(--md-sys-color-primary);font-weight:600;"><span class="material-icons" style="font-size:11px;">verified</span>Préparée</span>';
            return [formatDate(r.date), r.netWeight.toFixed(2)+' kg', r.quality, badge, formatCurrency(r.price), formatCurrency(r.totalValue)];
        }),
        `<td colspan="5" style="${tdStyle}">TOTAL</td><td style="${tdStyle}text-align:right;">${formatCurrency(totalDeliveries)}</td>`
    );
    const rembTable = makeTable(
        [{label:'Date'},{label:'Note'},{label:'Montant',right:true}],
        remboursements.sort((a,b)=>new Date(a.date)-new Date(b.date)).map(r=>[formatDate(r.date),r.note||'',formatCurrency(r.amount)]),
        `<td colspan="2" style="${tdStyle}">TOTAL REMBOURSÉ</td><td style="${tdStyle}text-align:right;">${formatCurrency(totalRemboursements)}</td>`
    );
    const paiTable  = makeTable(
        [{label:'Date'},{label:'Note'},{label:'Montant',right:true}],
        paiements.sort((a,b)=>new Date(a.date)-new Date(b.date)).map(p=>[formatDate(p.date),p.note||'',formatCurrency(p.amount)]),
        `<td colspan="2" style="${tdStyle}">TOTAL PAYÉ</td><td style="${tdStyle}text-align:right;">${formatCurrency(totalPaiements)}</td>`
    );

    const modalContent = `
        <div class="modal-header">
            <h3 class="modal-title">
                <span class="material-icons" style="color:var(--md-sys-color-primary);">person</span>
                Détails — ${collector.name}
            </h3>
            <button class="close-btn" onclick="closeModal('collector-details-modal')"><span class="material-icons">close</span></button>
        </div>
        <div style="max-height:80vh;overflow-y:auto;padding-right:8px;">
            <!-- Info collecteur -->
            <div style="background:linear-gradient(135deg,var(--md-sys-color-primary-container),var(--md-sys-color-tertiary-container));padding:20px;border-radius:16px;margin-bottom:20px;color:var(--md-sys-color-on-primary-container);">
                <div style="display:flex;align-items:flex-start;gap:16px;flex-wrap:wrap;">
                    ${collector.photo ? `
                    <div style="flex-shrink:0;">
                        <img src="${collector.photo}" alt="${collector.name}"
                             onclick="openPhotoPreviewModal(this.src, this.alt)"
                             title="Cliquer pour agrandir"
                             style="width:80px;height:80px;border-radius:12px;object-fit:cover;
                                    border:3px solid rgba(240,237,244,0.35);
                                    box-shadow:0 4px 16px rgba(0,0,0,0.25);
                                    cursor:pointer;transition:transform 0.2s ease,box-shadow 0.2s ease;"
                             onmouseover="this.style.transform='scale(1.08)';this.style.boxShadow='0 8px 28px rgba(0,0,0,0.38)'"
                             onmouseout="this.style.transform='';this.style.boxShadow='0 4px 16px rgba(0,0,0,0.25)'">
                    </div>` : ''}
                    <div style="flex:1;min-width:0;">
                        <h4 style="margin-bottom:16px;font-size:18px;display:flex;align-items:center;gap:8px;"><span class="material-icons">account_circle</span> Informations</h4>
                        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;">
                            <div><div style="font-size:12px;opacity:.8;margin-bottom:4px;"><span class="material-icons" style="font-size:16px;vertical-align:middle;">phone</span> Téléphone</div><div style="font-weight:600;">${formatPhoneNumberForDisplay(collector.phone)}</div></div>
                            <div><div style="font-size:12px;opacity:.8;margin-bottom:4px;"><span class="material-icons" style="font-size:16px;vertical-align:middle;">fingerprint</span> CIN</div><div style="font-weight:600;">${collector.cin||'—'} ${collector.cinDate?`<small>(${formatDate(collector.cinDate)})</small>`:''}</div>${collector.cinPlace?`<div style="font-size:12px;opacity:.75;margin-top:3px;"><span class="material-icons" style="font-size:13px;vertical-align:middle;">location_on</span> ${collector.cinPlace}</div>`:''}</div>
                            <div><div style="font-size:12px;opacity:.8;margin-bottom:4px;"><span class="material-icons" style="font-size:16px;vertical-align:middle;">location_on</span> Adresse</div><div style="font-weight:600;">${collector.address||'—'}</div></div>
                            <div><div style="font-size:12px;opacity:.8;margin-bottom:4px;"><span class="material-icons" style="font-size:16px;vertical-align:middle;">calendar_today</span> Inscription</div><div style="font-weight:600;">${formatDate(collector.createdAt)}</div></div>
                        </div>
                    </div>
                </div>
            </div>
            <!-- Summary cards -->
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:20px;">
                <div class="collector-stat-card collector-stat-card--advances">
                    <div class="collector-stat-card__label">Total Avances (${currentYear})</div>
                    <div class="collector-stat-card__value">${formatCurrency(totalAdvances)}</div>
                </div>
                <div class="collector-stat-card collector-stat-card--receptions">
                    <div class="collector-stat-card__label">Total Réceptions (${currentYear})</div>
                    <div class="collector-stat-card__value">${formatCurrency(totalDeliveries)}</div>
                </div>
                <div class="collector-stat-card ${balance >= 0 ? 'collector-stat-card--balance-ok' : 'collector-stat-card--balance-bad'}">
                    <div class="collector-stat-card__label">Solde ${currentYear}</div>
                    <div class="collector-stat-card__value">${formatCurrency(Math.abs(balance))}</div>
                    <div class="collector-stat-card__status">${status.label}</div>
                </div>
                <div class="collector-stat-card ${globalBalance >= 0 ? 'collector-stat-card--global-ok' : 'collector-stat-card--global-bad'}">
                    <div class="collector-stat-card__label">Dette Totale (Toutes années)</div>
                    <div class="collector-stat-card__value">${formatCurrency(Math.abs(globalBalance))}</div>
                    <div class="collector-stat-card__status">${globalStatus.label}</div>
                </div>
            </div>
            <!-- Tabs -->
            <div>
                <div style="display:flex;border-bottom:2px solid var(--md-sys-color-outline-variant);margin-bottom:16px;flex-wrap:wrap;" id="detail-tabs">
                    <button class="detail-tab-btn" onclick="switchDetailTab(event,'dt-advances')"   style="padding:10px 16px;border:none;background:none;color:var(--md-sys-color-primary);font-weight:500;border-bottom:2px solid var(--md-sys-color-primary);cursor:pointer;">💰 Avances (${advances.length})</button>
                    <button class="detail-tab-btn" onclick="switchDetailTab(event,'dt-receptions')" style="padding:10px 16px;border:none;background:none;color:var(--md-sys-color-on-surface);opacity:.7;font-weight:500;border-bottom:2px solid transparent;cursor:pointer;">📦 Réceptions (${receptions.length})</button>
                    <button class="detail-tab-btn" onclick="switchDetailTab(event,'dt-remb')"       style="padding:10px 16px;border:none;background:none;color:var(--md-sys-color-on-surface);opacity:.7;font-weight:500;border-bottom:2px solid transparent;cursor:pointer;">💵 Remboursements (${remboursements.length})</button>
                    <button class="detail-tab-btn" onclick="switchDetailTab(event,'dt-paiements')"  style="padding:10px 16px;border:none;background:none;color:var(--md-sys-color-on-surface);opacity:.7;font-weight:500;border-bottom:2px solid transparent;cursor:pointer;">💸 Paiements (${paiements.length})</button>
                    <button class="detail-tab-btn" onclick="switchDetailTab(event,'dt-documents')"  style="padding:10px 16px;border:none;background:none;color:var(--md-sys-color-on-surface);opacity:.7;font-weight:500;border-bottom:2px solid transparent;cursor:pointer;">🗂 Documents (${(collector.documents||[]).length})</button>
                </div>
                <div id="dt-advances"   class="detail-tab-content" style="display:block;">${advTable}</div>
                <div id="dt-receptions" class="detail-tab-content" style="display:none;">${recTable}</div>
                <div id="dt-remb"       class="detail-tab-content" style="display:none;">${rembTable}</div>
                <div id="dt-paiements"  class="detail-tab-content" style="display:none;">${paiTable}</div>
                <div id="dt-documents"  class="detail-tab-content" style="display:none;">${_renderCollectorDocsTab(collector)}</div>
            </div>
            <!-- Actions -->
            <div style="display:flex;gap:12px;border-top:1px solid var(--md-sys-color-outline-variant);padding-top:16px;margin-top:16px;flex-wrap:wrap;">
                <button class="btn btn-outline" onclick="exportCollectorReport(${collectorId})"><span class="material-icons">picture_as_pdf</span> Export PDF</button>
                <button class="btn btn-success" onclick="exportCollectorDetailsToExcel(${collectorId})"><span class="material-icons">table_view</span> Export Excel</button>
                <button class="btn btn-primary" onclick="closeModal('collector-details-modal')">Fermer</button>
            </div>
        </div>`;

    let modal = document.getElementById('collector-details-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'collector-details-modal';
        document.body.appendChild(modal);
    }
    modal.innerHTML = `<div class="modal-content" style="max-width:900px;width:95%;max-height:90vh;">${modalContent}</div>`;
    openModal('collector-details-modal');
}

function switchDetailTab(event, tabId) {
    const tabs = event.target.closest('[id="detail-tabs"]') || event.target.parentElement;
    tabs.querySelectorAll('.detail-tab-btn').forEach(btn => {
        btn.style.borderBottomColor = 'transparent';
        btn.style.color = 'var(--md-sys-color-on-surface)';
        btn.style.opacity = '0.7';
    });
    const content = tabs.parentElement || document.getElementById('collector-details-modal');
    content.querySelectorAll('.detail-tab-content').forEach(c => c.style.display = 'none');
    const tab = document.getElementById(tabId);
    if (tab) tab.style.display = 'block';
    event.target.style.borderBottomColor = 'var(--md-sys-color-primary)';
    event.target.style.color = 'var(--md-sys-color-primary)';
    event.target.style.opacity = '1';
}

// ── Documents tab renderer (fiche détail, lecture seule) ─────
function _renderCollectorDocsTab(collector) {
    const docs = collector.documents || [];
    if (!docs.length) {
        return `<div style="text-align:center;padding:32px 20px;opacity:.55;">
            <span class="material-icons" style="font-size:40px;display:block;margin-bottom:8px;">folder_open</span>
            Aucun document enregistré
        </div>`;
    }
    return `<div class="cdetail-doc-grid">
        ${docs.map(doc => {
            const isPdf   = doc.type === 'application/pdf';
            const sizeStr = doc.size < 1024*1024
                ? `${(doc.size/1024).toFixed(0)} Ko`
                : `${(doc.size/(1024*1024)).toFixed(1)} Mo`;
            const dateStr = doc.addedAt ? formatDate(doc.addedAt.split('T')[0]) : '';
            const thumb   = isPdf
                ? `<div class="cdetail-doc-card__thumb cdetail-doc-card__thumb--pdf">
                       <span class="material-icons" style="font-size:32px;">picture_as_pdf</span>
                   </div>`
                : `<div class="cdetail-doc-card__thumb">
                       <img src="${doc.data}" alt="${doc.name}"
                            style="width:100%;height:100%;object-fit:cover;">
                   </div>`;
            return `
            <div class="cdetail-doc-card" onclick="_detailDocPreview(${JSON.stringify(doc).replace(/"/g,'&quot;')})" title="Cliquer pour voir">
                ${thumb}
                <div class="cdetail-doc-card__info">
                    <div class="cdetail-doc-card__name" title="${doc.name}">${doc.name}</div>
                    <div class="cdetail-doc-card__meta">${sizeStr}${dateStr ? ' · '+dateStr : ''}</div>
                </div>
                <span class="material-icons cdetail-doc-card__eye">visibility</span>
            </div>`;
        }).join('')}
    </div>`;
}

function _detailDocPreview(doc) {
    _openDocPreviewModal(doc);
}

// ── Photo Preview Modal ───────────────────────────────────────
/**
 * openPhotoPreviewModal(src, name)
 * Ouvre un lightbox pour visualiser l'avatar du collecteur en grand.
 * Fermeture : clic sur le backdrop, bouton ×, ou touche Échap.
 */
function openPhotoPreviewModal(src, name) {
    // Créer l'overlay une seule fois
    let overlay = document.getElementById('photo-preview-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'photo-preview-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-label', 'Aperçu photo');
        overlay.innerHTML = `
            <div class="photo-preview-box">
                <button class="photo-preview-close" id="photo-preview-close-btn" aria-label="Fermer l'aperçu">
                    <span class="material-icons">close</span>
                </button>
                <img id="photo-preview-img" src="" alt="" class="photo-preview-img">
                <p id="photo-preview-name" class="photo-preview-name"></p>
            </div>`;
        document.body.appendChild(overlay);

        // Fermeture au clic sur le backdrop
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) closePhotoPreviewModal();
        });
        // Fermeture via le bouton ×
        document.getElementById('photo-preview-close-btn')
            .addEventListener('click', closePhotoPreviewModal);
    }

    // Injecter le contenu
    document.getElementById('photo-preview-img').src = src;
    document.getElementById('photo-preview-img').alt = name || '';
    document.getElementById('photo-preview-name').textContent = name || '';

    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Fermeture via Échap
    overlay._escHandler = function(e) { if (e.key === 'Escape') closePhotoPreviewModal(); };
    document.addEventListener('keydown', overlay._escHandler);

    // Focus sur le bouton fermer pour l'accessibilité
    setTimeout(() => {
        const btn = document.getElementById('photo-preview-close-btn');
        if (btn) btn.focus();
    }, 80);
}

function closePhotoPreviewModal() {
    const overlay = document.getElementById('photo-preview-overlay');
    if (!overlay) return;
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    if (overlay._escHandler) {
        document.removeEventListener('keydown', overlay._escHandler);
        delete overlay._escHandler;
    }
}

function exportCollectorReport(collectorId) {
    const collector      = appData.collectors.find(c => c.id === collectorId);
    if (!collector) return;
    const advances       = appData.advances.filter(a => a.collectorId === collectorId);
    const receptions     = appData.receptions.filter(r => r.collectorId === collectorId);
    const remboursements = (appData.remboursements||[]).filter(r => r.collectorId === collectorId);
    const paiements      = (appData.paiements||[]).filter(p => p.collectorId === collectorId);
    const totalAdv  = advances.reduce((s,a)=>s+a.amount,0);
    const totalRec  = receptions.reduce((s,r)=>s+r.totalValue,0);
    const totalRemb = remboursements.reduce((s,r)=>s+r.amount,0);
    const totalPai  = paiements.reduce((s,p)=>s+p.amount,0);
    const balance   = (totalRec+totalRemb) - (totalAdv+totalPai);
    const status    = getCollectorStatus(balance);

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>Rapport — ${collector.name}</title>
    <style>body{font-family:Arial,sans-serif;margin:20px;color:#333;font-size:12px}
    h2{font-size:15px;color:#333;border-bottom:1px solid #ccc;padding-bottom:4px;margin-top:20px}
    table{width:100%;border-collapse:collapse;margin-bottom:16px}
    th,td{border:1px solid #ddd;padding:7px;text-align:left}th{background:#f2f2f2}
    .summary{display:flex;gap:16px;margin-bottom:20px}.card{flex:1;border:1px solid #ddd;border-radius:8px;padding:12px;text-align:center}
    .val{font-size:18px;font-weight:700}.lbl{font-size:11px;color:#666}.total{font-weight:700;background:#f8f9fa}
    .pdf-header{display:flex;align-items:center;gap:14px;margin-bottom:8px}
    .pdf-brand-name{font-size:20px;font-weight:800;color:#1a1a1a;letter-spacing:.3px;line-height:1.1;margin:0}
    .pdf-brand-sub{font-size:10px;color:#888;letter-spacing:1.8px;text-transform:uppercase;margin:2px 0 0 0}
    .status-debiteur{color:#c62828;font-weight:700}
    .status-crediteur{color:#2e7b32;font-weight:700}</style>
    </head><body>
    <div class="pdf-header">
        <svg version="1.2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620 620" width="50" height="50" style="flex-shrink:0;border-radius:8px;">
	<defs>
		<image width="174" height="195" id="img1" href="data:image/png;base64,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"/>
		<image width="145" height="238" id="img2" href="data:image/png;base64,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"/>
	</defs>
	<style>
		.s0 { fill: #000000 } 
	</style>
	<path id="Calque 1" fill-rule="evenodd" class="s0" d="m22 0h576c12.15 0 22 9.85 22 22v576c0 12.15-9.85 22-22 22h-576c-12.15 0-22-9.85-22-22v-576c0-12.15 9.85-22 22-22z"/>
	<use id="img1" href="#img1" transform="matrix(1.334,0,0,1.333,92.036,167.333)"/>
	<use id="img2" href="#img2" transform="matrix(1.334,0,0,1.333,293.49,166)"/>
</svg>
        <div>
            <p class="pdf-brand-name">RISEVANILLA</p>
            <p class="pdf-brand-sub">Rapport Collecteur</p>
        </div>
    </div>
    <hr style="border:none;border-top:2px solid #e0e0e0;margin:8px 0 14px">
    <p><strong>Collecteur:</strong> ${collector.name} &nbsp; <strong>CIN:</strong> ${collector.cin||'—'} &nbsp; <strong>Adresse:</strong> ${collector.address||'—'}</p>
    <div class="summary">
        <div class="card"><div class="val" style="color:#c62828">${formatCurrency(totalAdv+totalPai)}</div><div class="lbl">Total Débits</div></div>
        <div class="card"><div class="val" style="color:#2e7b32">${formatCurrency(totalRec+totalRemb)}</div><div class="lbl">Total Crédits</div></div>
        <div class="card"><div class="val">${formatCurrency(Math.abs(balance))}</div><div class="lbl">Solde — <span ${status.label === 'Débiteur' ? 'class=\"status-debiteur\"' : status.label === 'Créditeur' ? 'class=\"status-crediteur\"' : ''}>${status.label}</span></div></div>
    </div>
    <h2>💰 Avances</h2>
    ${advances.length ? `<table><thead><tr><th>Date</th><th>Motif</th><th>Montant</th></tr></thead><tbody>
        ${advances.map(a=>`<tr><td>${formatDate(a.date)}</td><td>${a.motif||''}</td><td>${formatCurrency(a.amount)}</td></tr>`).join('')}
        <tr class="total"><td colspan="2">TOTAL</td><td>${formatCurrency(totalAdv)}</td></tr>
    </tbody></table>` : '<p>Aucune avance.</p>'}
    <h2>📦 Réceptions</h2>
    ${receptions.length ? (() => {
        const rv = receptions.filter(r => getVanilleType(r.quality) === 'verte');
        const rp = receptions.filter(r => getVanilleType(r.quality) === 'preparee');
        const pv = rv.reduce((s,r)=>s+(r.netWeight||0),0);
        const vv = rv.reduce((s,r)=>s+(r.totalValue||0),0);
        const pp = rp.reduce((s,r)=>s+(r.netWeight||0),0);
        const vp = rp.reduce((s,r)=>s+(r.totalValue||0),0);
        return '<div style="display:flex;gap:12px;margin-bottom:12px;font-size:11px;">'
            + '<div style="flex:1;border:1px solid #a5d6a7;border-radius:6px;padding:8px 12px;background:#f1f8e9;">'
            + '<strong style="color:#2e7b32;">🌿 Vanille Verte</strong><br>'
            + pv.toFixed(2) + ' kg — ' + formatCurrency(Math.round(vv))
            + '</div>'
            + '<div style="flex:1;border:1px solid #ce93d8;border-radius:6px;padding:8px 12px;background:#f3e5f5;">'
            + '<strong style="color:#7B5EA7;">✅ Vanille Préparée</strong><br>'
            + pp.toFixed(2) + ' kg — ' + formatCurrency(Math.round(vp))
            + '</div></div>'
            + '<table><thead><tr><th>Date</th><th>Poids Net</th><th>Qualité</th><th>Type</th><th>Valeur</th></tr></thead><tbody>'
            + receptions.map(r =>
                '<tr>'
                + '<td>' + formatDate(r.date) + '</td>'
                + '<td>' + r.netWeight.toFixed(2) + ' kg</td>'
                + '<td>' + r.quality + '</td>'
                + '<td>' + (getVanilleType(r.quality) === 'verte' ? '🌿 Verte' : '✅ Préparée') + '</td>'
                + '<td>' + formatCurrency(r.totalValue) + '</td>'
                + '</tr>'
            ).join('')
            + '<tr class="total"><td colspan="4">TOTAL</td><td>' + formatCurrency(totalRec) + '</td></tr>'
            + '</tbody></table>';
    })() : '<p>Aucune réception.</p>'}
    <h2>💵 Remboursements</h2>
    ${remboursements.length ? `<table><thead><tr><th>Date</th><th>Note</th><th>Montant</th></tr></thead><tbody>
        ${remboursements.map(r=>`<tr><td>${formatDate(r.date)}</td><td>${r.note||''}</td><td>${formatCurrency(r.amount)}</td></tr>`).join('')}
        <tr class="total"><td colspan="2">TOTAL</td><td>${formatCurrency(totalRemb)}</td></tr>
    </tbody></table>` : '<p>Aucun remboursement.</p>'}
    <h2>💸 Paiements de Solde</h2>
    ${paiements.length ? `<table><thead><tr><th>Date</th><th>Note</th><th>Montant</th><th>Signature</th></tr></thead><tbody>
        ${paiements.map(p=>`<tr>
            <td>${formatDate(p.date)}</td>
            <td>${p.note||''}</td>
            <td>${formatCurrency(p.amount)}</td>
            <td style="text-align:center;">${p.signatureData
                ? `<img src="${p.signatureData}" style="max-width:140px;max-height:60px;border:1px solid #ddd;border-radius:4px;padding:3px;background:#fff;">`
                : `<span style="font-size:11px;color:#c62828;font-style:italic;">Non signé</span>`
            }</td>
        </tr>`).join('')}
        <tr class="total"><td colspan="3">TOTAL</td><td>${formatCurrency(totalPai)}</td></tr>
    </tbody></table>` : '<p>Aucun paiement.'}
    <script>window.onload=()=>window.print();</script></body></html>`;

    const w = window.open('','_blank');
    w.document.write(html);
    w.document.close();
}
