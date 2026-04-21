/* ============================================================
 * QUALITIES.JS — Quality CRUD
 * RISEVANILLA - Gestion de Collecte de Vanille
 * ============================================================ */

'use strict';

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
        }
    }
    openModal('quality-modal');
}

function saveQuality(event) {
    event.preventDefault();
    const id  = document.getElementById('quality-id').value;
    const data = {
        name:        document.getElementById('quality-name').value.trim(),
        description: document.getElementById('quality-description').value.trim()
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
