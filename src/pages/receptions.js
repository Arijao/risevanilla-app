/* ============================================================
 * RECEPTIONS.JS — Adjust Modal (Post-Tri)
 * BEHAVANA - Gestion de Collecte de Vanille
 * ============================================================ */

'use strict';

let adjustmentCounter = 0;
let originalReception = null;
let isSaving          = false;

async function openAdjustModal(receptionId) {
    await syncReceptionModuleData();
    originalReception = appData.receptions.find(r => r.id === receptionId);
    if (!originalReception) { showToast('Réception introuvable', 'error'); return; }

    const collector = appData.collectors.find(c => c.id === originalReception.collectorId);

    let tare = originalReception.tare;
    if ((tare === undefined || tare === null) && originalReception.grossWeight && originalReception.netWeight)
        tare = originalReception.grossWeight - originalReception.netWeight;
    if (tare === undefined || tare === null || isNaN(tare)) tare = 0;
    tare = parseFloat(tare.toFixed(2));

    const gross      = parseFloat((originalReception.grossWeight || 0).toFixed(2));
    const net        = parseFloat((originalReception.netWeight   || 0).toFixed(2));
    const price      = parseFloat((originalReception.price       || 0).toFixed(0));
    const totalValue = parseFloat((originalReception.totalValue  || 0).toFixed(0));

    const infoDiv = document.getElementById('adjust-reception-info');
    if (infoDiv) {
        infoDiv.innerHTML = `
            <h3 style="margin-bottom:12px;font-size:16px;">📦 Réception d'origine</h3>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;">
                <div><strong>Date:</strong> ${formatDate(originalReception.date)}</div>
                <div><strong>Collecteur:</strong> ${collector ? collector.name : 'N/A'}</div>
                <div><strong>Qualité:</strong> <span class="status-badge status-${originalReception.quality.toLowerCase()}">${originalReception.quality}</span></div>
                <div><strong>Poids Brut:</strong> ${gross} kg</div>
                <div><strong>Tare:</strong> ${tare} kg</div>
                <div><strong>Poids Net:</strong> ${net} kg</div>
                <div><strong>Prix:</strong> ${formatCurrency(price)}/kg</div>
                <div><strong>Valeur:</strong> ${formatCurrency(totalValue)}</div>
            </div>`;
    }

    const hiddenId = document.getElementById('adjust-original-reception-id');
    if (hiddenId) hiddenId.value = receptionId;

    adjustmentCounter = 0;
    const container = document.getElementById('adjustments-container');
    if (container) container.innerHTML = '';
    addAdjustmentRow();

    document.getElementById('adjust-modal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeAdjustModal() {
    document.getElementById('adjust-modal').classList.remove('active');
    document.body.style.overflow = '';
    const container = document.getElementById('adjustments-container');
    if (container) container.innerHTML = '';
    adjustmentCounter = 0;
    originalReception = null;
}

function addAdjustmentRow() {
    adjustmentCounter++;
    const rowId     = `adj-row-${adjustmentCounter}`;
    const container = document.getElementById('adjustments-container');
    const allQualities = [...new Set(
        (appData.receptions||[]).map(r => r.quality)
        .concat((appData.qualities||[]).map(q => q.name))
    )].filter(Boolean);
    const origQual = originalReception ? originalReception.quality : '';

    const div = document.createElement('div');
    div.id = rowId;
    div.className = 'adjustment-row';
    div.style.cssText = 'background:rgba(80,80,80,.3);padding:16px;border-radius:12px;margin-bottom:16px;position:relative;';
    div.innerHTML = `
        <button type="button" class="btn btn-icon btn-danger" onclick="removeAdjustmentRow('${rowId}')" style="position:absolute;top:8px;right:8px;width:32px;height:32px;">
            <span class="material-icons" style="font-size:18px;">close</span>
        </button>
        <h4 style="margin-bottom:12px;font-size:14px;color:rgba(255,255,255,.9);">Ajustement #${adjustmentCounter}</h4>
        <div class="form-grid" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;">
            <div class="form-group" style="margin-bottom:0;">
                <label class="form-label required">Nouvelle Qualité</label>
                <select class="form-select adj-quality" data-row="${rowId}" required>
                    <option value="">-- Sélectionner --</option>
                    ${allQualities.filter(q => q !== origQual).map(q => `<option value="${q}">${q}</option>`).join('')}
                    <option value="__NEW__">+ Nouvelle qualité...</option>
                </select>
            </div>
            <div class="form-group" style="margin-bottom:0;"><label class="form-label">Poids Brut (kg)</label><input type="number" class="form-input adj-gross" data-row="${rowId}" step="0.01" min="0" placeholder="Ex: 300"></div>
            <div class="form-group" style="margin-bottom:0;"><label class="form-label">Tare (kg)</label><input type="number" class="form-input adj-tare" data-row="${rowId}" step="0.01" min="0" placeholder="Ex: 5"></div>
            <div class="form-group" style="margin-bottom:0;"><label class="form-label required">Poids Net (kg)</label><input type="number" class="form-input adj-net" data-row="${rowId}" step="0.01" min="0.01" required placeholder="Ex: 295"></div>
            <div class="form-group" style="margin-bottom:0;"><label class="form-label">Prix/kg (Ar)</label><input type="number" class="form-input adj-price" data-row="${rowId}" step="1" min="0" placeholder="Auto selon qualité"></div>
            <div class="form-group" style="margin-bottom:0;"><label class="form-label">Valeur Totale</label><input type="text" class="form-input adj-total" data-row="${rowId}" readonly style="background:rgba(255,255,255,.1);cursor:not-allowed;" placeholder="Calculé auto"></div>
        </div>
        <div class="form-group" style="margin-top:12px;margin-bottom:0;"><label class="form-label">Note / Raison</label><input type="text" class="form-input adj-note" data-row="${rowId}" placeholder="Ex: Tri manuel — produits abîmés"></div>`;

    container.appendChild(div);
    _setupAdjRowEvents(rowId);
}

function removeAdjustmentRow(rowId) {
    const row = document.getElementById(rowId);
    if (row) row.remove();
}

function _setupAdjRowEvents(rowId) {
    const row      = document.getElementById(rowId);
    const qualSel  = row.querySelector('.adj-quality');
    const grossInp = row.querySelector('.adj-gross');
    const tareInp  = row.querySelector('.adj-tare');
    const netInp   = row.querySelector('.adj-net');
    const priceInp = row.querySelector('.adj-price');
    const totalInp = row.querySelector('.adj-total');

    qualSel.addEventListener('change', function() {
        if (this.value === '__NEW__') {
            const q = prompt('Entrez le nom de la nouvelle qualité:');
            if (q && q.trim()) {
                const opt = document.createElement('option');
                opt.value = q.trim(); opt.textContent = q.trim(); opt.selected = true;
                this.insertBefore(opt, this.lastElementChild);
            } else { this.value = ''; }
        }
        if (this.value && !priceInp.value) {
            const defaults = { 'LAVA': 9600, 'VANILLE': 8500, 'FOHY': 7000 };
            if (defaults[this.value.toUpperCase()]) { priceInp.value = defaults[this.value.toUpperCase()]; calcTotal(); }
        }
    });

    function calcNet() {
        const g = parseFloat(grossInp.value)||0, t = parseFloat(tareInp.value)||0;
        if (g > 0 && t >= 0 && g >= t) { netInp.value = (g-t).toFixed(2); calcTotal(); }
    }
    function calcTotal() {
        const n = parseFloat(netInp.value)||0, p = parseFloat(priceInp.value)||0;
        totalInp.value = (n > 0 && p > 0) ? formatCurrency(n * p) : '';
    }

    grossInp.addEventListener('input', calcNet);
    tareInp.addEventListener('input',  calcNet);
    netInp.addEventListener('input',   calcTotal);
    priceInp.addEventListener('input', calcTotal);
}

async function saveAllAdjustments() {
    if (isSaving) return;
    isSaving = true;

    await syncReceptionModuleData();
    const origId = originalReception?.id || parseInt(document.getElementById('adjust-original-reception-id').value, 10);
    originalReception = appData.receptions.find(r => r.id === origId);
    if (!originalReception) { showToast('Réception introuvable', 'error'); isSaving = false; return; }

    const rows = document.querySelectorAll('#adjustments-container .adjustment-row');
    if (!rows.length) { showToast('Aucun ajustement à enregistrer', 'error'); isSaving = false; return; }

    const adjustments = [];
    let totalAdjW = 0, hasError = false;

    rows.forEach((row, idx) => {
        const quality = row.querySelector('.adj-quality').value;
        const gross   = parseFloat(row.querySelector('.adj-gross').value)  || 0;
        const tare    = parseFloat(row.querySelector('.adj-tare').value)   || 0;
        const net     = parseFloat(row.querySelector('.adj-net').value)    || 0;
        const price   = parseFloat(row.querySelector('.adj-price').value)  || 0;
        const note    = row.querySelector('.adj-note').value;

        if (!quality) { showToast(`Ajustement #${idx+1}: Sélectionnez une qualité`, 'error'); hasError = true; return; }
        if (net <= 0) { showToast(`Ajustement #${idx+1}: Poids net > 0 requis`,     'error'); hasError = true; return; }

        totalAdjW += net;
        adjustments.push({ quality, grossWeight: gross||net, tare, netWeight: net, price, note });
    });

    if (hasError) { isSaving = false; return; }

    totalAdjW = parseFloat(totalAdjW.toFixed(2));
    if (totalAdjW > originalReception.netWeight) {
        showToast(`Total ajusté (${totalAdjW.toFixed(2)} kg) > poids disponible (${originalReception.netWeight} kg)`, 'error');
        isSaving = false; return;
    }

    const remaining = (originalReception.netWeight - totalAdjW).toFixed(2);
    const ok = await confirmModal({
        title:       `Créer ${adjustments.length} ajustement(s)`,
        message:     `${adjustments.length} nouvelle(s) réception(s) seront créées. Poids total ajusté : ${totalAdjW.toFixed(2)} kg — Restant sur réception : ${remaining} kg.`,
        confirmText: 'Confirmer',
        cancelText:  'Annuler',
        variant:     'info',
        icon:        'check_circle'
    });
    if (!ok) { isSaving = false; return; }

    try {
        const maxId = Math.max(...appData.receptions.map(r => r.id||0), 0);
        for (let i = 0; i < adjustments.length; i++) {
            const adj = adjustments[i];
            const newRec = {
                id:          maxId + i + 1,
                date:        originalReception.date,
                collectorId: originalReception.collectorId,
                quality:     adj.quality,
                grossWeight: parseFloat(adj.grossWeight.toFixed(2)),
                tare:        parseFloat(adj.tare.toFixed(2)),
                netWeight:   parseFloat(adj.netWeight.toFixed(2)),
                price:       parseFloat(adj.price.toFixed(0)),
                totalValue:  parseFloat((adj.netWeight * adj.price).toFixed(0)),
                year:        originalReception.year,
                bagCount:    originalReception.bagCount    || 0,
                bagWeight:   originalReception.bagWeight   || 0,
                quickWeights: originalReception.quickWeights || [],
                note:        adj.note ? `[Ajustement] ${adj.note}` : '[Ajustement tri post-réception]',
                sourceReceptionId: originalReception.id,
                adjustmentDate:    Date.now()
            };
            await saveToDB('receptions', newRec);
        }

        const oldNet   = originalReception.netWeight || 0;
        const newNet   = parseFloat((oldNet - totalAdjW).toFixed(2));
        const origTare = parseFloat((originalReception.tare||0).toFixed(2));
        originalReception.netWeight   = Math.max(0, newNet);
        originalReception.grossWeight = Math.max(0, parseFloat((newNet + origTare).toFixed(2)));
        originalReception.totalValue  = Math.max(0, parseFloat((newNet * (originalReception.price||0)).toFixed(0)));
        originalReception.note        = `[Ajusté — ${adjustments.length} tri(s)] ${originalReception.note||''}`.trim();

        await saveToDB('receptions', originalReception);
        showToast(`${adjustments.length} ajustement(s) enregistré(s)!`, 'success');
        isSaving = false;
        closeAdjustModal();
    } catch (err) {
        console.error('saveAllAdjustments error:', err);
        showToast('Erreur lors de la sauvegarde: ' + err.message, 'error');
        isSaving = false;
    }
}
