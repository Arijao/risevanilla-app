/* ============================================================
 * EXPORT.JS — PDF reports, Excel exports, Receipt printing
 * BEHAVANA - Gestion de Collecte de Vanille
 * ============================================================ */

'use strict';

const _PDF_BASE_STYLE = `
    body{font-family:Arial,sans-serif;margin:20px;font-size:11px;color:#333;}
    h1{color:#6750a4;font-size:20px;margin-bottom:4px;}
    h2{font-size:14px;color:#444;border-bottom:1px solid #ccc;padding-bottom:4px;margin-top:20px;}
    table{width:100%;border-collapse:collapse;margin-bottom:16px;}
    th,td{border:1px solid #ddd;padding:7px;text-align:left;}
    th{background:#f2f2f2;font-weight:bold;}
    .total{font-weight:bold;background:#f8f9fa;}
    .right{text-align:right;}
    .status-debiteur{color:#ba1a1a;font-weight:bold;}
    .status-crediteur{color:#2e7d32;font-weight:bold;}
    .status-equilibre{color:#625b71;}
`;

function _printWindow(html) {
    const w = window.open('', '_blank');
    if (!w) { showToast('Popup bloqué — autorisez les popups', 'error'); return; }
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 400);
}

// ── Analysis PDF ──────────────────────────────────────────────
function exportAnalysis() {
    const today = formatDate(new Date().toISOString().split('T')[0]);
    let rows = '';
    let totalDeb = 0, totalCred = 0;

    appData.collectors.filter(isCollectorAvailableInCurrentYear).forEach(c => {
        const adv  = getTotalAdvances(c.id);
        const pai  = getPaiementsForCurrentYear().filter(p=>p.collectorId===c.id).reduce((s,p)=>s+p.amount,0);
        const rec  = getTotalDeliveries(c.id);
        const remb = getRemboursementsForCurrentYear().filter(r=>r.collectorId===c.id).reduce((s,r)=>s+r.amount,0);
        const deb  = adv + pai;
        const cred = rec + remb;
        const bal  = cred - deb;
        const st   = getCollectorStatus(bal);
        if (bal < 0) totalDeb  += bal;
        if (bal > 0) totalCred += bal;
        rows += `<tr>
            <td>${c.name}</td>
            <td>${formatPhoneNumberForDisplay(c.phone)}</td>
            <td class="right">${formatCurrency(deb)}</td>
            <td class="right">${formatCurrency(cred)}</td>
            <td class="right">${formatCurrency(bal)}</td>
            <td class="status-${st.class}">${st.label}</td>
        </tr>`;
    });

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Analyse — BEHAVANA</title>
    <style>${_PDF_BASE_STYLE}</style></head><body>
    <h1>BEHAVANA</h1><p>Rapport Analyse des Comptes — ${today}</p>
    <table>
        <thead><tr><th>Collecteur</th><th>Téléphone</th><th class="right">Total Débits</th><th class="right">Total Crédits</th><th class="right">Solde</th><th>Statut</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot>
            <tr class="total"><td colspan="4">TOTAL NON RÉCUPÉRÉ (Dettes)</td><td class="right status-debiteur">${formatCurrency(totalDeb)}</td><td></td></tr>
            <tr class="total"><td colspan="4">TOTAL CRÉDIT (Dû aux Collecteurs)</td><td class="right status-crediteur">${formatCurrency(totalCred)}</td><td></td></tr>
        </tfoot>
    </table></body></html>`;
    _printWindow(html);
}

// ── Poids Analysis PDF ────────────────────────────────────────
function exportPoidsAnalysis() {
    const receptionsYear = getReceptionsForCurrentYear();
    const qualities = [...new Set(receptionsYear.map(r => r.quality))].sort();
    const today = formatDate(new Date().toISOString().split('T')[0]);

    const totals = {};
    qualities.forEach(q => totals[q] = 0);
    let grandTotal = 0;

    let rows = '';
    appData.collectors.filter(isCollectorAvailableInCurrentYear).forEach(c => {
        let colTotal = 0;
        let cells = qualities.map(q => {
            const w = receptionsYear.filter(r=>r.collectorId===c.id&&r.quality===q).reduce((s,r)=>s+r.netWeight,0);
            totals[q] += w;
            colTotal  += w;
            return `<td class="right">${w > 0 ? formatNumber(w) : '—'}</td>`;
        }).join('');
        grandTotal += colTotal;
        rows += `<tr><td>${c.name}</td>${cells}<td class="right total">${formatNumber(colTotal)}</td></tr>`;
    });

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Poids — BEHAVANA</title>
    <style>${_PDF_BASE_STYLE} td.right{text-align:right;} th{text-align:center;}</style></head><body>
    <h1>BEHAVANA</h1><p>Analyse des Poids Livrés — ${today}</p>
    <table>
        <thead><tr><th>Collecteur</th>${qualities.map(q=>`<th>${q} (kg)</th>`).join('')}<th>TOTAL (kg)</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr class="total"><th>TOTAL GÉNÉRAL</th>${qualities.map(q=>`<td class="right">${formatNumber(totals[q])}</td>`).join('')}<td class="right">${formatNumber(grandTotal)}</td></tr></tfoot>
    </table></body></html>`;
    _printWindow(html);
}

