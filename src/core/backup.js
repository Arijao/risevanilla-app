/* ============================================================
 * BACKUP.JS — Sauvegarde Automatique Sécurisée (Offline-First)
 * RISEVANILLA - Gestion de Collecte de Vanille
 * ============================================================
 *
 * Stratégie 3 couches :
 *   Couche 1 — IndexedDB  (données primaires — géré par db.js)
 *   Couche 2 — localStorage miroir (snapshot JSON compressé)
 *              → détection de perte au démarrage
 *   Couche 3 — Téléchargement JSON (export manuel + suggestion auto)
 *
 * Pourquoi le localStorage comme miroir ?
 *   IndexedDB et le cache navigateur sont supprimés ensemble lors
 *   d'un "Effacer les données du site". Le localStorage suit le même
 *   sort MAIS il est vidé EN DERNIER et rarement par "Effacer le cache"
 *   seul (qui ne touche pas localStorage). Ce décalage constitue une
 *   fenêtre de détection exploitable au prochain démarrage.
 *
 * Limitation connue (et assumée) :
 *   "Effacer toutes les données du site" supprime tout simultanément.
 *   Dans ce cas, seul l'export JSON (Couche 3) peut restaurer les données.
 *   C'est pourquoi la suggestion d'export périodique est maintenue.
 * ============================================================ */

'use strict';

// ── Configuration ─────────────────────────────────────────────
const BACKUP_CONFIG = {
    // Clés localStorage
    MIRROR_KEY:        'risevanilla_mirror_v1',  // snapshot JSON des données
    MIRROR_META_KEY:   'risevanilla_mirror_meta', // métadonnées du miroir
    LAST_EXPORT_KEY:   'risevanilla_last_export', // date du dernier export fichier
    EXPORT_COUNT_KEY:  'risevanilla_export_count',// nb de modifications depuis export

    // Intervalles
    AUTO_MIRROR_INTERVAL_MS:  5 * 60 * 1000,  // miroir localStorage toutes les 5 min
    EXPORT_SUGGEST_THRESHOLD: 50,              // suggérer export après N modifications
    EXPORT_SUGGEST_DAYS:      3,               // ou si export > 3 jours
};

// ── Compteur de modifications ─────────────────────────────────
let _modificationCount = 0;
let _autoMirrorTimer   = null;
let _backupInitialized = false;

// ─────────────────────────────────────────────────────────────
// INITIALISATION
// ─────────────────────────────────────────────────────────────

/**
 * Point d'entrée principal.
 * À appeler dans main.js après initDB() et loadData().
 * Utilise un léger délai pour laisser loadData() terminer.
 */
function initBackupSystem() {
    if (_backupInitialized) return;
    _backupInitialized = true;

    // Attendre que les données soient chargées (IndexedDB async)
    setTimeout(() => {
        _checkDataIntegrity();
        _startAutoMirror();
        _loadModificationCount();
        console.log('[BACKUP] Système de sauvegarde initialisé.');
    }, 1500);
}

// ─────────────────────────────────────────────────────────────
// COUCHE 2 — MIROIR localStorage
// ─────────────────────────────────────────────────────────────

/**
 * Prend un snapshot de appData et le stocke dans localStorage.
 * Appelé automatiquement toutes les 5 min et après chaque modification.
 */
function saveMirror() {
    try {
        const snapshot = {
            collectors:     appData.collectors     || [],
            advances:       appData.advances       || [],
            receptions:     appData.receptions     || [],
            deliveries:     appData.deliveries     || [],
            expenses:       appData.expenses       || [],
            qualities:      appData.qualities      || [],
            remboursements: appData.remboursements || [],
            paiements:      appData.paiements      || [],
        };

        const totalItems = Object.values(snapshot).reduce((s, arr) => s + arr.length, 0);

        // Ne pas écraser un miroir existant avec des données vides
        // (protection contre un démarrage en erreur)
        if (totalItems === 0) {
            const existing = _readMirrorMeta();
            if (existing && existing.totalItems > 0) {
                console.warn('[BACKUP] Miroir non mis à jour : données actuelles vides, miroir existant conservé.');
                return;
            }
        }

        const meta = {
            savedAt:    new Date().toISOString(),
            totalItems,
            version:    '1.0',
        };

        localStorage.setItem(BACKUP_CONFIG.MIRROR_KEY,      JSON.stringify(snapshot));
        localStorage.setItem(BACKUP_CONFIG.MIRROR_META_KEY, JSON.stringify(meta));

        console.log(`[BACKUP] Miroir sauvegardé — ${totalItems} enregistrements.`);
    } catch (err) {
        // localStorage peut être plein (quota) ou désactivé en navigation privée
        console.warn('[BACKUP] Échec miroir localStorage :', err.message);
    }
}

