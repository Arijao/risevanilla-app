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
        document.getElementById('collector-phone').value   = formatPhoneForInput(c.phone);
        document.getElementById('collector-cin').value     = c.cin     || '';
        document.getElementById('collector-cin-date').value = c.cinDate || '';
        document.getElementById('collector-address').value = c.address  || '';
        // Charger les médias existants dans les buffers
        resetCollectorMediaBuffers(c);
    } else {
        if (titleEl) titleEl.textContent = 'Ajouter Collecteur';
        resetCollectorMediaBuffers(null);
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
    const recTable  = makeTable(
        [{label:'Date'},{label:'Poids Net',right:true},{label:'Qualité'},{label:'Prix/kg',right:true},{label:'Valeur',right:true}],
        receptions.sort((a,b)=>new Date(a.date)-new Date(b.date)).map(r=>[formatDate(r.date),r.netWeight.toFixed(2)+' kg',r.quality,formatCurrency(r.price),formatCurrency(r.totalValue)]),
        `<td colspan="4" style="${tdStyle}">TOTAL</td><td style="${tdStyle}text-align:right;">${formatCurrency(totalDeliveries)}</td>`
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
                             style="width:80px;height:80px;border-radius:12px;object-fit:cover;
                                    border:3px solid rgba(255,255,255,0.35);
                                    box-shadow:0 4px 16px rgba(0,0,0,0.25);">
                    </div>` : ''}
                    <div style="flex:1;min-width:0;">
                        <h4 style="margin-bottom:16px;font-size:18px;display:flex;align-items:center;gap:8px;"><span class="material-icons">account_circle</span> Informations</h4>
                        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;">
                            <div><div style="font-size:12px;opacity:.8;margin-bottom:4px;"><span class="material-icons" style="font-size:16px;vertical-align:middle;">phone</span> Téléphone</div><div style="font-weight:600;">${formatPhoneNumberForDisplay(collector.phone)}</div></div>
                            <div><div style="font-size:12px;opacity:.8;margin-bottom:4px;"><span class="material-icons" style="font-size:16px;vertical-align:middle;">fingerprint</span> CIN</div><div style="font-weight:600;">${collector.cin||'N/A'} ${collector.cinDate?`<small>(${formatDate(collector.cinDate)})</small>`:''}</div></div>
                            <div><div style="font-size:12px;opacity:.8;margin-bottom:4px;"><span class="material-icons" style="font-size:16px;vertical-align:middle;">location_on</span> Adresse</div><div style="font-weight:600;">${collector.address||'N/A'}</div></div>
                            <div><div style="font-size:12px;opacity:.8;margin-bottom:4px;"><span class="material-icons" style="font-size:16px;vertical-align:middle;">calendar_today</span> Inscription</div><div style="font-weight:600;">${formatDate(collector.createdAt)}</div></div>
                        </div>
                    </div>
                </div>
            </div>
            <!-- Summary cards -->
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:20px;">
                <div class="collector-stat-card collector-stat-card--advances">
                    <div class="collector-stat-card__value">${formatCurrency(totalAdvances)}</div>
                    <div class="collector-stat-card__label">Total Avances (${currentYear})</div>
                </div>
                <div class="collector-stat-card collector-stat-card--receptions">
                    <div class="collector-stat-card__value">${formatCurrency(totalDeliveries)}</div>
                    <div class="collector-stat-card__label">Total Réceptions (${currentYear})</div>
                </div>
                <div class="collector-stat-card ${balance >= 0 ? 'collector-stat-card--balance-ok' : 'collector-stat-card--balance-bad'}">
                    <div class="collector-stat-card__value">${formatCurrency(Math.abs(balance))}</div>
                    <div class="collector-stat-card__label">Solde ${currentYear}</div>
                    <div class="collector-stat-card__status">${status.label}</div>
                </div>
                <div class="collector-stat-card ${globalBalance >= 0 ? 'collector-stat-card--global-ok' : 'collector-stat-card--global-bad'}">
                    <div class="collector-stat-card__value">${formatCurrency(Math.abs(globalBalance))}</div>
                    <div class="collector-stat-card__label">Dette Totale (Toutes années)</div>
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
    h1{color:#6750a4;font-size:22px}h2{font-size:15px;color:#333;border-bottom:1px solid #ccc;padding-bottom:4px;margin-top:20px}
    table{width:100%;border-collapse:collapse;margin-bottom:16px}
    th,td{border:1px solid #ddd;padding:7px;text-align:left}th{background:#f2f2f2}
    .summary{display:flex;gap:16px;margin-bottom:20px}.card{flex:1;border:1px solid #ddd;border-radius:8px;padding:12px;text-align:center}
    .val{font-size:18px;font-weight:700}.lbl{font-size:11px;color:#666}.total{font-weight:700;background:#f8f9fa}</style>
    </head><body>
    <h1>RISEVANILLA — Rapport Collecteur</h1>
    <p><strong>Collecteur:</strong> ${collector.name} &nbsp; <strong>CIN:</strong> ${collector.cin||'N/A'} &nbsp; <strong>Adresse:</strong> ${collector.address||'N/A'}</p>
    <div class="summary">
        <div class="card"><div class="val" style="color:#ba1a1a">${formatCurrency(totalAdv+totalPai)}</div><div class="lbl">Total Débits</div></div>
        <div class="card"><div class="val" style="color:#2e7d32">${formatCurrency(totalRec+totalRemb)}</div><div class="lbl">Total Crédits</div></div>
        <div class="card"><div class="val">${formatCurrency(Math.abs(balance))}</div><div class="lbl">Solde — ${status.label}</div></div>
    </div>
    <h2>💰 Avances</h2>
    ${advances.length ? `<table><thead><tr><th>Date</th><th>Motif</th><th>Montant</th></tr></thead><tbody>
        ${advances.map(a=>`<tr><td>${formatDate(a.date)}</td><td>${a.motif||''}</td><td>${formatCurrency(a.amount)}</td></tr>`).join('')}
        <tr class="total"><td colspan="2">TOTAL</td><td>${formatCurrency(totalAdv)}</td></tr>
    </tbody></table>` : '<p>Aucune avance.</p>'}
    <h2>📦 Réceptions</h2>
    ${receptions.length ? `<table><thead><tr><th>Date</th><th>Poids Net</th><th>Qualité</th><th>Valeur</th></tr></thead><tbody>
        ${receptions.map(r=>`<tr><td>${formatDate(r.date)}</td><td>${r.netWeight.toFixed(2)} kg</td><td>${r.quality}</td><td>${formatCurrency(r.totalValue)}</td></tr>`).join('')}
        <tr class="total"><td colspan="3">TOTAL</td><td>${formatCurrency(totalRec)}</td></tr>
    </tbody></table>` : '<p>Aucune réception.</p>'}
    <h2>💵 Remboursements</h2>
    ${remboursements.length ? `<table><thead><tr><th>Date</th><th>Note</th><th>Montant</th></tr></thead><tbody>
        ${remboursements.map(r=>`<tr><td>${formatDate(r.date)}</td><td>${r.note||''}</td><td>${formatCurrency(r.amount)}</td></tr>`).join('')}
        <tr class="total"><td colspan="2">TOTAL</td><td>${formatCurrency(totalRemb)}</td></tr>
    </tbody></table>` : '<p>Aucun remboursement.</p>'}
    <h2>💸 Paiements de Solde</h2>
    ${paiements.length ? `<table><thead><tr><th>Date</th><th>Note</th><th>Montant</th></tr></thead><tbody>
        ${paiements.map(p=>`<tr><td>${formatDate(p.date)}</td><td>${p.note||''}</td><td>${formatCurrency(p.amount)}</td></tr>`).join('')}
        <tr class="total"><td colspan="2">TOTAL</td><td>${formatCurrency(totalPai)}</td></tr>
    </tbody></table>` : '<p>Aucun paiement.'}
    <script>window.onload=()=>window.print();</script></body></html>`;

    const w = window.open('','_blank');
    w.document.write(html);
    w.document.close();
}
