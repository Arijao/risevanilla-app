/* ============================================================
 * KEYBOARD.JS — Gestionnaire central des raccourcis clavier
 * RISEVANILLA - Gestion de Collecte de Vanille
 *
 * Raccourcis disponibles :
 *   Ctrl+K       → Focus recherche globale
 *   ?            → Afficher l'aide des raccourcis
 *   Escape       → Fermer le modal actif
 *   Alt+1..8     → Naviguer vers une section
 *   Alt+N        → Nouveau (modal ajouter selon section active)
 *   Alt+R        → Rapport Comptes (section analysis)
 *   Alt+P        → Rapport Poids   (section analysis)
 *   Alt+E        → Export Excel    (section active)
 *   Alt+T        → Basculer thème  dark / light
 * ============================================================ */

'use strict';

(function () {

    // ── Map section : Alt+1..8 ────────────────────────────────
    const SECTION_KEYS = {
        '1': 'dashboard',
        '2': 'collectors',
        '3': 'advances',
        '4': 'reception',
        '5': 'delivery',
        '6': 'expenses',
        '7': 'analysis',
        '8': 'settings',
    };

    // ── Map section → fonction d'ouverture du modal "Ajouter" ─
    const ADD_MODAL_MAP = {
        collectors:  () => typeof openCollectorModal === 'function' && openCollectorModal(),
        advances:    () => typeof openAdvanceModal   === 'function' && openAdvanceModal(),
        reception:   () => typeof openReceptionModal === 'function' && openReceptionModal(),
        delivery:    () => typeof openDeliveryModal  === 'function' && openDeliveryModal(),
        expenses:    () => typeof openExpenseModal   === 'function' && openExpenseModal(),
    };

    // ── Helpers ───────────────────────────────────────────────

    /** Retourne l'id de la section actuellement active */
    function _activeSection() {
        return document.querySelector('.content-section.active')?.id || '';
    }

    /** Retourne true si un champ de saisie est focusé */
    function _inputFocused() {
        const tag = document.activeElement?.tagName?.toLowerCase();
        return tag === 'input' || tag === 'textarea' || tag === 'select'
            || document.activeElement?.isContentEditable;
    }

    /** Retourne true si un modal est actuellement visible */
    function _modalOpen() {
        // Modals gérés par modal.js (display flex/block) ou le modal dashboard QDM
        return !![...document.querySelectorAll('.modal')].some(m => {
            const s = getComputedStyle(m).display;
            return s !== 'none';
        });
    }

    /** Ferme le modal le plus récemment ouvert */
    function _closeActiveModal() {
        // Modal dashboard (qdm) — géré indépendamment
        const qdm = document.getElementById('quality-detail-modal');
        if (qdm && getComputedStyle(qdm).display !== 'none') {
            if (typeof closeQualityDetailModal === 'function') closeQualityDetailModal();
            return;
        }
        // Modals standards (modal.js)
        const visible = [...document.querySelectorAll('.modal')]
            .find(m => getComputedStyle(m).display !== 'none');
        if (visible && typeof closeModal === 'function') {
            closeModal(visible.id);
        }
    }

    /** Affiche un toast de feedback bref */
    function _feedback(label) {
        if (typeof showToast === 'function') {
            showToast(`⌨️ ${label}`, 'info', 1200);
        }
    }

    // ── Handler principal ─────────────────────────────────────

    function _onKeyDown(e) {
        const key     = e.key;
        const ctrlCmd = e.ctrlKey || e.metaKey;
        const alt     = e.altKey;

        // ── Escape : fermer modal (toujours prioritaire) ──────
        if (key === 'Escape') {
            if (_modalOpen()) {
                _closeActiveModal();
                e.preventDefault();
            }
            return;
        }

        // ── Ctrl+K : focus recherche globale ──────────────────
        if (ctrlCmd && key === 'k') {
            e.preventDefault();
            const input = document.getElementById('global-search-input');
            if (input) {
                input.focus();
                input.select();
                _feedback('Recherche');
            }
            return;
        }

        // ── ? : modal aide (hors champ de saisie) ────────────
        if (key === '?' && !_inputFocused() && !alt && !ctrlCmd) {
            e.preventDefault();
            _toggleHelpModal();
            return;
        }

        // ── Alt + touche ──────────────────────────────────────
        if (alt && !ctrlCmd) {

            // Alt+1..8 : navigation sections
            if (SECTION_KEYS[key]) {
                e.preventDefault();
                const section = SECTION_KEYS[key];
                if (typeof navigateToSection === 'function') {
                    navigateToSection(section);
                    _feedback(section.charAt(0).toUpperCase() + section.slice(1));
                }
                return;
            }

            // Alt+N : nouveau / ajouter
            if (key === 'n' || key === 'N') {
                e.preventDefault();
                const section = _activeSection();
                const opener  = ADD_MODAL_MAP[section];
                if (opener) {
                    opener();
                    _feedback('Nouveau');
                }
                return;
            }

            // Alt+R : Rapport Comptes (analysis)
            if (key === 'r' || key === 'R') {
                e.preventDefault();
                if (typeof exportAnalysis === 'function') {
                    exportAnalysis();
                    _feedback('Rapport Comptes');
                }
                return;
            }

            // Alt+P : Rapport Poids (analysis)
            if (key === 'p' || key === 'P') {
                e.preventDefault();
                if (typeof exportPoidsAnalysis === 'function') {
                    exportPoidsAnalysis();
                    _feedback('Rapport Poids');
                }
                return;
            }

            // Alt+E : Export Excel
            if (key === 'e' || key === 'E') {
                e.preventDefault();
                const section = _activeSection();
                // Chaque page expose sa propre fonction d'export Excel
                const exportMap = {
                    analysis:   () => typeof exportAnalysisToExcel    === 'function' && exportAnalysisToExcel(),
                    reception:  () => typeof exportReceptionsToExcel  === 'function' && exportReceptionsToExcel(),
                    advances:   () => typeof exportAdvancesToExcel    === 'function' && exportAdvancesToExcel(),
                    delivery:   () => typeof exportDeliveriesToExcel  === 'function' && exportDeliveriesToExcel(),
                    expenses:   () => typeof exportExpensesToExcel    === 'function' && exportExpensesToExcel(),
                    collectors: () => typeof exportCollectorsToExcel  === 'function' && exportCollectorsToExcel(),
                };
                if (exportMap[section]) {
                    exportMap[section]();
                    _feedback('Export Excel');
                }
                return;
            }

            // Alt+T : toggle thème
            if (key === 't' || key === 'T') {
                e.preventDefault();
                if (typeof toggleTheme === 'function') {
                    toggleTheme();
                    _feedback('Thème');
                }
                return;
            }
        }
    }

    // ── Modal d'aide ──────────────────────────────────────────

    const HELP_MODAL_ID = 'kbd-help-modal';

    const SHORTCUTS = [
        { keys: ['Ctrl', 'K'],   label: 'Recherche globale',         group: 'Global' },
        { keys: ['?'],           label: 'Aide raccourcis clavier',    group: 'Global' },
        { keys: ['Esc'],         label: 'Fermer le modal actif',      group: 'Global' },
        { keys: ['Alt', 'T'],    label: 'Basculer thème dark/light',  group: 'Global' },
        { keys: ['Alt', '1'],    label: 'Tableau de Bord',            group: 'Navigation' },
        { keys: ['Alt', '2'],    label: 'Collecteurs',                group: 'Navigation' },
        { keys: ['Alt', '3'],    label: 'Avances',                    group: 'Navigation' },
        { keys: ['Alt', '4'],    label: 'Réceptions',                 group: 'Navigation' },
        { keys: ['Alt', '5'],    label: 'Livraisons',                 group: 'Navigation' },
        { keys: ['Alt', '6'],    label: 'Dépenses',                   group: 'Navigation' },
        { keys: ['Alt', '7'],    label: 'Suivi & Analyse',            group: 'Navigation' },
        { keys: ['Alt', '8'],    label: 'Paramètres',                 group: 'Navigation' },
        { keys: ['Alt', 'N'],    label: 'Ajouter (section active)',   group: 'Actions' },
        { keys: ['Alt', 'R'],    label: 'Rapport Comptes',            group: 'Actions' },
        { keys: ['Alt', 'P'],    label: 'Rapport Poids',              group: 'Actions' },
        { keys: ['Alt', 'E'],    label: 'Export Excel',               group: 'Actions' },
    ];

    function _renderHelpModal() {
        const existing = document.getElementById(HELP_MODAL_ID);
        if (existing) return existing;

        const groups = [...new Set(SHORTCUTS.map(s => s.group))];

        const groupsHtml = groups.map(group => {
            const rows = SHORTCUTS.filter(s => s.group === group).map(s => `
                <div class="kbd-row">
                    <span class="kbd-label">${s.label}</span>
                    <span class="kbd-keys">
                        ${s.keys.map(k => `<kbd>${k}</kbd>`).join('<span class="kbd-plus">+</span>')}
                    </span>
                </div>`).join('');

            return `
                <div class="kbd-group">
                    <div class="kbd-group-title">${group}</div>
                    ${rows}
                </div>`;
        }).join('');

        const modal = document.createElement('div');
        modal.id        = HELP_MODAL_ID;
        modal.className = 'modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'kbd-help-title');
        modal.innerHTML = `
            <div class="modal-content kbd-modal-content">
                <div class="modal-header">
                    <h3 class="modal-title" id="kbd-help-title">
                        <span class="material-icons">keyboard</span>
                        Raccourcis clavier
                    </h3>
                    <button class="close-btn" id="kbd-help-close" aria-label="Fermer">
                        <span class="material-icons">close</span>
                    </button>
                </div>
                <div class="kbd-body">
                    ${groupsHtml}
                </div>
                <div class="kbd-footer">
                    <span class="material-icons" style="font-size:14px;opacity:.6;">info</span>
                    Appuyez sur <kbd>?</kbd> pour afficher / masquer cette aide
                </div>
            </div>`;

        document.body.appendChild(modal);

        // Fermeture
        modal.querySelector('#kbd-help-close').addEventListener('click', _closeHelpModal);
        modal.addEventListener('click', e => { if (e.target === modal) _closeHelpModal(); });

        return modal;
    }

    function _toggleHelpModal() {
        const modal = _renderHelpModal();
        const isVisible = getComputedStyle(modal).display !== 'none';
        if (isVisible) {
            _closeHelpModal();
        } else {
            if (typeof openModal === 'function') {
                openModal(HELP_MODAL_ID);
            } else {
                modal.style.display = 'flex';
            }
        }
    }

    function _closeHelpModal() {
        const modal = document.getElementById(HELP_MODAL_ID);
        if (!modal) return;
        if (typeof closeModal === 'function') {
            closeModal(HELP_MODAL_ID);
        } else {
            modal.style.display = 'none';
        }
    }

    // ── Bouton FAB "?" (desktop uniquement) ──────────────────

    function _renderHelpFab() {
        if (document.getElementById('kbd-help-fab')) return;
        const fab = document.createElement('button');
        fab.id = 'kbd-help-fab';
        fab.className = 'kbd-help-fab';
        fab.setAttribute('aria-label', 'Raccourcis clavier');
        fab.setAttribute('title', 'Raccourcis clavier (?)');
        fab.innerHTML = '<span class="material-icons">keyboard</span>';
        fab.addEventListener('click', _toggleHelpModal);
        document.body.appendChild(fab);
    }

    // ── Init ──────────────────────────────────────────────────

    function initKeyboardShortcuts() {
        document.addEventListener('keydown', _onKeyDown);
        _renderHelpFab();
        console.log('[KB] Raccourcis clavier initialisés — appuyez sur ? pour l\'aide');
    }

    // Exposer globalement
    window.initKeyboardShortcuts = initKeyboardShortcuts;

})();
