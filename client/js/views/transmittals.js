// FA1: Transmittal Reports — hierarchical drill-down (Year > Month > School)
(function() {
  window.Views = window.Views || {};

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const CONTRIB_TYPES = [
    { value: 'Cash', label: 'Cash' },
    { value: 'InKind', label: 'In-Kind' },
    { value: 'Service', label: 'Service' },
    { value: 'Scholarship', label: 'Scholarship' },
    { value: 'Infrastructure', label: 'Infrastructure' },
    { value: 'Equipment', label: 'Equipment' },
    { value: 'Supplies', label: 'Supplies' },
    { value: 'Other', label: 'Other' }
  ];
  const CLUSTERS = ['1','2','3','4','5','6','7','8','9','10'];
  const STATUSES = ['Submitted', 'Validated', 'Pending'];

  // View state
  let state = { level: 'years', selectedYear: null, selectedMonth: null };

  Views.transmittals = async function(page) {
    state = { level: 'years', selectedYear: null, selectedMonth: null };
    await render(page);
  };

  async function render(page) {
    page.innerHTML = renderHeader() + `<div id="t-body" class="mt-5">${UI.skeletonCard(5)}</div>`;
    wireHeaderButtons(page);

    const all = await Api.list('transmittals');
    const body = document.getElementById('t-body');

    if (state.level === 'years') {
      body.innerHTML = renderYearView(all);
      wireYearClicks(body, all, page);
    } else if (state.level === 'months') {
      body.innerHTML = renderMonthView(all);
      wireMonthClicks(body, all, page);
    } else if (state.level === 'schools') {
      body.innerHTML = renderSchoolView(all);
      wireSchoolClicks(body, all, page);
    }
  }

  function renderHeader() {
    let crumbs = `<button id="goRoot" class="hover:text-ink-900 transition">All Years</button>`;
    if (state.selectedYear) {
      crumbs += `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-ink-300"><path d="M9 18l6-6-6-6"/></svg>
        <button id="goYear" class="hover:text-ink-900 transition">${UI.esc(state.selectedYear)}</button>`;
    }
    if (state.selectedMonth) {
      crumbs += `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-ink-300"><path d="M9 18l6-6-6-6"/></svg>
        <span class="text-ink-900 font-semibold">${UI.esc(state.selectedMonth)}</span>`;
    }

    return `
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div class="text-[10px] font-bold tracking-widest text-deped-yellow mb-1">FA 1 · TRANSMITTAL</div>
          <h1 class="text-2xl font-bold tracking-tight text-ink-900">Partnerships Data Sheet Consolidation</h1>
          <p class="text-sm text-ink-500 mt-1">Year → Month → School drill-down. Generate reports per school.</p>
        </div>
        <div class="flex items-center gap-2">
          ${Store.canEdit() ? `<button id="addBtn" class="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-lg bg-ink-900 text-white hover:bg-ink-800 transition shadow-soft">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
            New Transmittal
          </button>` : ''}
        </div>
      </div>
      <div class="flex items-center gap-2 mt-3 text-xs text-ink-500">${crumbs}</div>
    `;
  }

  function wireHeaderButtons(page) {
    const addBtn = document.getElementById('addBtn');
    if (addBtn) addBtn.onclick = () => openForm(null, page);
    const goRoot = document.getElementById('goRoot');
    if (goRoot) goRoot.onclick = () => { state = { level: 'years', selectedYear: null, selectedMonth: null }; render(page); };
    const goYear = document.getElementById('goYear');
    if (goYear) goYear.onclick = () => { state = { level: 'months', selectedYear: state.selectedYear, selectedMonth: null }; render(page); };
  }

  // ---- YEAR VIEW ----
  function renderYearView(all) {
    if (!all.length) {
      return `<div class="bg-white rounded-2xl shadow-soft ring-1 ring-ink-100">${UI.emptyState({
        title: 'No transmittals yet',
        desc: 'Click "New Transmittal" to create the first partnership data sheet.'
      })}</div>`;
    }

    const byYear = {};
    all.forEach(t => {
      if (!byYear[t.year]) byYear[t.year] = { count: 0, totalAmt: 0, totalBen: 0, schools: new Set() };
      byYear[t.year].count++;
      byYear[t.year].totalAmt += t.amountContribution;
      byYear[t.year].totalBen += t.numBeneficiaries;
      byYear[t.year].schools.add(t.school);
    });

    const years = Object.keys(byYear).sort().reverse();
    return `
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        ${years.map(y => {
          const d = byYear[y];
          return `
            <button data-year="${UI.esc(y)}" class="year-card text-left relative bg-white rounded-2xl p-6 shadow-soft ring-1 ring-ink-100 hover:shadow-soft-md hover:-translate-y-0.5 transition group">
              <div class="flex items-start justify-between mb-4">
                <div>
                  <div class="text-[10px] font-bold tracking-widest text-ink-400 mb-1">CALENDAR YEAR</div>
                  <div class="text-3xl font-bold tracking-tight text-ink-900">${UI.esc(y)}</div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-ink-300 group-hover:text-ink-700 group-hover:translate-x-0.5 transition"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </div>
              <div class="grid grid-cols-3 gap-3 pt-4 border-t border-ink-100">
                <div><div class="text-base font-semibold text-ink-900">${d.count}</div><div class="text-[10px] text-ink-400 uppercase tracking-wider">Records</div></div>
                <div><div class="text-base font-semibold text-ink-900">${d.schools.size}</div><div class="text-[10px] text-ink-400 uppercase tracking-wider">Schools</div></div>
                <div><div class="text-base font-semibold text-ink-900">${UI.num(d.totalBen)}</div><div class="text-[10px] text-ink-400 uppercase tracking-wider">Learners</div></div>
              </div>
              <div class="mt-3 text-xs text-ink-500">${UI.currency(d.totalAmt)} total contributions</div>
            </button>
          `;
        }).join('')}
      </div>
    `;
  }

  function wireYearClicks(body, all, page) {
    body.querySelectorAll('.year-card').forEach(card => {
      card.onclick = () => {
        state = { level: 'months', selectedYear: card.dataset.year, selectedMonth: null };
        render(page);
      };
    });
  }

  // ---- MONTH VIEW ----
  function renderMonthView(all) {
    const yearItems = all.filter(t => t.year === state.selectedYear);
    if (!yearItems.length) {
      return `<div class="bg-white rounded-2xl shadow-soft ring-1 ring-ink-100">${UI.emptyState({ title: 'No records for ' + state.selectedYear })}</div>`;
    }

    const byMonth = {};
    MONTHS.forEach(m => byMonth[m] = { count: 0, totalAmt: 0, totalBen: 0, schools: new Set() });
    yearItems.forEach(t => {
      if (!byMonth[t.month]) return;
      byMonth[t.month].count++;
      byMonth[t.month].totalAmt += t.amountContribution;
      byMonth[t.month].totalBen += t.numBeneficiaries;
      byMonth[t.month].schools.add(t.school);
    });

    return `
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        ${MONTHS.map(m => {
          const d = byMonth[m];
          const empty = d.count === 0;
          return `
            <button data-month="${UI.esc(m)}" ${empty ? 'disabled' : ''} class="month-card text-left relative bg-white rounded-xl p-4 shadow-soft ring-1 ring-ink-100 ${empty ? 'opacity-40 cursor-not-allowed' : 'hover:shadow-soft-md hover:-translate-y-0.5 cursor-pointer'} transition group">
              <div class="flex items-start justify-between mb-2">
                <div class="text-sm font-semibold text-ink-900">${UI.esc(m)}</div>
                ${empty ? '<span class="text-[10px] text-ink-400">No data</span>' : `<span class="px-1.5 py-0.5 rounded-md bg-ink-100 text-ink-700 text-[10px] font-bold">${d.count}</span>`}
              </div>
              ${empty ? '<div class="text-[11px] text-ink-300">—</div>' : `
                <div class="text-[11px] text-ink-500">${d.schools.size} school${d.schools.size !== 1 ? 's' : ''}</div>
                <div class="text-[11px] text-ink-500 font-medium mt-0.5">${UI.currency(d.totalAmt)}</div>
              `}
            </button>
          `;
        }).join('')}
      </div>
    `;
  }

  function wireMonthClicks(body, all, page) {
    body.querySelectorAll('.month-card:not([disabled])').forEach(card => {
      card.onclick = () => {
        state = { level: 'schools', selectedYear: state.selectedYear, selectedMonth: card.dataset.month };
        render(page);
      };
    });
  }

  // ---- SCHOOL VIEW (drill-down detail) ----
  function renderSchoolView(all) {
    const items = all.filter(t => t.year === state.selectedYear && t.month === state.selectedMonth)
      .sort((a, b) => a.school.localeCompare(b.school));

    if (!items.length) {
      return `<div class="bg-white rounded-2xl shadow-soft ring-1 ring-ink-100">${UI.emptyState({ title: 'No schools for ' + state.selectedMonth + ' ' + state.selectedYear })}</div>`;
    }

    const totals = items.reduce((acc, t) => ({
      partners: acc.partners + t.numPartners,
      amount: acc.amount + t.amountContribution,
      beneficiaries: acc.beneficiaries + t.numBeneficiaries
    }), { partners: 0, amount: 0, beneficiaries: 0 });

    return `
      <div class="bg-white rounded-2xl shadow-soft ring-1 ring-ink-100 overflow-hidden">
        <div class="px-5 py-4 border-b border-ink-100 flex items-center justify-between">
          <div>
            <div class="text-sm font-semibold text-ink-900">${items.length} school${items.length !== 1 ? 's' : ''} · ${UI.esc(state.selectedMonth)} ${UI.esc(state.selectedYear)}</div>
            <div class="text-xs text-ink-500 mt-0.5">${UI.num(totals.partners)} partners · ${UI.currency(totals.amount)} · ${UI.num(totals.beneficiaries)} learners</div>
          </div>
        </div>
        <div class="overflow-x-auto scrollbar-thin">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-ink-50/80 border-b border-ink-100">
                <th class="text-left font-semibold text-[11px] uppercase tracking-wider text-ink-500 px-5 py-3">School</th>
                <th class="text-left font-semibold text-[11px] uppercase tracking-wider text-ink-500 px-5 py-3">Cluster</th>
                <th class="text-left font-semibold text-[11px] uppercase tracking-wider text-ink-500 px-5 py-3">Type</th>
                <th class="text-right font-semibold text-[11px] uppercase tracking-wider text-ink-500 px-5 py-3">Partners</th>
                <th class="text-right font-semibold text-[11px] uppercase tracking-wider text-ink-500 px-5 py-3">Amount</th>
                <th class="text-right font-semibold text-[11px] uppercase tracking-wider text-ink-500 px-5 py-3">Learners</th>
                <th class="text-left font-semibold text-[11px] uppercase tracking-wider text-ink-500 px-5 py-3">Status</th>
                <th class="text-right font-semibold text-[11px] uppercase tracking-wider text-ink-500 px-5 py-3 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-ink-100">
              ${items.map(t => `
                <tr class="hover:bg-ink-50/60 transition">
                  <td class="px-5 py-3.5 font-medium text-ink-800">${UI.esc(t.school)}</td>
                  <td class="px-5 py-3.5 text-ink-600">Cluster ${UI.esc(t.cluster)}</td>
                  <td class="px-5 py-3.5">${UI.badge(UI.enumLabel('contributionType', t.contributionType), 'blue')}</td>
                  <td class="px-5 py-3.5 text-right tabular-nums">${UI.num(t.numPartners)}</td>
                  <td class="px-5 py-3.5 text-right tabular-nums font-medium">${UI.currency(t.amountContribution)}</td>
                  <td class="px-5 py-3.5 text-right tabular-nums">${UI.num(t.numBeneficiaries)}</td>
                  <td class="px-5 py-3.5">${UI.statusBadge(t.status)}</td>
                  <td class="px-5 py-3.5 text-right whitespace-nowrap">
                    <button data-action="report" data-id="${t.id}" class="action-btn px-2.5 py-1 rounded-md text-[11px] font-semibold bg-deped-yellow/15 text-amber-700 hover:bg-deped-yellow/25 transition">Report</button>
                    <button data-action="view" data-id="${t.id}" class="action-btn px-2.5 py-1 rounded-md text-[11px] font-semibold text-ink-700 hover:bg-ink-100 transition">View</button>
                    ${Store.canEdit() ? `<button data-action="edit" data-id="${t.id}" class="action-btn px-2.5 py-1 rounded-md text-[11px] font-semibold text-ink-700 hover:bg-ink-100 transition">Edit</button>` : ''}
                    ${Store.canDelete() ? `<button data-action="delete" data-id="${t.id}" class="action-btn px-2.5 py-1 rounded-md text-[11px] font-semibold text-rose-600 hover:bg-rose-50 transition">Delete</button>` : ''}
                  </td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr class="bg-ink-50/40 border-t-2 border-ink-200 font-semibold">
                <td colspan="3" class="px-5 py-3 text-xs text-ink-700 uppercase tracking-wider">Totals</td>
                <td class="px-5 py-3 text-right tabular-nums">${UI.num(totals.partners)}</td>
                <td class="px-5 py-3 text-right tabular-nums">${UI.currency(totals.amount)}</td>
                <td class="px-5 py-3 text-right tabular-nums">${UI.num(totals.beneficiaries)}</td>
                <td colspan="2"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    `;
  }

  function wireSchoolClicks(body, all, page) {
    body.querySelectorAll('.action-btn').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        const action = btn.dataset.action;
        const rec = all.find(t => t.id === id);
        if (!rec) return;
        if (action === 'view') openView(rec);
        else if (action === 'edit') openForm(rec, page);
        else if (action === 'delete') {
          UI.confirmDialog('Delete this transmittal? This cannot be undone.', async () => {
            await Api.remove('transmittals', id);
            UI.toast('Transmittal deleted.', 'warning');
            render(page);
          }, { danger: true, confirmLabel: 'Delete' });
        } else if (action === 'report') {
          openReport(rec);
        }
      };
    });
  }

  // ----- VIEW MODAL -----
  function openView(r) {
    const rows = [
      UI.detailRow('School', UI.esc(r.school)),
      UI.detailRow('Cluster', 'Cluster ' + UI.esc(r.cluster)),
      UI.detailRow('Period', UI.esc(r.month + ' ' + r.year)),
      UI.detailRow('Contribution Type', UI.badge(UI.enumLabel('contributionType', r.contributionType), 'blue')),
      UI.detailRow('No. of Partners', UI.num(r.numPartners)),
      UI.detailRow('Amount', UI.currency(r.amountContribution)),
      UI.detailRow('Beneficiary Learners', UI.num(r.numBeneficiaries)),
      UI.detailRow('Status', UI.statusBadge(r.status)),
      UI.detailRow('Encoded', UI.fmtDate(r.createdAt))
    ].join('');

    UI.modal({
      title: 'Transmittal — ' + r.school,
      size: 'md',
      body: `<div>${rows}</div>`,
      footer: (foot, close) => {
        const btn = UI.btn('Close', { tone: 'secondary', onClick: close });
        const reportBtn = UI.btn('Generate Report', { tone: 'primary', onClick: () => { close(); openReport(r); } });
        foot.appendChild(btn);
        foot.appendChild(reportBtn);
      }
    });
  }

  // ----- REPORT (printable, generated per school) -----
  function openReport(r) {
    const html = `
      <div id="report-doc" class="bg-white p-8 print-page">
        <div class="text-center border-b-2 border-ink-900 pb-4">
          <div class="text-xs uppercase tracking-widest text-ink-500">Republic of the Philippines</div>
          <div class="text-sm font-bold text-ink-900 mt-1">Department of Education</div>
          <div class="text-sm font-semibold text-ink-700">Schools Division Office of Sipalay City</div>
          <div class="text-xs text-ink-500 mt-1">Negros Island Region</div>
          <div class="mt-4 text-base font-bold tracking-tight text-ink-900">PARTNERSHIP DATA SHEET</div>
          <div class="text-xs text-ink-500">${UI.esc(r.month)} ${UI.esc(r.year)} · Cluster ${UI.esc(r.cluster)}</div>
        </div>

        <div class="mt-6 space-y-4 text-sm">
          <div class="grid grid-cols-2 gap-x-8 gap-y-2">
            <div><span class="text-ink-500 text-xs uppercase tracking-wide">School</span><div class="font-semibold">${UI.esc(r.school)}</div></div>
            <div><span class="text-ink-500 text-xs uppercase tracking-wide">Cluster</span><div class="font-semibold">Cluster ${UI.esc(r.cluster)}</div></div>
            <div><span class="text-ink-500 text-xs uppercase tracking-wide">Reporting Month</span><div class="font-semibold">${UI.esc(r.month)} ${UI.esc(r.year)}</div></div>
            <div><span class="text-ink-500 text-xs uppercase tracking-wide">Status</span><div class="font-semibold">${UI.esc(r.status)}</div></div>
          </div>

          <table class="w-full mt-4 border border-ink-200 text-sm">
            <thead>
              <tr class="bg-ink-50">
                <th class="text-left p-2 font-semibold border-b border-ink-200">Item</th>
                <th class="text-right p-2 font-semibold border-b border-ink-200">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr><td class="p-2 border-b border-ink-100">Contribution Type</td><td class="p-2 border-b border-ink-100 text-right font-medium">${UI.esc(UI.enumLabel('contributionType', r.contributionType))}</td></tr>
              <tr><td class="p-2 border-b border-ink-100">No. of Partners</td><td class="p-2 border-b border-ink-100 text-right tabular-nums">${UI.num(r.numPartners)}</td></tr>
              <tr><td class="p-2 border-b border-ink-100">Amount of Contribution</td><td class="p-2 border-b border-ink-100 text-right tabular-nums font-semibold">${UI.currency(r.amountContribution)}</td></tr>
              <tr><td class="p-2 border-b border-ink-100">No. of Beneficiary Learners</td><td class="p-2 border-b border-ink-100 text-right tabular-nums">${UI.num(r.numBeneficiaries)}</td></tr>
            </tbody>
          </table>

          <div class="grid grid-cols-2 gap-12 mt-12 pt-4">
            <div class="text-center">
              <div class="border-t border-ink-900 pt-1 mt-12 text-xs">School Head Signature</div>
            </div>
            <div class="text-center">
              <div class="border-t border-ink-900 pt-1 mt-12 text-xs">Division Coordinator Signature</div>
            </div>
          </div>

          <div class="mt-6 text-[10px] text-ink-400 text-right">Generated: ${new Date().toLocaleString()}</div>
        </div>
      </div>
    `;

    const m = UI.modal({
      title: 'Generated Report — ' + r.school,
      size: 'lg',
      body: html,
      footer: (foot, close) => {
        const closeBtn = UI.btn('Close', { tone: 'secondary', onClick: close });
        const printBtn = UI.btn('Print / Save PDF', {
          tone: 'primary',
          onClick: () => printDoc(r)
        });
        foot.appendChild(closeBtn);
        foot.appendChild(printBtn);
      }
    });
  }

  function printDoc(r) {
    const w = window.open('', '_blank', 'width=900,height=1200');
    if (!w) { UI.toast('Pop-up blocked. Please allow pop-ups to print.', 'warning'); return; }
    w.document.write(`
      <html><head>
        <title>Transmittal — ${UI.esc(r.school)} — ${UI.esc(r.month)} ${UI.esc(r.year)}</title>
        <style>
          body { font-family: 'Inter', sans-serif; padding: 40px; color: #1c1917; }
          h1 { font-size: 16px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
          th, td { padding: 8px 10px; border: 1px solid #d6d3d1; }
          th { background: #f5f5f4; text-align: left; }
          .header { text-align: center; padding-bottom: 16px; border-bottom: 2px solid #1c1917; }
          .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 20px; font-size: 13px; }
          .meta div { padding: 4px 0; }
          .meta span { color: #78716c; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; display: block; }
          .meta strong { font-size: 13px; }
          .sig { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; margin-top: 80px; }
          .sig div { text-align: center; }
          .sig-line { border-top: 1px solid #1c1917; padding-top: 4px; font-size: 11px; }
          .gen { margin-top: 30px; font-size: 10px; color: #a8a29e; text-align: right; }
        </style>
      </head><body>
        <div class="header">
          <div style="font-size:10px; text-transform: uppercase; letter-spacing: 0.1em; color:#78716c">Republic of the Philippines</div>
          <div style="font-size:13px; font-weight:700; margin-top:4px">Department of Education</div>
          <div style="font-size:13px; font-weight:600; color:#44403c">Schools Division Office of Sipalay City</div>
          <div style="font-size:11px; color:#78716c; margin-top:4px">Negros Island Region</div>
          <h1 style="margin-top:16px; font-size:14px; font-weight:700; letter-spacing:-0.01em">PARTNERSHIP DATA SHEET</h1>
          <div style="font-size:11px; color:#78716c">${UI.esc(r.month)} ${UI.esc(r.year)} · Cluster ${UI.esc(r.cluster)}</div>
        </div>
        <div class="meta">
          <div><span>School</span><strong>${UI.esc(r.school)}</strong></div>
          <div><span>Cluster</span><strong>Cluster ${UI.esc(r.cluster)}</strong></div>
          <div><span>Reporting Month</span><strong>${UI.esc(r.month)} ${UI.esc(r.year)}</strong></div>
          <div><span>Status</span><strong>${UI.esc(r.status)}</strong></div>
        </div>
        <table>
          <thead><tr><th>Item</th><th style="text-align:right">Value</th></tr></thead>
          <tbody>
            <tr><td>Contribution Type</td><td style="text-align:right">${UI.esc(UI.enumLabel('contributionType', r.contributionType))}</td></tr>
            <tr><td>No. of Partners</td><td style="text-align:right">${UI.num(r.numPartners)}</td></tr>
            <tr><td>Amount of Contribution</td><td style="text-align:right; font-weight:600">${UI.currency(r.amountContribution)}</td></tr>
            <tr><td>No. of Beneficiary Learners</td><td style="text-align:right">${UI.num(r.numBeneficiaries)}</td></tr>
          </tbody>
        </table>
        <div class="sig">
          <div><div style="margin-top:60px"></div><div class="sig-line">School Head Signature</div></div>
          <div><div style="margin-top:60px"></div><div class="sig-line">Division Coordinator Signature</div></div>
        </div>
        <div class="gen">Generated: ${new Date().toLocaleString()}</div>
        <script>window.onload=()=>setTimeout(()=>window.print(),300)</script>
      </body></html>
    `);
    w.document.close();
  }

  // ----- ADD / EDIT FORM -----
  function openForm(rec, page) {
    const isEdit = !!rec;
    const yearOpts = ['2024','2025','2026','2027'];

    const body = `
      <div class="space-y-5">
        ${UI.fieldGroup('School Information', UI.row2(
          UI.field('School Name', UI.input('f_school', { value: rec ? rec.school : '', placeholder: 'e.g. Agripino Alvarez ES' }), null, true),
          UI.field('Cluster', UI.select('f_cluster', CLUSTERS.map(c => ({ value: c, label: 'Cluster ' + c })), rec ? rec.cluster : '1'), null, true)
        ))}
        ${UI.fieldGroup('Reporting Period', UI.row2(
          UI.field('Month', UI.select('f_month', MONTHS, rec ? rec.month : 'January'), null, true),
          UI.field('Year', UI.select('f_year', yearOpts, rec ? rec.year : '2026'), null, true)
        ))}
        ${UI.fieldGroup('Partnership Data',
          UI.row2(
            UI.field('Contribution Type', UI.select('f_type', CONTRIB_TYPES, rec ? rec.contributionType : 'Cash'), null, true),
            UI.field('No. of Partners', UI.input('f_partners', { type: 'number', min: 0, value: rec ? rec.numPartners : '0' }), null, true)
          ) +
          UI.row2(
            UI.field('Amount of Contribution', UI.input('f_amount', { type: 'number', min: 0, step: '0.01', value: rec ? rec.amountContribution : '' }), '₱ Peso amount', true),
            UI.field('No. of Beneficiary Learners', UI.input('f_benef', { type: 'number', min: 0, value: rec ? rec.numBeneficiaries : '0' }), null, true)
          ) +
          UI.field('Status', UI.select('f_status', STATUSES, rec ? rec.status : 'Submitted'))
        )}
      </div>
    `;

    UI.modal({
      title: isEdit ? 'Edit Transmittal' : 'New Transmittal Report',
      size: 'lg',
      body,
      footer: (foot, close) => {
        foot.appendChild(UI.btn('Cancel', { tone: 'secondary', onClick: close }));
        const save = UI.btn(isEdit ? 'Save Changes' : 'Submit', {
          tone: 'primary',
          onClick: async () => {
            const data = {
              school: UI.val('f_school').trim(),
              cluster: UI.val('f_cluster'),
              month: UI.val('f_month'),
              year: UI.val('f_year'),
              contributionType: UI.val('f_type'),
              numPartners: parseInt(UI.val('f_partners')) || 0,
              amountContribution: parseFloat(UI.val('f_amount')) || 0,
              numBeneficiaries: parseInt(UI.val('f_benef')) || 0,
              status: UI.val('f_status')
            };
            if (!data.school) { UI.toast('School name is required.', 'error'); return; }
            try {
              if (isEdit) await Api.update('transmittals', rec.id, data);
              else await Api.create('transmittals', data);
              UI.toast(isEdit ? 'Transmittal updated.' : 'Transmittal created.');
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
