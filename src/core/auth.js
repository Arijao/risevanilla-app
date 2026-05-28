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
const AUTH_LOCK_KEY     = 'rv_auth_lock';     // { until, attempts, permanent, firstFailAt }
const AUTH_RESCUE_KEY   = 'rv_auth_rescue';   // { hash, salt, iterations } — code de secours admin

/* ── Config ─────────────────────────────────────────────────── */
const AUTH_PBKDF2_ITER  = 100000;
const AUTH_SESSION_MS   = 30 * 60 * 1000;    // 30 minutes session

/* ── Table de progression des blocages (anti-brute-force) ──────
 * Tentatives 1-3  : avertissement seulement, aucun délai
 * Tentative 4     : blocage 30 secondes
 * Tentative 5     : blocage 5 minutes
 * Tentative 6     : blocage 30 minutes
 * Tentative 7-9   : blocage 24 heures + alerte rouge critique
 * Tentative 10+   : verrouillage PERMANENT — récupération admin uniquement
 * ─────────────────────────────────────────────────────────────── */
const AUTH_LOCKOUT_SCHEDULE = [
    { from: 1,  to: 3,  lockMs: 0,                   level: 'warning'  },
    { from: 4,  to: 4,  lockMs: 30 * 1000,            level: 'moderate' },
    { from: 5,  to: 5,  lockMs: 5  * 60 * 1000,       level: 'serious'  },
    { from: 6,  to: 6,  lockMs: 30 * 60 * 1000,       level: 'severe'   },
    { from: 7,  to: 9,  lockMs: 24 * 60 * 60 * 1000,  level: 'critical' },
    { from: 10, to: Infinity, lockMs: Infinity,        level: 'permanent'},
];

function _getLockSchedule(attempts) {
    return AUTH_LOCKOUT_SCHEDULE.find(s => attempts >= s.from && attempts <= s.to)
        || AUTH_LOCKOUT_SCHEDULE[AUTH_LOCKOUT_SCHEDULE.length - 1];
}

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
 * ANTI-BRUTEFORCE — Logique progressive
 * ════════════════════════════════════════════════════════════ */

function _getLockRecord() {
    try { return JSON.parse(localStorage.getItem(AUTH_LOCK_KEY)) || { attempts: 0, until: 0, permanent: false, firstFailAt: 0 }; }
    catch { return { attempts: 0, until: 0, permanent: false, firstFailAt: 0 }; }
}

function _saveLockRecord(rec) {
    try { localStorage.setItem(AUTH_LOCK_KEY, JSON.stringify(rec)); } catch {}
}

function _clearLockRecord() {
    try { localStorage.removeItem(AUTH_LOCK_KEY); } catch {}
}

function _isLocked() {
    const rec = _getLockRecord();
    if (rec.permanent) return true;
    return rec.until > Date.now();
}

function _isPermanentlyLocked() {
    const rec = _getLockRecord();
    return !!rec.permanent;
}

function _lockUntil() {
    const rec = _getLockRecord();
    return rec.until || 0;
}

/**
 * Enregistre une tentative échouée et applique le blocage correspondant.
 * Retourne le lock record mis à jour.
 */
function _registerFailedAttempt() {
    const rec = _getLockRecord();
    rec.attempts = (rec.attempts || 0) + 1;
    if (!rec.firstFailAt) rec.firstFailAt = Date.now();

    const schedule = _getLockSchedule(rec.attempts);

    if (schedule.level === 'permanent') {
        rec.permanent = true;
        rec.until     = Infinity;
    } else if (schedule.lockMs > 0) {
        rec.until = Date.now() + schedule.lockMs;
        rec.permanent = false;
    } else {
        rec.until = 0;
        rec.permanent = false;
    }
    rec.level = schedule.level;
    _saveLockRecord(rec);
    return rec;
}

/** Tentatives restantes avant le prochain palier de blocage */
function _remainingAttempts() {
    const rec = _getLockRecord();
    const att = rec.attempts || 0;
    // Prochain palier avec blocage
    const nextLock = AUTH_LOCKOUT_SCHEDULE.find(s => s.lockMs > 0 && s.from > att);
    if (!nextLock) return 0;
    return nextLock.from - att;
}

/* ── Code de secours administrateur ────────────────────────── */

/**
 * Génère et stocke un code de secours admin (6 chiffres aléatoires).
 * Retourne le code en clair une seule fois pour affichage.
 * Appelé lors de la première création du PIN.
 */
