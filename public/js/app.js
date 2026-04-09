/* ===================================================================
   CPES – Core Application Engine
   Single-page app router, auth, data store, component helpers
   =================================================================== */

'use strict';

/* ------------------------------------------------------------------
   DATA STORE  (localStorage persistence)
   ------------------------------------------------------------------ */
const Store = (() => {
  const KEY = 'cpes_data';

  const defaults = {
    users: [
      { id: 'u1', name: 'Mark E. Caballes', email: 'mark.caballes@deped.gov.ph', role: 'Admin', school: 'SDO Sipalay City', status: 'Active', createdAt: '2026-01-01', password: 'admin123' },
      { id: 'u2', name: 'Mary L. Domingo',  email: 'mary.domingo@deped.gov.ph',  role: 'Editor','school': 'SDO Sipalay City', status: 'Active', createdAt: '2026-01-01', password: 'editor123' },
      { id: 'u3', name: 'Joan Sayson',       email: 'joan.sayson@deped.gov.ph',   role: 'Viewer', school: 'Sipalay City NHS',  status: 'Active', createdAt: '2026-01-02', password: 'viewer123' },
    ],
    transmittals: [
      { id: 't1', school: 'Agripino Alvarez ES', month: 'January', year: '2026', cluster: '1', contributionType: 'Cash', numPartners: 3, amountContribution: 101324, numBeneficiaries: 150, submittedBy: 'u3', status: 'Submitted', createdAt: '2026-01-15' },
      { id: 't2', school: 'Barangay 5 ES',       month: 'January', year: '2026', cluster: '2', contributionType: 'InKind', numPartners: 2, amountContribution: 25000,  numBeneficiaries: 80,  submittedBy: 'u3', status: 'Validated', createdAt: '2026-01-18' },
    ],
    research: [
      { id: 'r1', title: 'Action Research on Partnership Impact',  type: 'Action Research', author: 'Mark E. Caballes', school: 'SDO Sipalay City', year: '2026', status: 'Published', abstract: 'Study on SDO partnership effectiveness.', fileUrl: '', createdAt: '2026-02-01' },
    ],
    donations: [
      { id: 'd1', school: 'Leodegario Ponce Gonzales NHS', quarter: 'Q1', month: 'January', year: '2026',
        donationType: 'InKind', description: '10 Snare Drums', amount: 0, donorName: 'LGU of Sipalay City',
        hasMOA: 'Yes', notarizedDate: '', usageDescription: 'For Drum and Bugle Corps', status: 'Encoded', createdAt: '2026-01-15' },
    ],
    etmrs: [
      { id: 'e1', school: 'Agripino Alvarez ES', cluster: '1', month: 'January', year: '2026',
        totalPartners: 3, totalAmount: 101324, totalBeneficiaries: 150,
        schoolHeadSignature: 'Vivien T. Bretania', submittedDate: '2026-01-20', status: 'Uploaded', createdAt: '2026-01-20' },
    ],
    certifications: [
      { id: 'c1', school: 'Agripino Alvarez ES', schoolHead: 'Vivien T. Bretania',
        partnerName: 'LGU Sipalay City', amountReceived: 101324, pointsEarned: 10,
        programYear: '2026', quarter: 'Q1', certDate: '2026-02-01', hiyas: 'Yes', status: 'Issued', createdAt: '2026-02-01' },
    ],
    agreements: [
      { id: 'ag1', school: 'Sipalay City NHS', cluster: '3', agreementType: 'MOA', partnerName: 'Silliman University',
        partnerRep: 'University President', purpose: 'Library book donation', effectivityStart: '2026-01-01',
        effectivityEnd: '2027-12-31', notarized: 'Yes', notarizedDate: '2026-01-15', status: 'Active', createdAt: '2026-01-15' },
    ],
    session: null,
  };

  let data = null;

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      data = raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(defaults));
      // Merge missing keys from defaults
      Object.keys(defaults).forEach(k => { if (!(k in data)) data[k] = defaults[k]; });
    } catch(e) { data = JSON.parse(JSON.stringify(defaults)); }
  }

  function save() { localStorage.setItem(KEY, JSON.stringify(data)); }

  function get(key) { return data[key]; }

  function set(key, value) { data[key] = value; save(); }

  function nextId(prefix) {
    return prefix + Date.now().toString(36);
  }

  function reset() { data = JSON.parse(JSON.stringify(defaults)); save(); }

  function getData() { return data; }
  return { load, save, get, set, nextId, reset, getData };
})();


/* ------------------------------------------------------------------
   AUTH
   ------------------------------------------------------------------ */
const Auth = {
  login(email, password) {
    const users = Store.get('users');
    const user = users.find(u => u.email === email && u.password === password && u.status === 'Active');
    if (!user) return false;
    const session = { userId: user.id, name: user.name, role: user.role, school: user.school, loginAt: new Date().toISOString() };
    Store.set('session', session);
    return session;
  },
  logout() {
    Store.set('session', null);
    Router.go('login');
  },
  session() { return Store.get('session'); },
  check() {
    const s = this.session();
    if (!s) { Router.go('login'); return null; }
    return s;
  },
  can(action) {
    const s = this.session();
    if (!s) return false;
    if (s.role === 'Admin') return true;
    if (s.role === 'Editor') return ['view', 'create', 'edit'].includes(action);
    if (s.role === 'Viewer') return action === 'view';
    return false;
  },
};


/* ------------------------------------------------------------------
   ROUTER
   ------------------------------------------------------------------ */
const Router = {
  routes: {},
  current: null,

  register(name, fn) { this.routes[name] = fn; },

  go(name, params = {}) {
    const route = this.routes[name];
    if (!route) { console.warn('Unknown route:', name); return; }
    this.current = name;
    // Update sidebar active state
    document.querySelectorAll('.sidebar-link').forEach(el => {
      el.classList.toggle('active', el.dataset.route === name);
    });
    const app = document.getElementById('app');
    if (app) { app.innerHTML = ''; route(app, params); }
  },
};


/* ------------------------------------------------------------------
   HELPERS
   ------------------------------------------------------------------ */
