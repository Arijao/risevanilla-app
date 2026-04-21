/* ============================================================
 * DASHBOARD.JS — Dashboard stats, charts, insights
 * RISEVANILLA - Gestion de Collecte de Vanille
 * ============================================================ */

'use strict';

let pieChartInstance     = null;
let barChartInstance     = null;
let qualityChartInstance = null;

function updateEnhancedDashboard() {
    const expensesData   = getExpensesForCurrentYear();
    const advancesData   = getAdvancesForCurrentYear();
    const receptionsData = getReceptionsForCurrentYear();
    const deliveriesData = getDeliveriesForCurrentYear();

    const collectorsData = appData.collectors.filter(collector => {
        if (!isCollectorAvailableInCurrentYear(collector)) return false;
        return advancesData.some(a => a.collectorId === collector.id) ||
               receptionsData.some(r => r.collectorId === collector.id) ||
               getRemboursementsForCurrentYear().some(r => r.collectorId === collector.id) ||
               getPaiementsForCurrentYear().some(p => p.collectorId === collector.id);
    });

    const totalAdvances      = advancesData.reduce((s, a) => s + a.amount, 0);
    const totalExpenses      = expensesData.reduce((s, e) => s + e.amount, 0);
    const totalMoneyOut      = totalAdvances + totalExpenses;
    const totalVanillaValue  = receptionsData.reduce((s, r) => s + r.totalValue, 0);
    const totalRemboursements = getRemboursementsForCurrentYear().reduce((s, r) => s + r.amount, 0);
    const totalVanillaWeight  = receptionsData.reduce((s, r) => s + r.netWeight, 0);
    const balance             = (totalVanillaValue + totalRemboursements) - totalMoneyOut;
    const recoveryRate        = totalMoneyOut > 0 ? (totalVanillaValue / totalMoneyOut) * 100 : 0;

    const balanceInfo = {
        balance, isPositive: balance >= 0, deficit: Math.abs(balance),
        totalAdvances, totalExpenses, totalMoneyOut, totalVanillaValue,
        recoveryRate: recoveryRate.toFixed(1)
    };

    _setEl('total-advances',       formatCurrency(totalAdvances));
    _setEl('total-expenses',       formatCurrency(totalExpenses));
    _setEl('total-vanilla-value',  formatCurrency(totalVanillaValue));
    _setEl('total-vanilla-weight', totalVanillaWeight.toFixed(2) + ' kg');

    const totalTransactions = advancesData.length + receptionsData.length + deliveriesData.length + expensesData.length;
    _setEl('overview-collectors',   collectorsData.length);
    _setEl('overview-transactions', totalTransactions);
    _setEl('overview-month',        `Année ${currentYear}`);

    updateGlobalBalanceCard(balanceInfo);
    updateInsights(balanceInfo);
    updateRentabiliteInsights();
    updateProgressBars(balanceInfo, totalVanillaWeight);
}

function updateGlobalBalanceCard(b) {
    const card     = document.getElementById('solde-global-card');
    const value    = document.getElementById('solde-global');
    const icon     = document.getElementById('solde-icon');
    const trendI   = document.getElementById('solde-trend-icon');
    const trendT   = document.getElementById('solde-trend-text');
    if (!card) return;

    if (value)  value.textContent = (b.isPositive ? '+' : '-') + formatCurrency(b.deficit);
    if (card)   card.className = `stat-card solde-global-card ${b.balance > 0 ? 'crediteur' : b.balance === 0 ? 'equilibre' : 'debiteur'}`;

    if (b.balance > 0)       { if(icon) icon.textContent='account_balance_wallet'; if(trendI) trendI.textContent='trending_up';   if(trendT) trendT.textContent='Excédent disponible'; }
    else if (b.balance === 0){ if(icon) icon.textContent='balance';                 if(trendI) trendI.textContent='trending_flat'; if(trendT) trendT.textContent='Parfaitement équilibré'; }
    else                     { if(icon) icon.textContent='account_balance';         if(trendI) trendI.textContent='trending_down';  if(trendT) trendT.textContent='Argent non récupéré'; }
}

