// FA4: Monthly Repository — derived/aggregated view of FA1 Transmittals
(function() {
  window.Views = window.Views || {};

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  Views.etmrs = async function(page) {
    page.innerHTML = `
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div class="text-[10px] font-bold tracking-widest text-amber-600 mb-1">FA 4 · DERIVED</div>
          <h1 class="text-2xl font-bold tracking-tight text-ink-900">Monthly Consolidated Repository</h1>
          <p class="text-sm text-ink-500 mt-1">Auto-generated cluster-based monthly consolidations from <button id="goFA1" class="underline hover:text-ink-900 font-medium">FA1 Transmittal Reports</button>.</p>
        </div>
      </div>

      <div class="flex items-center gap-2 mt-5">
        <select id="fYear" class="px-3 py-2 text-sm bg-white border border-ink-200 rounded-lg cursor-pointer"></select>
        <select id="fMonth" class="px-3 py-2 text-sm bg-white border border-ink-200 rounded-lg cursor-pointer"></select>
        <span class="text-xs text-ink-400 ml-2">Filter by period</span>
      </div>

      <div id="e-body" class="mt-5">${UI.skeletonCard(5)}</div>
    `;

    document.getElementById('goFA1').onclick = (e) => { e.preventDefault(); Router.go('transmittals'); };

    const all = await Api.list('transmittals');
    const years = [...new Set(all.map(t => t.year))].sort().reverse();
    const yearSel = document.getElementById('fYear');
    yearSel.innerHTML = '<option value="">All Years</option>' + years.map(y => `<option value="${UI.esc(y)}">${UI.esc(y)}</option>`).join('');
    document.getElementById('fMonth').innerHTML = '<option value="">All Months</option>' + MONTHS.map(m => `<option value="${UI.esc(m)}">${UI.esc(m)}</option>`).join('');

    function refilter() {
      const y = yearSel.value;
      const m = document.getElementById('fMonth').value;
      let filtered = all.slice();
      if (y) filtered = filtered.filter(t => t.year === y);
      if (m) filtered = filtered.filter(t => t.month === m);
      document.getElementById('e-body').innerHTML = renderClusters(filtered);
    }
    yearSel.onchange = refilter;
    document.getElementById('fMonth').onchange = refilter;
    refilter();
  };

  function renderClusters(items) {
    if (!items.length) {
      return `<div class="bg-white rounded-2xl shadow-soft ring-1 ring-ink-100">${UI.emptyState({
        title: 'No transmittal data',
        desc: 'Add transmittals in FA1 to see aggregations here.'
      })}</div>`;
    }

    const byCluster = {};
    items.forEach(t => {
      const k = t.cluster;
      if (!byCluster[k]) byCluster[k] = { cluster: k, items: [], partners: 0, amount: 0, beneficiaries: 0, schools: new Set() };
      byCluster[k].items.push(t);
      byCluster[k].partners += t.numPartners;
      byCluster[k].amount += t.amountContribution;
      byCluster[k].beneficiaries += t.numBeneficiaries;
      byCluster[k].schools.add(t.school);
    });

    const clusters = Object.values(byCluster).sort((a,b) => parseInt(a.cluster) - parseInt(b.cluster));

    const grandTotals = clusters.reduce((acc, c) => ({
      partners: acc.partners + c.partners,
      amount: acc.amount + c.amount,
      beneficiaries: acc.beneficiaries + c.beneficiaries,
      schools: acc.schools + c.schools.size
    }), { partners: 0, amount: 0, beneficiaries: 0, schools: 0 });

    const grandHTML = `
      <div class="bg-ink-900 text-white rounded-2xl p-5 mb-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div><div class="text-[11px] uppercase tracking-widest text-ink-400">Active Clusters</div><div class="text-2xl font-bold mt-1">${clusters.length}</div></div>
        <div><div class="text-[11px] uppercase tracking-widest text-ink-400">Total Schools</div><div class="text-2xl font-bold mt-1">${grandTotals.schools}</div></div>
        <div><div class="text-[11px] uppercase tracking-widest text-ink-400">Total Partners</div><div class="text-2xl font-bold mt-1">${UI.num(grandTotals.partners)}</div></div>
        <div><div class="text-[11px] uppercase tracking-widest text-ink-400">Total Amount</div><div class="text-2xl font-bold mt-1 text-deped-yellow">${UI.currency(grandTotals.amount)}</div></div>
      </div>
    `;

    return grandHTML + clusters.map(c => `
      <div class="bg-white rounded-2xl shadow-soft ring-1 ring-ink-100 mb-3 overflow-hidden">
        <details>
          <summary class="cursor-pointer list-none px-5 py-4 hover:bg-ink-50/60 transition flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="w-9 h-9 rounded-lg bg-ink-900 text-deped-yellow font-bold flex items-center justify-center text-sm">C${UI.esc(c.cluster)}</span>
              <div>
                <div class="font-semibold text-ink-900">Cluster ${UI.esc(c.cluster)}</div>
                <div class="text-xs text-ink-500">${c.schools.size} school${c.schools.size !== 1 ? 's' : ''} · ${c.items.length} record${c.items.length !== 1 ? 's' : ''}</div>
              </div>
            </div>
            <div class="flex items-center gap-6 text-xs">
              <div class="text-right"><div class="text-[10px] text-ink-400 uppercase tracking-wider">Partners</div><div class="font-semibold text-ink-900 text-sm">${UI.num(c.partners)}</div></div>
              <div class="text-right"><div class="text-[10px] text-ink-400 uppercase tracking-wider">Amount</div><div class="font-semibold text-ink-900 text-sm">${UI.currency(c.amount)}</div></div>
              <div class="text-right"><div class="text-[10px] text-ink-400 uppercase tracking-wider">Learners</div><div class="font-semibold text-ink-900 text-sm">${UI.num(c.beneficiaries)}</div></div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" class="text-ink-400 transition group-open:rotate-180"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </summary>
          <div class="border-t border-ink-100 overflow-x-auto scrollbar-thin">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-ink-50/40 border-b border-ink-100">
                  <th class="text-left font-semibold text-[11px] uppercase tracking-wider text-ink-500 px-4 py-2.5">School</th>
                  <th class="text-left font-semibold text-[11px] uppercase tracking-wider text-ink-500 px-4 py-2.5">Period</th>
                  <th class="text-left font-semibold text-[11px] uppercase tracking-wider text-ink-500 px-4 py-2.5">Type</th>
                  <th class="text-right font-semibold text-[11px] uppercase tracking-wider text-ink-500 px-4 py-2.5">Partners</th>
                  <th class="text-right font-semibold text-[11px] uppercase tracking-wider text-ink-500 px-4 py-2.5">Amount</th>
                  <th class="text-right font-semibold text-[11px] uppercase tracking-wider text-ink-500 px-4 py-2.5">Learners</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-ink-100">
                ${c.items.map(t => `
                  <tr class="hover:bg-ink-50/60 transition">
                    <td class="px-4 py-2.5 font-medium text-ink-800">${UI.esc(t.school)}</td>
                    <td class="px-4 py-2.5 text-ink-600 whitespace-nowrap">${UI.esc(t.month + ' ' + t.year)}</td>
                    <td class="px-4 py-2.5">${UI.badge(UI.enumLabel('contributionType', t.contributionType), 'blue')}</td>
                    <td class="px-4 py-2.5 text-right tabular-nums">${UI.num(t.numPartners)}</td>
                    <td class="px-4 py-2.5 text-right tabular-nums font-medium">${UI.currency(t.amountContribution)}</td>
                    <td class="px-4 py-2.5 text-right tabular-nums">${UI.num(t.numBeneficiaries)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </details>
      </div>
    `).join('');
  }
})();