async function _generateRescueCode() {
    // Générer 6 chiffres aléatoires
    const arr   = crypto.getRandomValues(new Uint8Array(6));
    const code  = Array.from(arr).map(b => (b % 10).toString()).join('');
    const hashed = await _hashPIN(code);
    localStorage.setItem(AUTH_RESCUE_KEY, JSON.stringify(hashed));
    return code; // retourné UNE SEULE FOIS pour affichage admin
}

async function _verifyRescueCode(code) {
    try {
        const stored = JSON.parse(localStorage.getItem(AUTH_RESCUE_KEY));
        if (!stored) return false;
        const result = await _hashPIN(code, stored.salt);
        return result.hash === stored.hash;
    } catch { return false; }
}

/** Réinitialise le verrouillage après vérification du code de secours */
async function _recoverWithAdminCode(code) {
    const ok = await _verifyRescueCode(code);
    if (!ok) return false;
    _clearLockRecord();
    // Invalider le PIN existant : forcer re-création
    localStorage.removeItem(AUTH_KEY);
    // Régénérer un nouveau code de secours
    const newCode = await _generateRescueCode();
    return { success: true, newRescueCode: newCode };
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

    // ── Verrouillage permanent ────────────────────────────────
    if (_isPermanentlyLocked()) {
        _showPermanentLockScreen(opts);
        return;
    }

    _lockOverlay = document.createElement('div');
    _lockOverlay.id = 'rv-auth-overlay';

    const locked   = _isLocked();
    const lockEnd  = _lockUntil();
    const rec      = _getLockRecord();
    const attempts = rec.attempts || 0;
    const level    = rec.level || 'warning';
    const rem      = _remainingAttempts();

    // Message contextuel selon le niveau
    let hintHtml = '';
    if (!locked && attempts > 0) {
        if (level === 'warning' || attempts < 4) {
            const tentLabel = rem === 1 ? 'tentative' : 'tentatives';
            hintHtml = `<div class="rv-auth-hint rv-auth-hint--${level}">
                <span class="material-icons" style="font-size:13px;">warning_amber</span>
                ${rem} ${tentLabel} restante${rem > 1 ? 's' : ''} avant blocage temporaire
            </div>`;
        }
    }

    // Badge niveau de menace pour tentatives 4+
    let threatBadge = '';
    if (attempts >= 7 && !locked) {
        threatBadge = `<div class="rv-auth-threat-badge rv-auth-threat--critical">
            <span class="material-icons">gpp_bad</span>
            ALERTE SÉCURITÉ — Prochain échec : verrouillage 24h
        </div>`;
    } else if (attempts >= 4 && !locked) {
        const lockNames = { moderate:'30 secondes', serious:'5 minutes', severe:'30 minutes' };
        const nextSchedule = _getLockSchedule(attempts + 1);
        const nextLockName = lockNames[nextSchedule?.level] || '';
        if (nextLockName) {
            threatBadge = `<div class="rv-auth-threat-badge rv-auth-threat--${nextSchedule.level}">
                <span class="material-icons">shield</span>
                Prochain échec : blocage ${nextLockName}
            </div>`;
        }
    }

    _lockOverlay.innerHTML = `
        <div class="rv-auth-card rv-auth-dark${locked ? ' rv-auth-locked-state' : ''}${level === 'critical' ? ' rv-auth-critical-state' : ''}"
             role="dialog" aria-modal="true" aria-label="Authentification administrateur">

            <div class="rv-auth-logo">
                <img src="logo-risevanilla.svg" alt="RiseVanilla" onerror="this.style.display='none'">
            </div>
            <div class="rv-auth-title">
                <span class="material-icons rv-auth-lock-icon">${locked ? 'lock_clock' : 'lock'}</span>
                RISEVANILLA
            </div>
            <div class="rv-auth-subtitle">Entrez votre code PIN administrateur</div>

            ${threatBadge}
            <div id="rv-auth-error" class="rv-auth-error" style="display:none;"></div>

            <div class="rv-auth-dots" id="rv-auth-dots" aria-hidden="true">
                <span></span><span></span><span></span><span></span>
            </div>

            <div class="rv-pin-pad" id="rv-pin-pad"${locked ? ' style="pointer-events:none;opacity:.35;"' : ''}>
                ${[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map(k => `
                    <button class="rv-pin-key${k==='' ? ' rv-pin-key--empty' : ''}${k==='⌫' ? ' rv-pin-key--del' : ''}"
                            data-key="${k}" ${k==='' ? 'disabled' : ''} aria-label="${k === '⌫' ? 'Effacer' : k}">
                        ${k}
                    </button>`).join('')}
            </div>

            ${locked ? `
            <div class="rv-auth-lockout rv-auth-lockout--${level}" id="rv-auth-lockout">
                <span class="material-icons">${level === 'critical' ? 'gpp_bad' : 'timer'}</span>
                <span id="rv-auth-countdown">
                    ${level === 'critical' ? 'ALERTE — Accès bloqué 24h. Réessayez dans' : 'Accès bloqué. Réessayez dans'}
                    <strong id="rv-auth-timer"></strong>
                </span>
            </div>` : ''}

            ${hintHtml}

            ${isInline ? `<button class="rv-auth-cancel-btn" id="rv-auth-cancel">Annuler</button>` : ''}

            <button class="rv-auth-rescue-link" id="rv-auth-rescue-toggle" type="button">
                <span class="material-icons" style="font-size:13px;">help_outline</span>
                Code de secours administrateur
            </button>
            <div id="rv-auth-rescue-panel" class="rv-auth-rescue-panel" style="display:none;">
                <div class="rv-auth-rescue-panel__label">Entrez le code de secours à 6 chiffres :</div>
                <input type="text" id="rv-auth-rescue-input" class="rv-auth-rescue-input"
                       maxlength="6" inputmode="numeric" pattern="[0-9]*"
                       placeholder="• • • • • •" autocomplete="off">
                <button class="rv-auth-rescue-btn" id="rv-auth-rescue-submit">
                    <span class="material-icons" style="font-size:15px;">vpn_key</span>
                    Valider le code
                </button>
                <div id="rv-auth-rescue-error" class="rv-auth-rescue-error" style="display:none;">Code incorrect.</div>
            </div>
        </div>
    `;

    document.body.appendChild(_lockOverlay);

    // Focus trap
    const firstKey = _lockOverlay.querySelector('.rv-pin-key:not([disabled])');
    if (firstKey && !locked) firstKey.focus();

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

    // Panel code de secours
    const rescueToggle = _lockOverlay.querySelector('#rv-auth-rescue-toggle');
    const rescuePanel  = _lockOverlay.querySelector('#rv-auth-rescue-panel');
    if (rescueToggle && rescuePanel) {
        rescueToggle.addEventListener('click', () => {
            const open = rescuePanel.style.display !== 'none';
            rescuePanel.style.display = open ? 'none' : 'block';
            if (!open) rescuePanel.querySelector('#rv-auth-rescue-input')?.focus();
        });
    }

    const rescueSubmit = _lockOverlay.querySelector('#rv-auth-rescue-submit');
    if (rescueSubmit) {
        rescueSubmit.addEventListener('click', () => _handleRescueSubmit(opts));
    }
    const rescueInput = _lockOverlay.querySelector('#rv-auth-rescue-input');
    if (rescueInput) {
        rescueInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') _handleRescueSubmit(opts);
        });
    }

    // Stocker les callbacks
    _lockOverlay._onSuccess = onSuccess;
    _lockOverlay._onCancel  = onCancel;
    _lockOverlay._pin = '';
}

