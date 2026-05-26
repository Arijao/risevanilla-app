/* ============================================================
 * AUTH.JS — Système d'authentification PIN Admin
 * RISEVANILLA - Gestion de Collecte de Vanille
 *
 * ✅ Stockage sécurisé : PBKDF2 + SHA-256 (Web Crypto API)
 * ✅ Fonctionne 100% offline
 * ✅ Session en mémoire uniquement (pas de token dans localStorage)
 * ✅ Blocage temporaire après tentatives échouées
 * ✅ Protection : settings, deleteFromDB, resetData, export/import
 * ============================================================ */

'use strict';

/* ── Clés localStorage ──────────────────────────────────────── */
const AUTH_KEY          = 'rv_auth_v1';       // { hash, salt, iterations }
const AUTH_LOCK_KEY     = 'rv_auth_lock';     // { until, attempts }

/* ── Config ─────────────────────────────────────────────────── */
const AUTH_PBKDF2_ITER  = 100000;
const AUTH_MAX_ATTEMPTS = 5;
const AUTH_LOCK_MS      = 5 * 60 * 1000;     // 5 minutes blocage
const AUTH_SESSION_MS   = 30 * 60 * 1000;    // 30 minutes session

/* ── État session (mémoire uniquement, jamais persisté) ─────── */
const _authState = {
    unlocked:    false,
    expiresAt:   0,
    lockTimer:   null,
};

/* ════════════════════════════════════════════════════════════
 * API PUBLIQUE
 * ════════════════════════════════════════════════════════════ */

/**
 * Initialise l'auth au démarrage.
 * Affiche l'écran PIN ou de création selon l'état.
 * Retourne une Promise résolue quand l'utilisateur est authentifié.
 */
function initAuth() {
    return new Promise(resolve => {
        _authState._resolveInit = resolve;

        if (!_isAuthConfigured()) {
            _showSetupScreen();
        } else {
            _showLockScreen();
        }
    });
}

/** Vérifie si la session est active (pour protéger des actions) */
function isAuthenticated() {
    if (!_authState.unlocked) return false;
    if (Date.now() > _authState.expiresAt) {
        _expireSession();
        return false;
    }
    return true;
}

/**
 * Protège une action : si non authentifié, demande le PIN d'abord.
 * Usage : requireAuth().then(() => doSensitiveAction())
 */
function requireAuth() {
    if (isAuthenticated()) return Promise.resolve();
    return new Promise((resolve, reject) => {
        _showLockScreen({ inline: true, onSuccess: resolve, onCancel: reject });
    });
}

/** Verrouille manuellement la session */
function lockSession() {
    _expireSession();
    _showLockScreen();
}

/** Retourne true si un PIN est configuré */
function _isAuthConfigured() {
    try {
        const raw = localStorage.getItem(AUTH_KEY);
        if (!raw) return false;
        const data = JSON.parse(raw);
        return !!(data && data.hash && data.salt);
    } catch { return false; }
}

/* ════════════════════════════════════════════════════════════
 * CRYPTO — PBKDF2 + SHA-256
 * ════════════════════════════════════════════════════════════ */

async function _hashPIN(pin, saltHex) {
    const enc      = new TextEncoder();
    const keyMat   = await crypto.subtle.importKey('raw', enc.encode(pin), 'PBKDF2', false, ['deriveBits']);
    const salt     = saltHex ? _hexToBytes(saltHex) : crypto.getRandomValues(new Uint8Array(16));
    const bits     = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt, hash: 'SHA-256', iterations: AUTH_PBKDF2_ITER },
        keyMat, 256
    );
    return {
        hash: _bytesToHex(new Uint8Array(bits)),
        salt: _bytesToHex(salt),
        iterations: AUTH_PBKDF2_ITER
    };
}

async function _verifyPIN(pin) {
    try {
        const stored = JSON.parse(localStorage.getItem(AUTH_KEY));
        const result = await _hashPIN(pin, stored.salt);
        return result.hash === stored.hash;
    } catch { return false; }
}

function _bytesToHex(bytes) {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function _hexToBytes(hex) {
    const arr = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) arr[i / 2] = parseInt(hex.slice(i, i + 2), 16);
    return arr;
}

/* ════════════════════════════════════════════════════════════
 * SESSION
 * ════════════════════════════════════════════════════════════ */

