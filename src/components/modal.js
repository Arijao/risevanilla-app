/* ============================================================
 * MODAL.JS — Core Modal Engine + Collector Modal
 * Advance/Delivery/Expense modals → dans leurs pages dédiées
 * RISEVANILLA - Gestion de Collecte de Vanille
 * ============================================================ */

'use strict';

// ── Core Modal Functions ──────────────────────────────────────
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Focus premier champ
    const firstInput = modal.querySelector('input:not([type="hidden"]), select, textarea, button');
    if (firstInput) setTimeout(() => firstInput.focus(), 120);

    // ESC → fermeture
    modal._escHandler = e => { if (e.key === 'Escape') closeModal(modalId); };
    document.addEventListener('keydown', modal._escHandler);

    // Click hors du contenu → fermeture
    modal._outsideHandler = e => { if (e.target === modal) closeModal(modalId); };
    modal.addEventListener('click', modal._outsideHandler);
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';

    if (modal._escHandler) {
        document.removeEventListener('keydown', modal._escHandler);
        delete modal._escHandler;
    }
    if (modal._outsideHandler) {
        modal.removeEventListener('click', modal._outsideHandler);
        delete modal._outsideHandler;
    }
}

// ── Collector Modal ───────────────────────────────────────────
function openCollectorModal(collectorId = null) {
    const form = document.getElementById('collector-form');
    if (!form) return;
    form.reset();
    delete form.dataset.editId;

    // Nettoyer les états d'erreur résiduels
    form.querySelectorAll('.error-message').forEach(el => el.remove());
    form.querySelectorAll('.form-input').forEach(el => el.style.borderColor = '');

    const titleEl = document.querySelector('#collector-modal .modal-title');
    if (titleEl) titleEl.textContent = collectorId ? 'Modifier Collecteur' : 'Ajouter Collecteur';

    if (collectorId) {
        const collector = appData.collectors.find(c => c.id === collectorId);
        if (collector) {
            form.dataset.editId = collectorId;
            document.getElementById('collector-name').value     = collector.name    || '';
            document.getElementById('collector-phone').value    = formatPhoneForInput(collector.phone || '');
            document.getElementById('collector-cin').value      = collector.cin     || '';
            document.getElementById('collector-cin-date').value = collector.cinDate || '';
            document.getElementById('collector-address').value  = collector.address || '';
        }
    }
    openModal('collector-modal');
}

// ── Confirm Modal ─────────────────────────────────────────────
/**
 * confirmModal({ title, message, confirmText, cancelText, variant, icon })
 * variant: 'danger' | 'warning' | 'info'  (défaut: 'danger')
 * Retourne une Promise<boolean>
 */
function confirmModal({
    title       = 'Confirmer',
    message     = 'Êtes-vous sûr de vouloir effectuer cette action ?',
    confirmText = 'Confirmer',
    cancelText  = 'Annuler',
    variant     = 'danger',
    icon        = null
} = {}) {
    return new Promise(resolve => {
        _ensureConfirmModal();

        const overlay   = document.getElementById('confirm-modal-overlay');
        const titleEl   = document.getElementById('confirm-modal-title');
        const messageEl = document.getElementById('confirm-modal-message');
        const iconEl    = document.getElementById('confirm-modal-icon');
        const confirmBtn = document.getElementById('confirm-modal-confirm');
        const cancelBtn  = document.getElementById('confirm-modal-cancel');

        // Contenu
        titleEl.textContent   = title;
        messageEl.textContent = message;
        confirmBtn.textContent = confirmText;
        cancelBtn.textContent  = cancelText;

        // Icône automatique selon variant si non fournie
        const defaultIcons = { danger: 'delete_forever', warning: 'warning_amber', info: 'info' };
        iconEl.textContent = icon || defaultIcons[variant] || 'help_outline';

        // Variant (classe CSS)
        overlay.dataset.variant = variant;
        confirmBtn.className = 'confirm-modal-btn confirm-modal-btn--' + variant;

        // Animation entrée
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Nettoyage des anciens handlers
        const newConfirmBtn = confirmBtn.cloneNode(true);
        const newCancelBtn  = cancelBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

        // Restaurer textes après cloneNode
        newConfirmBtn.textContent = confirmText;
        newCancelBtn.textContent  = cancelText;

        function close(result) {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
            document.removeEventListener('keydown', escHandler);
            resolve(result);
        }

        newConfirmBtn.addEventListener('click', () => close(true));
        newCancelBtn.addEventListener('click',  () => close(false));

        // Click hors du contenu
        overlay.addEventListener('click', function handler(e) {
            if (e.target === overlay) { close(false); overlay.removeEventListener('click', handler); }
        });

        // ESC
        function escHandler(e) { if (e.key === 'Escape') close(false); }
        document.addEventListener('keydown', escHandler);

        // Focus bouton annuler (safe default)
        setTimeout(() => newCancelBtn.focus(), 80);
    });
}

