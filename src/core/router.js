/* ============================================================
 * ROUTER.JS — Navigation, Sidebar, Theme
 * RISEVANILLA - Gestion de Collecte de Vanille
 * ============================================================ */

'use strict';

// ── Section Titles ───────────────────────────────────────────
const SECTION_TITLES = {
    dashboard:       'Tableau de Bord',
    collectors:      'Gestion des Collecteurs',
    advances:        'Gestion des Avances',
    remboursements:  'Historique des Remboursements',
    paiements:       'Historique des Paiements',
    reception:       'Réception',
    delivery:        'Livraison à l\'Exportateur',
    expenses:        'Gestion des Dépenses',
    analysis:        'Suivi & Analyse',
    settings:        'Paramètres'
};

// ── Navigate ─────────────────────────────────────────────────
function navigateToSection(sectionName) {
    // Nav links
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    const activeLink = document.querySelector(`[data-section="${sectionName}"]`);
    if (activeLink) activeLink.classList.add('active');

    // Content sections
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    const activeSection = document.getElementById(sectionName);
    if (activeSection) activeSection.classList.add('active');

    // Page title
    const title = document.getElementById('page-title');
    if (title) title.textContent = SECTION_TITLES[sectionName] || 'RISEVANILLA';

    // Special: analysis filter from session
    if (sectionName === 'analysis') {
        updateAnalysisTable();
        const requestedFilter = sessionStorage.getItem('analysis_filter');
        if (requestedFilter === 'debiteur') {
            setTimeout(() => filterAnalysisForDebtors(), 100);
            sessionStorage.removeItem('analysis_filter');
        }
    }

    // Close sidebar on mobile
    if (window.innerWidth <= 768) closeSidebar();
}

// ── Sidebar ──────────────────────────────────────────────────
function initSidebar() {
    const toggle  = document.getElementById('sidebar-toggle');
    const overlay = document.getElementById('sidebar-overlay');

    if (toggle) {
        toggle.addEventListener('click', e => {
            e.stopPropagation();
            const sidebar     = document.getElementById('sidebar');
            const mainContent = document.querySelector('.main-content');
            const icon        = toggle.querySelector('.material-icons');

            if (window.innerWidth <= 992) {
                sidebar.classList.toggle('mobile-open');
                if (sidebar.classList.contains('mobile-open')) {
                    icon.textContent          = 'close';
                    overlay.style.display     = 'block';
                    document.body.style.overflow = 'hidden';
                } else {
                    icon.textContent          = 'menu';
                    overlay.style.display     = 'none';
                    document.body.style.overflow = '';
                }
            } else {
                sidebar.classList.toggle('collapsed');
                mainContent.classList.toggle('sidebar-collapsed');
                icon.textContent = sidebar.classList.contains('collapsed') ? 'menu' : 'menu_open';
            }
        });
    }

    if (overlay) overlay.addEventListener('click', closeSidebar);

    // Nav link clicks
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            navigateToSection(link.dataset.section);
        });
    });
}

function closeSidebar() {
    const sidebar  = document.getElementById('sidebar');
    const overlay  = document.getElementById('sidebar-overlay');
    const icon     = document.querySelector('#sidebar-toggle .material-icons');
    if (sidebar) sidebar.classList.remove('mobile-open');
    if (overlay) overlay.style.display = 'none';
    document.body.style.overflow = '';
    if (icon) icon.textContent = 'menu';
}

// ── Theme ────────────────────────────────────────────────────
function toggleTheme() {
    const current = document.body.dataset.theme || 'light';
    setTheme(current === 'light' ? 'dark' : 'light');
    setTimeout(updateCharts, 50);
}

function setTheme(theme) {
    document.body.dataset.theme = theme;
    const select = document.getElementById('theme-select');
    if (select) select.value = theme;
    const icon = document.querySelector('#theme-toggle .material-icons');
    if (icon) icon.textContent = theme === 'light' ? 'dark_mode' : 'light_mode';
    localStorage.setItem('theme', theme);
}

function loadThemePreference() {
    setTheme(localStorage.getItem('theme') || 'light');
}

// ── Global Search ────────────────────────────────────────────

// Indique si une recherche est active — utilisé par getPaginatedData()
let _searchActive = false;

