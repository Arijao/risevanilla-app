/* ============================================================
 * NUMPAD.JS — Pavé Numérique Virtuel Réutilisable
 * RISEVANILLA - Gestion de Collecte de Vanille
 *
 * Usage :
 *   Ajouter data-numpad="numeric"  → entiers purs (CIN, sacs, prix)
 *   Ajouter data-numpad="decimal"  → décimaux (poids kg, tare)
 *
 *   Le pavé s'ouvre au focus et se ferme à la validation ou
 *   en cliquant en dehors. Compatible mobile, tablette, desktop.
 * ============================================================ */

'use strict';

(function () {

    // ── État interne ──────────────────────────────────────────
    let _activeInput  = null;   // <input> actuellement ciblé
    let _mode         = 'numeric'; // 'numeric' | 'decimal'
    let _overlay      = null;   // élément DOM du pavé
    let _decimalUsed  = false;  // un séparateur décimal déjà saisi

    // ── Création du DOM du pavé (une seule fois) ──────────────
    function _buildNumpad() {
        if (document.getElementById('rv-numpad')) return;

        const pad = document.createElement('div');
        pad.id        = 'rv-numpad';
        pad.className = 'rv-numpad';
        pad.setAttribute('role', 'dialog');
        pad.setAttribute('aria-label', 'Pavé numérique');

        // Disposition : 3 colonnes × 4 lignes + ligne d'action
        pad.innerHTML = `
            <div class="rv-numpad__display">
                <span class="rv-numpad__display-value" id="rv-numpad-display">0</span>
                <span class="rv-numpad__display-label" id="rv-numpad-label"></span>
            </div>
            <div class="rv-numpad__grid">
                <button class="rv-numpad__key" data-val="7">7</button>
                <button class="rv-numpad__key" data-val="8">8</button>
                <button class="rv-numpad__key" data-val="9">9</button>

                <button class="rv-numpad__key" data-val="4">4</button>
                <button class="rv-numpad__key" data-val="5">5</button>
                <button class="rv-numpad__key" data-val="6">6</button>

                <button class="rv-numpad__key" data-val="1">1</button>
                <button class="rv-numpad__key" data-val="2">2</button>
                <button class="rv-numpad__key" data-val="3">3</button>

                <button class="rv-numpad__key rv-numpad__key--decimal" data-val="." id="rv-numpad-dot">.</button>
                <button class="rv-numpad__key rv-numpad__key--zero" data-val="0">0</button>
                <button class="rv-numpad__key rv-numpad__key--back" data-val="back"
                        aria-label="Effacer">
                    <span class="material-icons" style="font-size:20px;pointer-events:none;">backspace</span>
                </button>
            </div>
            <div class="rv-numpad__actions">
                <button class="rv-numpad__btn-clear" data-val="clear">
                    <span class="material-icons" style="font-size:16px;">close</span>
                    Effacer
                </button>
                <button class="rv-numpad__btn-ok" data-val="ok">
                    <span class="material-icons" style="font-size:16px;">check</span>
                    OK
                </button>
            </div>`;

        document.body.appendChild(pad);
        _overlay = pad;

        // Délégation d'événements sur le pavé
        pad.addEventListener('pointerdown', function (e) {
            e.preventDefault(); // empêcher le blur de l'input
            const btn = e.target.closest('[data-val]');
            if (!btn) return;
            _handleKey(btn.dataset.val);
            _animateKey(btn);
        });
    }

    // ── Injection du CSS (une seule fois) ─────────────────────
    function _injectStyles() {
        if (document.getElementById('rv-numpad-styles')) return;
        const style = document.createElement('style');
        style.id = 'rv-numpad-styles';
        style.textContent = `
/* ── Pavé numérique virtuel RISEVANILLA ── */
.rv-numpad {
    position: fixed;
    z-index: 9999;
    background: var(--md-sys-color-surface, #1c1b1f);
    border: 1px solid var(--md-sys-color-outline-variant, rgba(255,255,255,.12));
    border-radius: 20px;
    box-shadow: 0 8px 32px rgba(0,0,0,.45), 0 2px 8px rgba(0,0,0,.3);
    padding: 12px;
    width: 240px;
    user-select: none;
    touch-action: none;
    display: none;          /* caché par défaut */
    flex-direction: column;
    gap: 8px;
    /* animation */
    opacity: 0;
    transform: translateY(8px) scale(.97);
    transition: opacity .15s ease, transform .15s ease;
}
.rv-numpad.rv-numpad--visible {
    display: flex;
    opacity: 1;
    transform: translateY(0) scale(1);
}

/* Affichage valeur courante */
.rv-numpad__display {
    background: var(--md-sys-color-surface-variant, rgba(255,255,255,.06));
    border-radius: 12px;
    padding: 10px 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 44px;
    border: 1px solid var(--md-sys-color-outline-variant, rgba(255,255,255,.1));
}
.rv-numpad__display-value {
    font-size: 22px;
    font-weight: 700;
    color: var(--md-sys-color-on-surface, #e6e1e5);
    letter-spacing: .5px;
    flex: 1;
    text-align: right;
}
.rv-numpad__display-label {
    font-size: 11px;
    color: var(--md-sys-color-on-surface-variant, rgba(230,225,229,.6));
    margin-left: 8px;
    white-space: nowrap;
}

/* Grille 3×4 */
.rv-numpad__grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
}
.rv-numpad__key {
    background: var(--md-sys-color-surface-variant, rgba(255,255,255,.08));
    border: 1px solid var(--md-sys-color-outline-variant, rgba(255,255,255,.1));
    border-radius: 12px;
    color: var(--md-sys-color-on-surface, #e6e1e5);
    font-size: 20px;
    font-weight: 600;
    height: 52px;
    cursor: pointer;
    transition: background .1s, transform .08s;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: inherit;
    -webkit-tap-highlight-color: transparent;
}
.rv-numpad__key:active,
.rv-numpad__key--pressed {
    background: var(--md-sys-color-primary-container, rgba(103,80,164,.35)) !important;
    transform: scale(.93);
}
.rv-numpad__key--back {
    background: var(--md-sys-color-error-container, rgba(186,26,26,.18));
    color: var(--md-sys-color-error, #ffb4ab);
    border-color: transparent;
}
.rv-numpad__key--decimal {
    font-size: 24px;
    font-weight: 800;
}
.rv-numpad__key--decimal:disabled {
    opacity: .3;
    cursor: not-allowed;
}

/* Ligne d'actions */
.rv-numpad__actions {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 6px;
}
.rv-numpad__btn-clear,
.rv-numpad__btn-ok {
    border-radius: 12px;
    height: 44px;
    font-size: 14px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    cursor: pointer;
    font-family: inherit;
    transition: background .1s, transform .08s;
    -webkit-tap-highlight-color: transparent;
    border: none;
}
.rv-numpad__btn-clear {
    background: var(--md-sys-color-surface-variant, rgba(255,255,255,.08));
    color: var(--md-sys-color-on-surface-variant, rgba(230,225,229,.7));
    border: 1px solid var(--md-sys-color-outline-variant, rgba(255,255,255,.1));
}
.rv-numpad__btn-clear:active { transform: scale(.95); }
.rv-numpad__btn-ok {
    background: var(--md-sys-color-primary, #6750a4);
    color: var(--md-sys-color-on-primary, #fff);
}
.rv-numpad__btn-ok:active { transform: scale(.95); opacity: .88; }

/* Masquer le clavier système sur les champs numpad */
input[data-numpad] {
    caret-color: transparent;   /* cache le curseur clignotant */
}
input[data-numpad]:focus {
    outline: 2px solid var(--md-sys-color-primary, #6750a4);
    outline-offset: 1px;
}
        `;
        document.head.appendChild(style);
    }

    // ── Positionnement du pavé sous/au-dessus du champ ───────
    function _positionNumpad(input) {
        const pad   = _overlay;
        const rect  = input.getBoundingClientRect();
        const vw    = window.innerWidth;
        const vh    = window.innerHeight;
        const pw    = 240;
        const ph    = 280; // hauteur estimée

        let top  = rect.bottom + 8;
        let left = rect.left + rect.width / 2 - pw / 2;

        // Débordement en bas → placer au-dessus
        if (top + ph > vh - 8) top = rect.top - ph - 8;

        // Débordement à droite/gauche
        if (left + pw > vw - 8) left = vw - pw - 8;
        if (left < 8)           left = 8;

        // Garantir dans le viewport
        top = Math.max(8, top);

        pad.style.top  = top  + 'px';
        pad.style.left = left + 'px';
    }

    // ── Ouvrir le pavé ────────────────────────────────────────
    function _open(input) {
        _activeInput = input;
        _mode        = input.dataset.numpad || 'numeric';

        // Label (placeholder ou label associé)
        const labelEl   = document.querySelector(`label[for="${input.id}"]`);
        const labelText = labelEl ? labelEl.textContent.trim() : (input.placeholder || '');
        document.getElementById('rv-numpad-label').textContent = labelText;

        // Touche décimale
        const dotBtn = document.getElementById('rv-numpad-dot');
        if (_mode === 'decimal') {
            dotBtn.disabled      = false;
            dotBtn.style.display = '';
        } else {
            dotBtn.disabled      = true;
            dotBtn.style.display = 'none'; // masquer complètement en mode entier
        }

        // Afficher la valeur actuelle
        _decimalUsed = (input.value || '').includes('.');
        _syncDisplay();
        _positionNumpad(input);

        _overlay.style.display = 'flex';
        // Forcer reflow pour l'animation
        _overlay.offsetHeight;
        _overlay.classList.add('rv-numpad--visible');
    }

    // ── Fermer le pavé ────────────────────────────────────────
    function _close() {
        if (!_overlay) return;
        _overlay.classList.remove('rv-numpad--visible');
        // Attendre la transition avant de masquer
        setTimeout(() => {
            if (_overlay && !_overlay.classList.contains('rv-numpad--visible')) {
                _overlay.style.display = 'none';
            }
        }, 160);
        _activeInput = null;
    }

    // ── Synchroniser l'affichage ──────────────────────────────
    function _syncDisplay() {
        if (!_activeInput) return;
        const val = _activeInput.value || '';
        document.getElementById('rv-numpad-display').textContent = val === '' ? '0' : val;
    }

    // ── Traiter une touche ────────────────────────────────────
    function _handleKey(val) {
        if (!_activeInput) return;

        if (val === 'ok') {
            // Déclencher les calculs liés au champ
            _activeInput.dispatchEvent(new Event('input',  { bubbles: true }));
            _activeInput.dispatchEvent(new Event('change', { bubbles: true }));
            _close();
            return;
        }

        if (val === 'clear') {
            _activeInput.value = '';
            _decimalUsed = false;
            _syncDisplay();
            _activeInput.dispatchEvent(new Event('input', { bubbles: true }));
            return;
        }

        if (val === 'back') {
            const v = _activeInput.value;
            if (!v.length) return;
            const removed = v.slice(-1);
            if (removed === '.') _decimalUsed = false;
            _activeInput.value = v.slice(0, -1);
            _syncDisplay();
            _activeInput.dispatchEvent(new Event('input', { bubbles: true }));
            return;
        }

        if (val === '.') {
            if (_mode !== 'decimal' || _decimalUsed) return;
            _decimalUsed = true;
            _activeInput.value = (_activeInput.value || '0') + '.';
            _syncDisplay();
            return;
        }

        // Chiffre 0-9
        // Contrainte : maxlength
        const max = parseInt(_activeInput.maxLength) || Infinity;
        if (_activeInput.value.replace(/\s/g, '').length >= max &&
            !_activeInput.dataset.numpad === 'decimal') return;

        // Pour le champ CIN : laisser formatCIN gérer via event input
        // Pour les autres champs : append direct
        _activeInput.value = (_activeInput.value === '0' ? '' : _activeInput.value) + val;
        _syncDisplay();
        _activeInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // ── Feedback visuel touche ────────────────────────────────
    function _animateKey(btn) {
        btn.classList.add('rv-numpad__key--pressed');
        setTimeout(() => btn.classList.remove('rv-numpad__key--pressed'), 120);
    }

    // ── Initialisation (appelée depuis main.js) ───────────────
    function initNumpad() {
        _injectStyles();
        _buildNumpad();

        // Ouvrir au focus sur tout champ [data-numpad]
        document.addEventListener('focusin', function (e) {
            const input = e.target;
            if (!input.matches('input[data-numpad]')) return;
            // Empêcher le clavier système
            input.readOnly = true;
            setTimeout(() => { input.readOnly = false; }, 50);
            _open(input);
        });

        // Fermer si focus va ailleurs (hors pavé)
        document.addEventListener('focusin', function (e) {
            if (!_activeInput) return;
            if (e.target === _activeInput) return;
            if (_overlay && _overlay.contains(e.target)) return;
            _close();
        });

        // Fermer si clic en dehors
        document.addEventListener('pointerdown', function (e) {
            if (!_activeInput) return;
            if (_overlay && _overlay.contains(e.target)) return;
            if (e.target === _activeInput) return;
            _close();
        });

        // Repositionner lors du scroll ou resize
        window.addEventListener('resize', function () {
            if (_activeInput) _positionNumpad(_activeInput);
        });
        window.addEventListener('scroll', function () {
            if (_activeInput) _positionNumpad(_activeInput);
        }, true);
    }

    // ── Export global ─────────────────────────────────────────
    window.initNumpad = initNumpad;

})();
