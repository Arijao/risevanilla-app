/* ============================================================
 * DB.JS — IndexedDB Layer: init, load, save, delete
 * RISEVANILLA - Gestion de Collecte de Vanille
 * ============================================================ */

'use strict';

// ── DB Config ────────────────────────────────────────────────
let db            = null;
const dbName      = 'RiseVanillaDB_v2';
const dbVersion   = 3;
let dbInitialized = false;
let pendingOperations = [];

// ── Pending Queue ────────────────────────────────────────────
function executeWhenReady(operation) {
    if (dbInitialized && db) operation();
    else pendingOperations.push(operation);
}

function processPendingOperations() {
    while (pendingOperations.length > 0) {
        const op = pendingOperations.shift();
        op();
    }
}

function executeWhenReadyPromise() {
    return new Promise(resolve => {
        if (dbInitialized && db) resolve();
        else pendingOperations.push(resolve);
    });
}

// ── DB Init ──────────────────────────────────────────────────
function initDB() {
    if (!window.indexedDB) {
        console.warn('IndexedDB not supported, using memory storage');
        dbInitialized = true;
        updateAllTables();
        return;
    }

    const request = indexedDB.open(dbName, dbVersion);

    request.onerror = function(event) {
        console.error('Database error:', event.target.error);
        dbInitialized = true;
        updateAllTables();
    };

    request.onsuccess = function(event) {
        db = event.target.result;
        dbInitialized = true;
        db.onerror = e => console.error('DB error:', e.target.error);
        loadData();
        processPendingOperations();
    };

    request.onupgradeneeded = function(event) {
        db = event.target.result;

        const stores = [
            { name: 'collectors',     keyPath: 'id' },
            { name: 'advances',       keyPath: 'id' },
            { name: 'receptions',     keyPath: 'id' },
            { name: 'deliveries',     keyPath: 'id' },
            { name: 'expenses',       keyPath: 'id' },
            { name: 'remboursements', keyPath: 'id' },
            { name: 'paiements',      keyPath: 'id' },
        ];

        stores.forEach(({ name, keyPath }) => {
            if (!db.objectStoreNames.contains(name)) {
                db.createObjectStore(name, { keyPath, autoIncrement: true });
            }
        });

        if (!db.objectStoreNames.contains('qualities')) {
            const qualityStore = db.createObjectStore('qualities', { keyPath: 'id', autoIncrement: true });
            qualityStore.createIndex('name', 'name', { unique: true });

            const defaultQualities = [
                { name: 'Lava',    description: 'Vanille de qualité supérieure' },
                { name: 'Fohy',    description: 'Vanille plus courte' },
                { name: 'Fendue', description: 'Vanille fendue ou vaky' },
                { name: 'Lo',      description: 'Vanille de qualité inférieure' },
                { name: 'Verte',   description: 'Vanille non préparée' }
            ];
            defaultQualities.forEach(q => qualityStore.add(q));
        }
    };
}

// ── Load All Data ────────────────────────────────────────────
function loadData() {
    if (!db) { updateAllTables(); return; }

    const storeNames = Array.from(db.objectStoreNames);
    if (storeNames.length === 0) { updateAllTables(); return; }

    const promises = storeNames.map(storeName =>
        new Promise((resolve, reject) => {
            const tx      = db.transaction(storeName, 'readonly');
            const store   = tx.objectStore(storeName);
            const request = store.getAll();
            request.onsuccess = () => resolve({ storeName, data: request.result || [] });
            request.onerror   = () => reject({ storeName, data: [] });
        })
    );

    Promise.allSettled(promises).then(results => {
        storeNames.forEach(name => appData[name] = []);
        results.forEach(result => {
            if (result.status === 'fulfilled') {
                appData[result.value.storeName] = result.value.data;
            }
        });
        buildCache();
        updateAllTables();
    });
}