function initGlobalSearch() {
    const input = document.getElementById('global-search-input');
    if (!input) return;

    const wrapper = input.closest('.global-search-wrapper');
    if (wrapper) wrapper.setAttribute('data-search-wrapper', '');

    RiseVanillaSearch.attachSearchInput(input, {
        debounce: 300,
        onSearch: (query) => searchInAllData(query),
        onClear:  ()      => searchInAllData(''),
    });
}

function searchInAllData(query) {
    const sections = ['collectors','advances','reception','remboursements',
                      'paiements','expenses','delivery','analysis'];

    if (!query) {
        // Désactiver le mode recherche et revenir à la pagination normale
        _searchActive = false;
        sections.forEach(sid => {
            // Restaurer le texte original des cellules
            const tbody = document.getElementById(sid)?.querySelector('tbody');
            if (tbody) {
                tbody.querySelectorAll('td[data-orig-text]').forEach(td => {
                    td.innerHTML = RiseVanillaSearch.escapeHtml(td.dataset.origText);
                    delete td.dataset.origText;
                });
            }
        });
        // Rerendre toutes les tables avec pagination normale
        _rerenderAllTables();
        return;
    }

    // Activer le mode recherche : désactive la pagination (page 1, tout afficher)
    _searchActive = true;

    // Map section HTML id → nom de table pagination
    const TABLE_MAP = {
        collectors:    'collectors',
        advances:      'advances',
        reception:     'receptions',
        remboursements: null,   // pas de pagination
        paiements:     null,    // pas de pagination
        expenses:      'expenses',
        delivery:      'deliveries',
        analysis:      'analysis',
    };

    // Déterminer la section active pour le rendu contextuel
    const _activeSection = document.querySelector('.content-section.active')?.id;

    sections.forEach(sectionId => {
        const tableName = TABLE_MAP[sectionId];

        // Forcer page 1 pour que rerenderPaginatedTable affiche tout
        if (tableName && paginationState[tableName]) {
            paginationState[tableName].page = 1;
        }

        // Ne rerendre que la table de la section active (évite que updateAnalysisTable()
        // ou d'autres tables inactives déclenchent SearchAnalytics sur le mauvais module)
        if (tableName && sectionId === _activeSection) {
            rerenderPaginatedTable(tableName);
        }

        // Appliquer filtre + highlight sur le tbody résultant
        const tbody = document.getElementById(sectionId)?.querySelector('tbody');
        if (!tbody) return;

        tbody.querySelectorAll('tr').forEach(row => {
            if (row.querySelector('.empty-state')) { row.style.display = ''; return; }

            const isMatch = RiseVanillaSearch.normalize(row.textContent)
                              .includes(RiseVanillaSearch.normalize(query));
            row.style.display = isMatch ? '' : 'none';

            // Highlight dans les cellules textuelles (hors actions-cell)
            row.querySelectorAll('td:not(.actions-cell)').forEach(td => {
                // Cellules DOM riches (avatars) : re-surligner uniquement le <span> interne
                if (td.dataset.noHighlight) {
                    const span = td.querySelector('.collector-avatar-cell > span');
                    if (span) {
                        const orig = span.dataset.origText ?? span.textContent;
                        span.dataset.origText = orig;
                        span.innerHTML = isMatch
                            ? RiseVanillaSearch.highlightText(orig, query)
                            : RiseVanillaSearch.escapeHtml(orig);
                    }
                    return;
                }
                const orig = td.dataset.origText ?? td.textContent;
                td.dataset.origText = orig;
                td.innerHTML = isMatch
                    ? RiseVanillaSearch.highlightText(orig, query)
                    : RiseVanillaSearch.escapeHtml(orig);
            });
        });
    });
}

function _rerenderAllTables() {
    ['collectors','advances','receptions','expenses','deliveries']
        .forEach(t => rerenderPaginatedTable(t));
    // Analysis uniquement si la section analysis est active (évite le conflit SearchAnalytics)
    const activeId = document.querySelector('.content-section.active')?.id;
    if (activeId === 'analysis') rerenderPaginatedTable('analysis');
    // Remboursements et paiements n'ont pas de rerenderPaginatedTable — on les force
    if (typeof updateRemboursementsTable === 'function') updateRemboursementsTable();
    if (typeof updatePaiementsTable      === 'function') updatePaiementsTable();
}