function _startSession() {
    _authState.unlocked  = true;
    _authState.expiresAt = Date.now() + AUTH_SESSION_MS;
    _clearLockRecord();

    if (_authState.lockTimer) clearTimeout(_authState.lockTimer);
    _authState.lockTimer = setTimeout(() => {
        _expireSession();
        showToast('🔒 Session expirée — veuillez vous reconnecter.', 'info', 4000);
    }, AUTH_SESSION_MS);
}

function _expireSession() {
    _authState.unlocked  = false;
    _authState.expiresAt = 0;
    if (_authState.lockTimer) clearTimeout(_authState.lockTimer);
}

/* ════════════════════════════════════════════════════════════
 * ANTI-BRUTEFORCE
 * ════════════════════════════════════════════════════════════ */

function _getLockRecord() {
    try { return JSON.parse(localStorage.getItem(AUTH_LOCK_KEY)) || { attempts: 0, until: 0 }; }
    catch { return { attempts: 0, until: 0 }; }
}

function _saveLockRecord(rec) {
    try { localStorage.setItem(AUTH_LOCK_KEY, JSON.stringify(rec)); } catch {}
}

function _clearLockRecord() {
    try { localStorage.removeItem(AUTH_LOCK_KEY); } catch {}
}

function _isLocked() {
    const rec = _getLockRecord();
    return rec.until > Date.now();
}

function _lockUntil() {
    const rec = _getLockRecord();
    return rec.until || 0;
}

function _registerFailedAttempt() {
    const rec = _getLockRecord();
    rec.attempts = (rec.attempts || 0) + 1;
    if (rec.attempts >= AUTH_MAX_ATTEMPTS) {
        rec.until = Date.now() + AUTH_LOCK_MS;
    }
    _saveLockRecord(rec);
    return rec;
}

function _remainingAttempts() {
    const rec = _getLockRecord();
    return Math.max(0, AUTH_MAX_ATTEMPTS - (rec.attempts || 0));
}

/* ════════════════════════════════════════════════════════════
 * UI — ÉCRAN DE VERROUILLAGE
 * ════════════════════════════════════════════════════════════ */

let _lockOverlay = null;

function _showLockScreen(opts = {}) {
    _removeLockScreen();

    const isInline     = !!opts.inline;
    const onSuccess    = opts.onSuccess || null;
    const onCancel     = opts.onCancel  || null;
    const isBootScreen = !isInline && !_authState._resolveInit === false;

    _lockOverlay = document.createElement('div');
    _lockOverlay.id = 'rv-auth-overlay';

    const locked   = _isLocked();
    const lockEnd  = _lockUntil();
    const attempts = _remainingAttempts();

    _lockOverlay.innerHTML = `
        <div class="rv-auth-card" role="dialog" aria-modal="true" aria-label="Authentification administrateur">
            <div class="rv-auth-logo">
                <img src="logo-risevanilla.svg" alt="RiseVanilla" onerror="this.style.display='none'">
            </div>
            <div class="rv-auth-title">
                <span class="material-icons rv-auth-lock-icon">lock</span>
                RISEVANILLA
            </div>
            <div class="rv-auth-subtitle">Entrez votre code PIN administrateur</div>

            <div id="rv-auth-error" class="rv-auth-error" style="display:none;"></div>

            <div class="rv-auth-dots" id="rv-auth-dots" aria-hidden="true">
                <span></span><span></span><span></span><span></span>
            </div>

            <div class="rv-pin-pad" id="rv-pin-pad"${locked ? ' style="pointer-events:none;opacity:.4;"' : ''}>
                ${[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map(k => `
                    <button class="rv-pin-key${k==='' ? ' rv-pin-key--empty' : ''}${k==='⌫' ? ' rv-pin-key--del' : ''}"
                            data-key="${k}" ${k==='' ? 'disabled' : ''} aria-label="${k === '⌫' ? 'Effacer' : k}">
                        ${k}
                    </button>`).join('')}
            </div>

            ${locked ? `<div class="rv-auth-lockout" id="rv-auth-lockout">
                <span class="material-icons">timer</span>
                <span id="rv-auth-countdown">Trop de tentatives — réessayez dans <strong id="rv-auth-timer"></strong></span>
            </div>` : ''}

            ${attempts < AUTH_MAX_ATTEMPTS && !locked ? `
                <div class="rv-auth-hint">${attempts} tentative${attempts > 1 ? 's' : ''} restante${attempts > 1 ? 's' : ''}</div>
            ` : ''}

            ${isInline ? `<button class="rv-auth-cancel-btn" id="rv-auth-cancel">Annuler</button>` : ''}
        </div>
    `;

    document.body.appendChild(_lockOverlay);

    // Focus trap
    const firstKey = _lockOverlay.querySelector('.rv-pin-key:not([disabled])');
    if (firstKey) firstKey.focus();

    // Countdown si bloqué
    if (locked) _startCountdown(lockEnd, () => _showLockScreen(opts));

    // Events clavier physique
    _lockOverlay._keyHandler = e => _handleKeyboard(e);
    document.addEventListener('keydown', _lockOverlay._keyHandler);

    // Events PIN pad
    _lockOverlay.querySelectorAll('.rv-pin-key[data-key]').forEach(btn => {
        btn.addEventListener('click', () => {
            const k = btn.dataset.key;
            if (k === '⌫') _pinDelete();
            else if (k !== '') _pinAppend(k);
        });
    });

    // Annuler
    const cancelBtn = _lockOverlay.querySelector('#rv-auth-cancel');
    if (cancelBtn) cancelBtn.addEventListener('click', () => {
        _removeLockScreen();
        if (onCancel) onCancel(new Error('Annulé'));
    });

    // Stocker les callbacks
    _lockOverlay._onSuccess = onSuccess;
    _lockOverlay._onCancel  = onCancel;

    // PIN buffer
    _lockOverlay._pin = '';
}