function updateInsights(b) {
    const totalMoneyOut      = b.totalAdvances + b.totalExpenses;
    const recoveryRateValue  = totalMoneyOut > 0 ? (b.totalVanillaValue / totalMoneyOut * 100) : 0;
    const avanceBalance      = b.totalVanillaValue - b.totalAdvances;

    const icon1   = document.getElementById('insight-icon-1');
    const title1  = document.getElementById('insight-title-1');
    const detail1 = document.getElementById('insight-detail-1');
    const rateEl  = document.getElementById('recovery-rate');
    const infoEl  = document.getElementById('debtors-info');
    const card    = document.getElementById('debtors-card');

    if (avanceBalance >= 0) {
        if (title1) title1.textContent  = 'Excédent sur Avances';
        if (detail1) detail1.textContent = `La valeur vanille couvre les avances de ${formatCurrency(avanceBalance)}.`;
        if (icon1) { icon1.innerHTML = '<span class="material-icons">trending_up</span>'; icon1.style.backgroundColor = 'var(--md-sys-color-success)'; }
    } else {
        if (title1) title1.textContent  = 'Déficit sur Avances';
        if (detail1) detail1.textContent = `Il manque ${formatCurrency(Math.abs(avanceBalance))} pour couvrir les avances.`;
        if (icon1) { icon1.innerHTML = '<span class="material-icons">trending_down</span>'; icon1.style.backgroundColor = 'var(--md-sys-color-error)'; }
    }

    if (rateEl) rateEl.textContent = `${recoveryRateValue.toFixed(1)}% des coûts sont couverts par la valeur vanille.`;

    const debtorsCount = calculateDebtorsCount();
    if (card) { card.onclick = null; card.classList.remove('clickable'); }

    if (debtorsCount === 0) {
        if (infoEl) infoEl.textContent = 'Aucun collecteur n\'a de dette en cours.';
    } else {
        if (infoEl) infoEl.textContent = `${debtorsCount} collecteur${debtorsCount > 1 ? 's' : ''} ont des dettes. Cliquez pour voir.`;
        if (card) {
            card.classList.add('clickable');
            card.onclick = () => { sessionStorage.setItem('analysis_filter','debiteur'); navigateToSection('analysis'); };
        }
    }
}

function calculateDebtorsCount() {
    return (appData.collectors || []).filter(c => calculateCollectorBalance(c.id) < 0).length;
}

function updateProgressBars(b, totalWeight) {
    const totalOut = b.totalAdvances + b.totalExpenses;
    _setWidth('advances-progress', 100);
    _setWidth('expenses-progress', 100);
    _setWidth('vanilla-progress',  totalWeight > 0 ? 100 : 0);
    _setWidth('value-progress',    totalOut > 0 ? Math.min(100, (b.totalVanillaValue / totalOut) * 100) : 0);
    _setWidth('solde-progress',    b.isPositive ? 100 : (totalOut > 0 ? Math.min(100, (b.totalVanillaValue / totalOut) * 100) : 0));
}

