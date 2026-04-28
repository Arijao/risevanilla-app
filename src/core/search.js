/**
 * RISEVANILLA — Moteur de recherche intelligent
 * Expose window.RiseVanillaSearch — utilisé par router.js, table.js et toutes les pages
 */
window.RiseVanillaSearch = (() => {

  // ── Configuration ──────────────────────────────────────────────
  const CFG = {
    debounceDelay: 180,
    minLength: 1,
    highlightClass: 'search-highlight',
  };

  // ── Utilitaires texte ──────────────────────────────────────────

  function normalize(str) {
    return String(str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // ── Highlight ──────────────────────────────────────────────────

  /**
   * Insère des <mark> sur les segments correspondants
   * Préserve la casse et les accents originaux
   */
  function highlightText(text, query) {
    if (!query || query.length < CFG.minLength) return escapeHtml(text);
    const src = String(text);
    const normSrc = normalize(src);
    const normQ = normalize(escapeRegex(query));
    if (!normQ) return escapeHtml(src);

    const re = new RegExp(normQ, 'g');
    let result = '', last = 0, m;
    while ((m = re.exec(normSrc)) !== null) {
      result += escapeHtml(src.slice(last, m.index));
      result += `<mark class="${CFG.highlightClass}">${escapeHtml(src.slice(m.index, m.index + m[0].length))}</mark>`;
      last = m.index + m[0].length;
      if (m[0].length === 0) re.lastIndex++;
    }
    return result + escapeHtml(src.slice(last));
  }

  // ── Filtrage ───────────────────────────────────────────────────

  function matches(item, query, fields) {
    if (!query || query.length < CFG.minLength) return true;
    const nq = normalize(query);
    return fields.some(f => {
      const val = f.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : null), item);
      if (val === null || val === undefined) return false;
      // Convertir les nombres pour permettre la recherche (ex: "500" pour trouver 500)
      let strVal;
      if (typeof val === 'number') {
        // Garder les décimales pour les poids
        strVal = val % 1 !== 0 ? val.toFixed(3).toString() : val.toString();
      } else {
        strVal = String(val);
      }
      return normalize(strVal).includes(nq);
    });
  }

  function filter(items, query, fields) {
    if (!query || query.length < CFG.minLength) return items;
    return items.filter(item => matches(item, query, fields));
  }

  // ── Debounce ───────────────────────────────────────────────────

  function debounce(fn, delay) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  // ── Binding sur un <input> ─────────────────────────────────────

  /**
   * Attache la logique de recherche à un champ existant
   * Gère : debounce, état visuel, bouton clear, touche Échap
   */
  function attachSearchInput(inputEl, options = {}) {
    if (!inputEl) return { destroy: () => {} };

    const delay = options.debounce ?? CFG.debounceDelay;
    const parent = inputEl.parentElement;

    // Bouton clear
    if (parent && !parent.querySelector('.search-clear-btn')) {
      if (getComputedStyle(parent).position === 'static') {
        parent.style.position = 'relative';
      }
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'search-clear-btn';
      btn.setAttribute('aria-label', 'Effacer la recherche');
      btn.innerHTML = '<i class="material-icons" style="font-size:16px;pointer-events:none">close</i>';
      btn.addEventListener('click', () => {
        inputEl.value = '';
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        inputEl.focus();
      });
      parent.appendChild(btn);
    }

    const onInput = debounce((e) => {
      const q = e.target.value.trim();
      _updateState(inputEl, q);
      if (!q && options.onClear) { options.onClear(); return; }
      if (options.onSearch) options.onSearch(q);
    }, delay);

    const onKey = (e) => {
      if (e.key === 'Escape') {
        inputEl.value = '';
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
      }
    };

    inputEl.addEventListener('input', onInput);
    inputEl.addEventListener('keydown', onKey);

    return {
      destroy: () => {
        inputEl.removeEventListener('input', onInput);
        inputEl.removeEventListener('keydown', onKey);
        parent && parent.querySelector('.search-clear-btn')?.remove();
      }
    };
  }

  function _updateState(inputEl, query) {
    const active = query.length >= CFG.minLength;
    const wrapper = inputEl.closest('[data-search-wrapper]') || inputEl.parentElement;
    wrapper && wrapper.classList.toggle('search-wrapper--active', active);
    // Bouton clear
    const btn = inputEl.parentElement?.querySelector('.search-clear-btn');
    if (btn) { btn.style.opacity = active ? '1' : '0'; btn.style.pointerEvents = active ? 'auto' : 'none'; }
  }

  // ── Highlight dans un <tbody> ──────────────────────────────────

  /**
   * Surligne in-place les cellules d'un tbody
   * @param {HTMLElement} tbody
   * @param {string}      query
   * @param {number[]}    cols  — colonnes à surligner (null = toutes)
   */
  function highlightTable(tbody, query, cols) {
    if (!tbody) return;
    tbody.querySelectorAll('tr').forEach(tr => {
      tr.querySelectorAll('td').forEach((td, i) => {
        // Ne jamais toucher aux cellules d'actions (boutons)
        if (td.classList.contains('actions-cell')) return;
        // Cellules DOM riches (avatars) : re-surligner uniquement le <span> interne
        if (td.dataset.noHighlight) {
          const span = td.querySelector('.collector-avatar-cell > span');
          if (span) {
            const orig = span.dataset.origText ?? span.textContent;
            span.dataset.origText = orig;
            span.innerHTML = query ? highlightText(orig, query) : escapeHtml(orig);
          }
          return;
        }
        if (cols && !cols.includes(i)) return;
        const orig = td.dataset.origText ?? td.textContent;
        td.dataset.origText = orig;
        td.innerHTML = query ? highlightText(orig, query) : escapeHtml(orig);
      });
    });
  }

  // ── Badge résultats ────────────────────────────────────────────

  function updateResultBadge(container, count, total, query) {
    if (!container) return;
    let badge = container.querySelector('.search-results-badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'search-results-badge';
      container.appendChild(badge);
    }
    if (!query) { badge.style.display = 'none'; return; }
    badge.style.display = 'inline-flex';
    badge.className = count === 0
      ? 'search-results-badge search-results-badge--empty'
      : 'search-results-badge';
    badge.textContent = count === 0 ? 'Aucun résultat'
      : count === total ? String(count)
      : `${count} / ${total}`;
  }

  // ── Message "aucun résultat" ───────────────────────────────────

  function toggleNoResults(container, show, query) {
    if (!container) return;
    let el = container.querySelector('.search-empty-state');
    if (!show) { el && el.remove(); return; }
    if (!el) {
      el = document.createElement('div');
      el.className = 'search-empty-state';
      container.appendChild(el);
    }
    el.innerHTML = `
      <i class="material-icons">search_off</i>
      <p>Aucun résultat pour <strong>"${escapeHtml(query)}"</strong></p>
      <span>Vérifiez l'orthographe ou essayez un autre terme</span>`;
  }

  // ── API publique ───────────────────────────────────────────────
  return {
    normalize, escapeHtml, highlightText,
    matches, filter, debounce,
    attachSearchInput, highlightTable,
    updateResultBadge, toggleNoResults,
    config: CFG,
  };

})();