// Conservé pour compatibilité — appelé depuis index.html oninput
function debouncedGlobalSearch() {}
function clearSearch() {
    const input = document.getElementById('global-search-input');
    if (input) { input.value = ''; searchInAllData(''); }
}

// ── PWA Install ──────────────────────────────────────────────
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    const btn = document.getElementById('pwa-install-btn');
    if (btn) btn.style.display = 'block';
});

function installApp() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(() => {
        deferredPrompt = null;
        const btn = document.getElementById('pwa-install-btn');
        if (btn) btn.style.display = 'none';
    });
}

// ── Settings ─────────────────────────────────────────────────
function saveSettings() {
    const rate = document.getElementById('rendement-rate')?.value || 25;
    localStorage.setItem('rendement_rate', rate);
    const theme = document.getElementById('theme-select')?.value || 'light';
    setTheme(theme);
    showToast('Paramètres enregistrés.', 'success');
    updatePrixRevientAnalysis();
}

function loadSettings() {
    const rate = localStorage.getItem('rendement_rate');
    if (rate) { const el = document.getElementById('rendement-rate'); if (el) el.value = rate; }
}

// ── Palette de couleurs ───────────────────────────────────────
/**
 * Catalogue des palettes disponibles.
 * Chaque palette définit uniquement les 4 variables primaires —
 * les couleurs dérivées (container, on-*) sont calculées automatiquement.
 *
 * Structure par palette :
 *   primary        → couleur principale (boutons, accent, sidebar active)
 *   onPrimary      → texte sur couleur primaire  (toujours blanc ou noir)
 *   primaryCont    → container primaire clair     (fond des modals, bandeaux)
 *   onPrimaryCont  → texte dans le container      (titres, labels importants)
 *   secondary      → couleur secondaire
 *   tertiary       → couleur tertiaire / accent
 */
const PALETTES = {
    ocean: {
        label: '🌊 Océan (défaut)',
        light: {
            primary:       '#0061a4',
            onPrimary:     '#ffffff',
            primaryCont:   '#d1e4ff',
            onPrimaryCont: '#001d36',
            secondary:     '#535f70',
            tertiary:      '#6b5778',
        },
        dark: {
            primary:       '#9ecaff',
            onPrimary:     '#003258',
            primaryCont:   '#004a7c',
            onPrimaryCont: '#d1e4ff',
            secondary:     '#b9c8e1',
            tertiary:      '#d4bce1',
        },
    },
    vanille: {
        label: '🌿 Vanille (violet)',
        light: {
            primary:       '#6750a4',
            onPrimary:     '#ffffff',
            primaryCont:   '#eaddff',
            onPrimaryCont: '#21005d',
            secondary:     '#625b71',
            tertiary:      '#7e5260',
        },
        dark: {
            primary:       '#d0bcff',
            onPrimary:     '#381e72',
            primaryCont:   '#4f378b',
            onPrimaryCont: '#eaddff',
            secondary:     '#ccc2dc',
            tertiary:      '#efb8c8',
        },
    },
    foret: {
        label: '🌲 Forêt',
        light: {
            primary:       '#1b6c3e',
            onPrimary:     '#ffffff',
            primaryCont:   '#b7f1cb',
            onPrimaryCont: '#002111',
            secondary:     '#4e6355',
            tertiary:      '#3b6b4b',
        },
        dark: {
            primary:       '#9cd4b1',
            onPrimary:     '#003920',
            primaryCont:   '#005230',
            onPrimaryCont: '#b7f1cb',
            secondary:     '#b2ccbb',
            tertiary:      '#95cfab',
        },
    },
    soleil: {
        label: '☀️ Soleil',
        light: {
            primary:       '#7a5500',
            onPrimary:     '#ffffff',
            primaryCont:   '#ffdea5',
            onPrimaryCont: '#271900',
            secondary:     '#6c5c3e',
            tertiary:      '#4e6c52',
        },
        dark: {
            primary:       '#ffb94c',
            onPrimary:     '#412d00',
            primaryCont:   '#5c4200',
            onPrimaryCont: '#ffdea5',
            secondary:     '#d8c3a0',
            tertiary:      '#a8d1a8',
        },
    },
    grenade: {
        label: '🍎 Grenade',
        light: {
            primary:       '#9b1919',
            onPrimary:     '#ffffff',
            primaryCont:   '#ffdad6',
            onPrimaryCont: '#410001',
            secondary:     '#775652',
            tertiary:      '#705c2e',
        },
        dark: {
            primary:       '#ffb4ab',
            onPrimary:     '#690001',
            primaryCont:   '#930001',
            onPrimaryCont: '#ffdad6',
            secondary:     '#e7bdb8',
            tertiary:      '#dfc27f',
        },
    },
    ardoise: {
        label: '🪨 Ardoise',
        light: {
            primary:       '#2e5e8b',
            onPrimary:     '#ffffff',
            primaryCont:   '#d3e4f7',
            onPrimaryCont: '#001d33',
            secondary:     '#4f6070',
            tertiary:      '#5a5f6e',
        },
        dark: {
            primary:       '#a0c7e8',
            onPrimary:     '#003353',
            primaryCont:   '#1d4976',
            onPrimaryCont: '#d3e4f7',
            secondary:     '#b5c9d9',
            tertiary:      '#c2c6d5',
        },
    },
};