const h = {
  el(tag, attrs = {}, ...children) {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'class') el.className = v;
      else if (k === 'style') Object.assign(el.style, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (k === 'html') el.innerHTML = v;
      else el.setAttribute(k, v);
    });
    children.flat().forEach(c => {
      if (c == null) return;
      el.append(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return el;
  },

  badge(text, color = 'gray') {
    return `<span class="badge badge-${color}">${text}</span>`;
  },

  statusBadge(status) {
    const map = {
      'Active': 'green', 'Submitted': 'blue', 'Validated': 'green', 'Pending': 'yellow',
      'Uploaded': 'cyan', 'Issued': 'green', 'Published': 'green', 'Draft': 'gray',
      'Inactive': 'red', 'Encoded': 'blue', 'Approved': 'green', 'Rejected': 'red',
    };
    return h.badge(status, map[status] || 'gray');
  },

  fmt: {
    currency(n) { return '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 }); },
    date(s) { if (!s) return '—'; return new Date(s).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }); },
    num(n) { return Number(n).toLocaleString(); },
  },

  toast(msg, type = 'success') {
    const existing = document.querySelector('.cpes-toast');
    if (existing) existing.remove();
    const icons = { success: '✓', danger: '✕', warning: '⚠', info: 'ℹ' };
    const t = document.createElement('div');
    t.className = `cpes-toast cpes-toast-${type}`;
    t.innerHTML = `<span>${icons[type] || '✓'}</span> ${msg}`;
    t.style.cssText = `position:fixed;bottom:1.5rem;right:1.5rem;z-index:9999;background:var(--${type === 'success' ? 'success' : type === 'danger' ? 'danger' : type === 'warning' ? 'warning' : 'info'});color:#fff;padding:.625rem 1.125rem;border-radius:8px;font-size:13px;font-weight:500;box-shadow:var(--shadow-lg);display:flex;align-items:center;gap:.5rem;animation:fadeIn .2s ease;max-width:340px;`;
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; setTimeout(() => t.remove(), 300); }, 3000);
  },

  confirm(msg) { return window.confirm(msg); },

  modal(title, bodyHTML, footerFn) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">${title}</span>
          <button class="modal-close" id="modalCloseBtn">✕</button>
        </div>
        <div class="modal-body" id="modalBody">${bodyHTML}</div>
        <div class="modal-footer" id="modalFooter"></div>
      </div>`;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('open'));
    const close = () => { overlay.classList.remove('open'); setTimeout(() => overlay.remove(), 200); };
    overlay.querySelector('#modalCloseBtn').onclick = close;
    overlay.onclick = e => { if (e.target === overlay) close(); };
    if (footerFn) footerFn(overlay.querySelector('#modalFooter'), close);
    return { overlay, close };
  },
};


/* ------------------------------------------------------------------
   SHELL – renders sidebar + topbar layout
   ------------------------------------------------------------------ */
function renderShell() {
  const session = Auth.session();
  const initials = session ? session.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '??';

  const nav = [
    { route: 'dashboard', icon: '⊞', label: 'Dashboard' },
    { route: null, label: 'Functional Areas', section: true },
    { route: 'fa1', icon: '📋', label: 'Transmittal Reports', fa: '1' },
    { route: 'fa2', icon: '🔬', label: 'Research & Innovation', fa: '2' },
    { route: 'fa3', icon: '🎁', label: 'Donation Reports', fa: '3' },
    { route: 'fa4', icon: '📁', label: 'Monthly Reports Repo', fa: '4' },
    { route: 'fa5', icon: '🏅', label: 'Certifications', fa: '5' },
    { route: 'fa6', icon: '🤝', label: 'MOA / MOU / DOD / DOA', fa: '6' },
    { route: null, label: 'Administration', section: true },
    { route: 'users', icon: '👥', label: 'User Management' },
  ];

  document.body.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-brand">
          <div class="sidebar-brand-logo">SW</div>
          <div class="sidebar-brand-text">
            <div class="sidebar-brand-title">SMART WINGS: CPES</div>
            <div class="sidebar-brand-sub">SDO Sipalay City</div>
          </div>
        </div>
        <nav class="sidebar-section" id="sidebarNav">
          ${nav.map(item => {
            if (item.section) return `<div class="sidebar-section"><div class="sidebar-section-label">${item.label}</div>`;
            return `<ul class="sidebar-nav"><li>
              <a class="sidebar-link" data-route="${item.route}" href="javascript:void(0)">
                <span class="sidebar-icon">${item.icon}</span>
                ${item.label}
                ${item.fa ? `<span class="sidebar-badge">FA${item.fa}</span>` : ''}
              </a></li></ul>`;
          }).join('')}
        </nav>
        <div class="sidebar-footer">
          <div class="sidebar-user">
            <div class="sidebar-avatar">${initials}</div>
            <div class="sidebar-user-info">
              <div class="sidebar-user-name">${session ? session.name : 'Guest'}</div>
              <div class="sidebar-user-role">${session ? session.role : ''}</div>
            </div>
            <button class="sidebar-logout-btn" id="logoutBtn" title="Logout">⏻</button>
          </div>
        </div>
      </aside>
      <div class="main-content">
        <header class="topbar">
          <div id="topbarBreadcrumb" class="topbar-breadcrumb">
            <span>CPES</span>
            <span class="sep">›</span>
            <span class="current" id="topbarCurrent">Dashboard</span>
          </div>
          <div class="topbar-actions">
            <span style="font-size:12px;color:var(--text-3);">${session ? session.school : ''}</span>
          </div>
        </header>
        <div class="page-wrapper">
          <div id="app"></div>
        </div>
      </div>
    </div>`;

  // Wire sidebar links
  document.querySelectorAll('.sidebar-link[data-route]').forEach(el => {
    el.addEventListener('click', () => Router.go(el.dataset.route));
  });
  document.getElementById('logoutBtn').addEventListener('click', () => {
    if (h.confirm('Log out of CPES?')) Auth.logout();
  });
}

function setTopbarTitle(title) {
  const el = document.getElementById('topbarCurrent');
  if (el) el.textContent = title;
}


/* ------------------------------------------------------------------
   PAGE: Login
   ------------------------------------------------------------------ */
Router.register('login', (app) => {
  document.body.innerHTML = `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-logo">
          <div class="auth-logo-mark">SW</div>
          <div class="auth-logo-text">
            <div class="auth-logo-title">SMART WINGS: CPES</div>
            <div class="auth-logo-sub">SDO Sipalay City · Negros Island Region</div>
          </div>
        </div>
        <h1 class="auth-heading">Sign In</h1>
        <p class="auth-sub">Use your official DepEd email account.</p>
        <form class="auth-form" id="loginForm" novalidate>
          <div class="form-group">
            <label class="form-label" for="loginEmail">Email Address <span class="required">*</span></label>
            <input class="form-control" type="email" id="loginEmail" placeholder="yourname@deped.gov.ph" required autocomplete="email">
          </div>
          <div class="form-group">
            <label class="form-label" for="loginPw">Password <span class="required">*</span></label>
            <input class="form-control" type="password" id="loginPw" placeholder="••••••••" required autocomplete="current-password">
          </div>
          <div id="loginError" class="alert alert-danger hidden"></div>
          <button type="submit" class="btn btn-primary w-full btn-lg">Sign In</button>
        </form>
        <div class="auth-switch">Don't have an account? <a href="javascript:void(0)" id="goRegister">Register</a></div>
        <div style="margin-top:1.5rem;padding-top:1rem;border-top:1px solid var(--border);font-size:11px;color:var(--text-3);text-align:center;">
          <strong>Demo accounts:</strong><br>
          Admin: mark.caballes@deped.gov.ph / admin123<br>
          Editor: mary.domingo@deped.gov.ph / editor123<br>
          Viewer: joan.sayson@deped.gov.ph / viewer123
        </div>
      </div>
    </div>`;

  document.getElementById('loginForm').addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const pw = document.getElementById('loginPw').value;
    const errEl = document.getElementById('loginError');
    const session = Auth.login(email, pw);
    if (session) {
      renderShell();
      Router.go('dashboard');
    } else {
      errEl.textContent = 'Invalid email or password. Please try again.';
      errEl.classList.remove('hidden');
    }
  });
  document.getElementById('goRegister').addEventListener('click', () => Router.go('register'));
});


/* ------------------------------------------------------------------
   PAGE: Register
   ------------------------------------------------------------------ */
Router.register('register', () => {
  document.body.innerHTML = `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-logo">
          <div class="auth-logo-mark">SW</div>
          <div class="auth-logo-text">
            <div class="auth-logo-title">SMART WINGS: CPES</div>
            <div class="auth-logo-sub">SDO Sipalay City · Negros Island Region</div>
          </div>
        </div>
        <h1 class="auth-heading">Create Account</h1>
        <p class="auth-sub">Access is restricted to DepEd personnel.</p>
        <form class="auth-form" id="regForm" novalidate>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Full Name <span class="required">*</span></label>
              <input class="form-control" id="regName" type="text" placeholder="Juan dela Cruz" required>
            </div>
            <div class="form-group">
              <label class="form-label">Role <span class="required">*</span></label>
              <select class="form-control" id="regRole">
                <option value="Viewer">Viewer</option>
                <option value="Editor">Editor</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Email (DepEd) <span class="required">*</span></label>
            <input class="form-control" id="regEmail" type="email" placeholder="yourname@deped.gov.ph" required>
          </div>
          <div class="form-group">
            <label class="form-label">School / Office <span class="required">*</span></label>
            <input class="form-control" id="regSchool" type="text" placeholder="e.g. Sipalay City NHS" required>
          </div>
          <div class="form-group">
            <label class="form-label">Password <span class="required">*</span></label>
            <input class="form-control" id="regPw" type="password" placeholder="Min. 8 characters" required minlength="8">
          </div>
          <div id="regError" class="alert alert-danger hidden"></div>
          <div id="regSuccess" class="alert alert-success hidden"></div>
          <button type="submit" class="btn btn-primary w-full">Create Account</button>
        </form>
        <div class="auth-switch">Already have an account? <a href="javascript:void(0)" id="goLogin">Sign In</a></div>
      </div>
    </div>`;

  document.getElementById('goLogin').addEventListener('click', () => Router.go('login'));
  document.getElementById('regForm').addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const school = document.getElementById('regSchool').value.trim();
    const role = document.getElementById('regRole').value;
    const pw = document.getElementById('regPw').value;
    const err = document.getElementById('regError');
    const suc = document.getElementById('regSuccess');
    err.classList.add('hidden');
    suc.classList.add('hidden');

    if (!name || !email || !school || !pw) { err.textContent = 'All fields are required.'; err.classList.remove('hidden'); return; }
    if (!email.includes('@deped.gov.ph') && !email.includes('@')) { err.textContent = 'Please use your DepEd email.'; err.classList.remove('hidden'); return; }
    if (pw.length < 8) { err.textContent = 'Password must be at least 8 characters.'; err.classList.remove('hidden'); return; }

    const users = Store.get('users');
    if (users.find(u => u.email === email)) { err.textContent = 'Email already registered.'; err.classList.remove('hidden'); return; }

    users.push({ id: Store.nextId('u'), name, email, role, school, status: 'Active', createdAt: new Date().toISOString().slice(0, 10), password: pw });
    Store.set('users', users);
    suc.textContent = 'Account created! You can now sign in.';
    suc.classList.remove('hidden');
    setTimeout(() => Router.go('login'), 1500);
  });
});


