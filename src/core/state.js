/* ============================================================
 * STATE.JS — Global Application State & Year Management
 * BEHAVANA - Gestion de Collecte de Vanille
 * ============================================================ */

'use strict';

// ── Application Data Store ──────────────────────────────────
let appData = {
    collectors:     [],
    advances:       [],
    receptions:     [],
    deliveries:     [],
    qualities:      [],
    expenses:       [],
    remboursements: [],
    paiements:      []
};

// ── Year Management ─────────────────────────────────────────
const ACTIVE_YEAR_STORAGE_KEY = 'behavana_active_year';
let currentYear = new Date().getFullYear();

// ── Calculation Cache ───────────────────────────────────────
let calculationCache = {
    balances:  {},
    totals:    {},
    timestamp: 0,
    isValid:   false
};

// ── Quick Weights (Reception & Delivery) ────────────────────
let quickWeights         = [];
let deliveryQuickWeights = [];

// ── Year Filter Helpers ──────────────────────────────────────
function getYearFromDateString(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return null;
    return d.getFullYear();
}

function isItemInCurrentYear(item) {
    if (!item || !item.date) return false;
    return getYearFromDateString(item.date) === currentYear;
}

function getAdvancesForCurrentYear()       { return (appData.advances       || []).filter(isItemInCurrentYear); }
function getReceptionsForCurrentYear()     { return (appData.receptions     || []).filter(isItemInCurrentYear); }
function getDeliveriesForCurrentYear()     { return (appData.deliveries     || []).filter(isItemInCurrentYear); }
function getExpensesForCurrentYear()       { return (appData.expenses       || []).filter(isItemInCurrentYear); }
function getRemboursementsForCurrentYear() { return (appData.remboursements || []).filter(isItemInCurrentYear); }
function getPaiementsForCurrentYear()      { return (appData.paiements      || []).filter(isItemInCurrentYear); }

// ── Collector Year Filter ────────────────────────────────────
function getCollectorCreationYear(collector) {
    if (!collector.createdAt) return null;
    const d = new Date(collector.createdAt);
    if (Number.isNaN(d.getTime())) return null;
    return d.getFullYear();
}

function isCollectorAvailableInCurrentYear(collector) {
    const creationYear = getCollectorCreationYear(collector);
    if (!creationYear) return true;
    return creationYear <= currentYear;
}

// ── Cache Management ─────────────────────────────────────────
function invalidateCache() {
    calculationCache.isValid   = false;
    calculationCache.timestamp = Date.now();
}

function buildCache() {
    if (calculationCache.isValid && (Date.now() - calculationCache.timestamp < 1000)) return;

    calculationCache.balances = {};
    appData.collectors.forEach(collector => {
        calculationCache.balances[collector.id] = calculateCollectorBalance(collector.id);
    });

    const advYear  = getAdvancesForCurrentYear();
    const expYear  = getExpensesForCurrentYear();
    const recYear  = getReceptionsForCurrentYear();
    const rembYear = getRemboursementsForCurrentYear();

    calculationCache.totals = {
        advances:       advYear.reduce((s, a) => s + a.amount, 0),
        expenses:       expYear.reduce((s, e) => s + e.amount, 0),
        receptions:     recYear.reduce((s, r) => s + r.totalValue, 0),
        weight:         recYear.reduce((s, r) => s + r.netWeight, 0),
        remboursements: rembYear.reduce((s, r) => s + r.amount, 0)
    };

    calculationCache.isValid = true;
}

function getCachedBalance(collectorId) {
    if (!calculationCache.isValid) buildCache();
    return calculationCache.balances[collectorId] || 0;
}

// ── Balance Calculations ─────────────────────────────────────
function calculateCollectorBalance(collectorId) {
    const advances       = getAdvancesForCurrentYear().filter(a => a.collectorId === collectorId);
    const paiements      = getPaiementsForCurrentYear().filter(p => p.collectorId === collectorId);
    const receptions     = getReceptionsForCurrentYear().filter(r => r.collectorId === collectorId);
    const remboursements = getRemboursementsForCurrentYear().filter(r => r.collectorId === collectorId);

    const totalDebits  = advances.reduce((s, a) => s + a.amount, 0)
                       + paiements.reduce((s, p) => s + p.amount, 0);
    const totalCredits = receptions.reduce((s, r) => s + r.totalValue, 0)
                       + remboursements.reduce((s, r) => s + r.amount, 0);

    return totalCredits - totalDebits;
}

