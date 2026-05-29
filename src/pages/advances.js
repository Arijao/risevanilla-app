/* ============================================================
 * ADVANCES.JS — CRUD Avances + Remboursements
 * Architecture: Vanilla JS classique (pas d'ES modules)
 * Intègre la logique enrichie du fichier advances.js fourni
 * RISEVANILLA - Gestion de Collecte de Vanille
 * ============================================================ */

'use strict';

/* ── Logo inline (base64) — évite les chemins relatifs cassés dans les popups ── */
const _LOGO_B64_ADV = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiID8+PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMTQxNCIgaGVpZ2h0PSIxMjE0IiB2aWV3Qm94PSIwIDAgMTQxNCAxMjE0Ij48cGF0aCBmaWxsPSIjRTFFMUY0IiB0cmFuc2Zvcm09InNjYWxlKDEuMDA3ODQgMSkiIGQ9Ik0wIDBMMTQwMyAwTDE0MDMgMTIxNEwwIDEyMTRMMCAwWiIvPjxwYXRoIGZpbGw9IiM3QjQwNzUiIHRyYW5zZm9ybT0ic2NhbGUoMS4wMDc4NCAxKSIgZD0iTTI2MS4zOTMgMjYyLjMyN0MzMTQuNzU0IDI2My41NjUgMzcwLjE0OSAyNjEuODk5IDQyMy42NjggMjYxLjc4NEM1MDMuMjUxIDI2MS42MTMgNTc3LjEyMSAyNTguMzYzIDY1MC43MTggMjk1LjU1N0M3MjEuMzQxIDMzMS4yNDkgNzYyLjQ3OCAzOTcuMTAxIDc2NS45NDUgNDc1Ljk1MUM3NzAuNTU1IDUxNi4yOTMgNzY1LjUyMyA1NTMuOTAyIDc0Ny4wOTMgNTkwLjQyOEM3MzEuMzE3IDYyMS42OTMgNjkwLjA4OCA2NjEuMzYxIDY1NS43MyA2NzIuMTQ2QzY1OC4wMjUgNjgwLjYwNSA2NzEuNTE1IDcwMC45OTcgNjc2Ljg1MSA3MDkuNzExTDcxMC4yMTggNzY0LjE3OEM3MTYuMjkxIDc3NC4wOTUgNzIzLjg5IDc4NS44OTUgNzI5LjMyNiA3OTYuMDE3QzczMi42NzMgNzk5Ljk3MSA3MzUuMjE1IDgwNS42MTkgNzM4LjY1MSA4MTAuMDA0QzcyMy44MzMgODEwLjU4MSA3MDUuNjk1IDgxMC43MjMgNjkwLjg1NCA4MTAuMzcyQzY4MC4wOTYgODEwLjg0NCA2NjUuODY0IDgxMC40ODQgNjU0Ljc4MyA4MTAuNTI3TDU4NC4xOTkgODEwLjg0OEM1NzEuMzk2IDc4Ny4wODUgNTU1LjUxMyA3NjEuOTczIDU0MS43MzMgNzM4LjU3N0w0NTcuMzQ3IDU5NC45MDNDNDYxLjE1OCA1OTUuNjQxIDQ2NS40MDMgNTk2LjExMSA0NjkuMjkxIDU5Ni4wMzJDNTEyLjE2OCA1OTUuMjE5IDU2Mi4xNDggNjAxLjE4MiA1OTUuNjM3IDU2OC4yOTdDNjM2LjQ0NyA1MjguMjIzIDYyNy4xODEgNDQ2LjcxMSA1ODguNzQzIDQwOC4xMTNDNTUwLjc2MyAzNjkuOTc2IDQ4OC43MjIgMzc0LjcwMiA0MzguNzU5IDM3NC45NTVMMzI3Ljc0OSAzNzUuODk5QzMwNi45MzggMzM4LjA5OSAyODEuNTM5IDI5OS43MzMgMjYxLjM5MyAyNjIuMzI3WiIvPjxwYXRoIGZpbGw9IiMxQzA1MUEiIHRyYW5zZm9ybT0ic2NhbGUoMS4wMDc4NCAxKSIgZD0iTTcyOS4zMjYgNzk2LjAxN0M3MzIuNjczIDc5OS45NzEgNzM1LjIxNSA4MDUuNjE5IDczOC42NTEgODEwLjAwNEM3MjMuODMzIDgxMC41ODEgNzA1LjY5NSA4MTAuNzIzIDY5MC44NTQgODEwLjM3MkM3MDAuMjE5IDgwOC41NTEgNzE5LjY0OCA4MDkuNzk5IDczMC42NDkgODA4LjQ1OEM3MzUuMDQ5IDgwMy43OTUgNzI4LjYyNSA4MDAuMDg2IDcyOS4zMjYgNzk2LjAxN1oiLz48cGF0aCBmaWxsPSIjN0I0MDc1IiB0cmFuc2Zvcm09InNjYWxlKDEuMDA3ODQgMSkiIGQ9Ik05NjAuMzc4IDI2My4xMzlDMTAwMC4zNSAyNjMuOTg3IDEwNDEuMDcgMjYzLjI0OSAxMDgxLjEgMjYzLjc0MkMxMDk4LjM1IDI2My45NTQgMTExNi4xMiAyNjMuNDYgMTEzMy4yOSAyNjQuMTE5QzExMzAuMTMgMjcyLjA5MiAxMTI0LjcgMjgyLjg3OSAxMTIwLjk0IDI5MC44OTFMMTA5OC4yNyAzMzkuMjM1TDEwMjcuNzIgNDg5LjcxNUw4MTcuNzQ5IDkzNy42NjJDODEzLjkyOSA5NDUuODgxIDgwNS45MzYgOTYxLjYxMyA4MDMuNDEgOTY5LjM5M0M3OTQuODQzIDk3MC42MzQgNzcwLjA1NCA5NzAuMDgzIDc2MC4zNTIgOTcwLjA3N0w2NzcuNjk1IDk3MC4wMDRMODU1LjQ4NCA1MjUuMzQ2TDkyNy4zMzEgMzQ1LjQ2OEM5MzguMTYxIDMxOC40OTggOTQ5LjA0OSAyODkuNzU0IDk2MC4zNzggMjYzLjEzOVoiLz48L3N2Zz4=';


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
let _sigCanvas = null;
let _sigCtx = null;
let _sigDrawing = false;
let _sigHasData = false;

