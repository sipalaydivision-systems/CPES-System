// FA2: Research & Innovation — file upload of approved research
(function() {
  window.Views = window.Views || {};

  const TYPES = [
    { value: 'ActionResearch', label: 'Action Research' },
    { value: 'InnovationPaper', label: 'Innovation Paper' },
    { value: 'CaseStudy', label: 'Case Study' },
    { value: 'PolicyReview', label: 'Policy Review' },
    { value: 'Other', label: 'Other' }
  ];
  const STATUSES = ['Approved', 'Pending', 'Archived'];

  Views.research = async function(page) {
    await render(page);
  };

  async function render(page) {
    page.innerHTML = `
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div class="text-[10px] font-bold tracking-widest text-violet-500 mb-1">FA 2 · RESEARCH</div>
          <h1 class="text-2xl font-bold tracking-tight text-ink-900">Research & Innovation Repository</h1>
          <p class="text-sm text-ink-500 mt-1">Upload and archive approved research papers, action research, and innovation studies.</p>
        </div>
        ${Store.canEdit() ? `<button id="addBtn" class="self-start inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-lg bg-ink-900 text-white hover:bg-ink-800 transition shadow-soft">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
          Upload Research
        </button>` : ''}
      </div>
      <div id="r-body" class="mt-6">${UI.skeletonCard(4)}</div>
    `;

    if (Store.canEdit()) document.getElementById('addBtn').onclick = () => openForm(null, page);

    const items = await Api.list('research');
    document.getElementById('r-body').innerHTML = renderList(items);
    wire(items, page);
  }

  function renderList(items) {
    if (!items.length) {
      return `<div class="bg-white rounded-2xl shadow-soft ring-1 ring-ink-100">${UI.emptyState({
        title: 'No research uploaded yet',
        desc: 'Click "Upload Research" to add the first approved study.'
      })}</div>`;
    }
    return `
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        ${items.map(r => `
          <div class="bg-white rounded-2xl p-5 shadow-soft ring-1 ring-ink-100 hover:shadow-soft-md transition group">
            <div class="flex items-start justify-between gap-3 mb-2">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-2">
                  ${UI.badge(UI.enumLabel('researchType', r.type), 'purple')}
                  ${UI.statusBadge(r.status)}
                </div>
                <h3 class="font-semibold text-ink-900 leading-snug line-clamp-2">${UI.esc(r.title)}</h3>
              </div>
              ${r.file ? `
                <button data-action="download" data-id="${r.id}" class="action-btn flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-deped-yellow/15 text-amber-700 text-[11px] font-semibold hover:bg-deped-yellow/25 transition">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                  File
                </button>
              ` : ''}
            </div>
            <div class="text-xs text-ink-500 space-y-0.5 mb-3">
              <div><strong class="text-ink-700">Author:</strong> ${UI.esc(r.author)}</div>
              <div><strong class="text-ink-700">School:</strong> ${UI.esc(r.school)}</div>
              <div><strong class="text-ink-700">Year:</strong> ${UI.esc(r.year)}</div>
            </div>
            ${r.abstract ? `<p class="text-xs text-ink-500 mb-3 line-clamp-2">${UI.esc(r.abstract)}</p>` : ''}
            <div class="flex items-center gap-1 pt-3 border-t border-ink-100">
              <button data-action="view" data-id="${r.id}" class="action-btn px-2.5 py-1 rounded-md text-[11px] font-semibold text-ink-700 hover:bg-ink-100 transition">View</button>
              ${Store.canEdit() ? `<button data-action="edit" data-id="${r.id}" class="action-btn px-2.5 py-1 rounded-md text-[11px] font-semibold text-ink-700 hover:bg-ink-100 transition">Edit</button>` : ''}
              ${Store.canDelete() ? `<button data-action="delete" data-id="${r.id}" class="action-btn px-2.5 py-1 rounded-md text-[11px] font-semibold text-rose-600 hover:bg-rose-50 transition ml-auto">Delete</button>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function wire(items, page) {
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
          UI.confirmDialog('Delete this research entry? This will not delete the uploaded file.', async () => {
            await Api.remove('research', id);
            UI.toast('Research deleted.', 'warning');
            render(page);
          }, { danger: true, confirmLabel: 'Delete' });
        }
      };
    });
  }

  function openView(r) {
    const rows = [
      UI.detailRow('Title', UI.esc(r.title)),
      UI.detailRow('Type', UI.badge(UI.enumLabel('researchType', r.type), 'purple')),
      UI.detailRow('Author', UI.esc(r.author)),
      UI.detailRow('School / Office', UI.esc(r.school)),
      UI.detailRow('Year', UI.esc(r.year)),
      UI.detailRow('Status', UI.statusBadge(r.status)),
      UI.detailRow('Abstract', r.abstract ? UI.esc(r.abstract).replace(/\n/g, '<br>') : '<span class="text-ink-400">No abstract provided</span>'),
      UI.detailRow('File', r.file
        ? `<button id="dlBtn" class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-deped-yellow/15 text-amber-700 text-xs font-semibold hover:bg-deped-yellow/25 transition">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            ${UI.esc(r.file.filename)} <span class="text-ink-400">(${(r.file.size/1024).toFixed(0)} KB)</span>
          </button>`
        : '<span class="text-ink-400">No file</span>')
    ].join('');

    const m = UI.modal({
      title: 'Research — ' + r.title.slice(0, 60),
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
        ${UI.fieldGroup('Research Details',
          UI.field('Title', UI.input('r_title', { value: rec ? rec.title : '' }), null, true) +
          UI.row2(
            UI.field('Type', UI.select('r_type', TYPES, rec ? rec.type : 'ActionResearch'), null, true),
            UI.field('Year', UI.select('r_year', ['2024','2025','2026','2027'], rec ? rec.year : '2026'))
          )
        )}
        ${UI.fieldGroup('Authorship',
          UI.row2(
            UI.field('Author(s)', UI.input('r_author', { value: rec ? rec.author : '' }), null, true),
            UI.field('School / Office', (function(){
              const lock = Store.isSchool();
              const initial = rec ? rec.school : (lock ? Store.getSession().school : '');
              return lock
                ? `<div class="px-3 py-2 text-sm bg-ink-50 border border-ink-100 rounded-lg text-ink-700 font-medium flex items-center gap-2">
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-ink-400 flex-shrink-0"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                     ${UI.esc(initial)}
                     <input type="hidden" id="r_school" value="${UI.esc(initial)}">
                   </div>`
                : UI.input('r_school', { value: initial });
            })(), Store.isSchool() ? 'Locked to your school' : null, true)
          )
        )}
        ${UI.fieldGroup('Content',
          UI.field('Abstract / Description', UI.textarea('r_abs', { rows: 4, value: rec ? (rec.abstract || '') : '', placeholder: 'Brief summary of the research...' })) +
          UI.field('Status', UI.select('r_status', STATUSES, rec ? rec.status : 'Approved'))
        )}
        ${UI.fieldGroup('Document',
          renderFileField('r_file', rec && rec.file ? rec.file : null)
        )}
      </div>
    `;

    UI.modal({
      title: isEdit ? 'Edit Research' : 'Upload Research',
      size: 'lg',
      body,
      footer: (foot, close) => {
        foot.appendChild(UI.btn('Cancel', { tone: 'secondary', onClick: close }));
        const save = UI.btn(isEdit ? 'Save Changes' : 'Upload', {
          tone: 'primary',
          onClick: async () => {
            const title = UI.val('r_title').trim();
            const author = UI.val('r_author').trim();
            const school = UI.val('r_school').trim();
            if (!title || !author || !school) { UI.toast('Title, author, and school are required.', 'error'); return; }

            save.disabled = true;
            save.textContent = 'Saving...';
            try {
              // Upload file first if a new one is selected
              let fileId = rec && rec.fileId ? rec.fileId : null;
              const fileInput = document.getElementById('r_file');
              if (fileInput.files && fileInput.files[0]) {
                UI.toast('Uploading file...', 'info');
                const f = await Api.uploadFile(fileInput.files[0]);
                fileId = f.id;
              }
              const data = {
                title, author, school,
                type: UI.val('r_type'),
                year: UI.val('r_year'),
                abstract: UI.val('r_abs').trim() || null,
                status: UI.val('r_status'),
                fileId
              };
              if (isEdit) await Api.update('research', rec.id, data);
              else await Api.create('research', data);
              UI.toast(isEdit ? 'Research updated.' : 'Research uploaded.');
              close();
              render(page);
            } catch (e) {
              save.disabled = false;
              save.textContent = isEdit ? 'Save Changes' : 'Upload';
              UI.toast(e.message, 'error');
            }
          }
        });
        foot.appendChild(save);
      }
    });

    wireFileField('r_file');
  }

  // ===== File upload UI helper =====
  function renderFileField(id, existing) {
    return `
      <div class="space-y-2">
        <label class="block text-xs font-semibold text-ink-700 tracking-wide">Approved Research File <span class="text-ink-400 font-normal normal-case">(PDF, DOC, DOCX · max 5MB)</span></label>
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
        if (f.size > 5 * 1024 * 1024) {
          UI.toast('File exceeds 5MB.', 'error');
          inp.value = '';
          return;
        }
        lbl.textContent = f.name + ' · ' + (f.size/1024).toFixed(0) + ' KB';
      }
    };
  }

  // export for reuse
  Views._fileField = { renderFileField, wireFileField };
})();