/* ------------------------------------------------------------------
   PAGE: Dashboard
   ------------------------------------------------------------------ */
Router.register('dashboard', (app) => {
  if (!Auth.check()) return;
  setTopbarTitle('Dashboard');

  const transmittals = Store.get('transmittals');
  const research    = Store.get('research');
  const donations   = Store.get('donations');
  const etmrs       = Store.get('etmrs');
  const certs       = Store.get('certifications');
  const agreements  = Store.get('agreements');

  const totalAmount = transmittals.reduce((s, r) => s + Number(r.amountContribution || 0), 0);
  const totalBenef  = transmittals.reduce((s, r) => s + Number(r.numBeneficiaries  || 0), 0);

  app.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">SMART WINGS: CPES Dashboard</h1>
        <p class="page-subtitle">Contextualized Partnership Engagement System · SDO Sipalay City · CY 2026</p>
      </div>
    </div>

    <div class="stat-grid">
      <div class="stat-card blue">
        <div class="stat-label">Total Transmittals</div>
        <div class="stat-value">${transmittals.length}</div>
        <div class="stat-sub">Partnership data sheets</div>
      </div>
      <div class="stat-card green">
        <div class="stat-label">Total Contributions</div>
        <div class="stat-value">${h.fmt.currency(totalAmount)}</div>
        <div class="stat-sub">Across all partners</div>
      </div>
      <div class="stat-card yellow">
        <div class="stat-label">Beneficiary Learners</div>
        <div class="stat-value">${h.fmt.num(totalBenef)}</div>
        <div class="stat-sub">Students reached</div>
      </div>
      <div class="stat-card cyan">
        <div class="stat-label">Research Items</div>
        <div class="stat-value">${research.length}</div>
        <div class="stat-sub">Innovation entries</div>
      </div>
      <div class="stat-card red">
        <div class="stat-label">Donation Records</div>
        <div class="stat-value">${donations.length}</div>
        <div class="stat-sub">Utilization reports</div>
      </div>
      <div class="stat-card purple">
        <div class="stat-label">Active Agreements</div>
        <div class="stat-value">${agreements.filter(a => a.status === 'Active').length}</div>
        <div class="stat-sub">MOA / MOU / DOD / DOA</div>
      </div>
    </div>

    <div class="mb-6">
      <div class="flex items-center justify-between mb-4">
        <h2 style="font-size:16px;font-weight:600;">Functional Areas</h2>
      </div>
      <div class="fa-grid">
        <div class="fa-card" data-goto="fa1">
          <div class="fa-card-num">Functional Area 1</div>
          <div style="display:flex;align-items:center;gap:.75rem;">
            <div class="fa-card-icon blue">📋</div>
            <div class="fa-card-title">Partnerships Data Sheet Consolidation</div>
          </div>
          <div class="fa-card-desc">Monthly consolidation of partnership data at school, division, and regional levels. Captures contribution type, number of partners, amount, and beneficiary learners.</div>
          <div class="fa-card-footer">
            <span class="fa-card-count">${transmittals.length} transmittals</span>
            <span class="badge badge-blue">Active</span>
          </div>
        </div>
        <div class="fa-card" data-goto="fa2">
          <div class="fa-card-num">Functional Area 2</div>
          <div style="display:flex;align-items:center;gap:.75rem;">
            <div class="fa-card-icon green">🔬</div>
            <div class="fa-card-title">Research & Innovation Repository</div>
          </div>
          <div class="fa-card-desc">Houses sample research studies and standardized templates for documentation and sharing of research and innovation initiatives related to partnerships.</div>
          <div class="fa-card-footer">
            <span class="fa-card-count">${research.length} entries</span>
            <span class="badge badge-green">Active</span>
          </div>
        </div>
        <div class="fa-card" data-goto="fa3">
          <div class="fa-card-num">Functional Area 3</div>
          <div style="display:flex;align-items:center;gap:.75rem;">
            <div class="fa-card-icon yellow">🎁</div>
            <div class="fa-card-title">Utilization & Donation Report</div>
          </div>
          <div class="fa-card-desc">Organized by calendar year. Stores validated templates and reports on utilization of donated resources, ensuring transparency and proper documentation.</div>
          <div class="fa-card-footer">
            <span class="fa-card-count">${donations.length} records</span>
            <span class="badge badge-yellow">Active</span>
          </div>
        </div>
        <div class="fa-card" data-goto="fa4">
          <div class="fa-card-num">Functional Area 4</div>
          <div style="display:flex;align-items:center;gap:.75rem;">
            <div class="fa-card-icon cyan">📁</div>
            <div class="fa-card-title">ETMRS — Monthly Reports Repository</div>
          </div>
          <div class="fa-card-desc">Cluster-based folder system (Clusters 1–10) where schools upload monthly consolidated reports signed by school heads for division-level consolidation.</div>
          <div class="fa-card-footer">
            <span class="fa-card-count">${etmrs.length} uploads</span>
            <span class="badge badge-cyan">Active</span>
          </div>
        </div>
        <div class="fa-card" data-goto="fa5">
          <div class="fa-card-num">Functional Area 5</div>
          <div style="display:flex;align-items:center;gap:.75rem;">
            <div class="fa-card-icon red">🏅</div>
            <div class="fa-card-title">Certification on Amount Received</div>
          </div>
          <div class="fa-card-desc">Generates official certifications for recognition programs such as HIYAS – Rewards and Recognition Program, supporting fair, data-based acknowledgment.</div>
          <div class="fa-card-footer">
            <span class="fa-card-count">${certs.length} certifications</span>
            <span class="badge badge-red">Active</span>
          </div>
        </div>
        <div class="fa-card" data-goto="fa6">
          <div class="fa-card-num">Functional Area 6</div>
          <div style="display:flex;align-items:center;gap:.75rem;">
            <div class="fa-card-icon purple">🤝</div>
            <div class="fa-card-title">MOA / MOU / DOD / DOA Compilations</div>
          </div>
          <div class="fa-card-desc">Centralized archive of partnership agreements and acceptance documents, organized by cluster and month, ensuring easy access, compliance, and audit readiness.</div>
          <div class="fa-card-footer">
            <span class="fa-card-count">${agreements.length} agreements</span>
            <span class="badge badge-gray">Active</span>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-title">Recent Transmittal Reports</span>
        <button class="btn btn-sm btn-secondary" id="viewAllTransmittals">View All</button>
      </div>
      <div class="card-body" style="padding:0;">
        <div class="table-wrapper">
          <table>
            <thead><tr>
              <th>School</th><th>Month</th><th>Cluster</th>
              <th>Contribution Type</th><th>Amount</th><th>Beneficiaries</th><th>Status</th>
            </tr></thead>
            <tbody>
              ${transmittals.slice(0, 5).map(t => `<tr>
                <td>${t.school}</td>
                <td>${t.month} ${t.year}</td>
                <td>Cluster ${t.cluster}</td>
                <td>${t.contributionType}</td>
                <td>${h.fmt.currency(t.amountContribution)}</td>
                <td>${h.fmt.num(t.numBeneficiaries)}</td>
                <td>${h.statusBadge(t.status)}</td>
              </tr>`).join('') || '<tr><td colspan="7" class="text-muted" style="text-align:center;padding:2rem;">No records yet</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;

  app.querySelectorAll('.fa-card[data-goto]').forEach(c => {
    c.addEventListener('click', () => Router.go(c.dataset.goto));
  });
  document.getElementById('viewAllTransmittals').addEventListener('click', () => Router.go('fa1'));
});


/* ------------------------------------------------------------------
   FA1: Transmittal Reports
   ------------------------------------------------------------------ */
Router.register('fa1', (app) => {
  if (!Auth.check()) return;
  setTopbarTitle('FA1 — Transmittal Reports');
  renderListPage(app, {
    title: 'Partnerships Data Sheet Consolidation',
    subtitle: 'FA1 — Transmittal Reports · Monthly consolidation of partnership data',
    storeKey: 'transmittals',
    canAdd: Auth.can('create'),
    columns: [
      { label: 'School', key: 'school' },
      { label: 'Month / Year', render: r => `${r.month} ${r.year}` },
      { label: 'Cluster', render: r => `Cluster ${r.cluster}` },
      { label: 'Contribution Type', key: 'contributionType' },
      { label: 'Partners', key: 'numPartners' },
      { label: 'Amount', render: r => h.fmt.currency(r.amountContribution) },
      { label: 'Beneficiaries', render: r => h.fmt.num(r.numBeneficiaries) },
      { label: 'Status', render: r => h.statusBadge(r.status) },
    ],
    filterFn: (r, q) => r.school.toLowerCase().includes(q) || r.month.toLowerCase().includes(q),
    formFn: (record, onSave) => renderTransmittalForm(record, onSave),
  });
});

function renderTransmittalForm(record, onSave) {
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const contribTypes = ['Cash','In-Kind','Service','Scholarship','Infrastructure','Equipment','Supplies','Other'];
  const clusters = Array.from({ length: 10 }, (_, i) => i + 1);
  const statusOpts = ['Submitted', 'Validated', 'Pending'];
  const isEdit = !!record;

  const bodyHTML = `
    <div class="form-section">
      <div class="form-section-title">School Information</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">School Name <span class="required">*</span></label>
          <input class="form-control" id="fSchool" type="text" value="${record?.school || ''}" placeholder="e.g. Agripino Alvarez ES" required>
        </div>
        <div class="form-group">
          <label class="form-label">Cluster <span class="required">*</span></label>
          <select class="form-control" id="fCluster">
            ${clusters.map(c => `<option value="${c}" ${record?.cluster == c ? 'selected' : ''}>Cluster ${c}</option>`).join('')}
          </select>
        </div>
      </div>
    </div>
    <div class="form-section">
      <div class="form-section-title">Reporting Period</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Month <span class="required">*</span></label>
          <select class="form-control" id="fMonth">
            ${months.map(m => `<option value="${m}" ${record?.month === m ? 'selected' : ''}>${m}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Year <span class="required">*</span></label>
          <select class="form-control" id="fYear">
            ${['2025','2026','2027'].map(y => `<option value="${y}" ${(record?.year || '2026') === y ? 'selected' : ''}>${y}</option>`).join('')}
          </select>
        </div>
      </div>
    </div>
    <div class="form-section">
      <div class="form-section-title">Partnership Data</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Contribution Type <span class="required">*</span></label>
          <select class="form-control" id="fContribType">
            ${contribTypes.map(c => `<option value="${c}" ${record?.contributionType === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Number of Partners <span class="required">*</span></label>
          <input class="form-control" id="fNumPartners" type="number" min="0" value="${record?.numPartners || ''}" placeholder="0">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Amount of Contribution (₱) <span class="required">*</span></label>
          <input class="form-control" id="fAmount" type="number" min="0" step="0.01" value="${record?.amountContribution || ''}" placeholder="0.00">
          <span class="form-hint">Enter in pesos. E.g. 1000.00</span>
        </div>
        <div class="form-group">
          <label class="form-label">Number of Beneficiary Learners <span class="required">*</span></label>
          <input class="form-control" id="fBenef" type="number" min="0" value="${record?.numBeneficiaries || ''}" placeholder="0">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Status</label>
        <select class="form-control" id="fStatus">
          ${statusOpts.map(s => `<option value="${s}" ${record?.status === s ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </div>
    </div>`;

  const { close } = h.modal(isEdit ? 'Edit Transmittal Report' : 'New Transmittal Report', bodyHTML, (footer, closeModal) => {
    const btnCancel = document.createElement('button');
    btnCancel.className = 'btn btn-secondary';
    btnCancel.textContent = 'Cancel';
    btnCancel.onclick = closeModal;

    const btnSave = document.createElement('button');
    btnSave.className = 'btn btn-primary';
    btnSave.textContent = isEdit ? 'Save Changes' : 'Submit Transmittal';
    btnSave.onclick = () => {
      const school   = document.getElementById('fSchool').value.trim();
      const cluster  = document.getElementById('fCluster').value;
      const month    = document.getElementById('fMonth').value;
      const year     = document.getElementById('fYear').value;
      const contribType = document.getElementById('fContribType').value;
      const numPart  = parseInt(document.getElementById('fNumPartners').value) || 0;
      const amount   = parseFloat(document.getElementById('fAmount').value) || 0;
      const benef    = parseInt(document.getElementById('fBenef').value) || 0;
      const status   = document.getElementById('fStatus').value;

      if (!school) { h.toast('School name is required.', 'danger'); return; }

      const data = { school, cluster, month, year, contributionType: contribType, numPartners: numPart, amountContribution: amount, numBeneficiaries: benef, status, submittedBy: Auth.session()?.userId || '', createdAt: record?.createdAt || new Date().toISOString().slice(0, 10) };
      onSave(data);
      closeModal();
    };
    footer.append(btnCancel, btnSave);
  });
}


/* ------------------------------------------------------------------
   FA2: Research & Innovation Repository
   ------------------------------------------------------------------ */
Router.register('fa2', (app) => {
  if (!Auth.check()) return;
  setTopbarTitle('FA2 — Research & Innovation');
  renderListPage(app, {
    title: 'Research & Innovation Repository',
    subtitle: 'FA2 — Sample studies and standardized templates for research and innovation',
    storeKey: 'research',
    canAdd: Auth.can('create'),
    columns: [
      { label: 'Title', key: 'title' },
      { label: 'Type', render: r => h.badge(r.type, 'blue') },
      { label: 'Author', key: 'author' },
      { label: 'School / Office', key: 'school' },
      { label: 'Year', key: 'year' },
      { label: 'Status', render: r => h.statusBadge(r.status) },
    ],
    filterFn: (r, q) => r.title.toLowerCase().includes(q) || r.author.toLowerCase().includes(q),
    formFn: (record, onSave) => renderResearchForm(record, onSave),
  });
});

function renderResearchForm(record, onSave) {
  const types = ['Action Research', 'Innovation Paper', 'Case Study', 'Policy Review', 'Other'];
  const statusOpts = ['Draft', 'Submitted', 'Published'];
  const isEdit = !!record;

  const body = `
    <div class="form-section">
      <div class="form-section-title">Research Details</div>
      <div class="form-group">
        <label class="form-label">Research/Innovation Title <span class="required">*</span></label>
        <input class="form-control" id="rTitle" type="text" value="${record?.title || ''}" placeholder="e.g. Action Research on Partnership Impact">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Type <span class="required">*</span></label>
          <select class="form-control" id="rType">
            ${types.map(t => `<option value="${t}" ${record?.type === t ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Year <span class="required">*</span></label>
          <select class="form-control" id="rYear">
            ${['2024','2025','2026'].map(y => `<option value="${y}" ${(record?.year || '2026') === y ? 'selected' : ''}>${y}</option>`).join('')}
          </select>
        </div>
      </div>
    </div>
    <div class="form-section">
      <div class="form-section-title">Author Information</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Author(s) <span class="required">*</span></label>
          <input class="form-control" id="rAuthor" type="text" value="${record?.author || ''}" placeholder="Full name(s)">
        </div>
        <div class="form-group">
          <label class="form-label">School / Office <span class="required">*</span></label>
          <input class="form-control" id="rSchool" type="text" value="${record?.school || ''}" placeholder="e.g. SDO Sipalay City">
        </div>
      </div>
    </div>
    <div class="form-section">
      <div class="form-section-title">Content</div>
      <div class="form-group">
        <label class="form-label">Abstract / Description</label>
        <textarea class="form-control" id="rAbstract" rows="4" placeholder="Brief description of the research...">${record?.abstract || ''}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Status</label>
        <select class="form-control" id="rStatus">
          ${statusOpts.map(s => `<option value="${s}" ${record?.status === s ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </div>
    </div>`;

  h.modal(isEdit ? 'Edit Research Entry' : 'Add Research Entry', body, (footer, close) => {
    const c = document.createElement('button'); c.className = 'btn btn-secondary'; c.textContent = 'Cancel'; c.onclick = close;
    const s = document.createElement('button'); s.className = 'btn btn-primary'; s.textContent = isEdit ? 'Save Changes' : 'Add Entry';
    s.onclick = () => {
      const title = document.getElementById('rTitle').value.trim();
      if (!title) { h.toast('Title is required.', 'danger'); return; }
      onSave({ title, type: document.getElementById('rType').value, year: document.getElementById('rYear').value, author: document.getElementById('rAuthor').value.trim(), school: document.getElementById('rSchool').value.trim(), abstract: document.getElementById('rAbstract').value.trim(), status: document.getElementById('rStatus').value, createdAt: record?.createdAt || new Date().toISOString().slice(0,10) });
      close();
    };
    footer.append(c, s);
  });
}


/* ------------------------------------------------------------------
   FA3: Utilization & Donation Report
   ------------------------------------------------------------------ */
Router.register('fa3', (app) => {
  if (!Auth.check()) return;
  setTopbarTitle('FA3 — Donation Reports');
  renderListPage(app, {
    title: 'Utilization & Donation Report Compilation',
    subtitle: 'FA3 — CY 2024–2026 · Donated resource utilization records',
    storeKey: 'donations',
    canAdd: Auth.can('create'),
    columns: [
      { label: 'School', key: 'school' },
      { label: 'Quarter/Month', render: r => `${r.quarter} · ${r.month} ${r.year}` },
      { label: 'Donation Type', render: r => h.badge(r.donationType, 'blue') },
      { label: 'Description', key: 'description' },
      { label: 'Amount/Value', render: r => r.amount ? h.fmt.currency(r.amount) : 'In-Kind' },
      { label: 'Donor', key: 'donorName' },
      { label: 'MOA/MOU', render: r => h.badge(r.hasMOA, r.hasMOA === 'Yes' ? 'green' : 'gray') },
      { label: 'Status', render: r => h.statusBadge(r.status) },
    ],
    filterFn: (r, q) => r.school.toLowerCase().includes(q) || r.donorName.toLowerCase().includes(q) || r.description.toLowerCase().includes(q),
    formFn: (record, onSave) => renderDonationForm(record, onSave),
  });
});

function renderDonationForm(record, onSave) {
  const months   = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const quarters = ['Q1','Q2','Q3','Q4'];
  const types    = ['Cash','In-Kind','Service','Equipment','Supplies','Construction Materials','Food','Medals','Books','Other'];
  const statusOpts = ['Encoded', 'Validated', 'Utilized'];
  const isEdit = !!record;

  const body = `
    <div class="form-section">
      <div class="form-section-title">School Information</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Name of School <span class="required">*</span></label>
          <input class="form-control" id="dSchool" type="text" value="${record?.school || ''}" placeholder="e.g. Sipalay City NHS">
        </div>
        <div class="form-group">
          <label class="form-label">Complete Address</label>
          <input class="form-control" id="dAddress" type="text" value="${record?.address || ''}" placeholder="Brgy., Sipalay City">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">School ID</label>
          <input class="form-control" id="dSchoolId" type="text" value="${record?.schoolId || ''}" placeholder="e.g. 117357">
        </div>
        <div class="form-group">
          <label class="form-label">School Head</label>
          <input class="form-control" id="dSchoolHead" type="text" value="${record?.schoolHead || ''}" placeholder="Full name">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">School Contact / DepEd Email</label>
          <input class="form-control" id="dContact" type="text" value="${record?.contact || ''}" placeholder="email@deped.gov.ph">
        </div>
        <div class="form-group">
          <label class="form-label">Partnership Coordinator</label>
          <input class="form-control" id="dCoordinator" type="text" value="${record?.coordinator || ''}" placeholder="Full name">
        </div>
      </div>
    </div>
    <div class="form-section">
      <div class="form-section-title">Donation Details</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Quarter <span class="required">*</span></label>
          <select class="form-control" id="dQuarter">
            ${quarters.map(q => `<option value="${q}" ${record?.quarter === q ? 'selected' : ''}>${q}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Month <span class="required">*</span></label>
          <select class="form-control" id="dMonth">
            ${months.map(m => `<option value="${m}" ${record?.month === m ? 'selected' : ''}>${m}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Year <span class="required">*</span></label>
          <select class="form-control" id="dYear">
            ${['2024','2025','2026'].map(y => `<option value="${y}" ${(record?.year || '2026') === y ? 'selected' : ''}>${y}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Contribution Type / Donation Received <span class="required">*</span></label>
          <select class="form-control" id="dType">
            ${types.map(t => `<option value="${t}" ${record?.donationType === t ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Actual Amount / Value (₱)</label>
          <input class="form-control" id="dAmount" type="number" min="0" step="0.01" value="${record?.amount || ''}" placeholder="0.00">
          <span class="form-hint">Leave 0 for in-kind donations</span>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Description of Donation <span class="required">*</span></label>
        <input class="form-control" id="dDesc" type="text" value="${record?.description || ''}" placeholder="e.g. 10 Snare Drums, Cash for feeding program">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Name of Donor(s) <span class="required">*</span></label>
          <input class="form-control" id="dDonor" type="text" value="${record?.donorName || ''}" placeholder="Be specific — full name">
        </div>
        <div class="form-group">
          <label class="form-label">Date Received (Month/Day/Year)</label>
          <input class="form-control" id="dDateReceived" type="date" value="${record?.dateReceived || ''}">
        </div>
      </div>
    </div>
    <div class="form-section">
      <div class="form-section-title">MOA / MOU Information</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Has MOA/MOU? <span class="required">*</span></label>
          <select class="form-control" id="dHasMOA">
            <option value="Yes" ${record?.hasMOA === 'Yes' ? 'selected' : ''}>Yes</option>
            <option value="No"  ${record?.hasMOA === 'No'  ? 'selected' : ''}>No</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Notarized?</label>
          <select class="form-control" id="dNotarized">
            <option value="Yes" ${record?.notarized === 'Yes' ? 'selected' : ''}>Yes</option>
            <option value="No"  ${record?.notarized !== 'Yes' ? 'selected' : ''}>No</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Notarized Date</label>
          <input class="form-control" id="dNotarizedDate" type="date" value="${record?.notarizedDate || ''}">
        </div>
      </div>
    </div>
    <div class="form-section">
      <div class="form-section-title">Utilization</div>
      <div class="form-group">
        <label class="form-label">Usage / Turned Over To</label>
        <textarea class="form-control" id="dUsage" rows="3" placeholder="Describe how the donation was used or who it was turned over to...">${record?.usageDescription || ''}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Status</label>
        <select class="form-control" id="dStatus">
          ${statusOpts.map(s => `<option value="${s}" ${record?.status === s ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </div>
    </div>`;

  h.modal(isEdit ? 'Edit Donation Record' : 'New Donation Record', body, (footer, close) => {
    const c = document.createElement('button'); c.className = 'btn btn-secondary'; c.textContent = 'Cancel'; c.onclick = close;
    const s = document.createElement('button'); s.className = 'btn btn-primary'; s.textContent = isEdit ? 'Save Changes' : 'Save Record';
    s.onclick = () => {
      const school = document.getElementById('dSchool').value.trim();
      const desc   = document.getElementById('dDesc').value.trim();
      const donor  = document.getElementById('dDonor').value.trim();
      if (!school || !desc || !donor) { h.toast('School, description, and donor are required.', 'danger'); return; }
      onSave({
        school, address: document.getElementById('dAddress').value.trim(),
        schoolId: document.getElementById('dSchoolId').value.trim(),
        schoolHead: document.getElementById('dSchoolHead').value.trim(),
        contact: document.getElementById('dContact').value.trim(),
        coordinator: document.getElementById('dCoordinator').value.trim(),
        quarter: document.getElementById('dQuarter').value,
        month: document.getElementById('dMonth').value,
        year: document.getElementById('dYear').value,
        donationType: document.getElementById('dType').value,
        amount: parseFloat(document.getElementById('dAmount').value) || 0,
        description: desc, donorName: donor,
        dateReceived: document.getElementById('dDateReceived').value,
        hasMOA: document.getElementById('dHasMOA').value,
        notarized: document.getElementById('dNotarized').value,
        notarizedDate: document.getElementById('dNotarizedDate').value,
        usageDescription: document.getElementById('dUsage').value.trim(),
        status: document.getElementById('dStatus').value,
        createdAt: record?.createdAt || new Date().toISOString().slice(0,10),
      });
      close();
    };
    footer.append(c, s);
  });
}


/* ------------------------------------------------------------------
   FA4: ETMRS — Monthly Reports Repository
   ------------------------------------------------------------------ */
Router.register('fa4', (app) => {
  if (!Auth.check()) return;
  setTopbarTitle('FA4 — ETMRS Repository');
  renderListPage(app, {
    title: 'ETMRS — Transmittal & Consolidated Monthly Reports',
    subtitle: 'FA4 — Cluster-based repository (Clusters 1–10) for school monthly consolidated reports',
    storeKey: 'etmrs',
    canAdd: Auth.can('create'),
    columns: [
      { label: 'School', key: 'school' },
      { label: 'Cluster', render: r => `Cluster ${r.cluster}` },
      { label: 'Month / Year', render: r => `${r.month} ${r.year}` },
      { label: 'Total Partners', key: 'totalPartners' },
      { label: 'Total Amount', render: r => h.fmt.currency(r.totalAmount) },
      { label: 'Beneficiaries', render: r => h.fmt.num(r.totalBeneficiaries) },
      { label: 'School Head', key: 'schoolHeadSignature' },
      { label: 'Submitted', render: r => h.fmt.date(r.submittedDate) },
      { label: 'Status', render: r => h.statusBadge(r.status) },
    ],
    filterFn: (r, q) => r.school.toLowerCase().includes(q) || r.cluster.toString().includes(q),
    formFn: (record, onSave) => renderEtmrsForm(record, onSave),
  });
});

function renderEtmrsForm(record, onSave) {
  const months  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const clusters = Array.from({ length: 10 }, (_, i) => i + 1);
  const isEdit = !!record;

  const body = `
    <div class="form-section">
      <div class="form-section-title">School & Cluster</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">School Name <span class="required">*</span></label>
          <input class="form-control" id="eSchool" type="text" value="${record?.school || ''}" placeholder="School name">
        </div>
        <div class="form-group">
          <label class="form-label">Cluster <span class="required">*</span></label>
          <select class="form-control" id="eCluster">
            ${clusters.map(c => `<option value="${c}" ${record?.cluster == c ? 'selected' : ''}>Cluster ${c}</option>`).join('')}
          </select>
        </div>
      </div>
    </div>
    <div class="form-section">
      <div class="form-section-title">Reporting Period</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Month <span class="required">*</span></label>
          <select class="form-control" id="eMonth">
            ${months.map(m => `<option value="${m}" ${record?.month === m ? 'selected' : ''}>${m}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Year <span class="required">*</span></label>
          <select class="form-control" id="eYear">
            ${['2025','2026','2027'].map(y => `<option value="${y}" ${(record?.year || '2026') === y ? 'selected' : ''}>${y}</option>`).join('')}
          </select>
        </div>
      </div>
    </div>
    <div class="form-section">
      <div class="form-section-title">Consolidated Totals</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Total Partners <span class="required">*</span></label>
          <input class="form-control" id="eTotalPartners" type="number" min="0" value="${record?.totalPartners || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Total Amount (₱) <span class="required">*</span></label>
          <input class="form-control" id="eTotalAmount" type="number" min="0" step="0.01" value="${record?.totalAmount || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Total Beneficiaries <span class="required">*</span></label>
          <input class="form-control" id="eTotalBenef" type="number" min="0" value="${record?.totalBeneficiaries || ''}">
        </div>
      </div>
    </div>
    <div class="form-section">
      <div class="form-section-title">Submission Details</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">School Head Signature (Name) <span class="required">*</span></label>
          <input class="form-control" id="eSchoolHead" type="text" value="${record?.schoolHeadSignature || ''}" placeholder="Full name of school head">
        </div>
        <div class="form-group">
          <label class="form-label">Date Submitted</label>
          <input class="form-control" id="eSubmittedDate" type="date" value="${record?.submittedDate || ''}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Upload Status</label>
        <select class="form-control" id="eStatus">
          <option value="Pending"  ${record?.status === 'Pending'  ? 'selected' : ''}>Pending Upload</option>
          <option value="Uploaded" ${record?.status === 'Uploaded' ? 'selected' : ''}>Uploaded</option>
          <option value="Validated" ${record?.status === 'Validated' ? 'selected' : ''}>Validated</option>
        </select>
      </div>
    </div>`;

  h.modal(isEdit ? 'Edit Monthly Report' : 'Upload Monthly Report', body, (footer, close) => {
    const c = document.createElement('button'); c.className = 'btn btn-secondary'; c.textContent = 'Cancel'; c.onclick = close;
    const s = document.createElement('button'); s.className = 'btn btn-primary'; s.textContent = isEdit ? 'Save Changes' : 'Upload Report';
    s.onclick = () => {
      const school = document.getElementById('eSchool').value.trim();
      if (!school) { h.toast('School name is required.', 'danger'); return; }
      onSave({
        school, cluster: document.getElementById('eCluster').value,
        month: document.getElementById('eMonth').value,
        year: document.getElementById('eYear').value,
        totalPartners: parseInt(document.getElementById('eTotalPartners').value) || 0,
        totalAmount: parseFloat(document.getElementById('eTotalAmount').value) || 0,
        totalBeneficiaries: parseInt(document.getElementById('eTotalBenef').value) || 0,
        schoolHeadSignature: document.getElementById('eSchoolHead').value.trim(),
        submittedDate: document.getElementById('eSubmittedDate').value,
        status: document.getElementById('eStatus').value,
        createdAt: record?.createdAt || new Date().toISOString().slice(0,10),
      });
      close();
    };
    footer.append(c, s);
  });
}


/* ------------------------------------------------------------------
   FA5: Certifications
   ------------------------------------------------------------------ */
Router.register('fa5', (app) => {
  if (!Auth.check()) return;
  setTopbarTitle('FA5 — Certifications');
  renderListPage(app, {
    title: 'Certification on Amount Received & Points Earned',
    subtitle: 'FA5 — HIYAS Rewards & Recognition Program · Official partnership certifications',
    storeKey: 'certifications',
    canAdd: Auth.can('create'),
    columns: [
      { label: 'School', key: 'school' },
      { label: 'School Head', key: 'schoolHead' },
      { label: 'Partner Name', key: 'partnerName' },
      { label: 'Amount Received', render: r => h.fmt.currency(r.amountReceived) },
      { label: 'Points Earned', key: 'pointsEarned' },
      { label: 'Year/Quarter', render: r => `${r.programYear} · ${r.quarter}` },
      { label: 'HIYAS', render: r => h.badge(r.hiyas, r.hiyas === 'Yes' ? 'green' : 'gray') },
      { label: 'Status', render: r => h.statusBadge(r.status) },
    ],
    filterFn: (r, q) => r.school.toLowerCase().includes(q) || r.partnerName.toLowerCase().includes(q),
    formFn: (record, onSave) => renderCertForm(record, onSave),
  });
});

function renderCertForm(record, onSave) {
  const quarters = ['Q1','Q2','Q3','Q4'];
  const isEdit = !!record;

  const body = `
    <div class="form-section">
      <div class="form-section-title">School Details</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">School Name <span class="required">*</span></label>
          <input class="form-control" id="cSchool" type="text" value="${record?.school || ''}" placeholder="e.g. Agripino Alvarez ES">
        </div>
        <div class="form-group">
          <label class="form-label">School Head <span class="required">*</span></label>
          <input class="form-control" id="cSchoolHead" type="text" value="${record?.schoolHead || ''}" placeholder="Full name">
        </div>
      </div>
    </div>
    <div class="form-section">
      <div class="form-section-title">Partner & Contribution</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Partner Name <span class="required">*</span></label>
          <input class="form-control" id="cPartner" type="text" value="${record?.partnerName || ''}" placeholder="Individual or organization name">
        </div>
        <div class="form-group">
          <label class="form-label">Amount Received (₱) <span class="required">*</span></label>
          <input class="form-control" id="cAmount" type="number" min="0" step="0.01" value="${record?.amountReceived || ''}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Points Earned <span class="required">*</span></label>
          <input class="form-control" id="cPoints" type="number" min="0" value="${record?.pointsEarned || ''}">
          <span class="form-hint">Based on recognition program rubric</span>
        </div>
        <div class="form-group">
          <label class="form-label">Certificate Date</label>
          <input class="form-control" id="cCertDate" type="date" value="${record?.certDate || ''}">
        </div>
      </div>
    </div>
    <div class="form-section">
      <div class="form-section-title">Program Period</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Program Year</label>
          <select class="form-control" id="cYear">
            ${['2024','2025','2026'].map(y => `<option value="${y}" ${(record?.programYear || '2026') === y ? 'selected' : ''}>${y}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Quarter</label>
          <select class="form-control" id="cQuarter">
            ${quarters.map(q => `<option value="${q}" ${record?.quarter === q ? 'selected' : ''}>${q}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">HIYAS Eligible?</label>
          <select class="form-control" id="cHiyas">
            <option value="Yes" ${record?.hiyas === 'Yes' ? 'selected' : ''}>Yes</option>
            <option value="No"  ${record?.hiyas === 'No'  ? 'selected' : ''}>No</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Status</label>
        <select class="form-control" id="cStatus">
          <option value="Pending" ${record?.status === 'Pending' ? 'selected' : ''}>Pending</option>
          <option value="Issued"  ${record?.status === 'Issued'  ? 'selected' : ''}>Issued</option>
          <option value="Approved" ${record?.status === 'Approved' ? 'selected' : ''}>Approved</option>
        </select>
      </div>
    </div>`;

  h.modal(isEdit ? 'Edit Certification' : 'Issue Certification', body, (footer, close) => {
    const c = document.createElement('button'); c.className = 'btn btn-secondary'; c.textContent = 'Cancel'; c.onclick = close;
    const s = document.createElement('button'); s.className = 'btn btn-primary'; s.textContent = isEdit ? 'Save Changes' : 'Issue Certificate';
    s.onclick = () => {
      const school = document.getElementById('cSchool').value.trim();
      const partner = document.getElementById('cPartner').value.trim();
      if (!school || !partner) { h.toast('School and partner name are required.', 'danger'); return; }
      onSave({
        school, schoolHead: document.getElementById('cSchoolHead').value.trim(),
        partnerName: partner,
        amountReceived: parseFloat(document.getElementById('cAmount').value) || 0,
        pointsEarned: parseInt(document.getElementById('cPoints').value) || 0,
        certDate: document.getElementById('cCertDate').value,
        programYear: document.getElementById('cYear').value,
        quarter: document.getElementById('cQuarter').value,
        hiyas: document.getElementById('cHiyas').value,
        status: document.getElementById('cStatus').value,
        createdAt: record?.createdAt || new Date().toISOString().slice(0,10),
      });
      close();
    };
    footer.append(c, s);
  });
}


/* ------------------------------------------------------------------
   FA6: MOA / MOU / DOD / DOA
   ------------------------------------------------------------------ */
Router.register('fa6', (app) => {
  if (!Auth.check()) return;
  setTopbarTitle('FA6 — MOA / MOU / DOD / DOA');
  renderListPage(app, {
    title: 'MOA / MOU / DOD / DOA Compilations',
    subtitle: 'FA6 — Centralized archive of partnership agreements and acceptance documents',
    storeKey: 'agreements',
    canAdd: Auth.can('create'),
    columns: [
      { label: 'School / Office', key: 'school' },
      { label: 'Cluster', render: r => `Cluster ${r.cluster}` },
      { label: 'Agreement Type', render: r => h.badge(r.agreementType, 'blue') },
      { label: 'Partner', key: 'partnerName' },
      { label: 'Purpose', key: 'purpose' },
      { label: 'Effectivity', render: r => `${h.fmt.date(r.effectivityStart)} – ${h.fmt.date(r.effectivityEnd)}` },
      { label: 'Notarized', render: r => h.badge(r.notarized, r.notarized === 'Yes' ? 'green' : 'gray') },
      { label: 'Status', render: r => h.statusBadge(r.status) },
    ],
    filterFn: (r, q) => r.school.toLowerCase().includes(q) || r.partnerName.toLowerCase().includes(q) || r.agreementType.toLowerCase().includes(q),
    formFn: (record, onSave) => renderAgreementForm(record, onSave),
  });
});

function renderAgreementForm(record, onSave) {
  const types = ['MOA', 'MOU', 'DOD', 'DOA'];
  const clusters = Array.from({ length: 10 }, (_, i) => i + 1);
  const isEdit = !!record;

  const body = `
    <div class="form-section">
      <div class="form-section-title">School / Office</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">School / Office Name <span class="required">*</span></label>
          <input class="form-control" id="agSchool" type="text" value="${record?.school || ''}" placeholder="e.g. Sipalay City NHS">
        </div>
        <div class="form-group">
          <label class="form-label">Cluster <span class="required">*</span></label>
          <select class="form-control" id="agCluster">
            ${clusters.map(c => `<option value="${c}" ${record?.cluster == c ? 'selected' : ''}>Cluster ${c}</option>`).join('')}
          </select>
        </div>
      </div>
    </div>
    <div class="form-section">
      <div class="form-section-title">Agreement Details</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Agreement Type <span class="required">*</span></label>
          <select class="form-control" id="agType">
            ${types.map(t => `<option value="${t}" ${record?.agreementType === t ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Partner Name <span class="required">*</span></label>
          <input class="form-control" id="agPartner" type="text" value="${record?.partnerName || ''}" placeholder="Full name of partner organization">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Partner Representative</label>
          <input class="form-control" id="agPartnerRep" type="text" value="${record?.partnerRep || ''}" placeholder="Name and designation">
        </div>
        <div class="form-group">
          <label class="form-label">Nature of Partner</label>
          <select class="form-control" id="agPartnerNature">
            <option value="LGU" ${record?.partnerNature === 'LGU' ? 'selected' : ''}>LGU (Local Gov't Unit)</option>
            <option value="NGO" ${record?.partnerNature === 'NGO' ? 'selected' : ''}>NGO</option>
            <option value="Private Company" ${record?.partnerNature === 'Private Company' ? 'selected' : ''}>Private Company</option>
            <option value="Individual" ${record?.partnerNature === 'Individual' ? 'selected' : ''}>Individual</option>
            <option value="Academic Institution" ${record?.partnerNature === 'Academic Institution' ? 'selected' : ''}>Academic Institution</option>
            <option value="Government Agency" ${record?.partnerNature === 'Government Agency' ? 'selected' : ''}>Government Agency</option>
            <option value="Other" ${record?.partnerNature === 'Other' ? 'selected' : ''}>Other</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Purpose of Agreement <span class="required">*</span></label>
        <textarea class="form-control" id="agPurpose" rows="3" placeholder="Brief description of the partnership purpose...">${record?.purpose || ''}</textarea>
      </div>
    </div>
    <div class="form-section">
      <div class="form-section-title">Effectivity & Notarization</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Effectivity Start Date</label>
          <input class="form-control" id="agStart" type="date" value="${record?.effectivityStart || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Effectivity End Date</label>
          <input class="form-control" id="agEnd" type="date" value="${record?.effectivityEnd || ''}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Notarized?</label>
          <select class="form-control" id="agNotarized">
            <option value="Yes" ${record?.notarized === 'Yes' ? 'selected' : ''}>Yes</option>
            <option value="No"  ${record?.notarized !== 'Yes' ? 'selected' : ''}>No</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Notarized Date</label>
          <input class="form-control" id="agNotarizedDate" type="date" value="${record?.notarizedDate || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <select class="form-control" id="agStatus">
            <option value="Active"   ${record?.status === 'Active'   ? 'selected' : ''}>Active</option>
            <option value="Expired"  ${record?.status === 'Expired'  ? 'selected' : ''}>Expired</option>
            <option value="Pending"  ${record?.status === 'Pending'  ? 'selected' : ''}>Pending</option>
            <option value="Cancelled" ${record?.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </div>
      </div>
    </div>`;

  h.modal(isEdit ? 'Edit Agreement' : 'Add Agreement', body, (footer, close) => {
    const c = document.createElement('button'); c.className = 'btn btn-secondary'; c.textContent = 'Cancel'; c.onclick = close;
    const s = document.createElement('button'); s.className = 'btn btn-primary'; s.textContent = isEdit ? 'Save Changes' : 'Add Agreement';
    s.onclick = () => {
      const school = document.getElementById('agSchool').value.trim();
      const partner = document.getElementById('agPartner').value.trim();
      const purpose = document.getElementById('agPurpose').value.trim();
      if (!school || !partner) { h.toast('School and partner name are required.', 'danger'); return; }
      onSave({
        school, cluster: document.getElementById('agCluster').value,
        agreementType: document.getElementById('agType').value,
        partnerName: partner,
        partnerRep: document.getElementById('agPartnerRep').value.trim(),
        partnerNature: document.getElementById('agPartnerNature').value,
        purpose,
        effectivityStart: document.getElementById('agStart').value,
        effectivityEnd: document.getElementById('agEnd').value,
        notarized: document.getElementById('agNotarized').value,
        notarizedDate: document.getElementById('agNotarizedDate').value,
        status: document.getElementById('agStatus').value,
        createdAt: record?.createdAt || new Date().toISOString().slice(0,10),
      });
      close();
    };
    footer.append(c, s);
  });
}


/* ------------------------------------------------------------------
   User Management
   ------------------------------------------------------------------ */
Router.register('users', (app) => {
  const session = Auth.check();
  if (!session) return;
  if (session.role !== 'Admin') {
    app.innerHTML = `<div class="alert alert-danger" style="margin:2rem auto;max-width:480px;">
      <strong>Access Denied</strong> — Only Administrators can manage users.
    </div>`;
    return;
  }
  setTopbarTitle('User Management');

  function render() {
    const users = Store.get('users');
    app.innerHTML = `
      <div class="page-header">
        <div class="page-header-left">
          <h1 class="page-title">User Management</h1>
          <p class="page-subtitle">Manage system access — Roles: Admin, Editor, Viewer</p>
        </div>
        <div>
          <button class="btn btn-primary" id="addUserBtn">+ Add User</button>
        </div>
      </div>
      <div class="card">
        <div class="card-header">
          <span class="card-title">All Users (${users.length})</span>
          <div class="search-bar">
            <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input type="text" placeholder="Search users..." id="userSearch">
          </div>
        </div>
        <div class="card-body" style="padding:0;">
          <div class="table-wrapper">
            <table>
              <thead><tr>
                <th>Name</th><th>Email</th><th>Role</th><th>School / Office</th>
                <th>Status</th><th>Created</th><th>Actions</th>
              </tr></thead>
              <tbody id="usersBody">
                ${renderUsersRows(users)}
              </tbody>
            </table>
          </div>
        </div>
      </div>`;

    document.getElementById('addUserBtn').addEventListener('click', () => renderUserForm(null, () => render()));
    document.getElementById('userSearch').addEventListener('input', e => {
      const q = e.target.value.toLowerCase();
      const filtered = Store.get('users').filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.school.toLowerCase().includes(q));
      document.getElementById('usersBody').innerHTML = renderUsersRows(filtered);
      wireUserActions();
    });
    wireUserActions();
  }

  function renderUsersRows(users) {
    if (!users.length) return `<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">👥</div><div class="empty-title">No users found</div></div></td></tr>`;
    return users.map(u => `<tr>
      <td><strong>${u.name}</strong></td>
      <td class="td-muted">${u.email}</td>
      <td>${h.badge(u.role, u.role === 'Admin' ? 'red' : u.role === 'Editor' ? 'blue' : 'gray')}</td>
      <td>${u.school}</td>
      <td>${h.statusBadge(u.status)}</td>
      <td class="td-muted">${h.fmt.date(u.createdAt)}</td>
      <td>
        <button class="btn btn-sm btn-ghost edit-user" data-id="${u.id}">Edit</button>
        <button class="btn btn-sm btn-ghost text-danger del-user" data-id="${u.id}" ${u.id === session.userId ? 'disabled' : ''}>Delete</button>
      </td>
    </tr>`).join('');
  }

  function wireUserActions() {
    app.querySelectorAll('.edit-user').forEach(btn => {
      btn.addEventListener('click', () => {
        const user = Store.get('users').find(u => u.id === btn.dataset.id);
        if (user) renderUserForm(user, () => render());
      });
    });
    app.querySelectorAll('.del-user').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!h.confirm('Delete this user? This cannot be undone.')) return;
        const users = Store.get('users').filter(u => u.id !== btn.dataset.id);
        Store.set('users', users);
        h.toast('User deleted.');
        render();
      });
    });
  }

  render();
});

function renderUserForm(record, onSave) {
  const isEdit = !!record;
  const body = `
    <div class="form-section">
      <div class="form-section-title">Account Details</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Full Name <span class="required">*</span></label>
          <input class="form-control" id="ufName" type="text" value="${record?.name || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Role <span class="required">*</span></label>
          <select class="form-control" id="ufRole">
            <option value="Admin"  ${record?.role === 'Admin'  ? 'selected' : ''}>Admin</option>
            <option value="Editor" ${record?.role === 'Editor' ? 'selected' : ''}>Editor</option>
            <option value="Viewer" ${record?.role === 'Viewer' ? 'selected' : ''}>Viewer</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Email (DepEd) <span class="required">*</span></label>
        <input class="form-control" id="ufEmail" type="email" value="${record?.email || ''}">
      </div>
      <div class="form-group">
        <label class="form-label">School / Office <span class="required">*</span></label>
        <input class="form-control" id="ufSchool" type="text" value="${record?.school || ''}">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">${isEdit ? 'New Password (leave blank to keep)' : 'Password'} ${isEdit ? '' : '<span class="required">*</span>'}</label>
          <input class="form-control" id="ufPw" type="password" placeholder="${isEdit ? 'Leave blank to keep current' : 'Min. 8 characters'}">
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <select class="form-control" id="ufStatus">
            <option value="Active"   ${(record?.status || 'Active') === 'Active'   ? 'selected' : ''}>Active</option>
            <option value="Inactive" ${record?.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
          </select>
        </div>
      </div>
    </div>`;

  h.modal(isEdit ? 'Edit User' : 'Add User', body, (footer, close) => {
    const c = document.createElement('button'); c.className = 'btn btn-secondary'; c.textContent = 'Cancel'; c.onclick = close;
    const s = document.createElement('button'); s.className = 'btn btn-primary'; s.textContent = isEdit ? 'Save Changes' : 'Create User';
    s.onclick = () => {
      const name   = document.getElementById('ufName').value.trim();
      const email  = document.getElementById('ufEmail').value.trim();
      const school = document.getElementById('ufSchool').value.trim();
      const pw     = document.getElementById('ufPw').value;
      const role   = document.getElementById('ufRole').value;
      const status = document.getElementById('ufStatus').value;

      if (!name || !email || !school) { h.toast('Name, email, and school are required.', 'danger'); return; }
      if (!isEdit && pw.length < 8) { h.toast('Password must be at least 8 characters.', 'danger'); return; }

      const users = Store.get('users');
      if (isEdit) {
        const idx = users.findIndex(u => u.id === record.id);
        if (idx >= 0) {
          users[idx] = { ...users[idx], name, email, school, role, status };
          if (pw.length >= 8) users[idx].password = pw;
        }
      } else {
        if (users.find(u => u.email === email)) { h.toast('Email already exists.', 'danger'); return; }
        users.push({ id: Store.nextId('u'), name, email, school, role, status, createdAt: new Date().toISOString().slice(0,10), password: pw });
      }
      Store.set('users', users);
      h.toast(isEdit ? 'User updated.' : 'User created.');
      close();
      onSave();
    };
    footer.append(c, s);
  });
}


/* ------------------------------------------------------------------
   Generic List Page renderer (reused by all 6 FA modules)
   ------------------------------------------------------------------ */
function renderListPage(app, { title, subtitle, storeKey, canAdd, columns, filterFn, formFn }) {
  function render(query = '') {
    const records = Store.get(storeKey);
    const filtered = query ? records.filter(r => filterFn(r, query.toLowerCase())) : records;

    app.innerHTML = `
      <div class="page-header">
        <div class="page-header-left">
          <h1 class="page-title">${title}</h1>
          <p class="page-subtitle">${subtitle}</p>
        </div>
        <div class="flex gap-2">
          ${canAdd ? `<button class="btn btn-primary" id="addBtn">+ Add Record</button>` : ''}
        </div>
      </div>
      <div class="card">
        <div class="card-header">
          <span class="card-title">${filtered.length} record${filtered.length !== 1 ? 's' : ''}</span>
          <div class="search-bar">
            <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input type="text" placeholder="Search..." id="searchInput" value="${query}">
          </div>
        </div>
        <div class="card-body" style="padding:0;">
          <div class="table-wrapper">
            <table>
              <thead><tr>
                ${columns.map(c => `<th>${c.label}</th>`).join('')}
                <th>Actions</th>
              </tr></thead>
              <tbody id="tableBody">
                ${renderRows(filtered)}
              </tbody>
            </table>
          </div>
        </div>
      </div>`;

    if (canAdd) {
      document.getElementById('addBtn').addEventListener('click', () => {
        formFn(null, (data) => {
          const records = Store.get(storeKey);
          records.push({ id: Store.nextId(storeKey[0]), ...data });
          Store.set(storeKey, records);
          h.toast('Record saved successfully.');
          render(query);
        });
      });
    }

    document.getElementById('searchInput').addEventListener('input', e => render(e.target.value));
    wireRowActions(filtered, query);
  }

  function renderRows(records) {
    if (!records.length) return `<tr><td colspan="${columns.length + 1}"><div class="empty-state"><div class="empty-icon">📄</div><div class="empty-title">No records found</div><div class="empty-desc">Click "+ Add Record" to create the first entry.</div></div></td></tr>`;
    return records.map(r => `<tr>
      ${columns.map(c => `<td>${c.render ? c.render(r) : (r[c.key] ?? '—')}</td>`).join('')}
      <td>
        ${canAdd ? `<button class="btn btn-sm btn-ghost edit-row" data-id="${r.id}">Edit</button>` : ''}
        ${Auth.can('edit') ? `<button class="btn btn-sm btn-ghost text-danger del-row" data-id="${r.id}">Delete</button>` : ''}
      </td>
    </tr>`).join('');
  }

  function wireRowActions(records, query) {
    app.querySelectorAll('.edit-row').forEach(btn => {
      btn.addEventListener('click', () => {
        const rec = Store.get(storeKey).find(r => r.id === btn.dataset.id);
        if (!rec) return;
        formFn(rec, (data) => {
          const all = Store.get(storeKey);
          const idx = all.findIndex(r => r.id === btn.dataset.id);
          if (idx >= 0) all[idx] = { id: btn.dataset.id, ...data };
          Store.set(storeKey, all);
          h.toast('Record updated.');
          render(query);
        });
      });
    });
    app.querySelectorAll('.del-row').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!h.confirm('Delete this record?')) return;
        const all = Store.get(storeKey).filter(r => r.id !== btn.dataset.id);
        Store.set(storeKey, all);
        h.toast('Record deleted.', 'warning');
        render(query);
      });
    });
  }

  render();
}


/* ------------------------------------------------------------------
   BOOT
   ------------------------------------------------------------------ */
document.addEventListener('DOMContentLoaded', () => {
  Store.load();
  const session = Auth.session();
  if (session) {
    renderShell();
    Router.go('dashboard');
  } else {
    Router.go('login');
  }
});
