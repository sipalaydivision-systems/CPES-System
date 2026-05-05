// UI helpers: toast, modal, badges, formatting, icons
(function() {

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function num(n) { return (parseInt(n) || 0).toLocaleString(); }
  function currency(n) {
    const v = parseFloat(n) || 0;
    return '₱' + v.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
  }
  function fmtDate(s) {
    if (!s) return '—';
    try {
      const d = new Date(s);
      if (isNaN(d.getTime())) return '—';
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
    } catch(e) { return '—'; }
  }
  function fmtDateInput(s) {
    if (!s) return '';
    try {
      const d = new Date(s);
      if (isNaN(d.getTime())) return '';
      return d.toISOString().slice(0, 10);
    } catch(e) { return ''; }
  }

  // ----- Tone-mapped enum labels -----
  const ENUM_LABELS = {
    contributionType: { Cash:'Cash', InKind:'In-Kind', Service:'Service', Scholarship:'Scholarship', Infrastructure:'Infrastructure', Equipment:'Equipment', Supplies:'Supplies', Other:'Other' },
    donationType:     { Cash:'Cash', InKind:'In-Kind', Service:'Service', Equipment:'Equipment', Supplies:'Supplies', ConstructionMaterials:'Construction Materials', Food:'Food', Medals:'Medals', Books:'Books', Other:'Other' },
    researchType:     { ActionResearch:'Action Research', InnovationPaper:'Innovation Paper', CaseStudy:'Case Study', PolicyReview:'Policy Review', Other:'Other' },
    partnerNature:    { LGU:'LGU', NGO:'NGO', PrivateCompany:'Private Company', Individual:'Individual', AcademicInstitution:'Academic Institution', GovernmentAgency:'Government Agency', Other:'Other' },
    role:             { Admin:'Admin', Editor:'Editor', Viewer:'Viewer' }
  };
  function enumLabel(group, key) { return (ENUM_LABELS[group] && ENUM_LABELS[group][key]) || key; }

  // ----- Status badge color map -----
  const STATUS_COLORS = {
    // Generic
    Active: 'green', Inactive: 'red',
    // Transmittal / Donation
    Submitted: 'blue', Validated: 'green', Pending: 'amber', Encoded: 'blue', Utilized: 'green',
    // Research
    Approved: 'green', Archived: 'slate',
    // Cert
    Issued: 'green',
    // Agreement
    Expired: 'red', Cancelled: 'red'
  };

  function badge(text, tone) {
    const tones = {
      slate:  'bg-slate-100 text-slate-700 ring-slate-200',
      gray:   'bg-stone-100 text-stone-700 ring-stone-200',
      blue:   'bg-blue-50 text-blue-700 ring-blue-200',
      green:  'bg-emerald-50 text-emerald-700 ring-emerald-200',
      amber:  'bg-amber-50 text-amber-700 ring-amber-200',
      red:    'bg-rose-50 text-rose-700 ring-rose-200',
      yellow: 'bg-amber-50 text-amber-700 ring-amber-200',
      cyan:   'bg-cyan-50 text-cyan-700 ring-cyan-200',
      purple: 'bg-violet-50 text-violet-700 ring-violet-200'
    };
    const cls = tones[tone] || tones.gray;
    return `<span class="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ring-1 ring-inset ${cls}">${esc(text)}</span>`;
  }
  function statusBadge(s) { return badge(s, STATUS_COLORS[s] || 'gray'); }
  function yesNoBadge(b) { return badge(b ? 'Yes' : 'No', b ? 'green' : 'gray'); }

  // ----- Toast -----
  function toast(msg, type) {
    type = type || 'success';
    const root = document.getElementById('toast-root');
    const el = document.createElement('div');
    const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
    const tones = {
      success: 'bg-emerald-600 text-white',
      error:   'bg-rose-600 text-white',
      warning: 'bg-amber-500 text-white',
      info:    'bg-slate-800 text-white'
    };
    el.className = `pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-soft-lg animate-slide-in-right max-w-sm ${tones[type] || tones.success}`;
    el.innerHTML = `<span class="font-semibold text-base leading-none">${icons[type] || '✓'}</span><span class="text-sm font-medium">${esc(msg)}</span>`;
    root.appendChild(el);
    setTimeout(() => {
      el.style.transition = 'opacity .3s, transform .3s';
      el.style.opacity = '0';
      el.style.transform = 'translateX(20px)';
      setTimeout(() => el.remove(), 300);
    }, 3500);
  }

  // ----- Modal -----
  function modal(opts) {
    // opts: { title, body (HTML or DOM), footer (function(footEl, close)), size: 'sm'|'md'|'lg'|'xl', onClose }
    const root = document.getElementById('modal-root');
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-8 bg-ink-900/40 modal-backdrop animate-fade-in overflow-y-auto';

    const sizeCls = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl', xl: 'max-w-6xl' }[opts.size || 'md'];

    const panel = document.createElement('div');
    panel.className = `relative w-full ${sizeCls} bg-white rounded-2xl shadow-soft-lg ring-1 ring-ink-100 animate-scale-in my-8`;
    panel.innerHTML = `
      <div class="flex items-center justify-between px-6 py-4 border-b border-ink-100">
        <h3 class="text-base font-semibold text-ink-800">${esc(opts.title || '')}</h3>
        <button class="modal-close w-8 h-8 inline-flex items-center justify-center rounded-lg hover:bg-ink-100 text-ink-400 hover:text-ink-700" aria-label="Close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="modal-body px-6 py-5 max-h-[calc(100vh-220px)] overflow-y-auto scrollbar-thin"></div>
      <div class="modal-footer px-6 py-4 border-t border-ink-100 flex justify-end gap-2 bg-ink-50/40 rounded-b-2xl"></div>
    `;
    overlay.appendChild(panel);
    root.appendChild(overlay);

    const bodyEl = panel.querySelector('.modal-body');
    const footEl = panel.querySelector('.modal-footer');
    if (typeof opts.body === 'string') bodyEl.innerHTML = opts.body;
    else if (opts.body instanceof Node) bodyEl.appendChild(opts.body);

    function close() {
      overlay.style.transition = 'opacity .2s';
      overlay.style.opacity = '0';
      setTimeout(() => { overlay.remove(); if (opts.onClose) opts.onClose(); }, 180);
    }
    panel.querySelector('.modal-close').onclick = close;
    overlay.onclick = (e) => { if (e.target === overlay) close(); };
    document.addEventListener('keydown', escHandler);
    function escHandler(e) { if (e.key === 'Escape') { document.removeEventListener('keydown', escHandler); close(); } }

    if (opts.footer) opts.footer(footEl, close);
    return { close, panel, bodyEl, footEl };
  }

  // ----- Buttons builder -----
  function btn(label, opts) {
    opts = opts || {};
    const tones = {
      primary:   'bg-ink-900 text-white hover:bg-ink-800 ring-ink-900',
      secondary: 'bg-white text-ink-700 hover:bg-ink-50 ring-ink-200 ring-1',
      danger:    'bg-rose-600 text-white hover:bg-rose-700 ring-rose-600',
      ghost:     'bg-transparent text-ink-700 hover:bg-ink-100 ring-transparent',
      outline:   'bg-white text-ink-700 hover:bg-ink-50 border border-ink-200',
      brand:     'bg-brand-700 text-white hover:bg-brand-800 ring-brand-700'
    };
    const sizes = { sm: 'px-2.5 py-1 text-xs', md: 'px-3.5 py-2 text-sm', lg: 'px-4 py-2.5 text-sm' };
    const tone = tones[opts.tone || 'primary'];
    const sz = sizes[opts.size || 'md'];
    const b = document.createElement('button');
    b.className = `inline-flex items-center gap-1.5 font-medium rounded-lg ${tone} ${sz} transition focus-visible:ring-2 focus-visible:ring-offset-2`;
    b.textContent = label;
    if (opts.onClick) b.onclick = opts.onClick;
    if (opts.icon) b.insertAdjacentHTML('afterbegin', opts.icon);
    return b;
  }

  // ----- Form fragment helpers -----
  function field(label, html, hint, required) {
    return `
      <div class="space-y-1.5">
        <label class="block text-xs font-semibold text-ink-700 tracking-wide">
          ${esc(label)}${required ? '<span class="text-rose-500 ml-0.5">*</span>' : ''}
        </label>
        ${html}
        ${hint ? `<p class="text-[11px] text-ink-400">${esc(hint)}</p>` : ''}
      </div>
    `;
  }

  function input(id, opts) {
    opts = opts || {};
    const type = opts.type || 'text';
    const placeholder = opts.placeholder ? `placeholder="${esc(opts.placeholder)}"` : '';
    const value = opts.value != null ? `value="${esc(opts.value)}"` : '';
    const min = opts.min != null ? `min="${opts.min}"` : '';
    const step = opts.step != null ? `step="${opts.step}"` : '';
    return `<input id="${id}" type="${type}" ${placeholder} ${value} ${min} ${step}
      class="w-full px-3 py-2 text-sm bg-white border border-ink-200 rounded-lg transition placeholder:text-ink-300">`;
  }

  function textarea(id, opts) {
    opts = opts || {};
    const rows = opts.rows || 3;
    const placeholder = opts.placeholder ? `placeholder="${esc(opts.placeholder)}"` : '';
    return `<textarea id="${id}" rows="${rows}" ${placeholder}
      class="w-full px-3 py-2 text-sm bg-white border border-ink-200 rounded-lg transition placeholder:text-ink-300 resize-none scrollbar-thin">${esc(opts.value || '')}</textarea>`;
  }

  function select(id, options, selected) {
    const opts = options.map(o => {
      const val = typeof o === 'string' ? o : o.value;
      const lab = typeof o === 'string' ? o : o.label;
      return `<option value="${esc(val)}"${val === selected ? ' selected' : ''}>${esc(lab)}</option>`;
    }).join('');
    return `<select id="${id}" class="w-full px-3 py-2 text-sm bg-white border border-ink-200 rounded-lg transition cursor-pointer">${opts}</select>`;
  }

  function checkbox(id, label, checked) {
    return `<label class="flex items-center gap-2 cursor-pointer select-none">
      <input id="${id}" type="checkbox" ${checked ? 'checked' : ''} class="w-4 h-4 rounded border-ink-300 text-ink-900 focus:ring-2 focus:ring-ink-900/10 cursor-pointer">
      <span class="text-sm text-ink-700">${esc(label)}</span>
    </label>`;
  }

  function fieldGroup(title, html) {
    return `
      <div class="space-y-3 pb-5 border-b border-ink-100 last:border-0 last:pb-0">
        <div class="flex items-center gap-2">
          <span class="w-1 h-3.5 bg-deped-yellow rounded-full"></span>
          <h4 class="text-xs font-bold uppercase tracking-wider text-ink-500">${esc(title)}</h4>
        </div>
        <div class="space-y-3">${html}</div>
      </div>
    `;
  }

  function row2(html1, html2) { return `<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">${html1}${html2}</div>`; }
  function row3(html1, html2, html3) { return `<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">${html1}${html2}${html3}</div>`; }

  function val(id) { const el = document.getElementById(id); return el ? el.value : ''; }
  function checked(id) { const el = document.getElementById(id); return el ? !!el.checked : false; }

  // ----- Empty state -----
  function emptyState(opts) {
    return `
      <div class="text-center py-16 px-6">
        <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-ink-100 text-ink-400 mb-4">
          ${opts.icon || '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>'}
        </div>
        <h3 class="text-sm font-semibold text-ink-800">${esc(opts.title || 'No records yet')}</h3>
        <p class="text-sm text-ink-500 mt-1 max-w-sm mx-auto">${esc(opts.desc || '')}</p>
      </div>
    `;
  }

  // ----- Confirm dialog -----
  function confirmDialog(message, onConfirm, opts) {
    opts = opts || {};
    const m = modal({
      title: opts.title || 'Confirm',
      size: 'sm',
      body: `<p class="text-sm text-ink-700">${esc(message)}</p>`,
      footer: (foot, close) => {
        const cancel = btn(opts.cancelLabel || 'Cancel', { tone: 'secondary', onClick: close });
        const ok = btn(opts.confirmLabel || 'Confirm', {
          tone: opts.danger ? 'danger' : 'primary',
          onClick: () => { close(); onConfirm(); }
        });
        foot.appendChild(cancel);
        foot.appendChild(ok);
      }
    });
    return m;
  }

  // ----- Skeleton loader -----
  function skeletonCard(rows) {
    rows = rows || 3;
    let s = '';
    for (let i = 0; i < rows; i++) {
      s += `<div class="skeleton h-4 rounded ${i === rows - 1 ? 'w-2/3' : 'w-full'}"></div>`;
    }
    return `<div class="space-y-3">${s}</div>`;
  }

  function detailRow(label, valueHTML) {
    return `
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2.5 border-b border-ink-100 last:border-0">
        <div class="text-[11px] font-semibold uppercase tracking-wider text-ink-500">${esc(label)}</div>
        <div class="sm:col-span-2 text-sm text-ink-800 break-words">${valueHTML || '<span class="text-ink-400">—</span>'}</div>
      </div>
    `;
  }

  function detailSection(title, rows) {
    return `
      <div class="space-y-2 pb-5 border-b border-ink-100 last:border-0 last:pb-0">
        <div class="flex items-center gap-2 pb-1">
          <span class="w-1 h-3.5 bg-deped-yellow rounded-full"></span>
          <h4 class="text-xs font-bold uppercase tracking-wider text-ink-500">${esc(title)}</h4>
        </div>
        <div>${rows}</div>
      </div>
    `;
  }

  window.UI = {
    esc, num, currency, fmtDate, fmtDateInput,
    enumLabel, badge, statusBadge, yesNoBadge,
    toast, modal, confirmDialog,
    btn, field, input, textarea, select, checkbox, fieldGroup, row2, row3, val, checked,
    emptyState, skeletonCard, detailRow, detailSection
  };
})();
