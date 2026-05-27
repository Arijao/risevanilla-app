/* ============================================================
 * DASHBOARD-DRAG.JS — Cards Drag & Drop + Animations
 * RISEVANILLA - Gestion de Collecte de Vanille
 *
 * ✅ Drag & Drop natif via Pointer Events (zero dépendance)
 * ✅ Persistance ordre via localStorage
 * ✅ Animations fluides CSS + JS
 * ✅ Compatible offline, responsive, mobile-first
 * ✅ Aucune modification de la logique métier dashboard.js
 * ============================================================ */

'use strict';

(function () {

    /* ── Configuration ──────────────────────────────────────── */
    const STORAGE_KEY      = 'risevanilla_cards_order';
    const GRID_ID          = 'stats-grid-draggable';
    const DRAG_THRESHOLD   = 6;   // px avant déclenchement drag
    const LONG_PRESS_MS    = 180; // délai tactile

    /* ── État interne ───────────────────────────────────────── */
    let grid           = null;
    let dragCard       = null;
    let ghostEl        = null;
    let dropTarget     = null;
    let startX         = 0;
    let startY         = 0;
    let grabOffsetX    = 0;   // offset du clic dans la card (X)
    let grabOffsetY    = 0;   // offset du clic dans la card (Y)
    let isDragging     = false;
    let pointerMoved   = false;
    let longPressTimer = null;

    /* ── Initialisation ─────────────────────────────────────── */
    function init() {
        grid = document.getElementById(GRID_ID);
        if (!grid) return;

        injectResetButton();
        restoreOrder();
        bindEvents();
    }

    /* ── Bouton "Réinitialiser l'ordre" ─────────────────────── */
    function injectResetButton() {
        const btn = document.createElement('button');
        btn.id          = 'cards-reset-order-btn';
        btn.title       = 'Réinitialiser la disposition des cards';
        btn.innerHTML   = '<span class="material-icons" style="font-size:14px;line-height:1;">restart_alt</span> Réinitialiser';
        btn.addEventListener('click', resetOrder);
        grid.parentNode.insertBefore(btn, grid);
        updateResetBtn();
    }

    function updateResetBtn() {
        const btn = document.getElementById('cards-reset-order-btn');
        if (!btn) return;
        const saved = getSavedOrder();
        btn.classList.toggle('visible', saved !== null);
    }

    function resetOrder() {
        localStorage.removeItem(STORAGE_KEY);
        const cards = Array.from(grid.querySelectorAll('.stat-card[data-card-id]'));
        const defaultOrder = [
            'card-advances', 'card-expenses', 'card-vanilla-weight',
            'card-vanilla-value', 'card-dettes', 'card-paiements', 'card-solde'
        ];
        defaultOrder.forEach(id => {
            const card = cards.find(c => c.dataset.cardId === id);
            if (card) {
                card.classList.add('card-repositioning');
                grid.appendChild(card);
                card.addEventListener('animationend', () => card.classList.remove('card-repositioning'), { once: true });
            }
        });
        updateResetBtn();
        // Rebind events après réorganisation DOM
        bindEvents();
    }

    /* ── Persistance ────────────────────────────────────────── */
    function getSavedOrder() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) { return null; }
    }

    function saveOrder() {
        try {
            const order = Array.from(grid.querySelectorAll('.stat-card[data-card-id]'))
                               .map(c => c.dataset.cardId);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
            updateResetBtn();
        } catch (e) { /* localStorage indisponible (private mode, quota) → silencieux */ }
    }

    function restoreOrder() {
        const order = getSavedOrder();
        if (!order || !Array.isArray(order)) return;

        const cards = Array.from(grid.querySelectorAll('.stat-card[data-card-id]'));
        const cardMap = {};
        cards.forEach(c => { cardMap[c.dataset.cardId] = c; });

        order.forEach(id => {
            if (cardMap[id]) grid.appendChild(cardMap[id]);
        });
    }

    /* ── Bind Pointer Events ────────────────────────────────── */
    function bindEvents() {
        const cards = grid.querySelectorAll('.stat-card[data-card-id]');
        cards.forEach(card => {
            // Supprimer l'ancien listener avant d'en ajouter un nouveau (évite les doublons)
            card.removeEventListener('pointerdown', onPointerDown);
            card.addEventListener('pointerdown', onPointerDown, { passive: false });
        });
    }

    /* ── Pointer Down ───────────────────────────────────────── */
    function onPointerDown(e) {
        // Ignorer clic droit, ou si la target est un bouton/lien interne
        if (e.button !== 0 && e.pointerType === 'mouse') return;
        if (e.target.closest('button, a, input, select, textarea')) return;

        const card  = e.currentTarget;
        const rect  = card.getBoundingClientRect();
        startX      = e.clientX;
        startY      = e.clientY;
        // Offset exact du pointeur dans la card → ghost collera au point de grab
        grabOffsetX = e.clientX - rect.left;
        grabOffsetY = e.clientY - rect.top;
        pointerMoved  = false;
        isDragging    = false;
        dragCard      = card;

        // Sur mobile : long press pour activer drag
        if (e.pointerType === 'touch') {
            longPressTimer = setTimeout(() => {
                if (!pointerMoved) startDrag(card, e);
            }, LONG_PRESS_MS);
        }

        card.setPointerCapture(e.pointerId);
        card.addEventListener('pointermove', onPointerMove, { passive: false });
        card.addEventListener('pointerup',   onPointerUp,   { once: true });
        card.addEventListener('pointercancel', cancelDrag,  { once: true });
    }

    /* ── Pointer Move ───────────────────────────────────────── */
    function onPointerMove(e) {
        if (!dragCard) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 4) pointerMoved = true;

        // Desktop : déclencher dès que seuil atteint
        if (!isDragging && e.pointerType !== 'touch' && dist >= DRAG_THRESHOLD) {
            clearTimeout(longPressTimer);
            startDrag(dragCard, e);
        }

        if (!isDragging) return;
        e.preventDefault();

        // Déplacer le ghost
        moveGhost(e.clientX, e.clientY);

        // Trouver le drop target sous le curseur
        ghostEl.style.display = 'none';
        const elementBelow = document.elementFromPoint(e.clientX, e.clientY);
        ghostEl.style.display = '';

        const targetCard = elementBelow ? elementBelow.closest('.stat-card[data-card-id]') : null;

        if (targetCard && targetCard !== dragCard) {
            if (targetCard !== dropTarget) {
                clearDropTarget();
                dropTarget = targetCard;
                dropTarget.classList.add('card-drop-target');
            }
        } else {
            clearDropTarget();
        }
    }

    /* ── Pointer Up ─────────────────────────────────────────── */
    function onPointerUp(e) {
        clearTimeout(longPressTimer);
        dragCard && dragCard.removeEventListener('pointermove', onPointerMove);

        if (!isDragging) {
            cleanupDrag();
            return;
        }

        if (dropTarget) {
            const targetRect   = dropTarget.getBoundingClientRect();
            const dragCardRect = dragCard.getBoundingClientRect();

            // Détecter si la grille est en mode multi-colonnes
            const gridRect    = grid.getBoundingClientRect();
            const cards       = Array.from(grid.querySelectorAll('.stat-card[data-card-id]'));
            const firstRect   = cards[0]?.getBoundingClientRect();
            const secondRect  = cards[1]?.getBoundingClientRect();
            const isMultiCol  = firstRect && secondRect && Math.abs(firstRect.top - secondRect.top) < 10;

            let insertBefore;
            if (isMultiCol) {
                // Multi-colonnes → comparer centre vertical de la card cible
                const midY = targetRect.top + targetRect.height / 2;
                if (Math.abs(dragCardRect.top - targetRect.top) < 10) {
                    // Même ligne → comparer X
                    insertBefore = e.clientX < targetRect.left + targetRect.width / 2;
                } else {
                    insertBefore = e.clientY < midY;
                }
            } else {
                // 1 colonne → comparer uniquement Y
                insertBefore = e.clientY < targetRect.top + targetRect.height / 2;
            }

            if (insertBefore) {
                grid.insertBefore(dragCard, dropTarget);
            } else {
                dropTarget.insertAdjacentElement('afterend', dragCard);
            }

            // Animation pop sur les deux cards
            [dragCard, dropTarget].forEach(c => {
                c.classList.add('card-repositioning');
                c.addEventListener('animationend', () => c.classList.remove('card-repositioning'), { once: true });
            });

            saveOrder();
            // Rebind après déplacement DOM
            bindEvents();
        }

        cleanupDrag();
    }

    /* ── Démarrer le drag ───────────────────────────────────── */
    function startDrag(card, e) {
        isDragging = true;
        card.classList.add('card-dragging');

        // Créer le ghost
        ghostEl = createGhost(card);
        moveGhost(e.clientX, e.clientY);
        document.body.appendChild(ghostEl);

        // Vibration tactile légère (mobile)
        if (navigator.vibrate) navigator.vibrate(40);
    }

    /* ── Créer le ghost visuel ──────────────────────────────── */
    function createGhost(card) {
        const clone = card.cloneNode(true);
        const rect  = card.getBoundingClientRect();

        clone.className = 'card-drag-ghost';
        clone.removeAttribute('id');
        clone.style.cssText = `
            width:  ${rect.width}px;
            height: ${rect.height}px;
            left:   ${rect.left}px;
            top:    ${rect.top}px;
            background: ${getComputedStyle(card).background};
            border: ${getComputedStyle(card).border};
        `;
        return clone;
    }

    /* ── Déplacer le ghost ──────────────────────────────────── */
    function moveGhost(cx, cy) {
        if (!ghostEl) return;
        // Positionner le ghost exactement sous le point de grab (pas d'offset fixe)
        ghostEl.style.left = (cx - grabOffsetX) + 'px';
        ghostEl.style.top  = (cy - grabOffsetY) + 'px';
    }

    /* ── Nettoyer le drop target visuel ─────────────────────── */
    function clearDropTarget() {
        if (dropTarget) {
            dropTarget.classList.remove('card-drop-target');
            dropTarget = null;
        }
    }

    /* ── Nettoyage global ───────────────────────────────────── */
    function cleanupDrag() {
        if (ghostEl) {
            ghostEl.remove();
            ghostEl = null;
        }
        if (dragCard) {
            dragCard.classList.remove('card-dragging');
            dragCard.removeEventListener('pointermove', onPointerMove);
            dragCard = null;
        }
        clearDropTarget();
        isDragging   = false;
        pointerMoved = false;
    }

    function cancelDrag() {
        clearTimeout(longPressTimer);
        cleanupDrag();
    }

    /* ── Lancement ──────────────────────────────────────────── */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // Attendre que le dashboard soit rendu (léger délai)
        setTimeout(init, 0);
    }

})();