function calculateCollectorBalanceGlobal(collectorId) {
    const totalDebits =
        (appData.advances    || []).filter(a => a.collectorId === collectorId).reduce((s, a) => s + a.amount, 0) +
        (appData.paiements   || []).filter(p => p.collectorId === collectorId).reduce((s, p) => s + p.amount, 0);
    const totalCredits =
        (appData.receptions  || []).filter(r => r.collectorId === collectorId).reduce((s, r) => s + r.totalValue, 0) +
        (appData.remboursements || []).filter(r => r.collectorId === collectorId).reduce((s, r) => s + r.amount, 0);
    return totalCredits - totalDebits;
}

function getTotalAdvances(collectorId) {
    return getAdvancesForCurrentYear().filter(a => a.collectorId === collectorId).reduce((s, a) => s + a.amount, 0);
}

function getTotalDeliveries(collectorId) {
    return getReceptionsForCurrentYear().filter(r => r.collectorId === collectorId).reduce((s, r) => s + r.totalValue, 0);
}

function getCollectorStatus(balance) {
    if (balance > 0)  return { class: 'crediteur', label: 'Créditeur' };
    if (balance < 0)  return { class: 'debiteur',  label: 'Débiteur' };
    return                   { class: 'equilibre', label: 'Équilibré' };
}

