// FA5: Certifications
(function() {
  window.Views = window.Views || {};

  const STATUSES = ['Pending', 'Issued', 'Approved'];

  Views.certifications = async function(page) { await render(page); };

  async function render(page) {
    page.innerHTML = `
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div class="text-[10px] font-bold tracking-widest text-rose-500 mb-1">FA 5 · CERTIFICATIONS</div>
          <h1 class="text-2xl font-bold tracking-tight text-ink-900">Certifications & Recognition</h1>
          <p class="text-sm text-ink-500 mt-1">HIYAS Rewards & Recognition Program · Partnership certifications.</p>
        </div>
        ${Store.canEdit() ? `<button id="addBtn" class="self-start inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-lg bg-ink-900 text-white hover:bg-ink-800 transition shadow-soft">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
          Issue Certification
        </button>` : ''}
      </div>

      <div id="c-body" class="mt-5">${UI.skeletonCard(4)}</div>
    `;

    if (Store.canEdit()) document.getElementById('addBtn').onclick = () => openForm(null, page);
    const items = await Api.list('certifications');
    document.getElementById('c-body').innerHTML = renderTable(items);
    wire(items, page);
  }

  function renderTable(items) {
    if (!items.length) {
      return `<div class="bg-white rounded-2xl shadow-soft ring-1 ring-ink-100">${UI.emptyState({
        title: 'No certifications yet',
        desc: 'Click "Issue Certification" to create the first record.'
      })}</div>`;
    }
    return `
      <div class="bg-white rounded-2xl shadow-soft ring-1 ring-ink-100 overflow-hidden">
        <div class="overflow-x-auto scrollbar-thin">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-ink-50/80 border-b border-ink-100">
                <th class="text-left font-semibold text-[11px] uppercase tracking-wider text-ink-500 px-4 py-3">School</th>
                <th class="text-left font-semibold text-[11px] uppercase tracking-wider text-ink-500 px-4 py-3">Partner</th>
                <th class="text-right font-semibold text-[11px] uppercase tracking-wider text-ink-500 px-4 py-3">Amount</th>
                <th class="text-right font-semibold text-[11px] uppercase tracking-wider text-ink-500 px-4 py-3">Points</th>
                <th class="text-left font-semibold text-[11px] uppercase tracking-wider text-ink-500 px-4 py-3">Period</th>
                <th class="text-left font-semibold text-[11px] uppercase tracking-wider text-ink-500 px-4 py-3">HIYAS</th>
                <th class="text-left font-semibold text-[11px] uppercase tracking-wider text-ink-500 px-4 py-3">Status</th>
                <th class="text-right font-semibold text-[11px] uppercase tracking-wider text-ink-500 px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-ink-100">
              ${items.map(r => `
                <tr class="hover:bg-ink-50/60 transition">
                  <td class="px-4 py-3 font-medium text-ink-800">${UI.esc(r.school)}</td>
                  <td class="px-4 py-3 text-ink-600">${UI.esc(r.partnerName)}</td>
                  <td class="px-4 py-3 text-right tabular-nums font-medium">${UI.currency(r.amountReceived)}</td>
                  <td class="px-4 py-3 text-right tabular-nums">${UI.num(r.pointsEarned)}</td>
                  <td class="px-4 py-3 text-ink-600 whitespace-nowrap">${UI.esc(r.programYear + ' · ' + r.quarter)}</td>
                  <td class="px-4 py-3">${UI.yesNoBadge(r.hiyas)}</td>
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

  function wire(items, page) {
    document.querySelectorAll('.action-btn').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        const action = btn.dataset.action;
        const rec = items.find(r => r.id === id);
        if (!rec) return;
        if (action === 'view') openView(rec);
        else if (action === 'edit') openForm(rec, page);
        else if (action === 'delete') {
          UI.confirmDialog('Delete this certification?', async () => {
            await Api.remove('certifications', id);
            UI.toast('Certification deleted.', 'warning');
            render(page);
          }, { danger: true, confirmLabel: 'Delete' });
        }
      };
    });
  }

  function openView(r) {
    const rows = [
      UI.detailRow('School', UI.esc(r.school)),
      UI.detailRow('School Head', UI.esc(r.schoolHead || '—')),
      UI.detailRow('Partner Name', UI.esc(r.partnerName)),
      UI.detailRow('Amount Received', UI.currency(r.amountReceived)),
      UI.detailRow('Points Earned', UI.num(r.pointsEarned)),
      UI.detailRow('Certificate Date', UI.fmtDate(r.certDate)),
      UI.detailRow('Program Year / Quarter', UI.esc(r.programYear + ' · ' + r.quarter)),
      UI.detailRow('HIYAS Eligible', UI.yesNoBadge(r.hiyas)),
      UI.detailRow('Status', UI.statusBadge(r.status))
    ].join('');
    UI.modal({
      title: 'Certification — ' + r.school,
      body: `<div>${rows}</div>`,
      footer: (foot, close) => foot.appendChild(UI.btn('Close', { tone: 'secondary', onClick: close }))
    });
  }

  function openForm(rec, page) {
    const isEdit = !!rec;
    const body = `
      <div class="space-y-5">
        ${UI.fieldGroup('School',
          UI.row2(
            UI.field('School Name', UI.input('c_school', { value: rec ? rec.school : '' }), null, true),
            UI.field('School Head', UI.input('c_head', { value: rec ? (rec.schoolHead || '') : '' }))
          )
        )}
        ${UI.fieldGroup('Partner & Contribution',
          UI.row2(
            UI.field('Partner Name', UI.input('c_partner', { value: rec ? rec.partnerName : '' }), null, true),
            UI.field('Amount Received', UI.input('c_amt', { type: 'number', min: 0, step: '0.01', value: rec ? rec.amountReceived : '0' }))
          ) +
          UI.row2(
            UI.field('Points Earned', UI.input('c_pts', { type: 'number', min: 0, value: rec ? rec.pointsEarned : '0' }), 'Based on recognition rubric'),
            UI.field('Certificate Date', UI.input('c_date', { type: 'date', value: rec ? UI.fmtDateInput(rec.certDate) : '' }))
          )
        )}
        ${UI.fieldGroup('Program Period',
          UI.row3(
            UI.field('Program Year', UI.select('c_yr', ['2024','2025','2026','2027'], rec ? rec.programYear : '2026')),
            UI.field('Quarter', UI.select('c_qr', ['Q1','Q2','Q3','Q4'], rec ? rec.quarter : 'Q1')),
            UI.field('HIYAS Eligible', UI.checkbox('c_hiyas', 'Yes', rec ? rec.hiyas : false))
          ) +
          UI.field('Status', UI.select('c_status', STATUSES, rec ? rec.status : 'Pending'))
        )}
      </div>
    `;
    UI.modal({
      title: isEdit ? 'Edit Certification' : 'Issue Certification',
      size: 'lg',
      body,
      footer: (foot, close) => {
        foot.appendChild(UI.btn('Cancel', { tone: 'secondary', onClick: close }));
        const save = UI.btn(isEdit ? 'Save Changes' : 'Issue Certificate', {
          tone: 'primary',
          onClick: async () => {
            const data = {
              school: UI.val('c_school').trim(),
              schoolHead: UI.val('c_head').trim() || null,
              partnerName: UI.val('c_partner').trim(),
              amountReceived: parseFloat(UI.val('c_amt')) || 0,
              pointsEarned: parseInt(UI.val('c_pts')) || 0,
              certDate: UI.val('c_date') || null,
              programYear: UI.val('c_yr'),
              quarter: UI.val('c_qr'),
              hiyas: UI.checked('c_hiyas'),
              status: UI.val('c_status')
            };
            if (!data.school || !data.partnerName) { UI.toast('School and partner name required.', 'error'); return; }
            try {
              if (isEdit) await Api.update('certifications', rec.id, data);
              else await Api.create('certifications', data);
              UI.toast(isEdit ? 'Certification updated.' : 'Certification issued.');
              close();
              render(page);
            } catch (e) { UI.toast(e.message, 'error'); }
          }
        });
        foot.appendChild(save);
      }
    });
  }
})();
