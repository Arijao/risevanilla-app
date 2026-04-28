/* ============================================================
 * QUALITIES.JS — Quality CRUD
 * RISEVANILLA - Gestion de Collecte de Vanille
 * ============================================================ */

'use strict';

// ── Constantes métier ─────────────────────────────────────────
const VANILLE_TYPES = {
    verte:    { label: 'Verte (non préparée)', icon: 'grass',       badgeClass: 'status-verte'    },
    preparee: { label: 'Préparée (livrable)',  icon: 'verified',    badgeClass: 'status-preparee' }
};

/** Retourne le vanilleType d'une qualité par son nom — 'verte' ou 'preparee' */
function getVanilleType(qualityName) {
    const q = (appData.qualities || []).find(q => q.name === qualityName);
    return q?.vanilleType || 'preparee'; // par défaut préparée (sécuritaire pour livraison)
}

/** Retourne true si la qualité est livrable (préparée) */
function isQualityLivrable(qualityName) {
    return getVanilleType(qualityName) === 'preparee';
}

function openQualityModal(id = null) {
    const form = document.getElementById('quality-form');
    form.reset();
    document.getElementById('quality-id').value = '';

    if (id) {
        const quality = appData.qualities.find(q => q.id === id);
        if (quality) {
            document.getElementById('quality-id').value          = quality.id;
            document.getElementById('quality-name').value        = quality.name;
            document.getElementById('quality-description').value = quality.description || '';
            const typeEl = document.getElementById('quality-vanille-type');
            if (typeEl) typeEl.value = quality.vanilleType || 'preparee';
        }
    } else {
        // Valeur par défaut : préparée
        const typeEl = document.getElementById('quality-vanille-type');
        if (typeEl) typeEl.value = 'preparee';
    }
    openModal('quality-modal');
}

function saveQuality(event) {
    event.preventDefault();
    const id         = document.getElementById('quality-id').value;
    const vanilleType = document.getElementById('quality-vanille-type')?.value || 'preparee';
    const data = {
        name:        document.getElementById('quality-name').value.trim(),
        description: document.getElementById('quality-description').value.trim(),
        vanilleType                     // 'verte' | 'preparee'
    };
    if (id) data.id = parseInt(id);
    saveToDB('qualities', data);
    closeModal('quality-modal');
    showToast('Qualité enregistrée!', 'success');
}

async function deleteQuality(id) {
    const ok = await confirmModal({
        title:       'Supprimer la qualité',
        message:     'Cette qualité sera définitivement supprimée. Les réceptions associées ne seront pas affectées.',
        confirmText: 'Supprimer',
        cancelText:  'Annuler',
        variant:     'danger',
        icon:        'delete_forever'
    });
    if (!ok) return;
    deleteFromDB('qualities', id, () => showToast('Qualité supprimée.', 'error'));
}

/** Rendu du tableau des qualités avec badge vanilleType */
function updateQualitiesTable() {
    const tbody = document.getElementById('qualities-table');
    if (!tbody) return;
    tbody.innerHTML = '';

    const qualities = appData.qualities || [];
    if (!qualities.length) {
        tbody.innerHTML = `<tr><td colspan="3" class="empty-state"><div class="material-icons">eco</div><div>Aucune qualité définie</div></td></tr>`;
        return;
    }

    qualities.forEach(q => {
        const type    = q.vanilleType || 'preparee';
        const typeMeta = VANILLE_TYPES[type] || VANILLE_TYPES.preparee;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td data-label="Nom">
                <div style="display:flex;align-items:center;gap:10px;">
                    <span class="status-badge ${typeMeta.badgeClass}" style="font-size:11px;">
                        <span class="material-icons" style="font-size:13px;vertical-align:middle;">${typeMeta.icon}</span>
                        ${typeMeta.label}
                    </span>
                    <strong>${q.name}</strong>
                </div>
            </td>
            <td data-label="Description">${q.description || '—'}</td>
            <td class="actions-cell">
                <button class="btn btn-icon btn-outline" onclick="openQualityModal(${q.id})" title="Modifier">
                    <span class="material-icons">edit</span>
                </button>
                <button class="btn btn-icon btn-danger" onclick="deleteQuality(${q.id})" title="Supprimer">
                    <span class="material-icons">delete</span>
                </button>
            </td>`;
        tbody.appendChild(row);
    });
}