// ── Save to DB ───────────────────────────────────────────────
async function saveToDB(storeName, data, onSuccess) {
    try {
        await executeWhenReadyPromise();
        if (!db || db.readyState === 'done') {
            saveToDB_Fallback(storeName, data);
            if (onSuccess) onSuccess();
            return;
        }

        await new Promise((resolve, reject) => {
            const tx      = db.transaction(storeName, 'readwrite');
            const store   = tx.objectStore(storeName);
            store.put(data);
            tx.oncomplete = resolve;
            tx.onerror    = e => reject(e.target.error);
        });

        invalidateCache();

        await new Promise(resolve => { loadData(); setTimeout(resolve, 300); });

        if (onSuccess) onSuccess();
    } catch (error) {
        console.error(`saveToDB error (${storeName}):`, error);
        showToast(`Erreur enregistrement: ${storeName}`, 'error');
        saveToDB_Fallback(storeName, data);
        if (onSuccess) onSuccess();
    }
}

function saveToDB_Fallback(storeName, data) {
    if (!data || !storeName || !appData[storeName]) return;
    if (!data.id) data.id = Date.now() + Math.random();
    const idx = appData[storeName].findIndex(i => i.id === data.id);
    if (idx >= 0) appData[storeName][idx] = data;
    else          appData[storeName].push(data);
    updateAllTables();
}

// ── Delete from DB ───────────────────────────────────────────
async function deleteFromDB(storeName, id, onSuccessCallback) {
    try {
        await executeWhenReadyPromise();
        if (!db || db.readyState === 'done') {
            deleteFromDB_Fallback(storeName, id);
            if (onSuccessCallback) onSuccessCallback();
            return;
        }

        await new Promise((resolve, reject) => {
            const tx    = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            store.delete(id);
            tx.oncomplete = resolve;
            tx.onerror    = e => reject(e.target.error);
        });

        const idx = (appData[storeName] || []).findIndex(i => i.id === id);
        if (idx >= 0) appData[storeName].splice(idx, 1);

        invalidateCache();
        updateAllTables();
        if (onSuccessCallback) onSuccessCallback();
    } catch (error) {
        console.error(`deleteFromDB error (${storeName}):`, error);
        showToast(`Erreur suppression: ${storeName}`, 'error');
        deleteFromDB_Fallback(storeName, id);
        if (onSuccessCallback) onSuccessCallback();
    }
}

function deleteFromDB_Fallback(storeName, id) {
    const idx = (appData[storeName] || []).findIndex(i => i.id === id);
    if (idx >= 0) { appData[storeName].splice(idx, 1); updateAllTables(); }
}

// ── Import / Export / Reset ──────────────────────────────────
function exportData() {
    const dataToExport = {
        collectors: appData.collectors || [], advances: appData.advances || [],
        receptions: appData.receptions || [], deliveries: appData.deliveries || [],
        qualities:  appData.qualities  || [], expenses:   appData.expenses   || [],
        remboursements: appData.remboursements || [], paiements: appData.paiements || [],
        exportDate: new Date().toISOString(), version: '2.0'
    };
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), { href: url, download: `risevanilla-data-v2-${new Date().toISOString().split('T')[0]}.json` });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Exportation terminée.', 'success');
}

function importData() {
    const input  = Object.assign(document.createElement('input'), { type: 'file', accept: '.json' });
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async function(e) {
            try {
                const imported = JSON.parse(e.target.result);
                const ok = await confirmModal({
                    title:       'Importer les données',
                    message:     'Toutes les données existantes seront remplacées par celles du fichier. Cette action est irréversible.',
                    confirmText: 'Importer',
                    cancelText:  'Annuler',
                    variant:     'warning',
                    icon:        'upload'
                });
                if (!ok) return;
                executeWhenReady(() => {
                    if (!db) {
                        Object.assign(appData, {
                            collectors: imported.collectors || [], advances: imported.advances || [],
                            receptions: imported.receptions || [], deliveries: imported.deliveries || [],
                            qualities: imported.qualities || [], expenses: imported.expenses || [],
                            remboursements: imported.remboursements || [], paiements: imported.paiements || []
                        });
                        updateAllTables();
                        showToast('Données importées (mode mémoire).', 'success');
                        return;
                    }
                    clearAllData(() => importNewData(imported));
                });
            } catch (err) { showToast('Erreur JSON : ' + err.message, 'error'); }
        };
        reader.readAsText(file);
    };
    input.click();
}

