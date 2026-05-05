// FA3: Donation Reports — with 2-tier donor categorization
(function() {
  window.Views = window.Views || {};

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const TYPES = [
    { value: 'Cash', label: 'Cash' },
    { value: 'InKind', label: 'In-Kind' },
    { value: 'Service', label: 'Service' },
    { value: 'Equipment', label: 'Equipment' },
    { value: 'Supplies', label: 'Supplies' },
    { value: 'ConstructionMaterials', label: 'Construction Materials' },
    { value: 'Food', label: 'Food' },
    { value: 'Medals', label: 'Medals' },
    { value: 'Books', label: 'Books' },
    { value: 'Other', label: 'Other' }
  ];
  const STATUSES = ['Encoded', 'Validated', 'Utilized'];

  // 2-tier donor categories
  const DONOR_TIERS = {
    Internal: [
      { value: 'LGU', nameLabel: 'LGU Name', placeholder: 'e.g. LGU of Sipalay City' },
      { value: 'Barangay', nameLabel: 'Barangay Name', placeholder: 'e.g. Barangay 5' },
      { value: 'DepEd Central / Regional / Division', nameLabel: 'Office Name', placeholder: 'e.g. DepEd Region VI' },
      { value: 'Other Government Agency', nameLabel: 'Agency Name', placeholder: 'e.g. DSWD, DOH, DPWH' }
    ],
    External: [
      { value: 'Private Company', nameLabel: 'Company Name', placeholder: 'e.g. ABC Corporation' },
      { value: 'NGO / Foundation', nameLabel: 'Organization Name', placeholder: 'e.g. Save the Children PH' },
      { value: 'Individual / Person', nameLabel: 'Donor Full Name', placeholder: 'e.g. Juan Dela Cruz' },
      { value: 'Academic Institution', nameLabel: 'Institution Name', placeholder: 'e.g. Silliman University' },
      { value: 'Religious Organization', nameLabel: 'Organization Name', placeholder: 'e.g. Diocese of Kabankalan' },
      { value: 'Other', nameLabel: 'Donor Name', placeholder: 'Specify donor' }
    ]
  };

  Views.donations = async function(page) { await render(page); };

  async function render(page) {
    page.innerHTML = `
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div class="text-[10px] font-bold tracking-widest text-emerald-600 mb-1">FA 3 · DONATIONS</div>
          <h1 class="text-2xl font-bold tracking-tight text-ink-900">Utilization & Donation Reports</h1>
          <p class="text-sm text-ink-500 mt-1">Donor-categorized donation records with utilization tracking.</p>
        </div>
        ${Store.canEdit() ? `<button id="addBtn" class="self-start inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-lg bg-ink-900 text-white hover:bg-ink-800 transition shadow-soft">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
          New Donation
        </button>` : ''}
      </div>

      <div class="mt-5 flex items-center gap-2">
        <input id="search" type="text" placeholder="Search by school, donor, or description..." class="flex-1 max-w-md px-3.5 py-2 text-sm bg-white border border-ink-200 rounded-lg transition placeholder:text-ink-300">
        <select id="filterCat" class="px-3 py-2 text-sm bg-white border border-ink-200 rounded-lg cursor-pointer">
          <option value="">All Donors</option>
          <option value="Internal">Internal</option>
          <option value="External">External</option>
        </select>
      </div>

      <div id="d-body" class="mt-5">${UI.skeletonCard(5)}</div>
    `;

    if (Store.canEdit()) document.getElementById('addBtn').onclick = () => openForm(null, page);
    const items = await Api.list('donations');

    function refilter() {
      const q = document.getElementById('search').value.toLowerCase();
      const cat = document.getElementById('filterCat').value;
      const filtered = items.filter(r => {
        if (cat && r.donorCategory !== cat) return false;
        if (q && !(`${r.school} ${r.donorName} ${r.description}`.toLowerCase().includes(q))) return false;
        return true;
      });
      document.getElementById('d-body').innerHTML = renderTable(filtered);
      wireRows(filtered, page);
    }
    document.getElementById('search').oninput = refilter;
    document.getElementById('filterCat').onchange = refilter;
    refilter();
  }

  function renderTable(items) {
    if (!items.length) {
      return `<div class="bg-white rounded-2xl shadow-soft ring-1 ring-ink-100">${UI.emptyState({
        title: 'No donations found',
        desc: 'Click "New Donation" to add a record, or adjust your filters.'
      })}</div>`;
    }
    return `
      <div class="bg-white rounded-2xl shadow-soft ring-1 ring-ink-100 overflow-hidden">
        <div class="overflow-x-auto scrollbar-thin">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-ink-50/80 border-b border-ink-100">
                <th class="text-left font-semibold text-[11px] uppercase tracking-wider text-ink-500 px-4 py-3">School</th>
                <th class="text-left font-semibold text-[11px] uppercase tracking-wider text-ink-500 px-4 py-3">Period</th>
                <th class="text-left font-semibold text-[11px] uppercase tracking-wider text-ink-500 px-4 py-3">Donor</th>
                <th class="text-left font-semibold text-[11px] uppercase tracking-wider text-ink-500 px-4 py-3">Type</th>
                <th class="text-right font-semibold text-[11px] uppercase tracking-wider text-ink-500 px-4 py-3">Amount</th>
                <th class="text-left font-semibold text-[11px] uppercase tracking-wider text-ink-500 px-4 py-3">Status</th>
                <th class="text-right font-semibold text-[11px] uppercase tracking-wider text-ink-500 px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-ink-100">
              ${items.map(r => `
                <tr class="hover:bg-ink-50/60 transition">
                  <td class="px-4 py-3 font-medium text-ink-800">${UI.esc(r.school)}</td>
                  <td class="px-4 py-3 text-ink-600 whitespace-nowrap">${UI.esc(r.quarter + ' · ' + r.month + ' ' + r.year)}</td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-1.5 mb-0.5">
                      ${UI.badge(r.donorCategory, r.donorCategory === 'Internal' ? 'cyan' : 'purple')}
                      <span class="text-[10px] text-ink-400">${UI.esc(r.donorSubType)}</span>
                    </div>
                    <div class="text-ink-800 font-medium text-xs">${UI.esc(r.donorName)}</div>
                  </td>
                  <td class="px-4 py-3">${UI.badge(UI.enumLabel('donationType', r.donationType), 'blue')}</td>
                  <td class="px-4 py-3 text-right tabular-nums font-medium">${r.amount > 0 ? UI.currency(r.amount) : '<span class="text-ink-400">In-Kind</span>'}</td>
                  <td class="px-4 py-3">${UI.statusBadge(r.status)}</td>
                  <td class="px-4 py-3 text-right whitespace-nowrap">
                    <button data-action="view" data-id="${r.id}" class="action-btn px-2.5 py-1 rounded-md text-[11px] font-semibold text-ink-700 hover:bg-ink-100 transition">View</button>
                    ${Store.canEdit() ? `<button data-action="edit" data-id="${r.id}" class="action-btn px-2.5 py-1 rounded-md text-[11px] font-semibold text-ink-700 hover:bg-ink-100 transition">Edit</button>` : ''}
                    ${Store.canDelete() ? `<button data-action="delete" data-id="${r.id}" class="action-btn px-2.5 py-1 rounded-md text-[11px] font-semibold text-rose-600 hover:bg-rose-50 transition">Delete</button>` : ''}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
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
        if (action === 'view') openView(rec);
        else if (action === 'edit') openForm(rec, page);
        else if (action === 'delete') {
          UI.confirmDialog('Delete this donation record?', async () => {
            await Api.remove('donations', id);
            UI.toast('Donation deleted.', 'warning');
            render(page);
          }, { danger: true, confirmLabel: 'Delete' });
        }
      };
    });
  }

  function openView(r) {
    const schoolRows = [
      UI.detailRow('School', UI.esc(r.school)),
      r.schoolId ? UI.detailRow('School ID', UI.esc(r.schoolId)) : '',
      r.address ? UI.detailRow('Address', UI.esc(r.address)) : '',
      r.schoolHead ? UI.detailRow('School Head', UI.esc(r.schoolHead)) : '',
      r.coordinator ? UI.detailRow('Coordinator', UI.esc(r.coordinator)) : ''
    ].filter(Boolean).join('');

    const donationRows = [
      UI.detailRow('Period', UI.esc(r.quarter + ' · ' + r.month + ' ' + r.year)),
      UI.detailRow('Type', UI.badge(UI.enumLabel('donationType', r.donationType), 'blue')),
      UI.detailRow('Description', UI.esc(r.description)),
      UI.detailRow('Amount / Value', r.amount > 0 ? UI.currency(r.amount) : 'In-Kind'),
      r.dateReceived ? UI.detailRow('Date Received', UI.fmtDate(r.dateReceived)) : ''
    ].filter(Boolean).join('');

    const donorRows = [
      UI.detailRow('Category', UI.badge(r.donorCategory, r.donorCategory === 'Internal' ? 'cyan' : 'purple')),
      UI.detailRow('Sub-type', UI.esc(r.donorSubType)),
      UI.detailRow('Name', UI.esc(r.donorName))
    ].join('');

    const moaRows = [
      UI.detailRow('Has MOA/MOU', UI.yesNoBadge(r.hasMOA)),
      UI.detailRow('Notarized', UI.yesNoBadge(r.notarized)),
      r.notarizedDate ? UI.detailRow('Notarized Date', UI.fmtDate(r.notarizedDate)) : '',
      r.usageDescription ? UI.detailRow('Usage', UI.esc(r.usageDescription).replace(/\n/g, '<br>')) : '',
      UI.detailRow('Status', UI.statusBadge(r.status))
    ].filter(Boolean).join('');

    UI.modal({
      title: 'Donation — ' + r.school,
      size: 'lg',
      body: `
        <div class="space-y-5">
          ${UI.detailSection('School Information', schoolRows)}
          ${UI.detailSection('Donor', donorRows)}
          ${UI.detailSection('Donation Details', donationRows)}
          ${UI.detailSection('MOA/MOU & Utilization', moaRows)}
        </div>
      `,
      footer: (foot, close) => foot.appendChild(UI.btn('Close', { tone: 'secondary', onClick: close }))
    });
  }

  function openForm(rec, page) {
    const isEdit = !!rec;
    const initialCategory = rec ? rec.donorCategory : 'Internal';
    const initialSubType = rec ? rec.donorSubType : DONOR_TIERS.Internal[0].value;

    function subTypeOptionsFor(category) {
      return DONOR_TIERS[category].map(s => ({ value: s.value, label: s.value }));
    }
    function getSubTypeMeta(category, subType) {
      return DONOR_TIERS[category].find(s => s.value === subType) || DONOR_TIERS[category][0];
    }

    const lockSchool = Store.isSchool();
    const initialSchool = rec ? rec.school : (lockSchool ? Store.getSession().school : '');
    const schoolField = lockSchool
      ? `<div class="px-3 py-2 text-sm bg-ink-50 border border-ink-100 rounded-lg text-ink-700 font-medium flex items-center gap-2">
           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-ink-400 flex-shrink-0"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
           ${UI.esc(initialSchool)}
           <input type="hidden" id="d_school" value="${UI.esc(initialSchool)}">
         </div>`
      : UI.input('d_school', { value: initialSchool });

    const body = `
      <div class="space-y-5">
        ${UI.fieldGroup('School Information',
          UI.row2(
            UI.field('Name of School', schoolField, lockSchool ? 'Locked to your assigned school' : null, true),
            UI.field('School ID', UI.input('d_sid', { value: rec ? (rec.schoolId || '') : '' }))
          ) +
          UI.row2(
            UI.field('School Head', UI.input('d_head', { value: rec ? (rec.schoolHead || '') : '' })),
            UI.field('Partnership Coordinator', UI.input('d_coord', { value: rec ? (rec.coordinator || '') : '' }))
          ) +
          UI.field('Complete Address', UI.input('d_addr', { value: rec ? (rec.address || '') : '' }))
        )}

        ${UI.fieldGroup('Donor Information',
          UI.field('Donor Category', `
            <div class="grid grid-cols-2 gap-2">
              <label class="cursor-pointer">
                <input type="radio" name="d_cat" id="d_cat_int" value="Internal" ${initialCategory === 'Internal' ? 'checked' : ''} class="peer hidden">
                <div class="px-4 py-3 rounded-xl border-2 border-ink-200 peer-checked:border-cyan-500 peer-checked:bg-cyan-50 transition text-sm">
                  <div class="font-semibold text-ink-900">Internal</div>
                  <div class="text-[11px] text-ink-500">LGU, DepEd, government</div>
                </div>
              </label>
              <label class="cursor-pointer">
                <input type="radio" name="d_cat" id="d_cat_ext" value="External" ${initialCategory === 'External' ? 'checked' : ''} class="peer hidden">
                <div class="px-4 py-3 rounded-xl border-2 border-ink-200 peer-checked:border-violet-500 peer-checked:bg-violet-50 transition text-sm">
                  <div class="font-semibold text-ink-900">External</div>
                  <div class="text-[11px] text-ink-500">Private, NGO, individual</div>
                </div>
              </label>
            </div>
          `, null, true) +
          UI.row2(
            UI.field('Sub-type', `<select id="d_subtype" class="w-full px-3 py-2 text-sm bg-white border border-ink-200 rounded-lg cursor-pointer"></select>`, null, true),
            UI.field('<span id="d_namelabel">Donor Name</span>', UI.input('d_donor', { value: rec ? rec.donorName : '', placeholder: getSubTypeMeta(initialCategory, initialSubType).placeholder }), null, true)
          )
        )}

        ${UI.fieldGroup('Donation Details',
          UI.row3(
            UI.field('Quarter', UI.select('d_q', ['Q1','Q2','Q3','Q4'], rec ? rec.quarter : 'Q1'), null, true),
            UI.field('Month', UI.select('d_m', MONTHS, rec ? rec.month : 'January'), null, true),
            UI.field('Year', UI.select('d_y', ['2024','2025','2026','2027'], rec ? rec.year : '2026'), null, true)
          ) +
          UI.row2(
            UI.field('Donation Type', UI.select('d_type', TYPES, rec ? rec.donationType : 'Cash'), null, true),
            UI.field('Amount / Value', UI.input('d_amt', { type: 'number', min: 0, step: '0.01', value: rec ? rec.amount : '0' }), '0 for In-Kind')
          ) +
          UI.field('Description of Donation', UI.input('d_desc', { value: rec ? rec.description : '' }), null, true) +
          UI.field('Date Received', UI.input('d_date', { type: 'date', value: rec ? UI.fmtDateInput(rec.dateReceived) : '' }))
        )}

        ${UI.fieldGroup('MOA/MOU & Utilization',
          UI.row3(
            UI.field('Has MOA/MOU?', UI.checkbox('d_moa', 'Yes', rec ? rec.hasMOA : false)),
            UI.field('Notarized?', UI.checkbox('d_not', 'Yes', rec ? rec.notarized : false)),
            UI.field('Notarized Date', UI.input('d_notd', { type: 'date', value: rec ? UI.fmtDateInput(rec.notarizedDate) : '' }))
          ) +
          UI.field('Usage / Turned Over To', UI.textarea('d_usage', { rows: 2, value: rec ? (rec.usageDescription || '') : '' })) +
          UI.field('Status', UI.select('d_status', STATUSES, rec ? rec.status : 'Encoded'))
        )}
      </div>
    `;

    UI.modal({
      title: isEdit ? 'Edit Donation' : 'New Donation Record',
      size: 'lg',
      body,
      footer: (foot, close) => {
        foot.appendChild(UI.btn('Cancel', { tone: 'secondary', onClick: close }));
        const save = UI.btn(isEdit ? 'Save Changes' : 'Save Record', {
          tone: 'primary',
          onClick: async () => {
            const cat = document.querySelector('input[name="d_cat"]:checked').value;
            const data = {
              school: UI.val('d_school').trim(),
              schoolId: UI.val('d_sid').trim() || null,
              schoolHead: UI.val('d_head').trim() || null,
              coordinator: UI.val('d_coord').trim() || null,
              address: UI.val('d_addr').trim() || null,
              quarter: UI.val('d_q'),
              month: UI.val('d_m'),
              year: UI.val('d_y'),
              donationType: UI.val('d_type'),
              amount: parseFloat(UI.val('d_amt')) || 0,
              description: UI.val('d_desc').trim(),
              donorCategory: cat,
              donorSubType: UI.val('d_subtype'),
              donorName: UI.val('d_donor').trim(),
              dateReceived: UI.val('d_date') || null,
              hasMOA: UI.checked('d_moa'),
              notarized: UI.checked('d_not'),
              notarizedDate: UI.val('d_notd') || null,
              usageDescription: UI.val('d_usage').trim() || null,
              status: UI.val('d_status')
            };
            if (!data.school || !data.description || !data.donorName) {
              UI.toast('School, description, and donor name are required.', 'error');
              return;
            }
            try {
              if (isEdit) await Api.update('donations', rec.id, data);
              else await Api.create('donations', data);
              UI.toast(isEdit ? 'Donation updated.' : 'Donation created.');
              close();
              render(page);
            } catch (e) { UI.toast(e.message, 'error'); }
          }
        });
        foot.appendChild(save);
      }
    });

    // Wire 2-tier donor logic
    function refreshSubType() {
      const cat = document.querySelector('input[name="d_cat"]:checked').value;
      const sel = document.getElementById('d_subtype');
      sel.innerHTML = subTypeOptionsFor(cat).map(o => `<option value="${UI.esc(o.value)}">${UI.esc(o.label)}</option>`).join('');
      if (rec && rec.donorCategory === cat) sel.value = rec.donorSubType;
      refreshNameLabel();
    }
    function refreshNameLabel() {
      const cat = document.querySelector('input[name="d_cat"]:checked').value;
      const sub = document.getElementById('d_subtype').value;
      const meta = getSubTypeMeta(cat, sub);
      document.getElementById('d_namelabel').textContent = meta.nameLabel;
      document.getElementById('d_donor').placeholder = meta.placeholder;
    }
    document.getElementById('d_cat_int').onchange = refreshSubType;
    document.getElementById('d_cat_ext').onchange = refreshSubType;
    document.getElementById('d_subtype').onchange = refreshNameLabel;
    refreshSubType();
  }
})();