/**
 * Lit le miroir localStorage.
 * @returns {Object|null} les données miroir ou null si absent/corrompu
 */
function readMirror() {
    try {
        const raw = localStorage.getItem(BACKUP_CONFIG.MIRROR_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function _readMirrorMeta() {
    try {
        const raw = localStorage.getItem(BACKUP_CONFIG.MIRROR_META_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

/**
 * Lance la sauvegarde miroir automatique périodique.
 */
function _startAutoMirror() {
    if (_autoMirrorTimer) clearInterval(_autoMirrorTimer);
    _autoMirrorTimer = setInterval(() => {
        saveMirror();
    }, BACKUP_CONFIG.AUTO_MIRROR_INTERVAL_MS);

    // Premier miroir immédiat si données présentes
    const total = Object.values(appData).reduce((s, v) => s + (Array.isArray(v) ? v.length : 0), 0);
    if (total > 0) saveMirror();
}

// ─────────────────────────────────────────────────────────────
// DÉTECTION DE PERTE DE DONNÉES
// ─────────────────────────────────────────────────────────────

/**
 * Vérifie au démarrage si IndexedDB semble vide alors que le miroir
 * contient des données → propose la restauration.
 */
function _checkDataIntegrity() {
    const mirror = readMirror();
    const meta   = _readMirrorMeta();
    if (!mirror || !meta || meta.totalItems === 0) return;

    const currentTotal = Object.values(appData)
        .reduce((s, v) => s + (Array.isArray(v) ? v.length : 0), 0);

    if (currentTotal === 0 && meta.totalItems > 0) {
        console.warn(`[BACKUP] Perte de données détectée ! Miroir contient ${meta.totalItems} enregistrements.`);
        _showDataLossAlert(meta);
    }
}

/**
 * Affiche une alerte modale proposant la restauration depuis le miroir.
 */
async function _showDataLossAlert(meta) {
    const savedDate = new Date(meta.savedAt).toLocaleString('fr-FR');

    // Attendre que confirmModal soit disponible (chargé après)
    await _waitForFunction('confirmModal');

    const ok = await confirmModal({
        title:       '⚠️ Données manquantes détectées',
        message:     `Les données locales semblent avoir été effacées.\n\nUn miroir de sauvegarde automatique a été trouvé :\n• ${meta.totalItems} enregistrements\n• Sauvegardé le : ${savedDate}\n\nVoulez-vous restaurer ces données ?`,
        confirmText: 'Restaurer maintenant',
        cancelText:  'Ignorer',
        variant:     'warning',
        icon:        'restore',
    });

    if (ok) {
        restoreFromMirror();
    } else {
        showToast('Restauration annulée. Vous pouvez importer un fichier JSON manuellement.', 'info', 5000);
    }
}

// ─────────────────────────────────────────────────────────────
// RESTAURATION DEPUIS LE MIROIR
// ─────────────────────────────────────────────────────────────

/**
 * Restaure les données depuis le miroir localStorage vers IndexedDB.
 * Peut être appelé manuellement depuis l'UI.
 */
async function restoreFromMirror() {
    const mirror = readMirror();
    if (!mirror) {
        showToast('Aucun miroir de sauvegarde disponible.', 'error');
        return;
    }

    const totalItems = Object.values(mirror).reduce((s, arr) => s + (Array.isArray(arr) ? arr.length : 0), 0);
    if (totalItems === 0) {
        showToast('Le miroir de sauvegarde est vide.', 'warning');
        return;
    }

    try {
        showToast('⏳ Restauration en cours…', 'info', 3000);

        await new Promise(resolve => {
            executeWhenReady(() => {
                clearAllData(() => {
                    importNewData(mirror);
                    resolve();
                });
            });
        });

        // Rafraîchir le miroir après restauration
        setTimeout(() => {
            saveMirror();
            showToast(`✅ Restauration réussie — ${totalItems} enregistrements restaurés.`, 'success', 5000);
        }, 800);

    } catch (err) {
        console.error('[BACKUP] Erreur restauration miroir :', err);
        showToast('Erreur lors de la restauration. Essayez d\'importer un fichier JSON.', 'error');
    }
}

// ─────────────────────────────────────────────────────────────
// COUCHE 3 — EXPORT JSON (sauvegarde fichier)
// ─────────────────────────────────────────────────────────────

/**
 * Export JSON complet vers un fichier téléchargeable.
 * Réinitialise le compteur de modifications.
 */
function exportBackupJSON() {
    const dataToExport = {
        collectors:     appData.collectors     || [],
        advances:       appData.advances       || [],
        receptions:     appData.receptions     || [],
        deliveries:     appData.deliveries     || [],
        qualities:      appData.qualities      || [],
        expenses:       appData.expenses       || [],
        remboursements: appData.remboursements || [],
        paiements:      appData.paiements      || [],
        exportDate:     new Date().toISOString(),
        version:        '2.0',
        _backup:        { source: 'backup-system', mirrorMeta: _readMirrorMeta() },
    };

    const dateStr   = new Date().toISOString().split('T')[0];
    const timeStr   = new Date().toTimeString().slice(0, 5).replace(':', 'h');
    const fileName  = `risevanilla-backup-${dateStr}-${timeStr}.json`;

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), { href: url, download: fileName });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Mettre à jour les métadonnées d'export
    localStorage.setItem(BACKUP_CONFIG.LAST_EXPORT_KEY, new Date().toISOString());
    _resetModificationCount();

    // Mettre à jour le miroir aussi
    saveMirror();

    showToast(`✅ Sauvegarde exportée : ${fileName}`, 'success', 4000);
    _updateBackupUI();
}

// ─────────────────────────────────────────────────────────────
// SUGGESTION D'EXPORT PÉRIODIQUE
// ─────────────────────────────────────────────────────────────

/**
 * Incrémente le compteur de modifications et vérifie si une
 * suggestion d'export doit être affichée.
 * À appeler après chaque saveToDB réussi.
 */
function onDataModified() {
    _modificationCount++;
    _saveModificationCount();

    // Mettre à jour le miroir immédiatement (pas d'attente du timer)
    saveMirror();

    // Vérifier si on doit suggérer un export
    _checkExportSuggestion();
    _updateBackupUI();
}

function _checkExportSuggestion() {
    const lastExportStr = localStorage.getItem(BACKUP_CONFIG.LAST_EXPORT_KEY);
    const daysSinceExport = lastExportStr
        ? (Date.now() - new Date(lastExportStr).getTime()) / (1000 * 60 * 60 * 24)
        : Infinity;

    const shouldSuggest =
        _modificationCount >= BACKUP_CONFIG.EXPORT_SUGGEST_THRESHOLD ||
        daysSinceExport     >= BACKUP_CONFIG.EXPORT_SUGGEST_DAYS;

    if (shouldSuggest) {
        _showExportSuggestionBanner();
    }
}

/**
 * Affiche une bannière (non bloquante) suggérant un export.
 */
function _showExportSuggestionBanner() {
    // Éviter d'afficher plusieurs fois de suite
    if (document.getElementById('backup-suggest-banner')) return;

    const banner = document.createElement('div');
    banner.id    = 'backup-suggest-banner';
    Object.assign(banner.style, {
        position:     'fixed',
        bottom:       '72px',
        left:         '50%',
        transform:    'translateX(-50%)',
        background:   'var(--md-sys-color-tertiary-container, #f3e5ab)',
        color:        'var(--md-sys-color-on-tertiary-container, #1c1b00)',
        padding:      '12px 16px',
        borderRadius: '12px',
        boxShadow:    '0 4px 24px rgba(0,0,0,0.25)',
        zIndex:       '99998',
        display:      'flex',
        alignItems:   'center',
        gap:          '12px',
        fontSize:     '13px',
        maxWidth:     '90vw',
        fontFamily:   'inherit',
    });

    banner.innerHTML = `
        <span class="material-icons" style="font-size:20px;flex-shrink:0;">backup</span>
        <span style="flex:1;">💾 <strong>${_modificationCount} modifications</strong> non sauvegardées en fichier. Exportez pour sécuriser vos données.</span>
        <button id="backup-suggest-now" style="
            background: var(--md-sys-color-primary,#6750a4);
            color: var(--md-sys-color-on-primary,#fff);
            border: none; border-radius: 8px; padding: 6px 14px;
            font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap;
        ">Exporter</button>
        <button id="backup-suggest-dismiss" style="
            background: transparent; border: 1px solid currentColor;
            border-radius: 8px; padding: 6px 10px; font-size: 12px;
            cursor: pointer; opacity: 0.7; white-space: nowrap;
        ">Plus tard</button>
    `;

    document.body.appendChild(banner);

    document.getElementById('backup-suggest-now').addEventListener('click', () => {
        banner.remove();
        exportBackupJSON();
    });
    document.getElementById('backup-suggest-dismiss').addEventListener('click', () => {
        banner.remove();
        // Réinitialiser le compteur pour ne pas re-proposer immédiatement
        _resetModificationCount();
    });

    // Auto-fermeture après 15 secondes
    setTimeout(() => banner.remove(), 15000);
}

// ─────────────────────────────────────────────────────────────
// UI — PANNEAU DE SAUVEGARDE (section Paramètres)
// ─────────────────────────────────────────────────────────────

/**
 * Insère le panneau de sauvegarde dans la section Paramètres.
 * À appeler une fois le DOM prêt.
 */
function renderBackupPanel() {
    const target = document.querySelector('#settings .form-container');
    if (!target) return;
    if (document.getElementById('backup-panel')) return; // déjà inséré

    // Chercher le groupe "Gestion des Données" existant pour insérer juste avant
    const dataGroup = [...target.querySelectorAll('.form-group')]
        .find(el => el.querySelector('.btn-group'));

    const panel = document.createElement('div');
    panel.id    = 'backup-panel';
    Object.assign(panel.style, {
        background:   'var(--md-sys-color-secondary-container)',
        padding:      '20px',
        borderRadius: '12px',
        marginBottom: '20px',
    });

    panel.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
            <span class="material-icons" style="color:var(--md-sys-color-primary);font-size:32px;">shield</span>
            <div>
                <div style="font-weight:600;font-size:16px;margin-bottom:2px;">🔒 Sauvegarde Automatique</div>
                <div style="font-size:13px;color:var(--md-sys-color-on-surface-variant);">
                    Miroir local actif • Export fichier recommandé
                </div>
            </div>
        </div>

        <!-- Statut -->
        <div id="backup-status-grid" style="
            display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">

            <div style="background:var(--md-sys-color-surface);border-radius:8px;padding:12px;">
                <div style="font-size:11px;color:var(--md-sys-color-on-surface-variant);margin-bottom:4px;">
                    <span class="material-icons" style="font-size:14px;vertical-align:middle;">storage</span>
                    Miroir local
                </div>
                <div id="backup-mirror-status" style="font-weight:600;font-size:13px;">—</div>
            </div>

            <div style="background:var(--md-sys-color-surface);border-radius:8px;padding:12px;">
                <div style="font-size:11px;color:var(--md-sys-color-on-surface-variant);margin-bottom:4px;">
                    <span class="material-icons" style="font-size:14px;vertical-align:middle;">file_download</span>
                    Dernier export fichier
                </div>
                <div id="backup-last-export" style="font-weight:600;font-size:13px;">Jamais</div>
            </div>

            <div style="background:var(--md-sys-color-surface);border-radius:8px;padding:12px;">
                <div style="font-size:11px;color:var(--md-sys-color-on-surface-variant);margin-bottom:4px;">
                    <span class="material-icons" style="font-size:14px;vertical-align:middle;">edit_note</span>
                    Modif. depuis export
                </div>
                <div id="backup-mod-count" style="font-weight:600;font-size:13px;">0</div>
            </div>

            <div style="background:var(--md-sys-color-surface);border-radius:8px;padding:12px;">
                <div style="font-size:11px;color:var(--md-sys-color-on-surface-variant);margin-bottom:4px;">
                    <span class="material-icons" style="font-size:14px;vertical-align:middle;">inventory_2</span>
                    Enregistrements
                </div>
                <div id="backup-record-count" style="font-weight:600;font-size:13px;">—</div>
            </div>
        </div>

        <!-- Actions -->
        <div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:12px;">
            <button class="btn btn-primary" onclick="exportBackupJSON()" style="flex:1;min-width:160px;">
                <span class="material-icons">backup</span>
                Sauvegarder (JSON)
            </button>
            <button class="btn btn-outline" onclick="saveMirror(); showToast('Miroir mis à jour.', 'success', 2000); _updateBackupUI();" style="flex:1;min-width:160px;">
                <span class="material-icons">sync</span>
                Forcer le miroir
            </button>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:10px;">
            <button class="btn btn-secondary" onclick="restoreFromMirror()" style="flex:1;min-width:160px;">
                <span class="material-icons">restore</span>
                Restaurer le miroir
            </button>
        </div>

        <!-- Info -->
        <div style="
            margin-top:14px;font-size:12px;
            color:var(--md-sys-color-on-surface-variant);
            padding:10px 12px;
            background:var(--md-sys-color-surface-variant);
            border-radius:8px;
            border-left:3px solid var(--md-sys-color-primary);
            line-height:1.6;">
            <span class="material-icons" style="font-size:15px;vertical-align:middle;">info</span>
            <strong>Conseil :</strong> Exportez régulièrement un fichier JSON sur votre appareil ou cloud.
            Le miroir local est une protection rapide, mais il peut être perdu si toutes les données du navigateur sont effacées simultanément.
        </div>
    `;

    if (dataGroup) {
        target.insertBefore(panel, dataGroup);
    } else {
        target.appendChild(panel);
    }

    _updateBackupUI();
}

/**
 * Met à jour les indicateurs du panneau de sauvegarde.
 */
function _updateBackupUI() {
    // Miroir
    const meta = _readMirrorMeta();
    const mirrorEl = document.getElementById('backup-mirror-status');
    if (mirrorEl) {
        if (meta) {
            const d = new Date(meta.savedAt);
            const timeAgo = _timeAgo(d);
            mirrorEl.innerHTML = `<span style="color:var(--md-sys-color-primary);">✓ ${timeAgo}</span>`;
        } else {
            mirrorEl.textContent = 'Aucun miroir';
        }
    }

    // Dernier export
    const lastExport = localStorage.getItem(BACKUP_CONFIG.LAST_EXPORT_KEY);
    const exportEl   = document.getElementById('backup-last-export');
    if (exportEl) {
        exportEl.textContent = lastExport
            ? _timeAgo(new Date(lastExport))
            : 'Jamais';
        exportEl.style.color = !lastExport || _daysSince(lastExport) > 3
            ? 'var(--md-sys-color-error, #ba1a1a)'
            : 'inherit';
    }

    // Compteur modifications
    const modEl = document.getElementById('backup-mod-count');
    if (modEl) {
        modEl.textContent = _modificationCount;
        modEl.style.color = _modificationCount >= BACKUP_CONFIG.EXPORT_SUGGEST_THRESHOLD
            ? 'var(--md-sys-color-error, #ba1a1a)'
            : 'inherit';
    }

    // Nombre d'enregistrements
    const recEl = document.getElementById('backup-record-count');
    if (recEl) {
        const total = Object.values(appData)
            .reduce((s, v) => s + (Array.isArray(v) ? v.length : 0), 0);
        recEl.textContent = `${total} enreg.`;
    }
}

// ─────────────────────────────────────────────────────────────
// COMPTEUR DE MODIFICATIONS (persisté en localStorage)
// ─────────────────────────────────────────────────────────────

function _loadModificationCount() {
    const saved = parseInt(localStorage.getItem(BACKUP_CONFIG.EXPORT_COUNT_KEY), 10);
    _modificationCount = isNaN(saved) ? 0 : saved;
    _updateBackupUI();
}

function _saveModificationCount() {
    localStorage.setItem(BACKUP_CONFIG.EXPORT_COUNT_KEY, _modificationCount);
}

function _resetModificationCount() {
    _modificationCount = 0;
    _saveModificationCount();
}

// ─────────────────────────────────────────────────────────────
// UTILITAIRES
// ─────────────────────────────────────────────────────────────

function _timeAgo(date) {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60)   return 'À l\'instant';
    if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} min`;
    if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)} h`;
    return `Il y a ${Math.floor(seconds / 86400)} j`;
}

function _daysSince(isoString) {
    return (Date.now() - new Date(isoString).getTime()) / (1000 * 60 * 60 * 24);
}

/**
 * Attend qu'une fonction globale soit disponible (chargement asynchrone des scripts).
 */
function _waitForFunction(name, timeoutMs = 5000) {
    return new Promise((resolve, reject) => {
        const start = Date.now();
        const check = () => {
            if (typeof window[name] === 'function') return resolve();
            if (Date.now() - start > timeoutMs)     return reject(new Error(`${name} timeout`));
            setTimeout(check, 100);
        };
        check();
    });
}