let _pinBuffer = '';

function _pinAppend(digit) {
    if (_pinBuffer.length >= 6) return;
    _pinBuffer += digit;
    _updateDots(_pinBuffer.length);

    if (_pinBuffer.length >= 4) {
        // Déclencher vérif après min 4 chiffres
        _attemptUnlock(_pinBuffer);
    }
}

function _pinDelete() {
    if (_pinBuffer.length === 0) return;
    _pinBuffer = _pinBuffer.slice(0, -1);
    _updateDots(_pinBuffer.length);
}

function _handleKeyboard(e) {
    if (!_lockOverlay) return;
    if (/^[0-9]$/.test(e.key)) _pinAppend(e.key);
    else if (e.key === 'Backspace') _pinDelete();
    else if (e.key === 'Escape') {
        const cancelBtn = _lockOverlay.querySelector('#rv-auth-cancel');
        if (cancelBtn) cancelBtn.click();
    }
}

function _updateDots(count) {
    const dots = document.querySelectorAll('#rv-auth-dots span');
    dots.forEach((d, i) => {
        d.classList.toggle('rv-dot-filled', i < count);
        d.classList.toggle('rv-dot-active', i === count - 1);
    });
}

async function _attemptUnlock(pin) {
    if (_isLocked()) { _pinBuffer = ''; _updateDots(0); return; }

    // Désactiver pad pendant vérif
    const pad = document.getElementById('rv-pin-pad');
    if (pad) pad.style.pointerEvents = 'none';

    const ok = await _verifyPIN(pin);
    _pinBuffer = '';
    _updateDots(0);

    if (ok) {
        _startSession();
        // Animation succès
        const card = _lockOverlay?.querySelector('.rv-auth-card');
        if (card) {
            card.classList.add('rv-auth-success');
            await new Promise(r => setTimeout(r, 350));
        }
        const cb = _lockOverlay?._onSuccess;
        const resolveInit = _authState._resolveInit;
        _removeLockScreen();

        if (cb) cb();
        if (resolveInit) { _authState._resolveInit = null; resolveInit(); }

    } else {
        const rec = _registerFailedAttempt();
        if (pad) pad.style.pointerEvents = '';

        const errEl = document.getElementById('rv-auth-error');
        if (errEl) {
            if (rec.until > Date.now()) {
                errEl.textContent = `Compte bloqué pendant ${AUTH_LOCK_MS / 60000} min.`;
                errEl.style.display = 'block';
                if (pad) { pad.style.pointerEvents = 'none'; pad.style.opacity = '.4'; }
                _startCountdown(rec.until, () => _showLockScreen({
                    onSuccess: _lockOverlay?._onSuccess,
                    onCancel:  _lockOverlay?._onCancel,
                    inline:    !!_lockOverlay?.querySelector('#rv-auth-cancel'),
                }));
            } else {
                const rem = Math.max(0, AUTH_MAX_ATTEMPTS - rec.attempts);
                errEl.textContent = `PIN incorrect. ${rem} tentative${rem > 1 ? 's' : ''} restante${rem > 1 ? 's' : ''}.`;
                errEl.style.display = 'block';
                const card = _lockOverlay?.querySelector('.rv-auth-card');
                if (card) {
                    card.classList.add('rv-auth-shake');
                    setTimeout(() => card.classList.remove('rv-auth-shake'), 600);
                }
                // Effacer l'erreur après 2s
                setTimeout(() => { if (errEl) errEl.style.display = 'none'; }, 2500);
            }
        }
    }
}

