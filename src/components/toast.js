/* ============================================================
 * TOAST.JS — Toast Notification System
 * RISEVANILLA - Gestion de Collecte de Vanille
 * ============================================================ */

'use strict';

function showToast(message, type = 'info', duration = 3000) {
    // Remove existing toast
    const existing = document.querySelector('.app-toast');
    if (existing) existing.remove();

    const colors = { success: '#4CAF50', error: '#f44336', info: '#2196F3', warning: '#FF9800' };

    const toast = document.createElement('div');
    toast.className = 'app-toast';
    toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: ${colors[type] || colors.info};
        color: white;
        padding: 12px 20px;
        border-radius: 10px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.3);
        z-index: 10000;
        font-size: 14px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 10px;
        max-width: 400px;
        animation: toastSlideIn 0.3s ease;
        font-family: 'Roboto', sans-serif;
    `;

    const icon = { success: 'check_circle', error: 'error', info: 'info', warning: 'warning' };
    toast.innerHTML = `
        <span class="material-icons" style="font-size:20px;">${icon[type] || 'info'}</span>
        <span>${message}</span>
    `;

    // Inject animation if not already present
    if (!document.getElementById('toast-style')) {
        const style = document.createElement('style');
        style.id = 'toast-style';
        style.textContent = `
            @keyframes toastSlideIn {
                from { opacity:0; transform:translateX(100px); }
                to   { opacity:1; transform:translateX(0); }
            }
            @keyframes toastSlideOut {
                from { opacity:1; transform:translateX(0); }
                to   { opacity:0; transform:translateX(100px); }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'toastSlideOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}