// ── Excel: Analysis ───────────────────────────────────────────
function exportAnalysisToExcel() {
    if (typeof XLSX === 'undefined') { showToast('XLSX non disponible', 'error'); return; }
    const table = document.getElementById('analysis-table');
    if (!table) { showToast('Table introuvable', 'error'); return; }

    const headers = [...table.querySelectorAll('thead th')].map(th=>th.textContent.trim());
    headers.pop(); // Remove Actions
    const data = [headers];

    table.querySelectorAll('tbody tr').forEach(row => {
        if (row.querySelector('.empty-state')) return;
        const cells = [...row.querySelectorAll('td')].map(td=>td.textContent.trim());
        cells.pop();
        data.push(cells);
    });

    if (data.length <= 1) { showToast('Aucune donnée à exporter', 'error'); return; }

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = headers.map(h=>({ wch: Math.max(h.length, 15) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Analyse');
    XLSX.writeFile(wb, `Analyse_Collecteurs_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast('Export Excel réussi!', 'success');
}

// ── Excel: Collector Details ──────────────────────────────────
function exportCollectorDetailsToExcel(collectorId) {
    if (typeof XLSX === 'undefined') { showToast('XLSX non disponible', 'error'); return; }
    const collector = appData.collectors.find(c => c.id === collectorId);
    if (!collector) { showToast('Collecteur introuvable', 'error'); return; }

    const advances       = getAdvancesForCurrentYear().filter(a=>a.collectorId===collectorId);
    const receptions     = getReceptionsForCurrentYear().filter(r=>r.collectorId===collectorId);
    const remboursements = getRemboursementsForCurrentYear().filter(r=>r.collectorId===collectorId);
    const paiements      = getPaiementsForCurrentYear().filter(p=>p.collectorId===collectorId);
    const bal            = calculateCollectorBalance(collectorId);

    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
        ['Rapport Détaillé du Collecteur'], [],
        ['Nom:', collector.name], ['Téléphone:', collector.phone||'N/A'],
        ['CIN:', collector.cin||'N/A'], ['Adresse:', collector.address||'N/A'], [],
        [`RÉSUMÉ FINANCIER (Année ${currentYear})`],
        ['Total Avances:', advances.reduce((s,a)=>s+a.amount,0)],
        ['Total Réceptions (Valeur):', receptions.reduce((s,r)=>s+r.totalValue,0)],
        ['Total Remboursements:', remboursements.reduce((s,r)=>s+r.amount,0)],
        ['Total Paiements:', paiements.reduce((s,p)=>s+p.amount,0)],
        ['Solde Actuel:', bal]
    ];
    const ws0 = XLSX.utils.aoa_to_sheet(summaryData);
    ws0['!cols'] = [{wch:28},{wch:25}];
    XLSX.utils.book_append_sheet(wb, ws0, 'Résumé');

    // Avances
    if (advances.length) {
        const ws1 = XLSX.utils.json_to_sheet(advances.map(a=>({ Date:formatDate(a.date), Motif:a.motif||'', Montant:a.amount })));
        ws1['!cols'] = [{wch:12},{wch:30},{wch:15}];
        XLSX.utils.book_append_sheet(wb, ws1, 'Avances');
    }

    // Réceptions
    if (receptions.length) {
        const ws2 = XLSX.utils.json_to_sheet(receptions.map(r=>({ Date:formatDate(r.date), 'Poids Net (kg)':r.netWeight, Qualité:r.quality, 'Prix/kg':r.price, Valeur:r.totalValue })));
        ws2['!cols'] = [{wch:12},{wch:14},{wch:12},{wch:12},{wch:14}];
        XLSX.utils.book_append_sheet(wb, ws2, 'Réceptions');
    }

    // Remboursements
    if (remboursements.length) {
        const ws3 = XLSX.utils.json_to_sheet(remboursements.map(r=>({ Date:formatDate(r.date), Note:r.note||'', Montant:r.amount })));
        ws3['!cols'] = [{wch:12},{wch:30},{wch:15}];
        XLSX.utils.book_append_sheet(wb, ws3, 'Remboursements');
    }

    // Paiements
    if (paiements.length) {
        const ws4 = XLSX.utils.json_to_sheet(paiements.map(p=>({ Date:formatDate(p.date), Note:p.note||'', Montant:p.amount })));
        ws4['!cols'] = [{wch:12},{wch:30},{wch:15}];
        XLSX.utils.book_append_sheet(wb, ws4, 'Paiements de Solde');
    }

    XLSX.writeFile(wb, `Details_${collector.name.replace(/\s/g,'_')}_${currentYear}_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast('Export Excel réussi!', 'success');
}

// ── Receipt Print ─────────────────────────────────────────────
function generateReceipt(receptionId) {
    const existing = document.getElementById('behavanaPrintModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'behavanaPrintModal';
    modal.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);`;
    modal.innerHTML = `
        <div style="background:var(--md-sys-color-surface);border-radius:20px;padding:32px;max-width:380px;width:90%;text-align:center;box-shadow:0 24px 60px rgba(0,0,0,0.4);">
            <h3 style="margin-bottom:8px;font-size:20px;color:var(--md-sys-color-on-surface);">🖨️ Imprimer le Reçu</h3>
            <p style="font-size:14px;color:var(--md-sys-color-on-surface-variant);margin-bottom:24px;">Choisissez le format d'impression</p>
            <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;">
                <button id="btnA4" class="btn btn-primary" style="flex:1;min-width:120px;">
                    <span class="material-icons">description</span> Format A4
                </button>
                <button id="btnThermal" class="btn btn-secondary" style="flex:1;min-width:120px;">
                    <span class="material-icons">receipt</span> Thermique
                </button>
            </div>
            <button id="btnCancel" style="margin-top:16px;background:none;border:none;color:var(--md-sys-color-on-surface-variant);cursor:pointer;font-size:14px;">Annuler</button>
        </div>`;

    document.body.appendChild(modal);
    document.getElementById('btnA4').onclick      = () => { modal.remove(); generateReceiptA4(receptionId); };
    document.getElementById('btnThermal').onclick = () => { modal.remove(); generateReceiptThermal(receptionId); };
    document.getElementById('btnCancel').onclick  = () => modal.remove();

    const esc = e => { if (e.key === 'Escape') { modal.remove(); document.removeEventListener('keydown', esc); } };
    document.addEventListener('keydown', esc);
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

function generateReceiptA4(receptionId) {
    const base = appData.receptions.find(r => r.id === receptionId);
    if (!base) return;
    const collector = appData.collectors.find(c => c.id === base.collectorId);
    const dayRecs   = appData.receptions.filter(r => r.collectorId === base.collectorId && r.date === base.date);
    const totalNet  = dayRecs.reduce((s,r)=>s+r.netWeight,0);
    const totalVal  = dayRecs.reduce((s,r)=>s+r.totalValue,0);
    const recNum    = `R${new Date(base.date).getTime().toString().slice(-5)}${base.collectorId}`;

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>
        body{font-family:Arial,sans-serif;margin:30px;font-size:12px;color:#333;}
        .header{text-align:center;border-bottom:2px solid #6750a4;padding-bottom:16px;margin-bottom:20px;}
        .company{font-size:28px;font-weight:700;color:#6750a4;}
        .subtitle{font-size:14px;color:#666;}
        .receipt-no{font-size:13px;font-weight:600;margin-top:8px;}
        .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;}
        .info-box{border:1px solid #ddd;border-radius:8px;padding:12px;}
        .info-label{font-size:11px;color:#888;margin-bottom:4px;}
        .info-value{font-weight:600;}
        table{width:100%;border-collapse:collapse;}
        th,td{border:1px solid #ddd;padding:8px;text-align:left;}
        th{background:#f2f2f2;}
        .total-row{font-weight:700;background:#e8def8;}
        .signature{margin-top:40px;display:grid;grid-template-columns:1fr 1fr;gap:40px;}
        .sig-line{border-top:1px solid #333;padding-top:8px;text-align:center;font-size:11px;}
    </style>
    </head><body>
    <div class="header">
        <div class="company">BEHAVANA</div>
        <div class="subtitle">Gestion de Collecte de Vanille</div>
        <div class="receipt-no">Reçu N°: ${recNum}</div>
    </div>
    <div class="info-grid">
        <div class="info-box"><div class="info-label">Collecteur</div><div class="info-value">${collector?.name||'N/A'}</div></div>
        <div class="info-box"><div class="info-label">Date</div><div class="info-value">${formatDate(base.date)}</div></div>
    </div>
    <table>
        <thead><tr><th>Qualité</th><th>Poids Net (kg)</th><th>Prix/kg</th><th>Valeur</th></tr></thead>
        <tbody>
            ${dayRecs.map(r=>`<tr><td>${r.quality}</td><td>${r.netWeight.toFixed(2)}</td><td>${formatCurrency(r.price)}</td><td>${formatCurrency(r.totalValue)}</td></tr>`).join('')}
            <tr class="total-row"><td colspan="2">TOTAL</td><td>${totalNet.toFixed(2)} kg</td><td>${formatCurrency(totalVal)}</td></tr>
        </tbody>
    </table>
    <div class="signature">
        <div class="sig-line">Signature Collecteur</div>
        <div class="sig-line">Signature Responsable</div>
    </div>
    <script>window.onload=()=>window.print();</script>
    </body></html>`;
    _printWindow(html);
}

function generateReceiptThermal(receptionId) {
    const base = appData.receptions.find(r => r.id === receptionId);
    if (!base) return;
    const collector = appData.collectors.find(c => c.id === base.collectorId);
    const dayRecs   = appData.receptions.filter(r => r.collectorId === base.collectorId && r.date === base.date);
    const totalNet  = dayRecs.reduce((s,r)=>s+r.netWeight,0);
    const totalVal  = dayRecs.reduce((s,r)=>s+r.totalValue,0);
    const recNum    = `R${new Date(base.date).getTime().toString().slice(-5)}${base.collectorId}`;

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>
        @page{width:80mm;margin:3mm;}
        body{width:72mm;font-family:'Courier New',monospace;font-size:11px;margin:0;padding:2mm;}
        .center{text-align:center;}.bold{font-weight:700;}
        .sep{border-top:1px dashed #000;margin:4px 0;}
        .row{display:flex;justify-content:space-between;}
    </style>
    </head><body>
    <div class="center bold" style="font-size:16px;">BEHAVANA</div>
    <div class="center" style="font-size:10px;">Gestion de Collecte</div>
    <div class="sep"></div>
    <div>Reçu N°: ${recNum}</div>
    <div>Date: ${formatDate(base.date)}</div>
    <div>Collecteur: ${collector?.name||'N/A'}</div>
    <div class="sep"></div>
    ${dayRecs.map(r=>`<div><b>${r.quality}</b> — ${r.netWeight.toFixed(2)} kg × ${formatCurrency(r.price)}/kg = ${formatCurrency(r.totalValue)}</div>`).join('')}
    <div class="sep"></div>
    <div class="row bold"><span>TOTAL:</span><span>${totalNet.toFixed(2)} kg</span></div>
    <div class="row bold"><span>VALEUR:</span><span>${formatCurrency(totalVal)}</span></div>
    <div class="sep"></div>
    <div class="center" style="margin-top:8px;font-size:10px;">Merci — BEHAVANA</div>
    <script>window.onload=()=>window.print();</script>
    </body></html>`;
    _printWindow(html);
}

// ── Delivery PDF ──────────────────────────────────────────────
function generateDeliveryPDF(deliveryId, type = 'BL') {
    const delivery = appData.deliveries.find(d => d.id === deliveryId);
    if (!delivery) { showToast('Livraison introuvable', 'error'); return; }

    const number = type === 'BL' ? delivery.bl : delivery.invoice;
    const title  = type === 'BL' ? 'BON DE LIVRAISON' : 'FACTURE';

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title} — BEHAVANA</title>
    <style>
        body{font-family:Arial,sans-serif;margin:30px;font-size:12px;}
        .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #6750a4;}
        .company{font-size:24px;font-weight:700;color:#6750a4;}
        .doc-type{font-size:18px;font-weight:700;color:#333;}
        .doc-num{font-size:14px;color:#666;margin-top:4px;}
        .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px;}
        .info-box{border:1px solid #ddd;border-radius:8px;padding:12px;}
        .info-label{font-size:11px;color:#888;margin-bottom:4px;}
        .info-value{font-weight:600;font-size:13px;}
        table{width:100%;border-collapse:collapse;margin-bottom:20px;}
        th,td{border:1px solid #ddd;padding:10px;text-align:left;}
        th{background:#6750a4;color:#fff;}
        .total-row{font-weight:700;background:#f8f9fa;}
        .signatures{display:grid;grid-template-columns:1fr 1fr;gap:48px;margin-top:48px;}
        .sig-line{border-top:1px solid #333;padding-top:8px;text-align:center;font-size:11px;color:#666;}
    </style>
    </head><body>
    <div class="header">
        <div><div class="company">BEHAVANA</div><div style="font-size:12px;color:#666;">Gestion de Collecte de Vanille</div></div>
        <div style="text-align:right;"><div class="doc-type">${title}</div><div class="doc-num">N°: ${number||'—'}</div></div>
    </div>
    <div class="info-grid">
        <div class="info-box"><div class="info-label">Date</div><div class="info-value">${formatDate(delivery.date)}</div></div>
        <div class="info-box"><div class="info-label">Exportateur</div><div class="info-value">${delivery.exporter||'N/A'}</div></div>
    </div>
    <table>
        <thead><tr><th>Désignation</th><th>Qualité</th><th>Poids Brut (kg)</th><th>Tare (kg)</th><th>Poids Net (kg)</th><th>Prix/kg</th><th>Valeur</th></tr></thead>
        <tbody>
            <tr>
                <td>Vanille</td>
                <td>${delivery.quality||'N/A'}</td>
                <td>${delivery.grossWeight||'0'}</td>
                <td>${delivery.bagWeight||'0'}</td>
                <td>${delivery.weight||'0'}</td>
                <td>${formatCurrency(delivery.price||0)}</td>
                <td>${formatCurrency(delivery.totalValue||0)}</td>
            </tr>
            <tr class="total-row"><td colspan="6">TOTAL</td><td>${formatCurrency(delivery.totalValue||0)}</td></tr>
        </tbody>
    </table>
    <div class="signatures">
        <div class="sig-line">Signature Livreur / BEHAVANA</div>
        <div class="sig-line">Signature Destinataire / ${delivery.exporter||'Exportateur'}</div>
    </div>
    <script>window.onload=()=>window.print();</script>
    </body></html>`;
    _printWindow(html);
}

// ── Export Invoice (all receptions PDF) ───────────────────────
function exportInvoice() {
    const receptionsByCollector = {};
    (getReceptionsForCurrentYear()).forEach(r => {
        const c = appData.collectors.find(col=>col.id===r.collectorId);
        const name = c ? c.name : 'Supprimé';
        if (!receptionsByCollector[name]) receptionsByCollector[name] = [];
        receptionsByCollector[name].push(r);
    });

    let body = '';
    Object.entries(receptionsByCollector).forEach(([name, recs]) => {
        const totalNet = recs.reduce((s,r)=>s+r.netWeight,0);
        const totalVal = recs.reduce((s,r)=>s+r.totalValue,0);
        body += `<h2>${name}</h2>
        <table><thead><tr><th>Date</th><th>Qualité</th><th>Poids Net (kg)</th><th>Prix/kg</th><th>Valeur</th></tr></thead>
        <tbody>
            ${recs.sort((a,b)=>new Date(a.date)-new Date(b.date)).map(r=>`
            <tr><td>${formatDate(r.date)}</td><td>${r.quality}</td><td>${r.netWeight.toFixed(2)}</td><td>${formatCurrency(r.price)}</td><td>${formatCurrency(r.totalValue)}</td></tr>`).join('')}
            <tr class="total"><td colspan="2">TOTAL</td><td>${totalNet.toFixed(2)} kg</td><td></td><td>${formatCurrency(totalVal)}</td></tr>
        </tbody></table>`;
    });

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Facture — BEHAVANA</title>
    <style>${_PDF_BASE_STYLE}</style></head><body>
    <h1>BEHAVANA — Facture des Réceptions (${currentYear})</h1>
    ${body}
    <script>window.onload=()=>window.print();</script>
    </body></html>`;
    _printWindow(html);
}
