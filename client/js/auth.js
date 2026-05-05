// Login + Multi-step animated Registration
(function() {

  function authShell(content) {
    return `
      <div class="min-h-screen relative overflow-hidden bg-gradient-to-br from-ink-50 via-white to-stone-100 texture-grain">
        <!-- Decorative blobs -->
        <div class="absolute -top-32 -right-32 w-[28rem] h-[28rem] rounded-full bg-deped-yellow/10 blur-3xl pointer-events-none animate-pulse-slow"></div>
        <div class="absolute -bottom-40 -left-40 w-[32rem] h-[32rem] rounded-full bg-deped-blue/10 blur-3xl pointer-events-none animate-pulse-slow"></div>

        <div class="relative grid lg:grid-cols-2 min-h-screen">
          <!-- Brand panel -->
          <div class="hidden lg:flex flex-col justify-between p-12 bg-ink-900 text-white relative overflow-hidden">
            <div class="absolute inset-0 opacity-10" style="background-image: radial-gradient(circle at 20% 30%, rgba(245,166,35,0.4) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(0,56,147,0.4) 0%, transparent 40%);"></div>
            <div class="relative z-10">
              <div class="flex items-center gap-3 mb-12 animate-fade-in-up">
                <div class="w-11 h-11 rounded-xl bg-deped-yellow flex items-center justify-center font-black text-deped-blue text-sm tracking-tight">SW</div>
                <div>
                  <div class="font-semibold text-sm">SMART WINGS</div>
                  <div class="text-xs text-ink-400">SDO Sipalay City</div>
                </div>
              </div>
              <div class="max-w-md animate-fade-in-up" style="animation-delay:.05s">
                <h2 class="text-3xl font-bold leading-tight tracking-tight mb-4">Contextualized Partnership Engagement System</h2>
                <p class="text-ink-300 text-sm leading-relaxed">A unified platform for managing, monitoring, and reporting on partnership engagements across schools in the Schools Division Office of Sipalay City.</p>
              </div>
            </div>
            <div class="relative z-10 grid grid-cols-3 gap-4 max-w-md text-xs animate-fade-in-up" style="animation-delay:.15s">
              <div class="space-y-1"><div class="text-deped-yellow font-bold text-2xl">6</div><div class="text-ink-400">Functional Areas</div></div>
              <div class="space-y-1"><div class="text-deped-yellow font-bold text-2xl">47</div><div class="text-ink-400">Schools</div></div>
              <div class="space-y-1"><div class="text-deped-yellow font-bold text-2xl">CY26</div><div class="text-ink-400">Current Cycle</div></div>
            </div>
          </div>

          <!-- Form panel -->
          <div class="flex items-center justify-center p-6 sm:p-12">
            <div class="w-full max-w-md">${content}</div>
          </div>
        </div>
      </div>
    `;
  }

  // ===================== LOGIN =====================
  async function loginPage(root) {
    root.innerHTML = authShell(`
      <div class="animate-fade-in-up">
        <div class="lg:hidden flex items-center gap-2.5 mb-8">
          <div class="w-10 h-10 rounded-lg bg-ink-900 flex items-center justify-center font-black text-deped-yellow text-xs">SW</div>
          <div>
            <div class="text-sm font-semibold text-ink-800">SMART WINGS: CPES</div>
            <div class="text-xs text-ink-500">SDO Sipalay City</div>
          </div>
        </div>

        <div class="space-y-1.5 mb-7">
          <h1 class="text-2xl font-bold tracking-tight text-ink-900">Welcome back</h1>
          <p class="text-sm text-ink-500">Sign in to access the engagement system.</p>
        </div>

        <form id="loginForm" class="space-y-4">
          <div class="space-y-1.5">
            <label class="block text-xs font-semibold text-ink-700">Email Address</label>
            <input id="lEmail" type="email" autocomplete="email" required placeholder="yourname@deped.gov.ph"
              class="w-full px-3.5 py-2.5 text-sm bg-white border border-ink-200 rounded-xl transition placeholder:text-ink-300">
          </div>
          <div class="space-y-1.5">
            <label class="block text-xs font-semibold text-ink-700">Password</label>
            <input id="lPassword" type="password" autocomplete="current-password" required placeholder="••••••••"
              class="w-full px-3.5 py-2.5 text-sm bg-white border border-ink-200 rounded-xl transition placeholder:text-ink-300">
          </div>
          <div id="lError" class="hidden px-3.5 py-2.5 text-sm rounded-lg bg-rose-50 text-rose-700 ring-1 ring-rose-200 animate-fade-in-up"></div>
          <button id="lSubmit" type="submit"
            class="group w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl bg-ink-900 text-white hover:bg-ink-800 transition shadow-soft-md disabled:opacity-60 hover:-translate-y-0.5 active:translate-y-0">
            <span class="lbl">Sign In</span>
            <svg class="w-4 h-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            <span class="spin hidden">
              <svg class="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            </span>
          </button>
        </form>

        <div class="mt-6 pt-5 border-t border-ink-100 text-center text-sm text-ink-500">
          Don't have an account?
          <a href="#" id="goRegister" class="font-semibold text-ink-900 hover:text-deped-blue transition ml-1">Register here</a>
        </div>
      </div>
    `);

    document.getElementById('loginForm').onsubmit = async (e) => {
      e.preventDefault();
      const btn = document.getElementById('lSubmit');
      const err = document.getElementById('lError');
      err.classList.add('hidden');
      btn.disabled = true;
      btn.querySelector('.lbl').textContent = 'Signing in...';
      btn.querySelector('.spin').classList.remove('hidden');
      try {
        const email = document.getElementById('lEmail').value.trim();
        const password = document.getElementById('lPassword').value;
        const res = await Api.login(email, password);
        Api.setToken(res.token);
        Store.setSession(res.user);
        UI.toast('Welcome back, ' + res.user.firstName + '!');
        Router.go('dashboard');
      } catch (e) {
        err.textContent = e.message || 'Sign-in failed. Please try again.';
        err.classList.remove('hidden');
        btn.disabled = false;
        btn.querySelector('.lbl').textContent = 'Sign In';
        btn.querySelector('.spin').classList.add('hidden');
      }
    };

    document.getElementById('goRegister').onclick = (e) => { e.preventDefault(); Router.go('register'); };
  }

  // ===================== REGISTRATION (multi-step) =====================
  // Steps: 1=Type → 2=Name → 3=Location → 4=Credentials → review → submit
  const STEPS = [
    { id: 'type',     label: 'Account Type' },
    { id: 'name',     label: 'Personal Info' },
    { id: 'location', label: 'School / Office' },
    { id: 'creds',    label: 'Credentials' }
  ];

  let regState = null;
  let schoolsCache = null;

  async function registerPage(root) {
    regState = {
      step: 0,
      data: {
        registrationType: '',
        firstName: '', middleName: '', lastName: '', suffix: '',
        school: '',
        email: '', password: ''
      }
    };
    if (!schoolsCache) {
      try { schoolsCache = await Api.schools(); }
      catch (e) { UI.toast('Failed to load school directory.', 'error'); schoolsCache = { schools: [], division: [] }; }
    }
    renderRegister(root);
  }

  function renderRegister(root) {
    root.innerHTML = authShell(`
      <div class="animate-fade-in-up">
        <div class="lg:hidden flex items-center gap-2.5 mb-8">
          <div class="w-10 h-10 rounded-lg bg-ink-900 flex items-center justify-center font-black text-deped-yellow text-xs">SW</div>
          <div>
            <div class="text-sm font-semibold text-ink-800">SMART WINGS: CPES</div>
            <div class="text-xs text-ink-500">SDO Sipalay City</div>
          </div>
        </div>

        <div class="mb-2">
          <a href="#" id="backLogin" class="text-xs text-ink-500 hover:text-ink-900 transition inline-flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Back to sign in
          </a>
        </div>

        <div class="space-y-1.5 mb-5">
          <h1 class="text-2xl font-bold tracking-tight text-ink-900">Create your account</h1>
          <p class="text-sm text-ink-500">Step ${regState.step + 1} of ${STEPS.length} · ${STEPS[regState.step].label}</p>
        </div>

        <!-- Stepper -->
        <div class="flex items-center gap-1.5 mb-6">
          ${STEPS.map((s, i) => {
            const done = i < regState.step;
            const active = i === regState.step;
            return `
              <div class="flex-1 h-1 rounded-full overflow-hidden bg-ink-100 relative">
                <div class="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${done ? 'w-full bg-emerald-500' : active ? 'w-full bg-ink-900' : 'w-0'}"></div>
              </div>
            `;
          }).join('')}
        </div>

        <div id="step-body" class="animate-fade-in-up"></div>

        <div id="step-error" class="hidden mt-3 px-3.5 py-2.5 text-sm rounded-lg bg-rose-50 text-rose-700 ring-1 ring-rose-200 animate-fade-in-up"></div>

        <div class="flex items-center gap-2 mt-6">
          <button id="prevBtn" class="${regState.step === 0 ? 'invisible' : ''} px-4 py-2.5 text-sm font-semibold rounded-xl bg-white text-ink-700 ring-1 ring-ink-200 hover:bg-ink-50 transition">Back</button>
          <button id="nextBtn" class="flex-1 group inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl bg-ink-900 text-white hover:bg-ink-800 transition shadow-soft-md hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60">
            <span class="lbl">${regState.step === STEPS.length - 1 ? 'Create Account' : 'Continue'}</span>
            <svg class="w-4 h-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            <span class="spin hidden"><svg class="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg></span>
          </button>
        </div>
      </div>
    `);

    renderStep();
    document.getElementById('backLogin').onclick = (e) => { e.preventDefault(); Router.go('login'); };
    document.getElementById('prevBtn').onclick = () => { if (regState.step > 0) { regState.step--; renderRegister(root); } };
    document.getElementById('nextBtn').onclick = async () => { await handleNext(root); };
  }

  function renderStep() {
    const body = document.getElementById('step-body');
    body.innerHTML = '';
    body.classList.remove('animate-fade-in-up');
    void body.offsetWidth;
    body.classList.add('animate-fade-in-up');

    if (regState.step === 0) renderTypeStep(body);
    else if (regState.step === 1) renderNameStep(body);
    else if (regState.step === 2) renderLocationStep(body);
    else if (regState.step === 3) renderCredsStep(body);
  }

  // ----- STEP 1: Type -----
  function renderTypeStep(body) {
    body.innerHTML = `
      <p class="text-sm text-ink-500 mb-4">Choose the type of account that matches your role.</p>
      <div class="grid grid-cols-1 gap-3">
        <label class="cursor-pointer group">
          <input type="radio" name="rtype" value="School" ${regState.data.registrationType === 'School' ? 'checked' : ''} class="peer hidden">
          <div class="relative px-5 py-4 rounded-2xl border-2 border-ink-200 peer-checked:border-ink-900 peer-checked:bg-ink-900 peer-checked:text-white hover:border-ink-400 transition group-hover:-translate-y-0.5">
            <div class="flex items-start gap-3">
              <div class="w-10 h-10 rounded-xl bg-deped-yellow/15 text-deped-yellow flex items-center justify-center peer-checked:group-[]:bg-deped-yellow peer-checked:group-[]:text-deped-blue transition flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-7h6v7M9 11h.01M15 11h.01"/></svg>
              </div>
              <div class="flex-1">
                <div class="font-semibold text-base">School-Based</div>
                <div class="text-xs opacity-70 mt-0.5">Teaching & non-teaching personnel of a school under SDO Sipalay City. Sees only your school's data.</div>
              </div>
              <svg class="opacity-0 peer-checked:opacity-100 transition w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg>
            </div>
          </div>
        </label>

        <label class="cursor-pointer group">
          <input type="radio" name="rtype" value="Division" ${regState.data.registrationType === 'Division' ? 'checked' : ''} class="peer hidden">
          <div class="relative px-5 py-4 rounded-2xl border-2 border-ink-200 peer-checked:border-ink-900 peer-checked:bg-ink-900 peer-checked:text-white hover:border-ink-400 transition group-hover:-translate-y-0.5">
            <div class="flex items-start gap-3">
              <div class="w-10 h-10 rounded-xl bg-deped-blue/10 text-deped-blue flex items-center justify-center peer-checked:group-[]:bg-deped-yellow peer-checked:group-[]:text-deped-blue transition flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 22h20M3 22V10l9-7 9 7v12M9 22v-9h6v9M12 6.5v.01"/></svg>
              </div>
              <div class="flex-1">
                <div class="font-semibold text-base">Division-Based</div>
                <div class="text-xs opacity-70 mt-0.5">SDO personnel (OSDS, SGOD, CID, etc.). Has full access to all schools' data and user management.</div>
              </div>
              <svg class="opacity-0 peer-checked:opacity-100 transition w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg>
            </div>
          </div>
        </label>
      </div>
    `;
    body.querySelectorAll('input[name="rtype"]').forEach(r => {
      r.onchange = () => { regState.data.registrationType = r.value; };
    });
  }

  // ----- STEP 2: Name -----
  function renderNameStep(body) {
    body.innerHTML = `
      <p class="text-sm text-ink-500 mb-4">Enter your name as it appears on official records.</p>
      <div class="space-y-3">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <label class="block text-xs font-semibold text-ink-700">First Name <span class="text-rose-500">*</span></label>
            <input id="rFirst" value="${UI.esc(regState.data.firstName)}" required class="w-full px-3.5 py-2.5 text-sm bg-white border border-ink-200 rounded-xl transition" placeholder="Juan">
          </div>
          <div class="space-y-1.5">
            <label class="block text-xs font-semibold text-ink-700">Middle Name <span class="text-ink-400 font-normal">(optional)</span></label>
            <input id="rMiddle" value="${UI.esc(regState.data.middleName)}" class="w-full px-3.5 py-2.5 text-sm bg-white border border-ink-200 rounded-xl transition" placeholder="Reyes">
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="space-y-1.5 sm:col-span-2">
            <label class="block text-xs font-semibold text-ink-700">Last Name <span class="text-rose-500">*</span></label>
            <input id="rLast" value="${UI.esc(regState.data.lastName)}" required class="w-full px-3.5 py-2.5 text-sm bg-white border border-ink-200 rounded-xl transition" placeholder="Dela Cruz">
          </div>
          <div class="space-y-1.5">
            <label class="block text-xs font-semibold text-ink-700">Suffix <span class="text-ink-400 font-normal">(optional)</span></label>
            <input id="rSuffix" value="${UI.esc(regState.data.suffix)}" class="w-full px-3.5 py-2.5 text-sm bg-white border border-ink-200 rounded-xl transition" placeholder="Jr., Sr., III">
          </div>
        </div>
        <div id="namePreview" class="hidden mt-2 px-3 py-2 rounded-lg bg-emerald-50 ring-1 ring-emerald-200 text-xs text-emerald-800 animate-fade-in-up"></div>
      </div>
    `;

    function updatePreview() {
      const f = document.getElementById('rFirst').value.trim();
      const m = document.getElementById('rMiddle').value.trim();
      const l = document.getElementById('rLast').value.trim();
      const s = document.getElementById('rSuffix').value.trim();
      const prev = document.getElementById('namePreview');
      if (f && l) {
        const mid = m ? m[0] + '.' : '';
        const sfx = s ? ', ' + s : '';
        prev.innerHTML = `<strong>Display name:</strong> ${UI.esc([f, mid, l].filter(Boolean).join(' ') + sfx)}`;
        prev.classList.remove('hidden');
      } else {
        prev.classList.add('hidden');
      }
    }

    ['rFirst','rMiddle','rLast','rSuffix'].forEach(id => {
      document.getElementById(id).oninput = updatePreview;
    });
    updatePreview();
  }

  // ----- STEP 3: Location -----
  function renderLocationStep(body) {
    const isSchool = regState.data.registrationType === 'School';
    const list = isSchool ? schoolsCache.schools : schoolsCache.division;
    body.innerHTML = `
      <p class="text-sm text-ink-500 mb-4">${isSchool ? 'Select your school from the SDO Sipalay City directory.' : 'Select your Division Office.'}</p>
      <div class="space-y-3">
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-ink-700">${isSchool ? 'School' : 'Division Office'} <span class="text-rose-500">*</span></label>
          <div class="relative">
            <input id="schoolSearch" type="text" placeholder="${isSchool ? 'Search schools...' : 'Search offices...'}" autocomplete="off"
              class="w-full px-3.5 py-2.5 pl-10 text-sm bg-white border border-ink-200 rounded-xl transition placeholder:text-ink-300">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </div>
        </div>

        <div id="schoolList" class="max-h-72 overflow-y-auto scrollbar-thin border border-ink-100 rounded-xl bg-white divide-y divide-ink-50"></div>

        <div id="selectedSchool" class="${regState.data.school ? '' : 'hidden'} px-3.5 py-3 rounded-xl bg-ink-900 text-white animate-fade-in-up flex items-center justify-between gap-2">
          <div class="min-w-0">
            <div class="text-[10px] uppercase tracking-widest text-deped-yellow font-bold">Selected</div>
            <div id="selectedName" class="text-sm font-semibold truncate">${UI.esc(regState.data.school)}</div>
          </div>
          <svg class="w-5 h-5 text-deped-yellow flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg>
        </div>
      </div>
    `;

    const listEl = document.getElementById('schoolList');
    const search = document.getElementById('schoolSearch');

    function renderList(filter) {
      const q = (filter || '').toLowerCase().trim();
      const filtered = list.filter(name => !q || name.toLowerCase().includes(q));
      if (!filtered.length) {
        listEl.innerHTML = `<div class="px-4 py-6 text-center text-sm text-ink-400">No matches found</div>`;
        return;
      }
      listEl.innerHTML = filtered.slice(0, 50).map(name => `
        <button type="button" data-name="${UI.esc(name)}" class="school-opt w-full text-left px-4 py-2.5 text-sm hover:bg-ink-50 transition flex items-center gap-2 ${regState.data.school === name ? 'bg-ink-50' : ''}">
          <span class="flex-1 text-ink-800">${UI.esc(name)}</span>
          ${regState.data.school === name ? '<svg class="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg>' : ''}
        </button>
      `).join('');
      listEl.querySelectorAll('.school-opt').forEach(b => {
        b.onclick = () => {
          regState.data.school = b.dataset.name;
          document.getElementById('selectedSchool').classList.remove('hidden');
          document.getElementById('selectedName').textContent = b.dataset.name;
          renderList(search.value);
        };
      });
    }
    renderList('');
    search.oninput = (e) => renderList(e.target.value);
  }

  // ----- STEP 4: Credentials -----
  function renderCredsStep(body) {
    body.innerHTML = `
      <p class="text-sm text-ink-500 mb-4">Set your sign-in credentials.</p>
      <div class="space-y-3">
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-ink-700">Email Address <span class="text-rose-500">*</span></label>
          <input id="rEmail" type="email" value="${UI.esc(regState.data.email)}" required class="w-full px-3.5 py-2.5 text-sm bg-white border border-ink-200 rounded-xl transition placeholder:text-ink-300" placeholder="yourname@deped.gov.ph">
        </div>
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-ink-700">Password <span class="text-rose-500">*</span></label>
          <input id="rPassword" type="password" value="${UI.esc(regState.data.password)}" required class="w-full px-3.5 py-2.5 text-sm bg-white border border-ink-200 rounded-xl transition placeholder:text-ink-300" placeholder="Minimum 8 characters">
          <div id="pwStrength" class="flex items-center gap-1 mt-2"></div>
        </div>

        <!-- Summary card -->
        <div class="mt-4 p-4 rounded-2xl bg-gradient-to-br from-ink-50 to-stone-50 ring-1 ring-ink-100 space-y-2 animate-fade-in-up">
          <div class="text-[10px] uppercase tracking-widest font-bold text-ink-400">Account Summary</div>
          <div class="grid grid-cols-3 gap-2 text-xs">
            <div><div class="text-ink-400">Type</div><div class="font-semibold text-ink-800">${UI.esc(regState.data.registrationType)}</div></div>
            <div class="col-span-2"><div class="text-ink-400">Name</div><div class="font-semibold text-ink-800 truncate">${UI.esc(buildDisplayName())}</div></div>
            <div class="col-span-3"><div class="text-ink-400">${regState.data.registrationType === 'School' ? 'School' : 'Office'}</div><div class="font-semibold text-ink-800 truncate">${UI.esc(regState.data.school)}</div></div>
          </div>
        </div>
      </div>
    `;

    const pwInput = document.getElementById('rPassword');
    pwInput.oninput = () => updatePwStrength(pwInput.value);
    updatePwStrength(pwInput.value);
  }

  function updatePwStrength(pw) {
    const el = document.getElementById('pwStrength');
    if (!el) return;
    const score = pwScore(pw);
    const labels = ['Too short', 'Weak', 'OK', 'Strong', 'Excellent'];
    const colors = ['bg-rose-500', 'bg-amber-500', 'bg-yellow-500', 'bg-emerald-500', 'bg-emerald-600'];
    el.innerHTML = `
      ${[0,1,2,3].map(i => `<div class="flex-1 h-1.5 rounded-full ${i < score ? colors[Math.max(0, score-1)] : 'bg-ink-100'} transition-all"></div>`).join('')}
      <span class="text-[11px] text-ink-500 ml-2 min-w-[60px]">${pw.length === 0 ? '' : labels[score]}</span>
    `;
  }

  function pwScore(pw) {
    if (!pw || pw.length < 8) return 0;
    let s = 1;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
    if (/\d/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw) && pw.length >= 12) s++;
    return Math.min(4, s);
  }

  function buildDisplayName() {
    const f = regState.data.firstName, m = regState.data.middleName, l = regState.data.lastName, s = regState.data.suffix;
    if (!f || !l) return '—';
    const mid = m ? m[0] + '.' : '';
    const sfx = s ? ', ' + s : '';
    return [f, mid, l].filter(Boolean).join(' ') + sfx;
  }

  function showStepError(msg) {
    const e = document.getElementById('step-error');
    e.textContent = msg;
    e.classList.remove('hidden');
    setTimeout(() => e.classList.add('animate-fade-in-up'), 10);
  }
  function hideStepError() { const e = document.getElementById('step-error'); if (e) e.classList.add('hidden'); }

  function captureCurrentStep() {
    if (regState.step === 1) {
      regState.data.firstName = document.getElementById('rFirst').value.trim();
      regState.data.middleName = document.getElementById('rMiddle').value.trim();
      regState.data.lastName = document.getElementById('rLast').value.trim();
      regState.data.suffix = document.getElementById('rSuffix').value.trim();
    } else if (regState.step === 3) {
      regState.data.email = document.getElementById('rEmail').value.trim();
      regState.data.password = document.getElementById('rPassword').value;
    }
  }

  function validateCurrentStep() {
    captureCurrentStep();
    const d = regState.data;
    if (regState.step === 0) {
      if (!d.registrationType) return 'Please select an account type.';
    }
    if (regState.step === 1) {
      if (!d.firstName) return 'First name is required.';
      if (!d.lastName) return 'Last name is required.';
    }
    if (regState.step === 2) {
      if (!d.school) return 'Please select your ' + (d.registrationType === 'School' ? 'school' : 'division office') + '.';
    }
    if (regState.step === 3) {
      if (!d.email) return 'Email is required.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) return 'Please enter a valid email address.';
      if (!d.password || d.password.length < 8) return 'Password must be at least 8 characters.';
    }
    return null;
  }

  async function handleNext(root) {
    hideStepError();
    const err = validateCurrentStep();
    if (err) { showStepError(err); return; }

    if (regState.step < STEPS.length - 1) {
      regState.step++;
      renderRegister(root);
      return;
    }

    // Final submit
    const btn = document.getElementById('nextBtn');
    btn.disabled = true;
    btn.querySelector('.lbl').textContent = 'Creating account...';
    btn.querySelector('.spin').classList.remove('hidden');
    try {
      const res = await Api.register(regState.data);
      Api.setToken(res.token);
      Store.setSession(res.user);
      UI.toast('Account created — welcome, ' + res.user.firstName + '!');
      Router.go('dashboard');
    } catch (e) {
      btn.disabled = false;
      btn.querySelector('.lbl').textContent = 'Create Account';
      btn.querySelector('.spin').classList.add('hidden');
      showStepError(e.message || 'Registration failed.');
    }
  }

  window.AuthViews = { loginPage, registerPage };
})();