const PALETTE_STORAGE_KEY = 'risevanilla_palette';

/**
 * Applique une palette en injectant un <style> sur :root et [data-theme="dark"].
 * N'écrase aucune variable existante hors des 6 primaires ciblées.
 */
function applyPalette(paletteKey) {
    const palette = PALETTES[paletteKey];
    if (!palette) return;

    const l = palette.light;
    const d = palette.dark;

    const css = `
        :root {
            --md-sys-color-primary:               ${l.primary};
            --md-sys-color-on-primary:            ${l.onPrimary};
            --md-sys-color-primary-container:     ${l.primaryCont};
            --md-sys-color-on-primary-container:  ${l.onPrimaryCont};
            --md-sys-color-secondary:             ${l.secondary};
            --md-sys-color-tertiary:              ${l.tertiary};
            --md-sys-color-surface-tint:          ${l.primary};
            --md-sys-color-inverse-primary:       ${d.primary};
        }
        [data-theme="dark"] {
            --md-sys-color-primary:               ${d.primary};
            --md-sys-color-on-primary:            ${d.onPrimary};
            --md-sys-color-primary-container:     ${d.primaryCont};
            --md-sys-color-on-primary-container:  ${d.onPrimaryCont};
            --md-sys-color-secondary:             ${d.secondary};
            --md-sys-color-tertiary:              ${d.tertiary};
            --md-sys-color-surface-tint:          ${d.primary};
            --md-sys-color-inverse-primary:       ${l.primary};
        }`;

    let tag = document.getElementById('theme-palette-override');
    if (!tag) {
        tag = document.createElement('style');
        tag.id = 'theme-palette-override';
        document.head.appendChild(tag);
    }
    tag.textContent = css;

    // Mettre à jour les puces visuelles dans le sélecteur
    document.querySelectorAll('.palette-option').forEach(btn => {
        btn.classList.toggle('palette-option--active', btn.dataset.palette === paletteKey);
    });

    // Rafraîchir les graphiques après changement de couleur
    if (typeof updateCharts === 'function') setTimeout(updateCharts, 50);
}

/** Persiste le choix et l'applique. */
function setPalette(paletteKey) {
    localStorage.setItem(PALETTE_STORAGE_KEY, paletteKey);
    applyPalette(paletteKey);
}

/** Recharge la palette sauvegardée au démarrage. */
function loadPalettePreference() {
    const saved = localStorage.getItem(PALETTE_STORAGE_KEY) || 'ocean';
    applyPalette(saved);
    // Marquer le bouton actif dans le sélecteur (si déjà rendu)
    document.querySelectorAll('.palette-option').forEach(btn => {
        btn.classList.toggle('palette-option--active', btn.dataset.palette === saved);
    });
}