// ── Utilities ────────────────────────────────────────────────
function formatCurrency(amount) {
    return new Intl.NumberFormat('fr-MG', {
        style:                 'currency',
        currency:              'MGA',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount).replace('MGA', 'Ar');
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('fr-FR');
}

function formatNumber(num) {
    if (typeof num !== 'number' || isNaN(num)) return '-';
    return new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(num);
}

function getCurrentMonth() {
    const months = ['Janvier','Février','Mars','Avril','Mai','Juin',
                    'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
    return months[new Date().getMonth()];
}

function safeRound(value, decimals = 2) {
    if (value === null || value === undefined || isNaN(value)) return 0;
    return parseFloat(parseFloat(value).toFixed(decimals));
}

// ── Year Slider ──────────────────────────────────────────────
let isDragging = false;
let startY     = 0;
let startYearDrag = 0;

function getYearBounds() {
    const now = new Date().getFullYear();
    return { minYear: now - 5, maxYear: now + 2 };
}

function changeYearBy(delta) {
    const { minYear, maxYear } = getYearBounds();
    const nextYear = Math.max(minYear, Math.min(maxYear, currentYear + delta));
    if (nextYear === currentYear) return;
    currentYear = nextYear;
    localStorage.setItem(ACTIVE_YEAR_STORAGE_KEY, currentYear);
    updateSliderPosition(true);
    refreshAllData();
}

function refreshAllData() {
    const el = document.getElementById('overview-month');
    if (el) el.textContent = `Année ${currentYear}`;
    invalidateCache();
    buildCache();
    updateAllTables();
}

function initYearDisplay() {
    const saved = parseInt(localStorage.getItem(ACTIVE_YEAR_STORAGE_KEY), 10);
    const now   = new Date().getFullYear();
    currentYear = (!isNaN(saved) && saved >= 2020 && saved <= now + 5) ? saved : now;

    const el = document.getElementById('overview-month');
    if (el) el.textContent = `Année ${currentYear}`;

    initYearSlider();
}

function initYearSlider() {
    const track      = document.getElementById('yearSliderTrack');
    const thumb      = document.getElementById('yearSliderThumb');
    const mobileRange = document.getElementById('yearMobileRange');
    if (!track || !thumb) return;

    const { minYear, maxYear } = getYearBounds();
    if (mobileRange) {
        mobileRange.min   = minYear;
        mobileRange.max   = maxYear;
        mobileRange.value = currentYear;
        mobileRange.addEventListener('input', e => {
            const yr = parseInt(e.target.value, 10);
            if (yr !== currentYear) { currentYear = yr; localStorage.setItem(ACTIVE_YEAR_STORAGE_KEY, yr); updateSliderPosition(true); refreshAllData(); }
        });
        mobileRange.addEventListener('change', e => {
            const yr = parseInt(e.target.value, 10);
            if (yr !== currentYear) { currentYear = yr; localStorage.setItem(ACTIVE_YEAR_STORAGE_KEY, yr); updateSliderPosition(true); refreshAllData(); }
        });
    }

    track.addEventListener('click', e => {
        if (e.target === thumb || thumb.contains(e.target)) return;
        const rect       = track.getBoundingClientRect();
        const clickY     = e.clientY - rect.top;
        const percentage = 1 - (clickY / rect.height);
        const range      = maxYear - minYear;
        const newYear    = Math.round(minYear + (percentage * range));
        const clamped    = Math.max(minYear, Math.min(maxYear, newYear));
        if (clamped !== currentYear) { currentYear = clamped; localStorage.setItem(ACTIVE_YEAR_STORAGE_KEY, clamped); updateSliderPosition(true); refreshAllData(); }
    });

    track.addEventListener('wheel', e => {
        e.preventDefault();
        const dir     = e.deltaY > 0 ? -1 : 1;
        changeYearBy(dir);
    }, { passive: false });

    function startDrag(e) {
        isDragging     = true;
        startY         = e.clientY;
        startYearDrag  = currentYear;
        thumb.classList.add('dragging');
        track.classList.add('dragging');
    }
    function startDragTouch(e) {
        isDragging     = true;
        startY         = e.touches[0].clientY;
        startYearDrag  = currentYear;
        thumb.classList.add('dragging');
        track.classList.add('dragging');
    }
    function drag(e) {
        if (!isDragging) return;
        const rect         = track.getBoundingClientRect();
        const deltaY       = startY - e.clientY;
        const pixPerYear   = rect.height / (maxYear - minYear);
        const yearDelta    = Math.round(deltaY / pixPerYear);
        const newYear      = Math.max(minYear, Math.min(maxYear, startYearDrag + yearDelta));
        if (newYear !== currentYear) { currentYear = newYear; localStorage.setItem(ACTIVE_YEAR_STORAGE_KEY, newYear); updateSliderPosition(false); }
    }
    function dragTouch(e) {
        if (!isDragging) return;
        const rect         = track.getBoundingClientRect();
        const deltaY       = startY - e.touches[0].clientY;
        const pixPerYear   = rect.height / (maxYear - minYear);
        const yearDelta    = Math.round(deltaY / pixPerYear);
        const newYear      = Math.max(minYear, Math.min(maxYear, startYearDrag + yearDelta));
        if (newYear !== currentYear) { currentYear = newYear; localStorage.setItem(ACTIVE_YEAR_STORAGE_KEY, newYear); updateSliderPosition(false); }
    }
    function stopDrag() {
        if (!isDragging) return;
        isDragging = false;
        thumb.classList.remove('dragging');
        track.classList.remove('dragging');
        refreshAllData();
    }

    thumb.addEventListener('mousedown',  startDrag);
    thumb.addEventListener('touchstart', startDragTouch, { passive: true });
    document.addEventListener('mousemove',  drag);
    document.addEventListener('touchmove',  dragTouch, { passive: true });
    document.addEventListener('mouseup',    stopDrag);
    document.addEventListener('touchend',   stopDrag);

    updateSliderPosition(false);
}

function updateSliderPosition(animate = true) {
    const thumb        = document.getElementById('yearSliderThumb');
    const fill         = document.getElementById('yearSliderFill');
    const display      = document.getElementById('yearDisplay');
    const displayMobile = document.getElementById('yearDisplayMobile');
    const mobileRange  = document.getElementById('yearMobileRange');
    const track        = document.getElementById('yearSliderTrack');
    if (!thumb || !track) return;

    const { minYear, maxYear } = getYearBounds();
    const range      = maxYear - minYear;
    const position   = (currentYear - minYear) / range;
    const thumbPos   = (1 - position) * 100;

    if (!animate) {
        thumb.style.transition = 'none';
        if (fill) fill.style.transition = 'none';
    }

    thumb.style.top = `${thumbPos}%`;
    if (fill) fill.style.height = `${position * 100}%`;
    if (display) {
        display.textContent = currentYear;
        display.classList.add('changing');
        setTimeout(() => display.classList.remove('changing'), 400);
    }
    if (displayMobile) displayMobile.textContent = currentYear;
    if (mobileRange)   mobileRange.value = currentYear;

    thumb.classList.add('changing');
    setTimeout(() => thumb.classList.remove('changing'), 600);

    if (!animate) {
        requestAnimationFrame(() => {
            thumb.style.transition = '';
            if (fill) fill.style.transition = '';
        });
    }
}
