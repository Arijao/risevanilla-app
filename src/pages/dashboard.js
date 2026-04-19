/* ============================================================
 * DASHBOARD.JS — Dashboard stats, charts, insights
 * BEHAVANA - Gestion de Collecte de Vanille
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

    // Quality Chart (Weight by quality)
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
    }
}

// ── Helpers ───────────────────────────────────────────────────
function _setEl(id, val) { const el=document.getElementById(id); if(el) el.textContent=val; }
function _setWidth(id, pct) { const el=document.getElementById(id); if(el) el.style.width=pct+'%'; }