function updateRentabiliteInsights() {
    const receptionsYear = getReceptionsForCurrentYear();
    const BONNES         = ['Lava', 'Fendue'];

    let poidsBon = 0, valeurBon = 0, poidsMauvais = 0, valeurMauvais = 0;
    receptionsYear.forEach(r => {
        if (BONNES.includes(r.quality)) { poidsBon += r.netWeight; valeurBon += r.totalValue; }
        else { poidsMauvais += r.netWeight; valeurMauvais += r.totalValue; }
    });

    const totalPoids = poidsBon + poidsMauvais;

    const vrEl = document.getElementById('valeur-recuperable-detail');
    const pqEl = document.getElementById('perte-qualite-detail');
    const roEl = document.getElementById('rendement-op-detail');

    if (vrEl) vrEl.textContent = totalPoids > 0 ? `${poidsBon.toFixed(2)} kg (${formatCurrency(valeurBon)})` : 'Aucune réception';
    if (pqEl) pqEl.textContent = poidsMauvais > 0 ? `${poidsMauvais.toFixed(2)} kg (${formatCurrency(valeurMauvais)}) — qualité inférieure` : 'Aucune perte détectée';

    const totalCout = (getAdvancesForCurrentYear().reduce((s,a)=>s+a.amount,0)) + (getExpensesForCurrentYear().reduce((s,e)=>s+e.amount,0));
    const totalVal  = valeurBon + valeurMauvais;
    const taux      = totalCout > 0 ? ((totalVal / totalCout) * 100).toFixed(1) : 0;
    if (roEl) roEl.textContent = `${taux}% (Valeur vanille / Coûts totaux)`;
}

// ── Charts ────────────────────────────────────────────────────
function updateCharts() {
    if (typeof Chart === 'undefined') return;

    const style       = getComputedStyle(document.body);
    const primary     = style.getPropertyValue('--md-sys-color-primary').trim();
    const error       = style.getPropertyValue('--md-sys-color-error').trim();
    const surface     = style.getPropertyValue('--md-sys-color-surface').trim();
    const onSurface   = style.getPropertyValue('--md-sys-color-on-surface').trim();
    const outlineVar  = style.getPropertyValue('--md-sys-color-outline-variant').trim();
    const isDark      = document.body.dataset.theme === 'dark';
    const textColor   = isDark ? '#e6e1e5' : '#1a1c1e';
    const chartColors = [primary,'#7d5260','#FFC107','#4CAF50','#2196F3','#FF5722','#9C27B0','#607D8B'];

    Chart.defaults.color       = onSurface;
    Chart.defaults.borderColor = outlineVar;

    // Pie Chart
    const pieCtx = document.getElementById('pieChart');
    if (pieCtx) {
        if (pieChartInstance) pieChartInstance.destroy();
        const totalAdv = calculationCache.totals?.advances || 0;
        const totalRec = calculationCache.totals?.receptions || 0;
        pieChartInstance = new Chart(pieCtx.getContext('2d'), {
            type: 'doughnut',
            data: { labels: ['Total Avances','Valeur Vanille'], datasets: [{ data:[totalAdv,totalRec], backgroundColor:[error,primary], borderColor:surface, borderWidth:2 }] },
            options: { responsive:true, animation:false, plugins:{ legend:{ position:'top', labels:{ color:textColor } } } }
        });
    }

    // Bar Chart (Avances by collector)
    const barCtx = document.getElementById('barChart');
    if (barCtx) {
        if (barChartInstance) barChartInstance.destroy();
        const byCol = {};
        getAdvancesForCurrentYear().forEach(a => {
            const c = appData.collectors.find(co => co.id === a.collectorId);
            if (c) byCol[c.name] = (byCol[c.name] || 0) + a.amount;
        });
        barChartInstance = new Chart(barCtx.getContext('2d'), {
            type: 'bar',
            data: { labels: Object.keys(byCol), datasets: [{ label:'Total des Avances', data: Object.values(byCol), backgroundColor: chartColors, borderWidth:0 }] },
            options: {
                indexAxis:'y', responsive:true, maintainAspectRatio:false, animation:false,
                scales: {
                    y: { grid:{display:false}, ticks:{font:{size:11},color:textColor} },
                    x: { beginAtZero:true, ticks:{ font:{size:10}, color:textColor, callback: v => v>=1e6?v/1e6+'M':v>=1000?v/1000+'k':v } }
                },
                plugins: { legend:{display:false}, tooltip:{ callbacks:{ label: ctx => 'Total: '+ctx.parsed.x.toLocaleString('fr-MG')+' Ar' } } }
            }
        });
    }

    // Quality Chart (Weight by quality) — clickable, opens detail modal
    const qualCtx = document.getElementById('qualityChart');
    if (qualCtx) {
        if (qualityChartInstance) qualityChartInstance.destroy();

        const byQual = {};
        getReceptionsForCurrentYear().forEach(r => { byQual[r.quality] = (byQual[r.quality]||0) + r.netWeight; });

        qualityChartInstance = new Chart(qualCtx.getContext('2d'), {
            type: 'bar',
            data: { labels: Object.keys(byQual), datasets: [{ label:'Poids Net (kg)', data: Object.values(byQual), backgroundColor:[...chartColors].reverse(), borderWidth:0, borderRadius:4 }] },
            options: {
                responsive:true, animation:false,
                scales: { y:{beginAtZero:true,ticks:{color:textColor}}, x:{grid:{display:false},ticks:{color:textColor}} },
                plugins:{ legend:{display:false} }
            }
        });

        // Make the chart container visually clickable
        const qualContainer = qualCtx.closest('.chart-container') || qualCtx.parentElement;
        if (qualContainer) {
            qualContainer.style.cursor = 'pointer';
            qualContainer.title = 'Cliquer pour voir les détails';

            // Add a hint badge if not already present
            if (!qualContainer.querySelector('.chart-detail-hint')) {
                const hint = document.createElement('span');
                hint.className = 'chart-detail-hint';
                hint.innerHTML = '<span class="material-icons" style="font-size:14px;vertical-align:middle;">open_in_full</span> Détails';
                hint.style.cssText = `
                    position:absolute; top:8px; right:8px;
                    background:var(--md-sys-color-primary);
                    color:var(--md-sys-color-on-primary);
                    font-size:11px; padding:2px 8px; border-radius:12px;
                    display:flex; align-items:center; gap:3px; cursor:pointer;
                    opacity:0.85;
                `;
                if (getComputedStyle(qualContainer).position === 'static') {
                    qualContainer.style.position = 'relative';
                }
                qualContainer.appendChild(hint);
            }

            // Click on canvas opens modal
            qualCtx.onclick = () => openQualityDetailModal();
            qualContainer.onclick = (e) => {
                // Avoid double trigger if click is directly on canvas
                if (e.target !== qualCtx) openQualityDetailModal();
            };
        }
    }
}

