/* ============================================================
 * ROUTER.JS — Navigation, Sidebar, Theme
 * BEHAVANA - Gestion de Collecte de Vanille
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
    if (title) title.textContent = SECTION_TITLES[sectionName] || 'BEHAVANA';

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

function initGlobalSearch() {
    const input = document.getElementById('global-search-input');
    if (!input) return;

    // Marquer le wrapper pour BehavanaSearch
    const wrapper = input.closest('.global-search-wrapper');
    if (wrapper) wrapper.setAttribute('data-search-wrapper', '');

    BehavanaSearch.attachSearchInput(input, {
        debounce: 300,
        onSearch: (query) => searchInAllData(query),
        onClear:  ()      => searchInAllData(''),
    });
}

function searchInAllData(query) {
    const sections = ['collectors','advances','reception','remboursements','paiements','expenses','delivery','analysis'];
    sections.forEach(sectionId => {
        const tbody = document.getElementById(sectionId)?.querySelector('tbody');
        if (!tbody) return;

        tbody.querySelectorAll('tr').forEach(row => {
            if (row.querySelector('.empty-state')) { row.style.display = ''; return; }

            const isMatch = !query || BehavanaSearch.normalize(row.textContent).includes(BehavanaSearch.normalize(query));
            row.style.display = isMatch ? '' : 'none';

            // Highlight dans les cellules textuelles
            if (query) {
                row.querySelectorAll('td').forEach(td => {
                    const orig = td.dataset.origText ?? td.textContent;
                    td.dataset.origText = orig;
                    td.innerHTML = BehavanaSearch.highlightText(orig, query);
                });
            } else {
                row.querySelectorAll('td[data-orig-text]').forEach(td => {
                    td.innerHTML = BehavanaSearch.escapeHtml(td.dataset.origText);
                    delete td.dataset.origText;
                });
            }
        });
    });
}

// Conservé pour compatibilité — appelé depuis index.html oninput
function debouncedGlobalSearch() {}
function clearSearch() {
    const input = document.getElementById('global-search-input');
    if (input) { input.value = ''; searchInAllData(''); }
}

// clearDateFilter / setDateFilter / filterAdvancesByDate → src/pages/advances.js

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

// ── Pagination ───────────────────────────────────────────────
const paginationState = {};

function getPaginatedData(dataArray, tableName) {
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