function clearAllData(callback) {
    if (!db) {
        Object.assign(appData, { collectors:[], advances:[], receptions:[], deliveries:[], qualities:[], expenses:[], remboursements:[], paiements:[] });
        if (callback) callback();
        return;
    }
    const stores = ['collectors','advances','receptions','deliveries','expenses','qualities','remboursements','paiements'];
    const tx = db.transaction(stores, 'readwrite');
    tx.oncomplete = () => { if (callback) callback(); };
    tx.onerror    = () => { if (callback) callback(); };
    stores.forEach(s => { if (db.objectStoreNames.contains(s)) tx.objectStore(s).clear(); });
}

function importNewData(importedData) {
    const collectorIdMap = {};
    importCollectors(importedData.collectors || [], newIds => {
        (importedData.collectors || []).forEach((c, i) => {
            if (c.id && newIds[i]) collectorIdMap[c.id] = newIds[i];
        });

        const remap = items => (items || []).map(item => {
            const newItem = { ...item };
            if (newItem.collectorId && collectorIdMap[newItem.collectorId]) newItem.collectorId = collectorIdMap[newItem.collectorId];
            delete newItem.id;
            return newItem;
        });

        const stores = [
            { name: 'qualities',      data: remap(importedData.qualities) },
            { name: 'expenses',       data: remap(importedData.expenses) },
            { name: 'advances',       data: remap(importedData.advances) },
            { name: 'receptions',     data: remap(importedData.receptions) },
            { name: 'deliveries',     data: remap(importedData.deliveries) },
            { name: 'remboursements', data: remap(importedData.remboursements) },
            { name: 'paiements',      data: remap(importedData.paiements) }
        ];

        let remaining = stores.length;
        const done = () => { if (--remaining === 0) setTimeout(() => { loadData(); showToast('Import réussi !', 'success'); }, 500); };
        stores.forEach(s => importStoreData(s.name, s.data, done));
    });
}

function importCollectors(collectors, callback) {
    if (!collectors || collectors.length === 0) { if (callback) callback([]); return; }
    const newIds  = [];
    let processed = 0;
    const tx    = db.transaction(['collectors'], 'readwrite');
    const store = tx.objectStore('collectors');
    collectors.forEach((c, i) => {
        const clean = { name: c.name, phone: c.phone, address: c.address, cin: c.cin || '', cinDate: c.cinDate || '', createdAt: c.createdAt || new Date().toISOString() };
        const req   = store.add(clean);
        req.onsuccess = e => { newIds[i] = e.target.result; if (++processed === collectors.length && callback) callback(newIds); };
        req.onerror   = ()  => { newIds[i] = null;           if (++processed === collectors.length && callback) callback(newIds); };
    });
    tx.onerror = () => { if (callback) callback([]); };
}

function importStoreData(storeName, items, callback) {
    if (!items || items.length === 0) { if (callback) callback(); return; }
    const tx    = db.transaction([storeName], 'readwrite');
    const store = tx.objectStore(storeName);
    let processed = 0;
    items.forEach(item => {
        const clean = { ...item };
        delete clean.id; delete clean.exportId; delete clean.collectorExportId;
        const req = store.add(clean);
        req.onsuccess = () => { if (++processed === items.length && callback) callback(); };
        req.onerror   = () => { if (++processed === items.length && callback) callback(); };
    });
    tx.onerror = () => { if (callback) callback(); };
}

async function resetData() {
    const ok1 = await confirmModal({
        title:       'Remise à zéro',
        message:     'Toutes les données (collecteurs, avances, réceptions, dépenses...) seront définitivement effacées. Cette action est irréversible.',
        confirmText: 'Continuer',
        cancelText:  'Annuler',
        variant:     'danger',
        icon:        'warning_amber'
    });
    if (!ok1) return;

    const ok2 = await confirmModal({
        title:       'Confirmation finale',
        message:     'Dernière confirmation : toutes les données seront perdues sans possibilité de récupération.',
        confirmText: 'Effacer définitivement',
        cancelText:  'Annuler',
        variant:     'danger',
        icon:        'delete_forever'
    });
    if (!ok2) return;

    executeWhenReady(() => {
        clearAllData(() => {
            Object.assign(appData, { collectors:[], advances:[], receptions:[], deliveries:[], expenses:[], qualities:[], remboursements:[], paiements:[] });
            updateAllTables();
            showToast('Toutes les données ont été supprimées.', 'warning');
        });
    });
}