function _startCountdown(until, onExpire) {
    const el = document.getElementById('rv-auth-timer');
    if (!el) return;
    const iv = setInterval(() => {
        const rem = Math.max(0, Math.ceil((until - Date.now()) / 1000));
        const m   = Math.floor(rem / 60);
        const s   = rem % 60;
        el.textContent = `${m}:${s.toString().padStart(2, '0')}`;
        if (rem <= 0) {
            clearInterval(iv);
            _clearLockRecord();
            if (onExpire) onExpire();
        }
    }, 1000);
}

function _removeLockScreen() {
    if (_lockOverlay) {
        if (_lockOverlay._keyHandler) document.removeEventListener('keydown', _lockOverlay._keyHandler);
        _lockOverlay.remove();
        _lockOverlay = null;
    }
    _pinBuffer = '';
}

/* ════════════════════════════════════════════════════════════
 * UI — ÉCRAN DE CRÉATION DU PIN
 * ════════════════════════════════════════════════════════════ */

function _showSetupScreen() {
    _removeLockScreen();
    _lockOverlay = document.createElement('div');
    _lockOverlay.id = 'rv-auth-overlay';

    _lockOverlay.innerHTML = `
        <div class="rv-auth-card rv-auth-setup-card" role="dialog" aria-modal="true" aria-label="Configuration du PIN administrateur">
            <div class="rv-auth-logo">
                <img src="logo-risevanilla.svg" alt="RiseVanilla" onerror="this.style.display='none'">
            </div>
            <div class="rv-auth-title">Bienvenue sur RISEVANILLA</div>
            <div class="rv-auth-subtitle rv-auth-setup-sub">
                Créez un code PIN à 4–6 chiffres pour sécuriser l'accès administrateur.
            </div>

            <div id="rv-setup-step" class="rv-setup-step-label">① Choisissez votre PIN</div>
            <div id="rv-auth-error" class="rv-auth-error" style="display:none;"></div>

            <div class="rv-auth-dots" id="rv-auth-dots" aria-hidden="true">
                <span></span><span></span><span></span><span></span>
            </div>

            <div class="rv-pin-pad" id="rv-pin-pad">
                ${[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map(k => `
                    <button class="rv-pin-key${k==='' ? ' rv-pin-key--empty' : ''}${k==='⌫' ? ' rv-pin-key--del' : ''}"
                            data-key="${k}" ${k==='' ? 'disabled' : ''} aria-label="${k === '⌫' ? 'Effacer' : k}">
                        ${k}
                    </button>`).join('')}
            </div>

            <button id="rv-setup-confirm" class="rv-auth-confirm-btn" disabled>
                <span class="material-icons">check_circle</span> Confirmer
            </button>
        </div>
    `;

    document.body.appendChild(_lockOverlay);

    _lockOverlay._keyHandler = e => _handleKeyboard(e);
    document.addEventListener('keydown', _lockOverlay._keyHandler);

    _lockOverlay.querySelectorAll('.rv-pin-key[data-key]').forEach(btn => {
        btn.addEventListener('click', () => {
            const k = btn.dataset.key;
            if (k === '⌫') _pinDelete();
            else if (k !== '') _pinAppend(k);
        });
    });

    let _step = 1;
    let _firstPin = '';

    // Remplacer _pinAppend pour gestion setup
    const _origAppend = window._pinAppend;
    _lockOverlay._setupState = { step: 1, first: '' };

    const confirmBtn = _lockOverlay.querySelector('#rv-setup-confirm');

    // Override: écouter les dots pour détecter pin complet
    const origPinAppend = _pinAppend.toString();

    // Setup listener custom
    _lockOverlay._setupPinHandler = async (pin) => {
        const state = _lockOverlay._setupState;
        if (state.step === 1) {
            if (pin.length < 4) {
                _showSetupError('Le PIN doit comporter au moins 4 chiffres.');
                return;
            }
            state.first = pin;
            state.step  = 2;
            _pinBuffer = '';
            _updateDots(0);
            const stepEl = document.getElementById('rv-setup-step');
            if (stepEl) stepEl.textContent = '② Confirmez votre PIN';
            const sub = _lockOverlay.querySelector('.rv-auth-setup-sub');
            if (sub) sub.textContent = 'Entrez à nouveau le même code PIN.';
            document.getElementById('rv-auth-error').style.display = 'none';
            confirmBtn.disabled = true;
        } else {
            if (pin !== state.first) {
                _showSetupError('Les deux codes PIN ne correspondent pas. Recommencez.');
                state.step  = 1;
                state.first = '';
                _pinBuffer  = '';
                _updateDots(0);
                const stepEl = document.getElementById('rv-setup-step');
                if (stepEl) stepEl.textContent = '① Choisissez votre PIN';
                const sub = _lockOverlay.querySelector('.rv-auth-setup-sub');
                if (sub) sub.textContent = 'Créez un code PIN à 4–6 chiffres.';
                return;
            }
            // Sauvegarder
            try {
                const hashed = await _hashPIN(pin);
                localStorage.setItem(AUTH_KEY, JSON.stringify(hashed));
                _startSession();
                const card = _lockOverlay?.querySelector('.rv-auth-card');
                if (card) {
                    card.classList.add('rv-auth-success');
                    await new Promise(r => setTimeout(r, 350));
                }
                const resolveInit = _authState._resolveInit;
                _removeLockScreen();
                if (resolveInit) { _authState._resolveInit = null; resolveInit(); }
                showToast('🔐 Code PIN créé avec succès !', 'success', 3000);
            } catch (e) {
                _showSetupError('Erreur lors de la création du PIN. Réessayez.');
                _pinBuffer = ''; _updateDots(0);
            }
        }
    };

    confirmBtn.addEventListener('click', () => {
        if (_pinBuffer.length >= 4) _lockOverlay._setupPinHandler(_pinBuffer);
    });
}