/** Soumission du code de secours admin */
async function _handleRescueSubmit(opts) {
    const input  = document.getElementById('rv-auth-rescue-input');
    const errEl  = document.getElementById('rv-auth-rescue-error');
    const btn    = document.getElementById('rv-auth-rescue-submit');
    if (!input) return;

    const code = input.value.trim().replace(/\D/g, '');
    if (code.length !== 6) {
        if (errEl) { errEl.textContent = 'Le code doit comporter 6 chiffres.'; errEl.style.display = 'block'; }
        return;
    }

    if (btn) btn.disabled = true;
    const result = await _recoverWithAdminCode(code);

    if (result && result.success) {
        _removeLockScreen();
        // Afficher le nouveau code de secours
        _showNewRescueCodeModal(result.newRescueCode, () => {
            _showSetupScreen();
            showToast('🔓 Verrouillage levé. Créez un nouveau PIN.', 'success', 5000);
        });
    } else {
        if (errEl) { errEl.textContent = 'Code de secours incorrect.'; errEl.style.display = 'block'; }
        if (btn) btn.disabled = false;
        input.value = '';
        input.focus();
    }
}

/** Écran de verrouillage permanent */
function _showPermanentLockScreen(opts = {}) {
    _lockOverlay = document.createElement('div');
    _lockOverlay.id = 'rv-auth-overlay';

    _lockOverlay.innerHTML = `
        <div class="rv-auth-card rv-auth-dark rv-auth-permanent-card"
             role="dialog" aria-modal="true" aria-label="Application verrouillée">
            <div class="rv-auth-permanent-icon">
                <span class="material-icons">lock_person</span>
            </div>
            <div class="rv-auth-title" style="color:#ffb4ab;">
                <span class="material-icons" style="color:#ffb4ab;">security</span>
                ACCÈS BLOQUÉ
            </div>
            <div class="rv-auth-permanent-desc">
                Trop de tentatives incorrectes ont été détectées.<br>
                L'application est <strong>verrouillée définitivement</strong>.<br>
                Seul le code de secours administrateur permet la récupération.
            </div>

            <div class="rv-auth-rescue-panel rv-auth-rescue-panel--permanent" style="display:block;">
                <div class="rv-auth-rescue-panel__label">Code de secours administrateur (6 chiffres) :</div>
                <input type="text" id="rv-auth-rescue-input" class="rv-auth-rescue-input"
                       maxlength="6" inputmode="numeric" pattern="[0-9]*"
                       placeholder="• • • • • •" autocomplete="off">
                <button class="rv-auth-rescue-btn" id="rv-auth-rescue-submit">
                    <span class="material-icons" style="font-size:15px;">vpn_key</span>
                    Déverrouiller
                </button>
                <div id="rv-auth-rescue-error" class="rv-auth-rescue-error" style="display:none;">Code incorrect.</div>
            </div>
        </div>
    `;

    document.body.appendChild(_lockOverlay);

    _lockOverlay._keyHandler = e => { if (e.key === 'Enter') _handleRescueSubmit(opts); };
    document.addEventListener('keydown', _lockOverlay._keyHandler);

    _lockOverlay.querySelector('#rv-auth-rescue-submit')
        ?.addEventListener('click', () => _handleRescueSubmit(opts));
    _lockOverlay.querySelector('#rv-auth-rescue-input')
        ?.addEventListener('keydown', e => { if (e.key === 'Enter') _handleRescueSubmit(opts); });

    _lockOverlay._onSuccess = opts.onSuccess || null;
    _lockOverlay._onCancel  = opts.onCancel  || null;

    // Focus
    setTimeout(() => _lockOverlay?.querySelector('#rv-auth-rescue-input')?.focus(), 100);
}

