// App shell: sidebar + topbar + main content area
(function() {

  const NAV = [
    { route: 'dashboard', label: 'Dashboard', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>' },
    { sep: 'Functional Areas' },
    { route: 'transmittals', label: 'Transmittal Reports', fa: '1', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>' },
    { route: 'research', label: 'Research & Innovation', fa: '2', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3M11 8v6M8 11h6"/></svg>' },
    { route: 'donations', label: 'Donation Reports', fa: '3', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5" rx="1"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>' },
    { route: 'etmrs', label: 'Monthly Repository', fa: '4', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 7v13a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V7M3 7l2-3h14l2 3M3 7h18M9 12h6"/></svg>' },
    { route: 'certifications', label: 'Certifications', fa: '5', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="9" r="6"/><path d="M15.5 13.5 17 22l-5-3-5 3 1.5-8.5"/></svg>' },
    { route: 'agreements', label: 'MOA / MOU / DOD / DOA', fa: '6', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M21 21v-2a4 4 0 0 0-3-3.87"/><circle cx="8.5" cy="7" r="4"/><path d="M17 7a4 4 0 0 1 0 8"/></svg>' },
    { sep: 'Administration', divisionOnly: true },
    { route: 'users', label: 'User Management', divisionOnly: true, icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6M23 11h-6"/></svg>' }
  ];

  const TITLES = {
    dashboard: 'Dashboard',
    transmittals: 'Transmittal Reports',
    research: 'Research & Innovation',
    donations: 'Donation Reports',
    etmrs: 'Monthly Repository',
    certifications: 'Certifications',
    agreements: 'Agreements',
    users: 'User Management'
  };

  function render() {
    const root = document.getElementById('root');
    const s = Store.getSession();
    const isDivision = Store.isDivision();
    const initials = Store.sessionInitials();
    const displayName = Store.sessionDisplayName();

    const navHTML = NAV.map((item, idx) => {
      if (item.divisionOnly && !isDivision) return '';
      if (item.sep) return `<div class="px-3 pt-5 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-ink-400">${UI.esc(item.sep)}</div>`;
      return `
        <a href="#" data-route="${item.route}" style="animation-delay:${idx * 30}ms" class="nav-link group flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-ink-300 hover:bg-white/5 hover:text-white transition mx-2 animate-fade-in-up">
          <span class="text-ink-400 group-hover:text-white transition">${item.icon}</span>
          <span class="flex-1">${UI.esc(item.label)}</span>
          ${item.fa ? `<span class="px-1.5 py-0.5 rounded-md bg-deped-yellow/15 text-deped-yellow text-[10px] font-bold tracking-wider">FA${item.fa}</span>` : ''}
        </a>
      `;
    }).join('');

    const scopeBadge = isDivision
      ? '<span class="px-2 py-0.5 rounded-md bg-deped-yellow/15 text-deped-yellow text-[10px] font-bold tracking-widest">DIVISION</span>'
      : '<span class="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold tracking-widest">SCHOOL</span>';

    root.innerHTML = `
      <div class="flex h-screen bg-stone-50 overflow-hidden">
        <!-- Sidebar -->
        <aside class="w-64 flex-shrink-0 bg-ink-900 text-white flex flex-col">
          <div class="px-4 py-4 border-b border-white/5 flex items-center gap-2.5 animate-fade-in-up">
            <div class="w-9 h-9 rounded-lg bg-deped-yellow flex items-center justify-center font-black text-deped-blue text-[11px] tracking-tight">SW</div>
            <div class="min-w-0">
              <div class="text-[12px] font-bold truncate">SMART WINGS: CPES</div>
              <div class="text-[10px] text-ink-400 truncate">SDO Sipalay City</div>
            </div>
          </div>

          <nav class="flex-1 overflow-y-auto py-3 scrollbar-hide" id="nav">
            ${navHTML}
          </nav>

          <div class="px-3 py-3 border-t border-white/5 animate-fade-in-up" style="animation-delay:.3s">
            <div class="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/5 transition">
              <div class="w-8 h-8 rounded-full bg-gradient-to-br from-deped-yellow to-deped-yellow/70 flex items-center justify-center font-bold text-deped-blue text-xs">${initials}</div>
              <div class="flex-1 min-w-0">
                <div class="text-xs font-semibold truncate">${UI.esc(displayName)}</div>
                <div class="flex items-center gap-1 mt-0.5">${scopeBadge}</div>
              </div>
              <button id="logoutBtn" title="Sign out" class="w-7 h-7 inline-flex items-center justify-center rounded-md text-ink-400 hover:text-white hover:bg-white/10 transition">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
              </button>
            </div>
            <div class="mt-2 px-2 text-[10px] text-ink-400 truncate" title="${UI.esc(s.school)}">${UI.esc(s.school)}</div>
          </div>
        </aside>

        <!-- Main -->
        <div class="flex-1 flex flex-col overflow-hidden">
          <header class="h-14 bg-white border-b border-ink-100 px-6 flex items-center justify-between flex-shrink-0">
            <div class="flex items-center gap-2 text-sm">
              <span class="text-ink-400">CPES</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-ink-300"><path d="M9 18l6-6-6-6"/></svg>
              <span class="font-semibold text-ink-800" id="crumb">Dashboard</span>
            </div>
            <div class="flex items-center gap-3 text-xs text-ink-500">
              <span class="hidden sm:inline truncate max-w-xs">${UI.esc(s.school)}</span>
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-slow"></span>
              <span>CY ${new Date().getFullYear()}</span>
            </div>
          </header>

          <main id="main" class="flex-1 overflow-y-auto scrollbar-thin">
            <div id="page" class="p-6 sm:p-8 max-w-[1400px] mx-auto animate-fade-in"></div>
          </main>
        </div>
      </div>
    `;

    document.getElementById('logoutBtn').onclick = () => {
      UI.confirmDialog('Sign out of CPES?', () => {
        Store.clearSession();
        Router.go('login');
      });
    };

    document.querySelectorAll('.nav-link').forEach(el => {
      el.onclick = (e) => { e.preventDefault(); Router.go(el.dataset.route); };
    });
  }

  function setActive(route) {
    document.querySelectorAll('.nav-link').forEach(el => {
      const active = el.dataset.route === route;
      el.classList.toggle('bg-white/10', active);
      el.classList.toggle('text-white', active);
      const iconSpan = el.querySelector('span:first-child');
      if (iconSpan) {
        if (active) {
          iconSpan.classList.remove('text-ink-400');
          iconSpan.classList.add('text-deped-yellow');
        } else {
          iconSpan.classList.add('text-ink-400');
          iconSpan.classList.remove('text-deped-yellow');
        }
      }
    });
    const crumb = document.getElementById('crumb');
    if (crumb) crumb.textContent = TITLES[route] || route;
  }

  window.Shell = { render, setActive };
})();