// ── Prompt Modal ──────────────────────────────────────────────
/**
 * promptModal({ title, message, placeholder, confirmText, cancelText, icon })
 * Affiche un modal de saisie de texte stylisé, cohérent avec confirmModal.
 * Retourne une Promise<string|null> — null si annulé ou valeur vide.
 */
function promptModal({
    title       = 'Nouvelle entrée',
    message     = '',
    placeholder = '',
    confirmText = 'OK',
    cancelText  = 'Annuler',
    icon        = 'edit'
} = {}) {
    return new Promise(resolve => {
        _ensurePromptModal();

        const overlay    = document.getElementById('prompt-modal-overlay');
        const titleEl    = document.getElementById('prompt-modal-title');
        const messageEl  = document.getElementById('prompt-modal-message');
        const iconEl     = document.getElementById('prompt-modal-icon');
        const inputEl    = document.getElementById('prompt-modal-input');
        const confirmBtn = document.getElementById('prompt-modal-confirm');
        const cancelBtn  = document.getElementById('prompt-modal-cancel');

        titleEl.textContent       = title;
        messageEl.textContent     = message;
        messageEl.style.display   = message ? '' : 'none';
        iconEl.textContent        = icon;
        inputEl.value             = '';
        inputEl.placeholder       = placeholder;
        confirmBtn.textContent    = confirmText;
        cancelBtn.textContent     = cancelText;

        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Nettoyage des anciens handlers via cloneNode
        const newConfirmBtn = confirmBtn.cloneNode(true);
        const newCancelBtn  = cancelBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        newConfirmBtn.textContent = confirmText;
        newCancelBtn.textContent  = cancelText;

        function close(value) {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
            document.removeEventListener('keydown', escHandler);
            resolve(value);
        }

        newConfirmBtn.addEventListener('click', () => {
            const val = document.getElementById('prompt-modal-input').value.trim();
            close(val || null);
        });
        newCancelBtn.addEventListener('click', () => close(null));

        // Entrée clavier → confirme
        const newInput = document.getElementById('prompt-modal-input');
        newInput.addEventListener('keydown', function handler(e) {
            if (e.key === 'Enter') { e.preventDefault(); newConfirmBtn.click(); }
        });

        // Click hors du contenu → annule
        overlay.addEventListener('click', function handler(e) {
            if (e.target === overlay) { close(null); overlay.removeEventListener('click', handler); }
        });

        // ESC → annule
        function escHandler(e) { if (e.key === 'Escape') close(null); }
        document.addEventListener('keydown', escHandler);

        // Focus sur l'input
        setTimeout(() => document.getElementById('prompt-modal-input').focus(), 80);
    });
}