// Remplacer _attemptUnlock pendant setup
const _origAttemptUnlock = _attemptUnlock;

// Patch _pinAppend pour le setup : déclencher _setupPinHandler si dispo
function _pinAppend(digit) {
    if (_pinBuffer.length >= 6) return;
    _pinBuffer += digit;
    _updateDots(_pinBuffer.length);

    const confirmBtn = document.getElementById('rv-setup-confirm');
    if (confirmBtn) {
        confirmBtn.disabled = _pinBuffer.length < 4;
    }

    // Mode unlock normal (≥4 chiffres et pas en mode setup)
    if (!_lockOverlay?._setupPinHandler && _pinBuffer.length >= 4) {
        _attemptUnlock(_pinBuffer);
    }
}

function _showSetupError(msg) {
    const errEl = document.getElementById('rv-auth-error');
    if (!errEl) return;
    errEl.textContent = msg;
    errEl.style.display = 'block';
    const card = _lockOverlay?.querySelector('.rv-auth-card');
    if (card) {
        card.classList.add('rv-auth-shake');
        setTimeout(() => card.classList.remove('rv-auth-shake'), 600);
    }
}

/* ════════════════════════════════════════════════════════════
 * UI — PANNEAU PARAMÈTRES PIN
 * ════════════════════════════════════════════════════════════ */

/**
 * Rend le panneau de gestion PIN dans #rv-pin-settings-panel
 */