// ── Signature Pad Init ────────────────────────────────────────
function _initSignaturePad() {
    _sigCanvas = document.getElementById('signature-canvas');
    if (!_sigCanvas) return;

    // Calibrer le canvas à sa taille CSS réelle (évite le flou)
    const rect = _sigCanvas.getBoundingClientRect();
    _sigCanvas.width = rect.width || 476;
    _sigCanvas.height = rect.height || 200;

    _sigCtx = _sigCanvas.getContext('2d');
    _sigCtx.strokeStyle = '#1a1a2e';
    _sigCtx.lineWidth = 2.5;
    _sigCtx.lineCap = 'round';
    _sigCtx.lineJoin = 'round';
    _sigHasData = false;

    // Nettoyer les anciens listeners en recréant le canvas clone
    const fresh = _sigCanvas.cloneNode(true);
    _sigCanvas.parentNode.replaceChild(fresh, _sigCanvas);
    _sigCanvas = fresh;
    _sigCtx = _sigCanvas.getContext('2d');
    _sigCtx.strokeStyle = '#1a1a2e';
    _sigCtx.lineWidth = 2.5;
    _sigCtx.lineCap = 'round';
    _sigCtx.lineJoin = 'round';

    function _pos(e) {
        const r = _sigCanvas.getBoundingClientRect();
        const scaleX = _sigCanvas.width / r.width;
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

    _sigCanvas.addEventListener('mousedown', _start);
    _sigCanvas.addEventListener('mousemove', _move);
    _sigCanvas.addEventListener('mouseup', _end);
    _sigCanvas.addEventListener('mouseleave', _end);
    _sigCanvas.addEventListener('touchstart', _start, { passive: false });
    _sigCanvas.addEventListener('touchmove', _move, { passive: false });
    _sigCanvas.addEventListener('touchend', _end, { passive: false });
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
    const advance = (appData.advances || []).find(a => a.id === advanceId);
    if (!advance) { showToast('Avance introuvable', 'error'); return; }
    const collector = (appData.collectors || []).find(c => c.id === advance.collectorId);

    const infoEl = document.getElementById('signature-advance-info');
    if (infoEl) {
        infoEl.innerHTML = `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 16px;">
                <div>📋 <strong>Réf.</strong> AVA-${String(advance.id).padStart(4, '0')}</div>
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
    const advance = (appData.advances || []).find(a => a.id === advanceId);
    if (!advance) { showToast('Avance introuvable', 'error'); return; }

    // Extraire la signature en base64 (PNG transparent)
    const signatureData = _sigCanvas.toDataURL('image/png');

    // Construire l'objet avance mis à jour (put complet requis par IndexedDB)
    const updated = Object.assign({}, advance, {
        signature: signatureData,
        confirmedAt: new Date().toISOString()
    });

    await saveToDB('advances', updated);
    closeModal('signature-modal');
    showToast('✅ Signature enregistrée — réception confirmée !', 'success');
}


// ── Ticket Thermique 80mm — Avance ───────────────────────────
/** Imprime un ticket thermique format 80mm pour une avance.
 *
 *  Architecture "QR pré-généré" (la plus robuste) :
 *  1. Le QR code est généré dans le DOM parent (div caché) AVANT l'ouverture
 *     du popup — QRCode est disponible via assets/qrcode.min.js chargé dans index.html.
 *  2. Le SVG résultant est extrait et injecté comme HTML statique dans le popup.
 *  3. Le popup ne contient AUCUN script de génération QR → zéro timing, zéro path,
 *     zéro dépendance externe → fonctionne sur tous les navigateurs, 100% offline.
 *
 *  Structure identique à generateReceiptThermal (export.js).
 */
function printAdvanceTicket(advanceId) {
    const advance   = (appData.advances || []).find(a => a.id === advanceId);
    if (!advance) { showToast('Avance introuvable', 'error'); return; }
    const collector = (appData.collectors || []).find(c => c.id === advance.collectorId);

    // ── Données ticket ──────────────────────────────────────────
    const ref      = 'AVA-' + String(advance.id).padStart(7, '0');
    const colName  = collector ? collector.name : '—';
    const montant  = Math.abs(advance.amount).toLocaleString('fr-MG') + ' Ar';
    const dateFmt  = formatDate(advance.date);
    const confirmed = advance.confirmedAt
        ? new Date(advance.confirmedAt).toLocaleString('fr-FR') : '—';
    // ── Helper : normalise les accents pour compatibilité scanner ──
    // Certains lecteurs QR affichent l'UTF-8 en Latin-1 → accents corrompus.
    // On supprime les diacritiques dans le payload QR uniquement ;
    // les données originales en base restent intactes.
    function _ascii(str) {
        return String(str).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    // ── Payload QR — multiligne, ASCII-safe ─────────────────────
    // Séparateurs \n → affichage sur plusieurs lignes dans tous les scanners.
    const _montantQr = Math.abs(advance.amount).toLocaleString('fr-MG') + ' Ar';
    let qrPayload = 'N\u00b0: ' + ref
        + '\nCollecteur : ' + _ascii(colName)
        + '\nAvance : '     + _montantQr
        + '\nDate : '       + dateFmt;
    if (advance.motif) {
        qrPayload += '\nMotif : ' + _ascii(advance.motif);
    }

    // ── Génère le SVG QR dans un div caché du DOM parent ───────
    function _buildQrSvg() {
        const tmp = document.createElement('div');
        tmp.style.cssText = 'position:absolute;left:-9999px;visibility:hidden;';
        document.body.appendChild(tmp);
        let svg = '';
        try {
            new QRCode(tmp, {
                text: qrPayload, width: 114, height: 114,
                colorDark: '#000000', colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.M
            });
            const el = tmp.querySelector('svg');
            if (el) {
                el.setAttribute('width', '30mm');
                el.setAttribute('height', '30mm');
                el.style.cssText = 'width:30mm;height:30mm;display:block;';
                svg = tmp.innerHTML;
            }
        } catch(e) {
            console.warn('[RISEVANILLA] QR error:', e);
        } finally {
            document.body.removeChild(tmp);
        }
        return svg;
    }

    // ── Ouvre le popup et écrit le HTML complet ─────────────────
    function _openPopup(qrSvgHtml) {
        const motifBlock = advance.motif
            ? `<tr><td class="lbl">Motif&#160;:</td><td class="val-normal">${advance.motif}</td></tr>`
            : '';
        const confirmedBlock = advance.confirmedAt
            ? `<tr><td class="lbl">Confirm&#233;&#160;:</td><td class="val-normal">${confirmed}</td></tr>`
            : '';
        const qrBlock = qrSvgHtml
            ? `<div class="qr-wrap">${qrSvgHtml}</div><div class="qr-ref">${ref}</div>`
            : '';
        const sigBlock = advance.signature
            ? `<hr class="sep-dash"><div class="sig-section">
                   <div class="sig-label">Signature du collecteur&#160;:</div>
                   <div class="sig-img-wrap"><img src="${advance.signature}" class="sig-img" alt="Signature"></div>
               </div>`
            : `<hr class="sep-dash"><div class="sig-section">
                   <div class="sig-label">Signature du collecteur</div>
                   <div class="sig-line"></div>
               </div>`;
        const now = new Date();
        const timestamp = now.toLocaleDateString('fr-FR') + ' ' + now.toLocaleTimeString('fr-FR');

        const w = window.open('', '_blank');
        if (!w) { showToast('Popup bloqué — autorisez les popups', 'error'); return; }

        const html = `<!DOCTYPE html>
<html lang="fr"><head>
<meta charset="UTF-8">
<title>Ticket ${ref} \u2014 RISEVANILLA</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{background:#e0e0e0;min-height:100%}
body{background:#e0e0e0;display:flex;flex-direction:column;align-items:center;
     padding:20px 0 40px;font-family:'Courier New',Courier,monospace;font-size:12px;color:#000;line-height:1.6}
.toolbar{width:80mm;display:flex;gap:8px;margin-bottom:12px}
.toolbar button{flex:1;padding:7px 0;border:none;border-radius:6px;
     font-family:Arial,sans-serif;font-size:13px;cursor:pointer;font-weight:600}
.btn-print{background:#1a1a1a;color:#fff}
.btn-close{background:#ccc;color:#333}
#ticket{width:80mm;background:#fff;padding:4mm 4mm 6mm;line-height:1.6;box-shadow:0 2px 12px rgba(0,0,0,.25)}
.t-center{text-align:center}
.hd-logo{display:block;width:12mm;height:12mm;object-fit:contain;margin:0 auto 2mm}
.hd-title{font-size:15px;font-weight:700;letter-spacing:1.5px;text-align:center;margin-bottom:1px}
.hd-subtitle{font-size:11px;font-weight:700;letter-spacing:.8px;text-align:center;margin-bottom:4px}
.sep-dash{border:none;border-top:1px dashed #000;margin:6px 0}
.info-table{width:100%;border-collapse:collapse;margin-bottom:2px}
.info-table td{padding:2px 0;vertical-align:top;line-height:1.6}
.info-table td.lbl{width:46%}
.info-table td.val{text-align:right;font-weight:700}
.info-table td.val-normal{text-align:right;font-weight:400}
.amount-box{border:2px solid #000;padding:6px 8px;margin:7px 0;text-align:center}
.amount-box .lbl{font-size:10px;font-weight:700;letter-spacing:.6px;margin-bottom:1px}
.amount-box .val{font-size:16px;font-weight:700}
.qr-wrap{text-align:center;margin:8px 0 3px;line-height:0}
.qr-wrap svg{width:30mm!important;height:30mm!important;display:block;margin:0 auto}
.qr-ref{font-size:10px;text-align:center;margin:4px 0 6px;line-height:1.5}
.sig-section{margin:8px 0 4px}
.sig-label{font-size:11px;text-align:center;margin-bottom:4px;line-height:1.6}
.sig-line{border-top:1px solid #000;width:52mm;margin:16mm auto 0}
.sig-img-wrap{text-align:center}
.sig-img{max-width:56mm;max-height:20mm;border:1px solid #ccc;border-radius:1mm;padding:1mm;background:#fff}
.footer{font-size:9px;text-align:center;margin-top:8px;line-height:1.7}
@media print{
    @page{size:80mm auto;margin:0}
    html,body{background:#fff!important;display:block!important;padding:0!important}
    .toolbar{display:none!important}
    #ticket{width:80mm!important;box-shadow:none!important;padding:3mm 3mm 5mm!important;page-break-inside:avoid}
}
</style></head><body>
<div class="toolbar">
    <button class="btn-print" onclick="window.print()">&#128438;&#160;Imprimer</button>
    <button class="btn-close" onclick="window.close()">&#10005;&#160;Fermer</button>
</div>
<div id="ticket">
    <div class="t-center">
        <img src="${_LOGO_B64_ADV}" alt="RISEVANILLA" class="hd-logo">
        <div class="hd-title">RISEVANILLA</div>
        <div class="hd-subtitle">TICKET D&#39;AVANCE</div>
    </div>
    <hr class="sep-dash">
    <table class="info-table">
        <tr><td class="lbl">R&#233;f&#233;rence&#160;:</td><td class="val-normal">${ref}</td></tr>
        <tr><td class="lbl">Date&#160;:</td><td class="val-normal">${dateFmt}</td></tr>
        <tr><td class="lbl">Collecteur&#160;:</td><td class="val">${colName}</td></tr>
        ${confirmedBlock}
        ${motifBlock}
    </table>
    <hr class="sep-dash">
    <div class="amount-box">
        <div class="lbl">MONTANT AVANC&#201;</div>
        <div class="val">${montant}</div>
    </div>
    ${qrBlock}
    ${sigBlock}
    <hr class="sep-dash">
    <div class="footer">
        Imprim&#233; le ${timestamp}<br>
        <strong>RISEVANILLA</strong> &mdash; Gestion de Collecte de Vanille
    </div>
</div>
<script>window.onload=function(){setTimeout(function(){window.print();},400)};<\/script>
</body></html>`;

        w.document.write(html);
        w.document.close();
    }

    // ── Dispatch : QRCode dispo → direct ; sinon chargement dynamique ──
    if (typeof QRCode === 'function') {
        _openPopup(_buildQrSvg());
    } else {
        // Chargement dynamique — fonctionne même si index.html n'est pas mis à jour
        console.info('[RISEVANILLA] Chargement dynamique qrcode.min.js...');
        const _s = document.createElement('script');
        _s.src = 'assets/qrcode.min.js';
        _s.onload  = function() { _openPopup(_buildQrSvg()); };
        _s.onerror = function() {
            console.warn('[RISEVANILLA] qrcode.min.js introuvable — ticket sans QR');
            _openPopup('');
        };
        document.head.appendChild(_s);
    }
}

// ── Generate PDF Receipt ──────────────────────────────────────
function generateAdvancePDF(advanceId) {
    const advance = (appData.advances || []).find(a => a.id === advanceId);
    if (!advance) { showToast('Avance introuvable', 'error'); return; }
    const collector = (appData.collectors || []).find(c => c.id === advance.collectorId);
    const ref = 'AVA-' + String(advance.id).padStart(4, '0');
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
                    <img src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiID8+PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMTQxNCIgaGVpZ2h0PSIxMjE0IiB2aWV3Qm94PSIwIDAgMTQxNCAxMjE0Ij48cGF0aCBmaWxsPSIjRTFFMUY0IiB0cmFuc2Zvcm09InNjYWxlKDEuMDA3ODQgMSkiIGQ9Ik0wIDBMMTQwMyAwTDE0MDMgMTIxNEwwIDEyMTRMMCAwWiIvPjxwYXRoIGZpbGw9IiM3QjQwNzUiIHRyYW5zZm9ybT0ic2NhbGUoMS4wMDc4NCAxKSIgZD0iTTI2MS4zOTMgMjYyLjMyN0MzMTQuNzU0IDI2My41NjUgMzcwLjE0OSAyNjEuODk5IDQyMy42NjggMjYxLjc4NEM1MDMuMjUxIDI2MS42MTMgNTc3LjEyMSAyNTguMzYzIDY1MC43MTggMjk1LjU1N0M3MjEuMzQxIDMzMS4yNDkgNzYyLjQ3OCAzOTcuMTAxIDc2NS45NDUgNDc1Ljk1MUM3NzAuNTU1IDUxNi4yOTMgNzY1LjUyMyA1NTMuOTAyIDc0Ny4wOTMgNTkwLjQyOEM3MzEuMzE3IDYyMS42OTMgNjkwLjA4OCA2NjEuMzYxIDY1NS43MyA2NzIuMTQ2QzY1OC4wMjUgNjgwLjYwNSA2NzEuNTE1IDcwMC45OTcgNjc2Ljg1MSA3MDkuNzExTDcxMC4yMTggNzY0LjE3OEM3MTYuMjkxIDc3NC4wOTUgNzIzLjg5IDc4NS44OTUgNzI5LjMyNiA3OTYuMDE3QzczMi42NzMgNzk5Ljk3MSA3MzUuMjE1IDgwNS42MTkgNzM4LjY1MSA4MTAuMDA0QzcyMy44MzMgODEwLjU4MSA3MDUuNjk1IDgxMC43MjMgNjkwLjg1NCA4MTAuMzcyQzY4MC4wOTYgODEwLjg0NCA2NjUuODY0IDgxMC40ODQgNjU0Ljc4MyA4MTAuNTI3TDU4NC4xOTkgODEwLjg0OEM1NzEuMzk2IDc4Ny4wODUgNTU1LjUxMyA3NjEuOTczIDU0MS43MzMgNzM4LjU3N0w0NTcuMzQ3IDU5NC45MDNDNDYxLjE1OCA1OTUuNjQxIDQ2NS40MDMgNTk2LjExMSA0NjkuMjkxIDU5Ni4wMzJDNTEyLjE2OCA1OTUuMjE5IDU2Mi4xNDggNjAxLjE4MiA1OTUuNjM3IDU2OC4yOTdDNjM2LjQ0NyA1MjguMjIzIDYyNy4xODEgNDQ2LjcxMSA1ODguNzQzIDQwOC4xMTNDNTUwLjc2MyAzNjkuOTc2IDQ4OC43MjIgMzc0LjcwMiA0MzguNzU5IDM3NC45NTVMMzI3Ljc0OSAzNzUuODk5QzMwNi45MzggMzM4LjA5OSAyODEuNTM5IDI5OS43MzMgMjYxLjM5MyAyNjIuMzI3WiIvPjxwYXRoIGZpbGw9IiMxQzA1MUEiIHRyYW5zZm9ybT0ic2NhbGUoMS4wMDc4NCAxKSIgZD0iTTcyOS4zMjYgNzk2LjAxN0M3MzIuNjczIDc5OS45NzEgNzM1LjIxNSA4MDUuNjE5IDczOC42NTEgODEwLjAwNEM3MjMuODMzIDgxMC41ODEgNzA1LjY5NSA4MTAuNzIzIDY5MC44NTQgODEwLjM3MkM3MDAuMjE5IDgwOC41NTEgNzE5LjY0OCA4MDkuNzk5IDczMC42NDkgODA4LjQ1OEM3MzUuMDQ5IDgwMy43OTUgNzI4LjYyNSA4MDAuMDg2IDcyOS4zMjYgNzk2LjAxN1oiLz48cGF0aCBmaWxsPSIjN0I0MDc1IiB0cmFuc2Zvcm09InNjYWxlKDEuMDA3ODQgMSkiIGQ9Ik05NjAuMzc4IDI2My4xMzlDMTAwMC4zNSAyNjMuOTg3IDEwNDEuMDcgMjYzLjI0OSAxMDgxLjEgMjYzLjc0MkMxMDk4LjM1IDI2My45NTQgMTExNi4xMiAyNjMuNDYgMTEzMy4yOSAyNjQuMTE5QzExMzAuMTMgMjcyLjA5MiAxMTI0LjcgMjgyLjg3OSAxMTIwLjk0IDI5MC44OTFMMTA5OC4yNyAzMzkuMjM1TDEwMjcuNzIgNDg5LjcxNUw4MTcuNzQ5IDkzNy42NjJDODEzLjkyOSA5NDUuODgxIDgwNS45MzYgOTYxLjYxMyA4MDMuNDEgOTY5LjM5M0M3OTQuODQzIDk3MC42MzQgNzcwLjA1NCA5NzAuMDgzIDc2MC4zNTIgOTcwLjA3N0w2NzcuNjk1IDk3MC4wMDRMODU1LjQ4NCA1MjUuMzQ2TDkyNy4zMzEgMzQ1LjQ2OEM5MzguMTYxIDMxOC40OTggOTQ5LjA0OSAyODkuNzU0IDk2MC4zNzggMjYzLjEzOVoiLz48L3N2Zz4=" class="header-logo">
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
    // Réinitialiser l'affichage du solde
    _updateAdvanceCollectorBalance();
}

/** Met à jour l'affichage du solde du collecteur dans le formulaire d'avance */
function _updateAdvanceCollectorBalance() {
    const select = document.getElementById('advance-collector');
    const info = document.getElementById('advance-collector-balance-info');
    const text = document.getElementById('advance-balance-text');
    const icon = document.getElementById('advance-balance-icon');
    const amount = document.getElementById('advance-balance-amount');

    if (!select || !info || !text) return;

    const collectorId = parseInt(select.value);
    if (!collectorId) {
        info.style.display = 'none';
        return;
    }

    const balance = calculateCollectorBalance(collectorId);
    info.style.display = 'flex';

    // Supprimer les classes d'état précédentes
    info.classList.remove('balance-info--credit', 'balance-info--debit', 'balance-info--neutral');

    if (balance > 0) {
        // Créditeur (RiseVanilla doit de l'argent au collecteur)
        info.classList.add('balance-info--credit');
        if (icon) icon.textContent = 'trending_up';
        if (text) text.textContent = 'Solde créditeur';
        if (amount) amount.textContent = formatCurrency(balance);
        else text.innerHTML = `Solde restant : <strong>${formatCurrency(balance)}</strong> <span class="balance-info__tag crediteur">Créditeur</span>`;
    } else if (balance < 0) {
        // Débiteur (Le collecteur doit de l'argent à RiseVanilla)
        info.classList.add('balance-info--debit');
        if (icon) icon.textContent = 'trending_down';
        if (text) text.textContent = 'Montant dû';
        if (amount) amount.textContent = formatCurrency(Math.abs(balance));
        else text.innerHTML = `Montant dû : <strong>${formatCurrency(Math.abs(balance))}</strong> <span class="balance-info__tag debiteur">Débiteur</span>`;
    } else {
        // Neutre
        info.classList.add('balance-info--neutral');
        if (icon) icon.textContent = 'check_circle';
        if (text) text.textContent = 'Solde équilibré';
        if (amount) amount.textContent = formatCurrency(0);
        else text.innerHTML = `Solde : <strong>0 Ar</strong> <span class="balance-info__tag equilibre">Équilibré</span>`;
    }
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
            <td data-label="Motif">
                <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                    ${adv.vanilleType === 'verte'
                ? `<span style="display:inline-flex;align-items:center;gap:3px;font-size:10px;padding:2px 7px;border-radius:20px;background:rgba(0, 230, 118, 0.15);color:#00e676;font-weight:700;border:1px solid rgba(0, 230, 118, 0.3);box-shadow: 0 0 8px rgba(0, 230, 118, 0.15);"><span class="material-icons" style="font-size:11px;">grass</span>Verte</span>`
                : adv.vanilleType === 'preparee'
                    ? `<span style="display:inline-flex;align-items:center;gap:3px;font-size:10px;padding:2px 7px;border-radius:20px;background:rgba(152,144,168,.10);color:var(--md-sys-color-primary);font-weight:700;border:1px solid rgba(152,144,168,0.2);"><span class="material-icons" style="font-size:11px;">verified</span>Préparée</span>`
                    : ''}
                    <span>${RiseVanillaSearch.highlightText(adv.motif || '—', _q)}</span>
                </div>
            </td>
            <td class="actions-cell">
                ${adv.signature
                ? `<button class="btn btn-icon" title="Réception confirmée ✓"
                               style="color:#4caf50;cursor:default;" disabled>
                           <span class="material-icons">verified</span>
                       </button>
                       <button class="btn btn-icon btn-outline" onclick="generateAdvancePDF(${adv.id})" title="Générer le reçu PDF">
                           <span class="material-icons">picture_as_pdf</span>
                       </button>
                       <button class="btn btn-icon btn-outline" onclick="printAdvanceTicket(${adv.id})" title="Imprimer ticket thermique 80mm">
                           <span class="material-icons">receipt_long</span>
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
    const startDate = document.getElementById('advance-filter-start')?.value;
    const endDate = document.getElementById('advance-filter-end')?.value;

    if (collectorFilter) data = data.filter(a => String(a.collectorId) === String(collectorFilter));
    if (startDate) data = data.filter(a => a.date >= startDate);
    if (endDate) data = data.filter(a => a.date <= endDate);

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
    const now = new Date();
    const today = _todayISO();
    let start = today, end = today;

    if (period === 'week') {
        const d = new Date(now);
        d.setDate(d.getDate() - d.getDay());
        start = d.toISOString().split('T')[0];
    } else if (period === 'month') {
        start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    } else if (period === 'year') {
        start = `${now.getFullYear()}-01-01`;
        end = `${now.getFullYear()}-12-31`;
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
            document.getElementById('advance-date').value = advance.date;
            document.getElementById('advance-collector').value = advance.collectorId;
            // Afficher le montant formaté
            const amtEl = document.getElementById('advance-amount');
            if (amtEl) amtEl.value = advance.amount.toLocaleString('fr-MG');
            document.getElementById('advance-motif').value = advance.motif || '';
            // Restituer vanilleType
            const typeEl = document.getElementById('advance-vanille-type');
            if (typeEl) typeEl.value = advance.vanilleType || '';
        }
    }

    // Mettre à jour le solde immédiatement
    _updateAdvanceCollectorBalance();

    openModal('advance-modal');
    setTimeout(() => document.getElementById('advance-date')?.focus(), 200);
}

function saveAdvance(event) {
    if (event) event.preventDefault();
    const form = document.getElementById('advance-form');
    const editId = form?.dataset.editId;
    const date = document.getElementById('advance-date')?.value;
    const collectorId = parseInt(document.getElementById('advance-collector')?.value);
    const amount = _parseAmount(document.getElementById('advance-amount')?.value);
    const motif = document.getElementById('advance-motif')?.value?.trim() || '';

    if (!date || !collectorId || !amount) {
        showToast('Veuillez remplir tous les champs obligatoires', 'error');
        return;
    }

    const vanilleType = document.getElementById('advance-vanille-type')?.value || '';
    const data = { date, collectorId, amount, motif, vanilleType, createdAt: new Date().toISOString() };
    if (editId) data.id = parseInt(editId);

    saveToDB('advances', data, () => {
        closeModal('advance-modal');
        showToast(editId ? 'Avance modifiée' : 'Avance enregistrée', 'success');
    });
}

async function deleteAdvance(id) {
    const ok = await confirmModal({
        title: 'Supprimer l\'avance',
        message: 'Cette action est irréversible. L\'avance sera définitivement supprimée.',
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        variant: 'danger',
        icon: 'delete_forever'
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
    const nameEl = document.getElementById('remboursement-collector-name');
    const idEl = document.getElementById('remboursement-collector-id');
    const dateEl = document.getElementById('remboursement-date');

    if (idEl) idEl.value = collectorId;
    if (nameEl) nameEl.value = collector ? collector.name : '';
    if (dateEl) dateEl.value = _todayISO();

    // Pré-remplir le montant avec le solde dû du collecteur (nouveau remboursement uniquement)
    if (!remboursementId) {
        const balance = typeof calculateCollectorBalance === 'function'
            ? calculateCollectorBalance(collectorId)
            : 0;
        // Solde débiteur = balance négative (le collecteur doit de l'argent)
        const due = balance < 0 ? Math.abs(balance) : 0;
        const amtEl = document.getElementById('remboursement-amount');
        if (amtEl) amtEl.value = due > 0 ? due.toLocaleString('fr-MG') : '';

        // Stocker le montant dû pour validation + afficher l'indicateur
        const btn = document.getElementById('remb-fill-total-btn');
        const dueInfo = document.getElementById('remboursement-due-info');
        if (btn) {
            btn.dataset.due = due;
            btn.disabled = due <= 0;
        }
        if (dueInfo) {
            if (due > 0) {
                dueInfo.style.display = 'block';
                dueInfo.innerHTML = `Solde dû : <strong>${due.toLocaleString('fr-MG')} Ar</strong>
                    <span style="opacity:.7;">— saisie partielle autorisée</span>`;
            } else {
                dueInfo.style.display = 'block';
                dueInfo.innerHTML = `<span style="color:var(--md-sys-color-primary);">✓ Aucune dette — collecteur équilibré ou créditeur</span>`;
            }
        }
    } else {
        // En mode édition : masquer l'indicateur et le bouton totalité
        const btn = document.getElementById('remb-fill-total-btn');
        const dueInfo = document.getElementById('remboursement-due-info');
        if (btn) { btn.dataset.due = 0; btn.style.display = 'none'; }
        if (dueInfo) dueInfo.style.display = 'none';
    }

    if (remboursementId) {
        const remb = (appData.remboursements || []).find(r => r.id === remboursementId);
        if (remb) {
            if (editIdEl) editIdEl.value = remboursementId;
            const amtEl = document.getElementById('remboursement-amount');
            const noteEl = document.getElementById('remboursement-note');
            if (amtEl) amtEl.value = remb.amount.toLocaleString('fr-MG');
            if (dateEl) dateEl.value = remb.date;
            if (noteEl) noteEl.value = remb.note || '';
        }
    }

    openModal('remboursement-modal');
}

/** Remplit le champ montant avec la totalité du solde dû */
function fillTotalRemboursement() {
    const btn = document.getElementById('remb-fill-total-btn');
    const amtEl = document.getElementById('remboursement-amount');
    if (!btn || !amtEl) return;
    const due = parseFloat(btn.dataset.due || 0);
    if (due > 0) {
        amtEl.value = due.toLocaleString('fr-MG');
        amtEl.focus();
    }
}

function openRemboursementModalToEdit(remboursementId) {
    const remb = (appData.remboursements || []).find(r => r.id === remboursementId);
    if (remb) openRemboursementModal(remb.collectorId, remboursementId);
}

function saveRemboursement(event) {
    if (event) event.preventDefault();

    const editIdEl = document.getElementById('remboursement-edit-id');
    const collectorId = parseInt(document.getElementById('remboursement-collector-id')?.value);
    const amount = _parseAmount(document.getElementById('remboursement-amount')?.value);
    const date = document.getElementById('remboursement-date')?.value;
    const note = document.getElementById('remboursement-note')?.value?.trim() || '';

    if (!date || !collectorId || !amount) {
        showToast('Veuillez remplir tous les champs obligatoires', 'error');
        return;
    }

    // Validation : montant ne peut pas dépasser le solde dû (nouveau remboursement uniquement)
    if (!editIdEl?.value) {
        const balance = typeof calculateCollectorBalance === 'function'
            ? calculateCollectorBalance(collectorId) : 0;
        const due = balance < 0 ? Math.abs(balance) : 0;
        if (due > 0 && amount > due) {
            showToast(
                `Montant (${amount.toLocaleString('fr-MG')} Ar) supérieur au solde dû (${due.toLocaleString('fr-MG')} Ar)`,
                'error', 4000
            );
            return;
        }
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
        title: 'Supprimer le remboursement',
        message: 'Cette action est irréversible. Le remboursement sera définitivement supprimé.',
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        variant: 'danger',
        icon: 'delete_forever'
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

// ── Signature Pad — Paiement Solde Créditeur (pad dédié) ─────
let _cpSigCanvas = null;
let _cpSigCtx = null;
let _cpSigDrawing = false;
let _cpSigHasData = false;

function _initCpSignaturePad() {
    _cpSigCanvas = document.getElementById('cp-signature-canvas');
    if (!_cpSigCanvas) return;

    const rect = _cpSigCanvas.getBoundingClientRect();
    _cpSigCanvas.width = rect.width || 476;
    _cpSigCanvas.height = rect.height || 160;

    _cpSigCtx = _cpSigCanvas.getContext('2d');
    _cpSigCtx.strokeStyle = '#1a1a2e';
    _cpSigCtx.lineWidth = 2.5;
    _cpSigCtx.lineCap = 'round';
    _cpSigCtx.lineJoin = 'round';
    _cpSigHasData = false;

    // Cloner pour purger les anciens listeners
    const fresh = _cpSigCanvas.cloneNode(true);
    _cpSigCanvas.parentNode.replaceChild(fresh, _cpSigCanvas);
    _cpSigCanvas = fresh;
    _cpSigCtx = _cpSigCanvas.getContext('2d');
    _cpSigCtx.strokeStyle = '#1a1a2e';
    _cpSigCtx.lineWidth = 2.5;
    _cpSigCtx.lineCap = 'round';
    _cpSigCtx.lineJoin = 'round';

    function _pos(e) {
        const r = _cpSigCanvas.getBoundingClientRect();
        const scaleX = _cpSigCanvas.width / r.width;
        const scaleY = _cpSigCanvas.height / r.height;
        const src = e.touches ? e.touches[0] : e;
        return { x: (src.clientX - r.left) * scaleX, y: (src.clientY - r.top) * scaleY };
    }
    function _start(e) {
        e.preventDefault();
        _cpSigDrawing = true;
        _cpSigHasData = true;
        const { x, y } = _pos(e);
        _cpSigCtx.beginPath();
        _cpSigCtx.moveTo(x, y);
        const ph = document.getElementById('cp-signature-placeholder');
        if (ph) ph.style.display = 'none';
    }
    function _move(e) {
        e.preventDefault();
        if (!_cpSigDrawing) return;
        const { x, y } = _pos(e);
        _cpSigCtx.lineTo(x, y);
        _cpSigCtx.stroke();
    }
    function _end(e) { e.preventDefault(); _cpSigDrawing = false; }

    _cpSigCanvas.addEventListener('mousedown', _start);
    _cpSigCanvas.addEventListener('mousemove', _move);
    _cpSigCanvas.addEventListener('mouseup', _end);
    _cpSigCanvas.addEventListener('mouseleave', _end);
    _cpSigCanvas.addEventListener('touchstart', _start, { passive: false });
    _cpSigCanvas.addEventListener('touchmove', _move, { passive: false });
    _cpSigCanvas.addEventListener('touchend', _end, { passive: false });
}

function clearCpSignaturePad() {
    if (!_cpSigCanvas || !_cpSigCtx) return;
    _cpSigCtx.clearRect(0, 0, _cpSigCanvas.width, _cpSigCanvas.height);
    _cpSigHasData = false;
    const ph = document.getElementById('cp-signature-placeholder');
    if (ph) ph.style.display = '';
}

// ── Paiements Solde Créditeur ─────────────────────────────────

function payCollectorCredit(collectorId) {
    const collector = (appData.collectors || []).find(c => c.id === collectorId);
    const balance = calculateCollectorBalance(collectorId);
    if (balance <= 0) {
        showToast('Ce collecteur n\'a pas de solde créditeur.', 'error');
        return;
    }
    const nameEl = document.getElementById('credit-payment-collector-name');
    const idEl = document.getElementById('credit-payment-collector-id');
    const balEl = document.getElementById('credit-payment-balance');
    const dateEl = document.getElementById('credit-payment-date');
    const amtEl = document.getElementById('credit-payment-amount');
    const noteEl = document.getElementById('credit-payment-note');

    if (idEl) idEl.value = collectorId;
    if (nameEl) nameEl.value = collector ? collector.name : '';
    if (balEl) balEl.value = formatCurrency(balance);
    if (dateEl) dateEl.value = _todayISO();
    if (amtEl) amtEl.value = '';
    if (noteEl) noteEl.value = '';

    // Indicateur de solde créditeur + données du bouton "Payer tout"
    const fillBtn = document.getElementById('cp-fill-total-btn');
    const creditInfo = document.getElementById('cp-credit-info');
    if (fillBtn) {
        fillBtn.dataset.credit = balance;
        fillBtn.disabled = false;
    }
    if (creditInfo) {
        creditInfo.style.display = 'block';
        creditInfo.innerHTML = `Solde créditeur : <strong>${balance.toLocaleString('fr-MG')} Ar</strong>
            <span style="opacity:.7;">— saisie partielle autorisée</span>`;
    }

    // Réinitialiser le pad de signature
    _cpSigHasData = false;
    const ph = document.getElementById('cp-signature-placeholder');
    if (ph) ph.style.display = '';

    openModal('credit-payment-modal');
    // Init pad après ouverture (canvas doit être visible)
    setTimeout(_initCpSignaturePad, 80);
}

/** Remplit le champ montant avec la totalité du solde créditeur */
function setCreditPaymentToFullBalance() {
    const fillBtn = document.getElementById('cp-fill-total-btn');
    const amtEl = document.getElementById('credit-payment-amount');
    if (!fillBtn || !amtEl) return;
    const credit = parseFloat(fillBtn.dataset.credit || 0);
    if (credit > 0) {
        amtEl.value = credit.toLocaleString('fr-MG');
        amtEl.focus();
    }
}

function formatCreditPaymentAmount(input) {
    let raw = input.value.replace(/\D/g, '');
    if (!raw) { input.value = ''; return; }
    input.value = Number(raw).toLocaleString('fr-MG');
}

function submitCreditPayment(event) {
    if (event) event.preventDefault();
    const collectorId = parseInt(document.getElementById('credit-payment-collector-id')?.value);
    const amount = _parseAmount(document.getElementById('credit-payment-amount')?.value);
    const date = document.getElementById('credit-payment-date')?.value;
    const note = document.getElementById('credit-payment-note')?.value?.trim() || '';

    if (!date || !collectorId || !amount) {
        showToast('Veuillez remplir tous les champs obligatoires', 'error');
        return;
    }

    // Validation : montant ne peut pas dépasser le solde créditeur
    const balance = typeof calculateCollectorBalance === 'function'
        ? calculateCollectorBalance(collectorId) : 0;
    const credit = balance > 0 ? balance : 0;
    if (credit > 0 && amount > credit) {
        showToast(
            `Montant (${amount.toLocaleString('fr-MG')} Ar) supérieur au solde créditeur (${credit.toLocaleString('fr-MG')} Ar)`,
            'error', 4000
        );
        return;
    }

    // Signature obligatoire
    if (!_cpSigHasData) {
        showToast('Veuillez apposer la signature du collecteur avant de valider.', 'error');
        // Scroll vers la zone signature
        const sigSection = document.getElementById('cp-signature-canvas');
        if (sigSection) sigSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    const signatureData = _cpSigCanvas ? _cpSigCanvas.toDataURL('image/png') : null;
    const data = {
        collectorId, amount, date, note,
        signatureData,
        confirmedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
    };
    saveToDB('paiements', data, () => {
        closeModal('credit-payment-modal');
        showToast('✅ Paiement enregistré et signé !', 'success');
    });
}

async function deletePaiement(id) {
    const ok = await confirmModal({
        title: 'Supprimer le paiement',
        message: 'Cette action est irréversible. Le paiement de solde sera définitivement supprimé.',
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        variant: 'danger',
        icon: 'delete_forever'
    });
    if (!ok) return;
    deleteFromDB('paiements', id, () => showToast('Paiement supprimé.', 'warning'));
}

/** Affiche la signature d'un paiement dans un mini-modal */
function viewPaiementSignature(paiementId) {
    const p = (appData.paiements || []).find(x => x.id === paiementId);
    if (!p || !p.signatureData) { showToast('Signature introuvable.', 'error'); return; }
    const collector = (appData.collectors || []).find(c => c.id === p.collectorId);

    const modalId = 'paiement-sig-preview-modal';
    let modal = document.getElementById(modalId);
    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = modalId;
        document.body.appendChild(modal);
    }
    modal.innerHTML = `
        <div class="modal-content" style="max-width:420px;width:95%;">
            <div class="modal-header">
                <h3 class="modal-title">
                    <span class="material-icons" style="color:#2e7b32;">verified</span>
                    Signature — Paiement confirmé
                </h3>
                <button class="close-btn" onclick="closeModal('${modalId}')">
                    <span class="material-icons">close</span>
                </button>
            </div>
            <div style="padding:20px;">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 16px;
                            font-size:13px;margin-bottom:16px;
                            padding:12px;border-radius:10px;
                            background:var(--md-sys-color-surface-variant);">
                    <div><span style="opacity:.7;">Collecteur</span><br>
                         <strong>${collector ? collector.name : '—'}</strong></div>
                    <div><span style="opacity:.7;">Date</span><br>
                         <strong>${formatDate(p.date)}</strong></div>
                    <div><span style="opacity:.7;">Montant payé</span><br>
                         <strong style="color:var(--md-sys-color-primary);">${formatCurrency(p.amount)}</strong></div>
                    <div><span style="opacity:.7;">Note</span><br>
                         <strong>${p.note || '—'}</strong></div>
                </div>
                <div style="font-size:12px;color:var(--md-sys-color-on-surface-variant);
                            margin-bottom:8px;font-weight:500;">
                    Signature du collecteur :
                </div>
                <div style="border:1px solid var(--md-sys-color-outline-variant);
                            border-radius:10px;background:#fff;padding:8px;text-align:center;">
                    <img src="${p.signatureData}" alt="Signature"
                         style="max-width:100%;max-height:140px;object-fit:contain;">
                </div>
                ${p.confirmedAt ? `<div style="font-size:11px;opacity:.6;margin-top:8px;text-align:right;">
                    Signé le ${new Date(p.confirmedAt).toLocaleString('fr-MG')}</div>` : ''}
            </div>
            <div style="padding:0 20px 16px;display:flex;justify-content:flex-end;">
                <button class="btn btn-outline" onclick="closeModal('${modalId}')">Fermer</button>
            </div>
        </div>`;
    openModal(modalId);
}

function updatePaiementsTable() {
    const tbody = document.getElementById('paiements-table');
    if (!tbody) return;
    tbody.innerHTML = '';

    const paiements = getPaiementsForCurrentYear()
        .sort((a, b) => b.date.localeCompare(a.date));

    if (!paiements.length) {
        tbody.innerHTML = `
            <tr><td colspan="6" class="empty-state">
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
        const sigBadge = p.signatureData
            ? `<span title="Paiement signé — cliquer pour voir la signature"
                     onclick="viewPaiementSignature(${p.id})"
                     style="display:inline-flex;align-items:center;gap:3px;cursor:pointer;
                            padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600;
                            background:rgba(46,125,50,.12);color:#2e7b32;border:1px solid rgba(46,125,50,.3);">
                 <span class="material-icons" style="font-size:13px;">verified</span>Signé
               </span>`
            : `<span title="Aucune signature enregistrée"
                     style="display:inline-flex;align-items:center;gap:3px;
                            padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600;
                            background:rgba(198,40,40,.10);color:#c62828;border:1px solid rgba(198,40,40,.25);">
                 <span class="material-icons" style="font-size:13px;">warning_amber</span>Non signé
               </span>`;
        row.innerHTML = `
            <td data-label="Date">${formatDate(p.date)}</td>
            <td data-label="Collecteur"></td>
            <td data-label="Montant Payé">${formatCurrency(p.amount)}</td>
            <td data-label="Note">${RiseVanillaSearch.highlightText(p.note || '—', _q)}</td>
            <td data-label="Signature">${sigBadge}</td>
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
