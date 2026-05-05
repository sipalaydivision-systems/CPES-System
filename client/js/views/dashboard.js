// Dashboard view — animated stat cards, recent activity
(function() {
  window.Views = window.Views || {};

  Views.dashboard = async function(page) {
    page.innerHTML = `
      <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 class="text-2xl font-bold tracking-tight text-ink-900">Welcome back, ${UI.esc(Store.getSession().firstName)}</h1>
            <p class="text-sm text-ink-500 mt-1">${Store.isDivision() ? 'Here is the partnership engagement overview for SDO Sipalay City.' : 'Here is your school\\'s partnership engagement overview.'}</p>
          </div>
          <div class="text-xs text-ink-500 bg-white px-3 py-2 rounded-lg ring-1 ring-ink-100 inline-flex items-center gap-2 self-start">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Live data · Auto-synced
          </div>
        </div>

        <!-- Stat skeleton -->
        <div id="stats" class="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
          ${[0,1,2,3].map(() => `<div class="bg-white rounded-2xl p-5 shadow-soft ring-1 ring-ink-100"><div class="skeleton h-3 w-16 rounded mb-3"></div><div class="skeleton h-7 w-24 rounded"></div></div>`).join('')}
        </div>

        <!-- FA grid skeleton -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children" id="fa-grid">
          ${[0,1,2,3,4,5].map(() => `<div class="bg-white rounded-2xl p-5 shadow-soft ring-1 ring-ink-100 h-44"><div class="skeleton h-full w-full rounded"></div></div>`).join('')}
        </div>
      </div>
    `;

    // Load all data in parallel
    const [tx, rs, dn, ag, ct] = await Promise.all([
      Api.list('transmittals').catch(() => []),
      Api.list('research').catch(() => []),
      Api.list('donations').catch(() => []),
      Api.list('agreements').catch(() => []),
      Api.list('certifications').catch(() => [])
    ]);

    const totalAmt = tx.reduce((s, r) => s + (parseFloat(r.amountContribution) || 0), 0);
    const totalBen = tx.reduce((s, r) => s + (parseInt(r.numBeneficiaries) || 0), 0);
    const activeAg = ag.filter(a => a.status === 'Active').length;

    document.getElementById('stats').innerHTML = `
      ${statCard({ label: 'Transmittal Reports', value: tx.length, sub: 'Partnership data sheets', icon: '📋', tone: 'blue' })}
      ${statCard({ label: 'Total Contributions', value: UI.currency(totalAmt), sub: 'Across all partners', icon: '💰', tone: 'green', smallText: true })}
      ${statCard({ label: 'Beneficiary Learners', value: UI.num(totalBen), sub: 'Reached via partnerships', icon: '🎓', tone: 'amber' })}
      ${statCard({ label: 'Active Agreements', value: activeAg, sub: 'MOA / MOU / DOD / DOA', icon: '🤝', tone: 'cyan' })}
    `;

    document.getElementById('fa-grid').innerHTML = `
      ${faCard({ route: 'transmittals', fa: 1, title: 'Transmittal Reports', desc: 'Partnerships data sheet consolidation', count: tx.length, gradient: 'from-blue-500/10 to-blue-500/0' })}
      ${faCard({ route: 'research', fa: 2, title: 'Research & Innovation', desc: 'Approved research file repository', count: rs.length, gradient: 'from-violet-500/10 to-violet-500/0' })}
      ${faCard({ route: 'donations', fa: 3, title: 'Donation Reports', desc: 'Utilization & donation records', count: dn.length, gradient: 'from-emerald-500/10 to-emerald-500/0' })}
      ${faCard({ route: 'etmrs', fa: 4, title: 'Monthly Repository', desc: 'Cluster-based monthly consolidations', count: '—', gradient: 'from-amber-500/10 to-amber-500/0', sub: 'Derived from FA1' })}
      ${faCard({ route: 'certifications', fa: 5, title: 'Certifications', desc: 'HIYAS rewards & recognition', count: ct.length, gradient: 'from-rose-500/10 to-rose-500/0' })}
      ${faCard({ route: 'agreements', fa: 6, title: 'Agreements', desc: 'MOA / MOU / DOD / DOA archive', count: ag.length, gradient: 'from-cyan-500/10 to-cyan-500/0' })}
    `;

    document.querySelectorAll('[data-go]').forEach(el => el.onclick = () => Router.go(el.dataset.go));
  };

  function statCard(c) {
    const tones = {
      blue: 'text-blue-600',
      green: 'text-emerald-600',
      amber: 'text-amber-600',
      cyan: 'text-cyan-600'
    };
    return `
      <div class="bg-white rounded-2xl p-5 shadow-soft ring-1 ring-ink-100 hover:shadow-soft-md transition group cursor-default">
        <div class="flex items-start justify-between">
          <span class="text-[11px] font-semibold uppercase tracking-wider text-ink-500">${UI.esc(c.label)}</span>
          <span class="text-base ${tones[c.tone]}">${c.icon}</span>
        </div>
        <div class="mt-3 ${c.smallText ? 'text-xl' : 'text-3xl'} font-bold tracking-tight text-ink-900">${UI.esc(c.value)}</div>
        <div class="text-xs text-ink-400 mt-1">${UI.esc(c.sub)}</div>
      </div>
    `;
  }

  function faCard(c) {
    return `
      <button data-go="${c.route}" class="text-left relative overflow-hidden bg-white rounded-2xl p-5 shadow-soft ring-1 ring-ink-100 hover:shadow-soft-md hover:-translate-y-0.5 transition group">
        <div class="absolute inset-0 bg-gradient-to-br ${c.gradient} opacity-50 group-hover:opacity-100 transition"></div>
        <div class="relative">
          <div class="flex items-start justify-between mb-3">
            <span class="px-2 py-0.5 rounded-md bg-ink-900 text-deped-yellow text-[10px] font-bold tracking-widest">FA ${c.fa}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-ink-300 group-hover:text-ink-700 group-hover:translate-x-0.5 transition"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </div>
          <div class="text-base font-semibold text-ink-900 mb-1">${UI.esc(c.title)}</div>
          <div class="text-xs text-ink-500 mb-3">${UI.esc(c.desc)}</div>
          <div class="flex items-baseline gap-1.5">
            <span class="text-2xl font-bold text-ink-900">${UI.esc(c.count)}</span>
            <span class="text-xs text-ink-400">${UI.esc(c.sub || 'records')}</span>
          </div>
        </div>
      </button>
    `;
  }
})();