function renderPinSettingsPanel() {
    const panel = document.getElementById('rv-pin-settings-panel');
    if (!panel) return;

    const configured = _isAuthConfigured();

    panel.innerHTML = `
        <div class="rv-pin-settings">
            <div class="rv-pin-settings__header">
                <span class="material-icons" style="color:var(--md-sys-color-primary);">lock</span>
                <div>
                    <div style="font-weight:600;font-size:15px;">Code PIN Administrateur</div>
                    <div style="font-size:12px;color:var(--md-sys-color-on-surface-variant);margin-top:2px;">
                        ${configured
                            ? 'PIN configuré — accès sensible protégé'
                            : 'Aucun PIN configuré'}
                    </div>
                </div>
                <span class="rv-pin-badge ${configured ? 'rv-pin-badge--on' : 'rv-pin-badge--off'}">
                    ${configured ? 'Actif' : 'Inactif'}
                </span>
            </div>

            <div class="rv-pin-settings__actions">
                ${configured ? `
                    <button class="btn btn-outline" onclick="changePIN()" style="font-size:13px;">
                        <span class="material-icons" style="font-size:16px;">edit</span>
                        Changer le PIN
                    </button>
                    <button class="btn btn-outline" onclick="lockSession()" style="font-size:13px;">
                        <span class="material-icons" style="font-size:16px;">lock</span>
                        Verrouiller maintenant
                    </button>
                    <button class="btn btn-danger" onclick="removePIN()" style="font-size:13px;padding:8px 14px;">
                        <span class="material-icons" style="font-size:16px;">no_encryption</span>
                        Supprimer le PIN
                    </button>
                ` : `
                    <button class="btn btn-primary" onclick="setupPIN()" style="font-size:13px;">
                        <span class="material-icons" style="font-size:16px;">add_moderator</span>
                        Créer un PIN
                    </button>
                `}
            </div>

            <div style="font-size:11px;color:var(--md-sys-color-on-surface-variant);margin-top:10px;
                        padding:10px;background:var(--md-sys-color-surface-variant);border-radius:8px;
                        display:flex;gap:8px;align-items:flex-start;">
                <span class="material-icons" style="font-size:15px;flex-shrink:0;margin-top:1px;">info</span>
                <span>Le PIN protège : suppression de données, export/import, remise à zéro, et paramètres avancés.
                La session expire après 30 min d'inactivité.</span>
            </div>
        </div>
    `;
}

/** Permet à l'utilisateur de changer son PIN (nécessite l'ancien) */
async function changePIN() {
    try {
        await requireAuth();
    } catch { return; }
    localStorage.removeItem(AUTH_KEY);
    _expireSession();
    _showSetupScreen();
    showToast('Créez votre nouveau code PIN.', 'info', 3000);
}

/** Crée un PIN depuis les paramètres (premier lancement) */
function setupPIN() {
    if (_isAuthConfigured()) return;
    _showSetupScreen();
}

/** Supprime le PIN (nécessite authentification) */
async function removePIN() {
    try {
        await requireAuth();
    } catch { return; }
    const ok = await confirmModal({
        title:       'Supprimer le code PIN',
        message:     'L\'application ne sera plus protégée. Confirmer la suppression du PIN ?',
        confirmText: 'Supprimer',
        cancelText:  'Annuler',
        variant:     'danger',
        icon:        'no_encryption'
    });
    if (!ok) return;
    localStorage.removeItem(AUTH_KEY);
    _clearLockRecord();
    _expireSession();
    renderPinSettingsPanel();
    showToast('Code PIN supprimé.', 'warning', 3000);
}

/* ════════════════════════════════════════════════════════════
 * WRAPPERS ACTIONS PROTÉGÉES
 * ════════════════════════════════════════════════════════════ */

/**
 * Wrap une fonction globale pour exiger l'auth avant exécution.
 * Usage : wrapWithAuth('exportData')
 */
function wrapWithAuth(fnName) {
    const original = window[fnName];
    if (typeof original !== 'function') return;
    window[fnName] = async function(...args) {
        try {
            await requireAuth();
            original.apply(this, args);
        } catch { /* annulé */ }
    };
}

/* ════════════════════════════════════════════════════════════
 * INIT HOOKS (appelé depuis main.js après DOMContentLoaded)
 * ════════════════════════════════════════════════════════════ */

function _initAuthHooks() {
    // Protéger les actions sensibles après que toutes les fonctions sont définies
    setTimeout(() => {
        wrapWithAuth('resetData');
        wrapWithAuth('exportData');
        wrapWithAuth('importData');
    }, 0);

    // Rendre le panneau settings PIN
    renderPinSettingsPanel();

    // Bouton cadenas dans le header
    const lockBtn = document.getElementById('rv-lock-btn');
    if (lockBtn) {
        lockBtn.style.display = 'flex';
        lockBtn.addEventListener('click', lockSession);
    }
}
