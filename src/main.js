/* ============================================================
 * MAIN.JS — Application Entry Point & DOMContentLoaded
 * RISEVANILLA - Gestion de Collecte de Vanille
 * ============================================================ */

'use strict';

document.addEventListener('DOMContentLoaded', function() {

    // ── Core Init ─────────────────────────────────────────────
    initDB();
    loadSettings();
    initYearDisplay();
    loadThemePreference();

    // ── Palette de couleurs ───────────────────────────────────
    loadPalettePreference();   // applique la palette sauvegardée
    renderPaletteSelector();   // génère le sélecteur dans #settings

    // ── Sidebar & Navigation ──────────────────────────────────
    initSidebar();
    initGlobalSearch();                        // barre de recherche + highlight
    document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);

    // ── Forms ─────────────────────────────────────────────────
    setupFormHandlers();
    setCurrentDate();
    setupReceptionCalculations();
    setupDeliveryCalculations();

    // ── Validation ────────────────────────────────────────────
    validateCollectorNameLive();
    validateCollectorCINLive();

    // ── Advance amount live-format ────────────────────────────
    const amountInput = document.getElementById('advance-amount');
    if (amountInput) {
        amountInput.addEventListener('input', function(e) {
            let raw = e.target.value.replace(/\D/g, '');
            if (!raw) { e.target.value = ''; return; }
            e.target.value = Number(raw).toLocaleString('fr-MG');
        });
    }

    // ── Theme select change ───────────────────────────────────
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
        themeSelect.addEventListener('change', function() {
            setTheme(this.value);
            setTimeout(updateCharts, 50);
        });
    }

    // ── Settings rendement-rate ───────────────────────────────
    const rendEl = document.getElementById('rendement-rate');
    if (rendEl) {
        rendEl.addEventListener('change', () => {
            updatePrixRevientAnalysis();
        });
    }

    // ── Advance filter selects ────────────────────────────────
    const advFilterCollector = document.getElementById('advance-filter-collector');
    if (advFilterCollector) {
        advFilterCollector.addEventListener('change', updateAdvancesTable);
    }

    // ── Online/Offline indicators ─────────────────────────────
    window.addEventListener('online',  () => showToast('Connecté à Internet', 'success', 2000));
    window.addEventListener('offline', () => showToast('📵 Mode Hors-ligne — données enregistrées localement', 'info', 3000));

    console.log('✅ RISEVANILLA Application initialisée.');
});