/** Génère le HTML du sélecteur de palettes (injecté dans #settings). */
function renderPaletteSelector() {
    const container = document.getElementById('palette-selector');
    if (!container) return;

    const saved = localStorage.getItem(PALETTE_STORAGE_KEY) || 'ocean';

    container.innerHTML = Object.entries(PALETTES).map(([key, pal]) => {
        const isActive = key === saved;
        const swatch   = pal.light.primary;
        const swatchC  = pal.light.primaryCont;

        return `
        <button
            class="palette-option${isActive ? ' palette-option--active' : ''}"
            data-palette="${key}"
            onclick="setPalette('${key}')"
            title="${pal.label}"
            style="--pal-primary:${swatch};--pal-container:${swatchC};">
            <span class="palette-option__swatch"></span>
            <span class="palette-option__label">${pal.label}</span>
            <span class="palette-option__check material-icons">check_circle</span>
        </button>`;
    }).join('');
}

// ── Pagination ───────────────────────────────────────────────
const paginationState = {};

function getPaginatedData(dataArray, tableName) {
    // En mode recherche active, retourner tout le dataset sans découpe
    if (_searchActive) return dataArray;
    if (!paginationState[tableName]) paginationState[tableName] = { page: 1, rowsPerPage: 20 };
    const state = paginationState[tableName];
    const start = (state.page - 1) * state.rowsPerPage;
    return dataArray.slice(start, start + state.rowsPerPage);
}

function createPaginationControls(tableName, totalItems) {
    const state = paginationState[tableName] || { page: 1, rowsPerPage: 20 };
    const total = Math.ceil(totalItems / state.rowsPerPage);
    if (total <= 1) return '';

    let html = `<div class="pagination" style="display:flex;justify-content:center;align-items:center;gap:8px;padding:12px;flex-wrap:wrap;">`;
    html += `<button class="btn btn-icon btn-outline" onclick="changePage('${tableName}',1)" ${state.page===1?'disabled':''}><span class="material-icons" style="font-size:16px;">first_page</span></button>`;
    html += `<button class="btn btn-icon btn-outline" onclick="changePage('${tableName}',${state.page-1})" ${state.page===1?'disabled':''}><span class="material-icons" style="font-size:16px;">chevron_left</span></button>`;

    const range = 2;
    for (let i = Math.max(1, state.page-range); i <= Math.min(total, state.page+range); i++) {
        html += `<button class="btn btn-icon ${i===state.page?'btn-primary':'btn-outline'}" onclick="changePage('${tableName}',${i})">${i}</button>`;
    }

    html += `<button class="btn btn-icon btn-outline" onclick="changePage('${tableName}',${state.page+1})" ${state.page>=total?'disabled':''}><span class="material-icons" style="font-size:16px;">chevron_right</span></button>`;
    html += `<button class="btn btn-icon btn-outline" onclick="changePage('${tableName}',${total})" ${state.page>=total?'disabled':''}><span class="material-icons" style="font-size:16px;">last_page</span></button>`;
    html += `<span style="font-size:12px;color:var(--md-sys-color-on-surface-variant)">${state.page}/${total} (${totalItems})</span>`;
    html += `<select class="form-select" style="width:auto;padding:4px 24px 4px 8px;font-size:12px;" onchange="setRowsPerPage('${tableName}',this.value)">
        ${[10,20,50,100].map(v=>`<option value="${v}" ${v===state.rowsPerPage?'selected':''}>${v}/page</option>`).join('')}
    </select>`;
    html += `</div>`;
    return html;
}

function changePage(tableName, newPage) {
    if (!paginationState[tableName]) paginationState[tableName] = { page: 1, rowsPerPage: 20 };
    paginationState[tableName].page = newPage;
    rerenderPaginatedTable(tableName);
}

function setRowsPerPage(tableName, rowsPerPage) {
    if (!paginationState[tableName]) paginationState[tableName] = { page: 1, rowsPerPage: 20 };
    paginationState[tableName].rowsPerPage = parseInt(rowsPerPage);
    paginationState[tableName].page = 1;
    rerenderPaginatedTable(tableName);
}

function rerenderPaginatedTable(tableName) {
    const map = {
        collectors: updateCollectorsTable, advances: updateAdvancesTable,
        receptions: updateReceptionTable,  deliveries: updateDeliveryTable,
        analysis:   updateAnalysisTable,   expenses: updateExpensesTable
    };
    if (map[tableName]) map[tableName]();
}
