// FA6: MOA / MOU / DOD / DOA — agreements with file upload
(function() {
  window.Views = window.Views || {};

  const TYPES = ['MOA', 'MOU', 'DOD', 'DOA'];
  const TYPE_LABELS = {
    MOA: { full: 'Memorandum of Agreement', tone: 'blue' },
    MOU: { full: 'Memorandum of Understanding', tone: 'cyan' },
    DOD: { full: 'Deed of Donation', tone: 'amber' },
    DOA: { full: 'Deed of Acceptance', tone: 'green' }
  };

  const NATURES = [
    { value: 'LGU', label: 'LGU' },
    { value: 'NGO', label: 'NGO' },
    { value: 'PrivateCompany', label: 'Private Company' },
    { value: 'Individual', label: 'Individual' },
    { value: 'AcademicInstitution', label: 'Academic Institution' },
    { value: 'GovernmentAgency', label: 'Government Agency' },
    { value: 'Other', label: 'Other' }
  ];
  const STATUSES = ['Active', 'Expired', 'Pending', 'Cancelled'];
  const CLUSTERS = ['1','2','3','4','5','6','7','8','9','10'];

  Views.agreements = async function(page) { await render(page); };

  async function render(page) {
    page.innerHTML = `
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div class="text-[10px] font-bold tracking-widest text-cyan-600 mb-1">FA 6 · AGREEMENTS</div>
          <h1 class="text-2xl font-bold tracking-tight text-ink-900">MOA · MOU · DOD · DOA</h1>
          <p class="text-sm text-ink-500 mt-1">Centralized archive of partnership agreements and deeds with file uploads.</p>
        </div>
        ${Store.canEdit() ? `<button id="addBtn" class="self-start inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-lg bg-ink-900 text-white hover:bg-ink-800 transition shadow-soft">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
          New Agreement
        </button>` : ''}
      </div>

      <!-- Type filter chips -->
      <div class="mt-5 flex items-center gap-2 flex-wrap">
        <button data-type="" class="type-chip px-3 py-1.5 rounded-lg text-xs font-semibold bg-ink-900 text-white transition">All</button>
        ${TYPES.map(t => `<button data-type="${t}" class="type-chip px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-ink-700 ring-1 ring-ink-200 hover:bg-ink-50 transition">
          ${t} <span class="text-[10px] text-ink-400 ml-1">${TYPE_LABELS[t].full}</span>
        </button>`).join('')}
      </div>

      <div id="a-body" class="mt-5">${UI.skeletonCard(4)}</div>
    `;

    if (Store.canEdit()) document.getElementById('addBtn').onclick = () => openForm(null, page);

    const items = await Api.list('agreements');
    let activeType = '';

    function refilter() {
      const filtered = activeType ? items.filter(r => r.agreementType === activeType) : items;
      document.getElementById('a-body').innerHTML = renderList(filtered);
      wireRows(filtered, page);
    }

    document.querySelectorAll('.type-chip').forEach(btn => {
      btn.onclick = () => {
        activeType = btn.dataset.type;
        document.querySelectorAll('.type-chip').forEach(b => {
          const active = b.dataset.type === activeType;
          b.classList.toggle('bg-ink-900', active);
          b.classList.toggle('text-white', active);
          b.classList.toggle('bg-white', !active);
          b.classList.toggle('text-ink-700', !active);
          b.classList.toggle('ring-1', !active);
          b.classList.toggle('ring-ink-200', !active);
        });
        refilter();
      };
    });

    refilter();
  }

  function renderList(items) {
    if (!items.length) {
      return `<div class="bg-white rounded-2xl shadow-soft ring-1 ring-ink-100">${UI.emptyState({
        title: 'No agreements found',
        desc: 'Click "New Agreement" to add the first one.'
      })}</div>`;
    }
    return `
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        ${items.map(r => `
          <div class="bg-white rounded-2xl p-5 shadow-soft ring-1 ring-ink-100 hover:shadow-soft-md transition">
            <div class="flex items-start justify-between gap-3 mb-3">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-2">
                  ${UI.badge(r.agreementType, TYPE_LABELS[r.agreementType].tone)}
                  ${UI.statusBadge(r.status)}
                </div>
                <h3 class="font-semibold text-ink-900 text-sm leading-snug truncate">${UI.esc(r.partnerName)}</h3>
                <p class="text-xs text-ink-500 mt-0.5">${UI.esc(r.school)} · Cluster ${UI.esc(r.cluster)}</p>
              </div>
              ${r.file ? `
                <button data-action="download" data-id="${r.id}" class="action-btn flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-deped-yellow/15 text-amber-700 text-[11px] font-semibold hover:bg-deped-yellow/25 transition">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                  File
                </button>
              ` : ''}
            </div>
            <p class="text-xs text-ink-500 line-clamp-2 mb-3">${UI.esc(r.purpose)}</p>
            <div class="grid grid-cols-3 gap-2 text-xs pt-3 border-t border-ink-100">
              <div><div class="text-[10px] uppercase tracking-wider text-ink-400">Nature</div><div class="font-medium text-ink-700 mt-0.5">${UI.esc(UI.enumLabel('partnerNature', r.partnerNature))}</div></div>
              <div><div class="text-[10px] uppercase tracking-wider text-ink-400">Notarized</div><div class="font-medium text-ink-700 mt-0.5">${r.notarized ? 'Yes' : 'No'}</div></div>
              <div><div class="text-[10px] uppercase tracking-wider text-ink-400">Period</div><div class="font-medium text-ink-700 mt-0.5">${UI.fmtDate(r.effectivityStart).split(',')[0]}</div></div>
            </div>
            <div class="flex items-center gap-1 pt-3 mt-3 border-t border-ink-100">
              <button data-action="view" data-id="${r.id}" class="action-btn px-2.5 py-1 rounded-md text-[11px] font-semibold text-ink-700 hover:bg-ink-100 transition">View</button>
              ${Store.canEdit() ? `<button data-action="edit" data-id="${r.id}" class="action-btn px-2.5 py-1 rounded-md text-[11px] font-semibold text-ink-700 hover:bg-ink-100 transition">Edit</button>` : ''}
              ${Store.canDelete() ? `<button data-action="delete" data-id="${r.id}" class="action-btn px-2.5 py-1 rounded-md text-[11px] font-semibold text-rose-600 hover:bg-rose-50 transition ml-auto">Delete</button>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function wireRows(items, page) {
    document.querySelectorAll('.action-btn').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        const action = btn.dataset.action;
        const rec = items.find(r => r.id === id);
        if (!rec) return;
        if (action === 'download' && rec.file) {
          await Api.fileAuthDownload(rec.file.id, rec.file.filename);
        } else if (action === 'view') openView(rec);
        else if (action === 'edit') openForm(rec, page);
        else if (action === 'delete') {
          UI.confirmDialog('Delete this agreement?', async () => {
            await Api.remove('agreements', id);
            UI.toast('Agreement deleted.', 'warning');
            render(page);
          }, { danger: true, confirmLabel: 'Delete' });
        }
      };
    });
  }

  function openView(r) {
    const rows = [
      UI.detailRow('Type', UI.badge(r.agreementType, TYPE_LABELS[r.agreementType].tone) + ' <span class="text-ink-500 ml-2">' + UI.esc(TYPE_LABELS[r.agreementType].full) + '</span>'),
      UI.detailRow('School', UI.esc(r.school)),
      UI.detailRow('Cluster', 'Cluster ' + UI.esc(r.cluster)),
      UI.detailRow('Partner Name', UI.esc(r.partnerName)),
      UI.detailRow('Partner Representative', UI.esc(r.partnerRep || '—')),
      UI.detailRow('Nature of Partner', UI.esc(UI.enumLabel('partnerNature', r.partnerNature))),
      UI.detailRow('Purpose', UI.esc(r.purpose).replace(/\n/g, '<br>')),
      UI.detailRow('Effectivity', UI.fmtDate(r.effectivityStart) + ' – ' + UI.fmtDate(r.effectivityEnd)),
      UI.detailRow('Notarized', UI.yesNoBadge(r.notarized)),
      r.notarizedDate ? UI.detailRow('Notarized Date', UI.fmtDate(r.notarizedDate)) : '',
      UI.detailRow('Status', UI.statusBadge(r.status)),
      UI.detailRow('File', r.file
        ? `<button id="dlBtn" class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-deped-yellow/15 text-amber-700 text-xs font-semibold hover:bg-deped-yellow/25 transition">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            ${UI.esc(r.file.filename)} <span class="text-ink-400">(${(r.file.size/1024).toFixed(0)} KB)</span>
          </button>`
        : '<span class="text-ink-400">No file</span>')
    ].filter(Boolean).join('');

    const m = UI.modal({
      title: r.agreementType + ' — ' + r.partnerName,
      size: 'md',
      body: `<div>${rows}</div>`,
      footer: (foot, close) => foot.appendChild(UI.btn('Close', { tone: 'secondary', onClick: close }))
    });
    if (r.file) {
      const dl = m.bodyEl.querySelector('#dlBtn');
      if (dl) dl.onclick = () => Api.fileAuthDownload(r.file.id, r.file.filename);
    }
  }

  function openForm(rec, page) {
    const isEdit = !!rec;
    const body = `
      <div class="space-y-5">
        ${UI.fieldGroup('School / Office',
          UI.row2(
            UI.field('School / Office Name', UI.input('a_school', { value: rec ? rec.school : '' }), null, true),
            UI.field('Cluster', UI.select('a_cluster', CLUSTERS.map(c => ({ value: c, label: 'Cluster ' + c })), rec ? rec.cluster : '1'), null, true)
          )
        )}
        ${UI.fieldGroup('Agreement Details',
          UI.row2(
            UI.field('Agreement Type', UI.select('a_type', TYPES.map(t => ({ value: t, label: t + ' — ' + TYPE_LABELS[t].full })), rec ? rec.agreementType : 'MOA'), null, true),
            UI.field('Partner Name', UI.input('a_partner', { value: rec ? rec.partnerName : '' }), null, true)
          ) +
          UI.row2(
            UI.field('Partner Representative', UI.input('a_rep', { value: rec ? (rec.partnerRep || '') : '' })),
            UI.field('Nature of Partner', UI.select('a_nat', NATURES, rec ? rec.partnerNature : 'LGU'), null, true)
          ) +
          UI.field('Purpose of Agreement', UI.textarea('a_purpose', { rows: 3, value: rec ? rec.purpose : '' }), null, true)
        )}
        ${UI.fieldGroup('Effectivity & Notarization',
          UI.row2(
            UI.field('Effectivity Start', UI.input('a_start', { type: 'date', value: rec ? UI.fmtDateInput(rec.effectivityStart) : '' })),
            UI.field('Effectivity End', UI.input('a_end', { type: 'date', value: rec ? UI.fmtDateInput(rec.effectivityEnd) : '' }))
          ) +
          UI.row3(
            UI.field('Notarized?', UI.checkbox('a_not', 'Yes', rec ? rec.notarized : false)),
            UI.field('Notarized Date', UI.input('a_notd', { type: 'date', value: rec ? UI.fmtDateInput(rec.notarizedDate) : '' })),
            UI.field('Status', UI.select('a_status', STATUSES, rec ? rec.status : 'Active'))
          )
        )}
        ${UI.fieldGroup('Document', renderFileField('a_file', rec && rec.file ? rec.file : null))}
      </div>
    `;

    UI.modal({
      title: isEdit ? 'Edit Agreement' : 'New Agreement',
      size: 'lg',
      body,
      footer: (foot, close) => {
        foot.appendChild(UI.btn('Cancel', { tone: 'secondary', onClick: close }));
        const save = UI.btn(isEdit ? 'Save Changes' : 'Save Agreement', {
          tone: 'primary',
          onClick: async () => {
            save.disabled = true;
            save.textContent = 'Saving...';
            try {
              let fileId = rec && rec.fileId ? rec.fileId : null;
              const fileInput = document.getElementById('a_file');
              if (fileInput.files && fileInput.files[0]) {
                UI.toast('Uploading file...', 'info');
                const f = await Api.uploadFile(fileInput.files[0]);
                fileId = f.id;
              }
              const data = {
                school: UI.val('a_school').trim(),
                cluster: UI.val('a_cluster'),
                agreementType: UI.val('a_type'),
                partnerName: UI.val('a_partner').trim(),
                partnerRep: UI.val('a_rep').trim() || null,
                partnerNature: UI.val('a_nat'),
                purpose: UI.val('a_purpose').trim(),
                effectivityStart: UI.val('a_start') || null,
                effectivityEnd: UI.val('a_end') || null,
                notarized: UI.checked('a_not'),
                notarizedDate: UI.val('a_notd') || null,
                status: UI.val('a_status'),
                fileId
              };
              if (!data.school || !data.partnerName || !data.purpose) {
                save.disabled = false; save.textContent = isEdit ? 'Save Changes' : 'Save Agreement';
                UI.toast('School, partner name, and purpose are required.', 'error'); return;
              }
              if (isEdit) await Api.update('agreements', rec.id, data);
              else await Api.create('agreements', data);
              UI.toast(isEdit ? 'Agreement updated.' : 'Agreement saved.');
              close();
              render(page);
            } catch (e) {
              save.disabled = false; save.textContent = isEdit ? 'Save Changes' : 'Save Agreement';
              UI.toast(e.message, 'error');
            }
          }
        });
        foot.appendChild(save);
      }
    });

    wireFileField('a_file');
  }

  function renderFileField(id, existing) {
    return `
      <div class="space-y-2">
        <label class="block text-xs font-semibold text-ink-700 tracking-wide">Signed Agreement File <span class="text-ink-400 font-normal normal-case">(PDF preferred · max 5MB)</span></label>
        ${existing ? `
          <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 ring-1 ring-emerald-200 text-xs">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-emerald-600"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
            <span class="font-semibold text-emerald-800 flex-1 truncate">${UI.esc(existing.filename)}</span>
            <span class="text-emerald-700">${(existing.size/1024).toFixed(0)} KB</span>
          </div>
        ` : ''}
        <label for="${id}" class="cursor-pointer flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-ink-200 hover:border-ink-400 hover:bg-ink-50/50 transition group">
          <div class="w-9 h-9 rounded-lg bg-ink-100 group-hover:bg-ink-900 group-hover:text-white text-ink-400 flex items-center justify-center transition">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
          </div>
          <div class="flex-1">
            <div id="${id}_label" class="text-sm font-semibold text-ink-700">${existing ? 'Replace file' : 'Click to choose a file'}</div>
            <div class="text-[11px] text-ink-400">PDF, DOC, DOCX, JPG, PNG · 5MB max</div>
          </div>
          <input type="file" id="${id}" class="hidden" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.txt,.xls,.xlsx">
        </label>
      </div>
    `;
  }
  function wireFileField(id) {
    const inp = document.getElementById(id);
    if (!inp) return;
    inp.onchange = () => {
      const lbl = document.getElementById(id + '_label');
      if (inp.files && inp.files[0]) {
        const f = inp.files[0];
        if (f.size > 5 * 1024 * 1024) { UI.toast('File exceeds 5MB.', 'error'); inp.value = ''; return; }
        lbl.textContent = f.name + ' · ' + (f.size/1024).toFixed(0) + ' KB';
      }
    };
  }
})();