/** Modal affichant le nouveau code de secours après récupération */
function _showNewRescueCodeModal(code, onClose) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position:fixed;inset:0;z-index:9999999;
        background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;padding:16px;
    `;
    modal.innerHTML = `
        <div style="background:#2D2B33;border:1px solid #5A5766;border-radius:20px;padding:28px 24px;
                    max-width:340px;width:100%;text-align:center;box-shadow:0 32px 80px rgba(0,0,0,0.6);">
            <span class="material-icons" style="font-size:40px;color:#a5d6a7;margin-bottom:12px;display:block;">vpn_key</span>
            <div style="font-size:17px;font-weight:700;color:#F0EDF4;margin-bottom:8px;">Nouveau code de secours</div>
            <div style="font-size:13px;color:#D8D2E2;margin-bottom:16px;line-height:1.5;">
                Notez ce code en lieu sûr. Il ne sera <strong style="color:#ffb4ab;">plus affiché</strong>.
            </div>
            <div style="font-size:28px;font-weight:800;letter-spacing:10px;color:#a5d6a7;
                        background:#3A3742;border-radius:12px;padding:12px 16px;margin-bottom:20px;
                        font-family:monospace;">${code}</div>
            <button id="rv-rescue-modal-close-btn"
                    style="background:#D8D2E2;color:#504858;border:none;border-radius:20px;
                           padding:10px 28px;font-size:14px;font-weight:600;cursor:pointer;">
                J'ai noté ce code
            </button>
        </div>
    `;
    document.body.appendChild(modal);

    const closeModal = () => {
        modal.remove();
        document.body.style.overflow = '';
        if (typeof onClose === 'function') onClose();
    };
    document.body.style.overflow = 'hidden';
    modal.querySelector('#rv-rescue-modal-close-btn').addEventListener('click', closeModal);
}

let _pinBuffer = '';

function _pinAppend(digit) {
    if (_pinBuffer.length >= 4) return;
    _pinBuffer += digit;
    _updateDots(_pinBuffer.length);

    if (_pinBuffer.length === 4) {
        // Déclencher vérif dès les 4 chiffres saisis
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
        const level = rec.level || 'warning';

        if (rec.permanent) {
            // Verrouillage permanent immédiat
            _showPermanentLockScreen({
                onSuccess: _lockOverlay?._onSuccess,
                onCancel:  _lockOverlay?._onCancel,
                inline:    !!_lockOverlay?.querySelector('#rv-auth-cancel'),
            });
            return;
        }

        if (rec.until > Date.now()) {
            // Blocage temporaire — reconstruire l'écran avec countdown
            const onSuccessCb = _lockOverlay?._onSuccess;
            const onCancelCb  = _lockOverlay?._onCancel;
            const isInlineCb  = !!_lockOverlay?.querySelector('#rv-auth-cancel');
            _showLockScreen({ onSuccess: onSuccessCb, onCancel: onCancelCb, inline: isInlineCb });
        } else {
            // Avertissement simple
            if (errEl) {
                const rem = _remainingAttempts();
                let msg = `PIN incorrect.`;
                if (rec.attempts === 3) {
                    msg = `PIN incorrect. ⚠️ Prochain échec : blocage 30 secondes.`;
                } else if (rec.attempts === 6) {
                    msg = `PIN incorrect. ⚠️ Prochain échec : blocage 30 minutes.`;
                } else if (rem > 0) {
                    const tentLabel = rem === 1 ? 'tentative' : 'tentatives';
                    msg = `PIN incorrect — ${rem} ${tentLabel} avant blocage.`;
                } else {
                    msg = `PIN incorrect.`;
                }
                errEl.textContent = msg;
                errEl.style.display = 'block';
                errEl.className = `rv-auth-error rv-auth-error--${level}`;

                const card = _lockOverlay?.querySelector('.rv-auth-card');
                if (card) {
                    card.classList.add('rv-auth-shake');
                    setTimeout(() => card.classList.remove('rv-auth-shake'), 600);
                }
                // Effacer l'erreur après 3s
                setTimeout(() => { if (errEl) errEl.style.display = 'none'; }, 3000);
            }
            if (pad) pad.style.pointerEvents = '';
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
        <div class="rv-auth-card rv-auth-dark rv-auth-setup-card" role="dialog" aria-modal="true" aria-label="Configuration du PIN administrateur">
            <div class="rv-auth-logo">
                <img src="logo-risevanilla.svg" alt="RiseVanilla" onerror="this.style.display='none'">
            </div>
            <div class="rv-auth-title">Bienvenue sur RISEVANILLA</div>
            <div class="rv-auth-subtitle rv-auth-setup-sub">
                Créez un code PIN à 4 chiffres pour sécuriser l'accès administrateur.
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

    const confirmBtn = document.getElementById('rv-setup-confirm');

    // Override: écouter les dots pour détecter pin complet
    const origPinAppend = _pinAppend.toString();

    // Setup listener custom
    _lockOverlay._setupPinHandler = async (pin) => {
        const state = _lockOverlay._setupState;
        if (state.step === 1) {
            if (pin.length < 4) {
                _showSetupError('Le PIN doit comporter 4 chiffres.');
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
                if (sub) sub.textContent = 'Créez un code PIN à 4 chiffres.';
                return;
            }
            // Sauvegarder
            try {
                const hashed = await _hashPIN(pin);
                localStorage.setItem(AUTH_KEY, JSON.stringify(hashed));

                // Générer le code de secours admin si pas encore existant
                let rescueCode = null;
                if (!localStorage.getItem(AUTH_RESCUE_KEY)) {
                    rescueCode = await _generateRescueCode();
                }

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

                // Afficher le code de secours admin une seule fois
                if (rescueCode) {
                    setTimeout(() => _showNewRescueCodeModal(rescueCode), 400); // Pas de callback ici, car le flux normal continue
                }
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
    if (_pinBuffer.length >= 4) return;
    _pinBuffer += digit;
    _updateDots(_pinBuffer.length);

    const confirmBtn = document.getElementById('rv-setup-confirm');
    if (confirmBtn) {
        confirmBtn.disabled = _pinBuffer.length < 4;
    }

    // Mode unlock normal (exactement 4 chiffres et pas en mode setup)
    if (!_lockOverlay?._setupPinHandler && _pinBuffer.length === 4) {
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
                La session expire après 30 min d'inactivité.<br>
                <strong>Verrouillage progressif</strong> : 30s → 5min → 30min → 24h → permanent (10 tentatives).
                Récupération via code de secours admin.</span>
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
    // Note : exportData / importData / resetData sont protégées directement
    // dans db.js via requireAuth() — aucun wrap externe nécessaire ici.

    // Rendre le panneau settings PIN
    renderPinSettingsPanel();

    // Bouton cadenas dans le header
    const lockBtn = document.getElementById('rv-lock-btn');
    if (lockBtn) {
        lockBtn.style.display = 'flex';
        lockBtn.addEventListener('click', lockSession);
    }
}