// ── Quality Detail Modal ──────────────────────────────────────

/**
 * Build quality data from current year receptions.
 * Returns array sorted by totalWeight desc.
 */
function _buildQualityData() {
    const receptionsYear = getReceptionsForCurrentYear();
    const map = {};

    receptionsYear.forEach(r => {
        if (!map[r.quality]) map[r.quality] = { quality: r.quality, totalWeight: 0, totalValue: 0, count: 0 };
        map[r.quality].totalWeight += r.netWeight;
        map[r.quality].totalValue  += r.totalValue || 0;
        map[r.quality].count       += 1;
    });

    const rows = Object.values(map);
    const grandTotal = rows.reduce((s, row) => s + row.totalWeight, 0);
    rows.forEach(row => { row.pct = grandTotal > 0 ? (row.totalWeight / grandTotal * 100) : 0; });
    rows.sort((a, b) => b.totalWeight - a.totalWeight);
    return { rows, grandTotal };
}

/**
 * Injects the modal HTML into the DOM (once) and returns the modal element.
 */
function _ensureQualityModal() {
    const MODAL_ID = 'quality-detail-modal';
    let modal = document.getElementById(MODAL_ID);
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = MODAL_ID;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'qdm-title');
    modal.style.cssText = `
        display:none; position:fixed; inset:0; z-index:1200;
        align-items:center; justify-content:center;
        background:rgba(0,0,0,0.52); backdrop-filter:blur(4px);
        padding:16px;
    `;

    modal.innerHTML = `
        <div id="qdm-inner" style="
            background:var(--md-sys-color-surface);
            color:var(--md-sys-color-on-surface);
            border-radius:16px;
            width:100%; max-width:760px;
            max-height:90vh;
            overflow:hidden;
            display:flex; flex-direction:column;
            box-shadow:0 8px 40px rgba(0,0,0,0.28);
        ">
            <!-- Header -->
            <div style="
                display:flex; align-items:center; justify-content:space-between;
                padding:20px 24px 16px;
                border-bottom:1px solid var(--md-sys-color-outline-variant);
                flex-shrink:0;
            ">
                <div style="display:flex;align-items:center;gap:10px;">
                    <span class="material-icons" style="color:var(--md-sys-color-primary);font-size:22px;">bar_chart</span>
                    <h2 id="qdm-title" style="margin:0;font-size:1.1rem;font-weight:600;">
                        Détails des Poids par Qualité
                    </h2>
                    <span id="qdm-year-badge" style="
                        background:var(--md-sys-color-secondary-container,#e8def8);
                        color:var(--md-sys-color-on-secondary-container,#1d192b);
                        font-size:11px; font-weight:600;
                        padding:2px 10px; border-radius:10px;
                    "></span>
                </div>
                <button id="qdm-close" aria-label="Fermer" style="
                    background:none; border:none; cursor:pointer;
                    color:var(--md-sys-color-on-surface-variant);
                    border-radius:50%; width:36px; height:36px;
                    display:flex; align-items:center; justify-content:center;
                    transition:background .15s;
                " onmouseover="this.style.background='var(--md-sys-color-surface-variant)'"
                   onmouseout="this.style.background='none'">
                    <span class="material-icons" style="font-size:20px;">close</span>
                </button>
            </div>

            <!-- Scrollable body -->
            <div style="overflow-y:auto; flex:1; padding:20px 24px;">

                <!-- Summary chips -->
                <div id="qdm-chips" style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:20px;"></div>

                <!-- Horizontal bar chart (distribution) -->
                <div style="margin-bottom:24px;">
                    <p style="font-size:.8rem;font-weight:600;text-transform:uppercase;letter-spacing:.06em;
                               color:var(--md-sys-color-on-surface-variant);margin:0 0 12px;">
                        Distribution des poids
                    </p>
                    <div id="qdm-bars" style="display:flex;flex-direction:column;gap:8px;"></div>
                </div>

                <!-- Detailed table -->
                <div>
                    <p style="font-size:.8rem;font-weight:600;text-transform:uppercase;letter-spacing:.06em;
                               color:var(--md-sys-color-on-surface-variant);margin:0 0 10px;">
                        Données complètes
                    </p>
                    <div style="overflow-x:auto;border-radius:10px;border:1px solid var(--md-sys-color-outline-variant);">
                        <table id="qdm-table" style="
                            width:100%; border-collapse:collapse;
                            font-size:.875rem;
                        ">
                            <thead>
                                <tr style="background:var(--md-sys-color-surface-variant,#e7e0ec);">
                                    <th style="padding:10px 14px;text-align:left;font-weight:600;color:var(--md-sys-color-on-surface-variant);">Qualité</th>
                                    <th style="padding:10px 14px;text-align:right;font-weight:600;color:var(--md-sys-color-on-surface-variant);">Poids total</th>
                                    <th style="padding:10px 14px;text-align:right;font-weight:600;color:var(--md-sys-color-on-surface-variant);">Pourcentage</th>
                                    <th style="padding:10px 14px;text-align:right;font-weight:600;color:var(--md-sys-color-on-surface-variant);">Réceptions</th>
                                </tr>
                            </thead>
                            <tbody id="qdm-tbody"></tbody>
                            <tfoot id="qdm-tfoot" style="border-top:2px solid var(--md-sys-color-outline-variant);"></tfoot>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Close handlers
    document.getElementById('qdm-close').addEventListener('click', closeQualityDetailModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeQualityDetailModal(); });
    document.addEventListener('keydown', _qdmKeyHandler);

    return modal;
}

function _qdmKeyHandler(e) {
    if (e.key === 'Escape') closeQualityDetailModal();
}

/** Opens and populates the quality detail modal */
function openQualityDetailModal() {
    const modal = _ensureQualityModal();
    const { rows, grandTotal } = _buildQualityData();

    // Year badge
    const badge = document.getElementById('qdm-year-badge');
    if (badge) badge.textContent = `Année ${currentYear}`;

    // Palette
    const style    = getComputedStyle(document.body);
    const primary  = style.getPropertyValue('--md-sys-color-primary').trim() || '#6750A4';
    const PALETTE  = [primary,'#7d5260','#FFC107','#4CAF50','#2196F3','#FF5722','#9C27B0','#607D8B',
                      '#00BCD4','#8BC34A','#FF9800','#E91E63','#009688','#795548'];

    // ── Summary chips ──────────────────────────────────────────
    const chipsEl = document.getElementById('qdm-chips');
    if (chipsEl) {
        chipsEl.innerHTML = '';

        const makeChip = (label, value, color) => {
            const chip = document.createElement('div');
            chip.style.cssText = `
                background:var(--md-sys-color-surface-variant,#e7e0ec);
                border-radius:10px; padding:8px 14px;
                display:flex; flex-direction:column; gap:1px; min-width:110px;
            `;
            chip.innerHTML = `
                <span style="font-size:.7rem;color:var(--md-sys-color-on-surface-variant);font-weight:500;">${label}</span>
                <span style="font-size:1rem;font-weight:700;color:${color || 'var(--md-sys-color-on-surface)'};">${value}</span>
            `;
            return chip;
        };

        chipsEl.appendChild(makeChip('Total poids', grandTotal.toFixed(2) + ' kg', primary));
        chipsEl.appendChild(makeChip('Qualités', rows.length + ' types'));
        chipsEl.appendChild(makeChip('Réceptions', rows.reduce((s,r)=>s+r.count,0) + ' entrées'));
        if (rows.length > 0) {
            chipsEl.appendChild(makeChip('1ère qualité', rows[0].quality, PALETTE[0]));
        }
    }

    // ── Horizontal bars (distribution) ────────────────────────
    const barsEl = document.getElementById('qdm-bars');
    if (barsEl) {
        barsEl.innerHTML = '';

        if (rows.length === 0) {
            barsEl.innerHTML = '<p style="color:var(--md-sys-color-on-surface-variant);font-size:.875rem;">Aucune réception pour cette année.</p>';
        } else {
            const maxPct = rows[0].pct; // already sorted desc

            rows.forEach((row, i) => {
                const color = PALETTE[i % PALETTE.length];
                const barWidth = maxPct > 0 ? (row.pct / maxPct * 100) : 0;

                const rowEl = document.createElement('div');
                rowEl.style.cssText = 'display:flex;align-items:center;gap:10px;';
                rowEl.innerHTML = `
                    <div style="width:90px;font-size:.8rem;font-weight:500;
                                white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
                                text-align:right;flex-shrink:0;" title="${row.quality}">
                        ${row.quality}
                    </div>
                    <div style="flex:1;background:var(--md-sys-color-outline-variant,#cac4d0);
                                border-radius:6px;height:22px;overflow:hidden;">
                        <div style="
                            width:${barWidth}%;
                            height:100%;
                            background:${color};
                            border-radius:6px;
                            display:flex;align-items:center;
                            padding-left:8px;
                            min-width:32px;
                            transition:width .4s ease;
                            box-sizing:border-box;
                        ">
                            <span style="font-size:.72rem;font-weight:600;color:#fff;white-space:nowrap;
                                         text-shadow:0 1px 2px rgba(0,0,0,.3);">
                                ${row.pct.toFixed(1)}%
                            </span>
                        </div>
                    </div>
                    <div style="width:80px;font-size:.8rem;text-align:right;flex-shrink:0;
                                color:var(--md-sys-color-on-surface-variant);">
                        ${row.totalWeight.toFixed(2)} kg
                    </div>
                `;
                barsEl.appendChild(rowEl);
            });
        }
    }

    // ── Table ─────────────────────────────────────────────────
    const tbody = document.getElementById('qdm-tbody');
    const tfoot = document.getElementById('qdm-tfoot');

    if (tbody) {
        tbody.innerHTML = '';
        if (rows.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="padding:16px;text-align:center;
                color:var(--md-sys-color-on-surface-variant);">Aucune donnée disponible.</td></tr>`;
        } else {
            rows.forEach((row, i) => {
                const color = PALETTE[i % PALETTE.length];
                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid var(--md-sys-color-outline-variant)';
                tr.onmouseover = () => tr.style.background = 'var(--md-sys-color-surface-variant,#e7e0ec)';
                tr.onmouseout  = () => tr.style.background = '';
                tr.innerHTML = `
                    <td style="padding:10px 14px;">
                        <div style="display:flex;align-items:center;gap:8px;">
                            <span style="display:inline-block;width:10px;height:10px;
                                         border-radius:50%;background:${color};flex-shrink:0;"></span>
                            <span style="font-weight:500;">${row.quality}</span>
                        </div>
                    </td>
                    <td style="padding:10px 14px;text-align:right;font-variant-numeric:tabular-nums;">
                        ${row.totalWeight.toFixed(2)} kg
                    </td>
                    <td style="padding:10px 14px;min-width:140px;">
                        <div style="display:flex;align-items:center;gap:8px;">
                            <div style="
                                flex:1;
                                height:8px;
                                background:var(--md-sys-color-outline-variant,#cac4d0);
                                border-radius:99px;
                                overflow:hidden;
                            ">
                                <div style="
                                    width:${row.pct.toFixed(1)}%;
                                    height:100%;
                                    background:${color};
                                    border-radius:99px;
                                    transition:width .5s cubic-bezier(.4,0,.2,1);
                                "></div>
                            </div>
                            <span style="
                                width:38px;
                                text-align:right;
                                font-size:.8rem;
                                font-weight:600;
                                color:${color};
                                flex-shrink:0;
                            ">${row.pct.toFixed(1)}%</span>
                        </div>
                    </td>
                    <td style="padding:10px 14px;text-align:right;
                               color:var(--md-sys-color-on-surface-variant);">
                        ${row.count}
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    }

    if (tfoot) {
        tfoot.innerHTML = `
            <tr style="font-weight:700;">
                <td style="padding:10px 14px;">Total</td>
                <td style="padding:10px 14px;text-align:right;font-variant-numeric:tabular-nums;">
                    ${grandTotal.toFixed(2)} kg
                </td>
                <td style="padding:10px 14px;text-align:right;">100%</td>
                <td style="padding:10px 14px;text-align:right;color:var(--md-sys-color-on-surface-variant);">
                    ${rows.reduce((s,r)=>s+r.count,0)}
                </td>
            </tr>
        `;
    }

    // Show modal
    modal.style.display = 'flex';
    // Animate inner
    const inner = document.getElementById('qdm-inner');
    if (inner) {
        inner.style.opacity = '0';
        inner.style.transform = 'scale(0.96)';
        inner.style.transition = 'opacity .2s ease, transform .2s ease';
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                inner.style.opacity = '1';
                inner.style.transform = 'scale(1)';
            });
        });
    }
    document.body.style.overflow = 'hidden';
}

/** Closes the quality detail modal */
function closeQualityDetailModal() {
    const modal = document.getElementById('quality-detail-modal');
    if (!modal) return;
    const inner = document.getElementById('qdm-inner');
    if (inner) {
        inner.style.opacity = '0';
        inner.style.transform = 'scale(0.96)';
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }, 200);
    } else {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

// ── Helpers ───────────────────────────────────────────────────
function _setEl(id, val) { const el=document.getElementById(id); if(el) el.textContent=val; }
function _setWidth(id, pct) { const el=document.getElementById(id); if(el) el.style.width=pct+'%'; }