/** Injecte le markup du prompt modal dans le DOM (une seule fois) */
function _ensurePromptModal() {
    if (document.getElementById('prompt-modal-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'prompt-modal-overlay';
    overlay.innerHTML = `
        <div class="confirm-modal-box" role="dialog" aria-modal="true" aria-labelledby="prompt-modal-title">
            <div class="confirm-modal-icon-wrap" style="background:rgba(0,97,164,0.12);color:var(--md-sys-color-primary);box-shadow:0 0 0 8px rgba(0,97,164,0.06);">
                <span class="material-icons" id="prompt-modal-icon">edit</span>
            </div>
            <h2 class="confirm-modal-title" id="prompt-modal-title">Nouvelle entrée</h2>
            <p class="confirm-modal-message" id="prompt-modal-message"></p>
            <input
                type="text"
                id="prompt-modal-input"
                class="form-input"
                autocomplete="off"
                style="width:100%;margin-bottom:20px;box-sizing:border-box;"
            >
            <div class="confirm-modal-actions">
                <button class="confirm-modal-btn confirm-modal-btn--ghost"  id="prompt-modal-cancel">Annuler</button>
                <button class="confirm-modal-btn confirm-modal-btn--info"   id="prompt-modal-confirm">OK</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    // CSS spécifique au prompt modal (réutilise les classes confirm-modal-*)
    if (!document.getElementById('prompt-modal-style')) {
        const style = document.createElement('style');
        style.id = 'prompt-modal-style';
        style.textContent = `
            #prompt-modal-overlay {
                display: none;
                position: fixed;
                inset: 0;
                z-index: 3100;
                background: rgba(0, 0, 0, 0.55);
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
                justify-content: center;
                align-items: center;
                animation: fadeInModal 0.2s ease;
            }
            #prompt-modal-overlay.active { display: flex; }
            #prompt-modal-overlay .confirm-modal-message { margin-bottom: 16px; }
        `;
        document.head.appendChild(style);
    }
}

/** Injecte le markup du confirm modal dans le DOM (une seule fois) */
function _ensureConfirmModal() {
    if (document.getElementById('confirm-modal-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'confirm-modal-overlay';
    overlay.innerHTML = `
        <div class="confirm-modal-box" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title">
            <div class="confirm-modal-icon-wrap">
                <span class="material-icons" id="confirm-modal-icon">delete_forever</span>
            </div>
            <h2 class="confirm-modal-title" id="confirm-modal-title">Confirmer</h2>
            <p class="confirm-modal-message" id="confirm-modal-message"></p>
            <div class="confirm-modal-actions">
                <button class="confirm-modal-btn confirm-modal-btn--ghost" id="confirm-modal-cancel">Annuler</button>
                <button class="confirm-modal-btn confirm-modal-btn--danger" id="confirm-modal-confirm">Confirmer</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}

// ── CSS Modal (injection unique) ──────────────────────────────
(function injectModalCSS() {
    if (document.getElementById('modal-base-style')) return;
    const style = document.createElement('style');
    style.id = 'modal-base-style';
    style.textContent = `
        .modal {
            display: none;
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 2000;
            justify-content: center;
            align-items: center;
            backdrop-filter: blur(4px);
            animation: fadeInModal 0.2s ease;
        }
        .modal.active { display: flex; }
        @keyframes fadeInModal {
            from { opacity:0; }
            to   { opacity:1; }
        }
        .modal-content {
            background: var(--md-sys-color-surface);
            border-radius: 20px;
            padding: 24px;
            width: 90%;
            max-width: 600px;
            max-height: 90vh;
            overflow-y: auto;
            position: relative;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            animation: scaleInModal 0.3s cubic-bezier(0.34,1.56,0.64,1);
        }
        @keyframes scaleInModal {
            from { opacity:0; transform: scale(0.9); }
            to   { opacity:1; transform: scale(1); }
        }
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: -24px -24px 24px;
            padding: 16px 24px;
            background: var(--md-sys-color-primary-container);
            border-radius: 20px 20px 0 0;
            border-bottom: 1px solid var(--md-sys-color-outline-variant);
        }
        .modal-title {
            font-size: 18px;
            font-weight: 600;
            color: var(--md-sys-color-on-primary-container);
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .close-btn {
            background: none;
            border: none;
            cursor: pointer;
            color: var(--md-sys-color-on-primary-container);
            padding: 4px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            transition: background 0.2s;
            font-size: 24px;
            line-height: 1;
        }
        .close-btn:hover { background: rgba(0,0,0,0.1); }

        /* ── Confirm Modal ─────────────────────────────────── */
        #confirm-modal-overlay {
            display: none;
            position: fixed;
            inset: 0;
            z-index: 3000;
            background: rgba(0, 0, 0, 0.55);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            justify-content: center;
            align-items: center;
            animation: fadeInModal 0.2s ease;
        }
        #confirm-modal-overlay.active {
            display: flex;
        }

        .confirm-modal-box {
            background: rgba(var(--confirm-modal-surface-rgb, 253, 252, 255), 0.85);
            border: 1px solid rgba(255, 255, 255, 0.18);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-radius: 24px;
            padding: 36px 32px 28px;
            width: 90%;
            max-width: 420px;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 0;
            box-shadow:
                0 8px 32px rgba(0, 0, 0, 0.28),
                0 2px 8px rgba(0, 0, 0, 0.12),
                inset 0 1px 0 rgba(255, 255, 255, 0.25);
            animation: scaleInModal 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
            position: relative;
        }

        /* Surface RGB adaptée au thème */
        [data-theme="dark"] .confirm-modal-box {
            background: rgba(22, 14, 36, 0.82);
            border-color: rgba(255, 255, 255, 0.10);
        }

        .confirm-modal-icon-wrap {
            width: 64px;
            height: 64px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
            flex-shrink: 0;
        }
        .confirm-modal-icon-wrap .material-icons {
            font-size: 32px;
        }

        /* Couleurs icon-wrap par variant */
        #confirm-modal-overlay[data-variant="danger"] .confirm-modal-icon-wrap {
            background: rgba(186, 26, 26, 0.12);
            color: var(--md-sys-color-error);
            box-shadow: 0 0 0 8px rgba(186, 26, 26, 0.06);
        }
        #confirm-modal-overlay[data-variant="warning"] .confirm-modal-icon-wrap {
            background: rgba(245, 158, 11, 0.12);
            color: #f59e0b;
            box-shadow: 0 0 0 8px rgba(245, 158, 11, 0.06);
        }
        #confirm-modal-overlay[data-variant="info"] .confirm-modal-icon-wrap {
            background: rgba(0, 97, 164, 0.12);
            color: var(--md-sys-color-primary);
            box-shadow: 0 0 0 8px rgba(0, 97, 164, 0.06);
        }

        .confirm-modal-title {
            font-size: 20px;
            font-weight: 700;
            color: var(--md-sys-color-on-surface);
            margin: 0 0 12px;
            line-height: 1.3;
            letter-spacing: -0.2px;
        }

        .confirm-modal-message {
            font-size: 14px;
            line-height: 1.6;
            color: var(--md-sys-color-on-surface-variant);
            margin: 0 0 28px;
            max-width: 340px;
        }

        .confirm-modal-actions {
            display: flex;
            gap: 12px;
            width: 100%;
        }

        .confirm-modal-btn {
            flex: 1;
            padding: 13px 20px;
            border-radius: 14px;
            border: none;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            letter-spacing: 0.3px;
            transition:
                background 0.2s ease,
                transform 0.15s ease,
                box-shadow 0.2s ease,
                filter 0.2s ease;
            position: relative;
            overflow: hidden;
        }
        .confirm-modal-btn:focus-visible {
            outline: 2px solid var(--md-sys-color-primary);
            outline-offset: 2px;
        }
        .confirm-modal-btn:active {
            transform: scale(0.96);
        }

        /* Bouton Annuler (ghost / secondaire) */
        .confirm-modal-btn--ghost {
            background: var(--md-sys-color-surface-variant);
            color: var(--md-sys-color-on-surface-variant);
            border: 1px solid var(--md-sys-color-outline-variant);
        }
        .confirm-modal-btn--ghost:hover {
            background: var(--md-sys-color-outline-variant);
            color: var(--md-sys-color-on-surface);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.10);
        }

        /* Bouton Confirmer — danger */
        .confirm-modal-btn--danger {
            background: var(--md-sys-color-error);
            color: var(--md-sys-color-on-error);
        }
        .confirm-modal-btn--danger:hover {
            filter: brightness(1.08);
            transform: translateY(-1px);
            box-shadow: 0 6px 18px rgba(186, 26, 26, 0.35);
        }

        /* Bouton Confirmer — warning */
        .confirm-modal-btn--warning {
            background: #f59e0b;
            color: #fff;
        }
        .confirm-modal-btn--warning:hover {
            filter: brightness(1.08);
            transform: translateY(-1px);
            box-shadow: 0 6px 18px rgba(245, 158, 11, 0.35);
        }

        /* Bouton Confirmer — info */
        .confirm-modal-btn--info {
            background: var(--md-sys-color-primary);
            color: var(--md-sys-color-on-primary);
        }
        .confirm-modal-btn--info:hover {
            filter: brightness(1.08);
            transform: translateY(-1px);
            box-shadow: 0 6px 18px rgba(0, 97, 164, 0.35);
        }

        @media (max-width: 480px) {
            .confirm-modal-box {
                padding: 28px 20px 22px;
                border-radius: 20px;
            }
            .confirm-modal-actions {
                flex-direction: column-reverse;
            }
        }
    `;
    document.head.appendChild(style);
})();
