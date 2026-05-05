// Login + Register screens
(function() {

  function renderAuthShell(content) {
    return `
      <div class="min-h-screen relative overflow-hidden bg-gradient-to-br from-ink-50 via-white to-stone-100 texture-grain">
        <!-- Decorative blobs -->
        <div class="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-deped-yellow/10 blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-32 -left-32 w-[28rem] h-[28rem] rounded-full bg-deped-blue/10 blur-3xl pointer-events-none"></div>

        <div class="relative grid lg:grid-cols-2 min-h-screen">
          <!-- Brand panel -->
          <div class="hidden lg:flex flex-col justify-between p-12 bg-ink-900 text-white relative overflow-hidden">
            <div class="absolute inset-0 opacity-10" style="background-image: radial-gradient(circle at 20% 30%, rgba(245,166,35,0.4) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(0,56,147,0.4) 0%, transparent 40%);"></div>
            <div class="relative z-10">
              <div class="flex items-center gap-3 mb-12">
                <div class="w-11 h-11 rounded-xl bg-deped-yellow flex items-center justify-center font-black text-deped-blue text-sm tracking-tight">SW</div>
                <div>
                  <div class="font-semibold text-sm">SMART WINGS</div>
                  <div class="text-xs text-ink-400">SDO Sipalay City</div>
                </div>
              </div>
              <div class="max-w-md">
                <h2 class="text-3xl font-bold leading-tight tracking-tight mb-4">Contextualized Partnership Engagement System</h2>
                <p class="text-ink-300 text-sm leading-relaxed">A unified platform for managing, monitoring, and reporting on partnership engagements across schools in the Schools Division Office of Sipalay City.</p>
              </div>
            </div>
            <div class="relative z-10 grid grid-cols-3 gap-4 max-w-md text-xs">
              <div class="space-y-1">
                <div class="text-deped-yellow font-bold text-2xl">6</div>
                <div class="text-ink-400">Functional Areas</div>
              </div>
              <div class="space-y-1">
                <div class="text-deped-yellow font-bold text-2xl">10</div>
                <div class="text-ink-400">School Clusters</div>
              </div>
              <div class="space-y-1">
                <div class="text-deped-yellow font-bold text-2xl">CY26</div>
                <div class="text-ink-400">Current Cycle</div>
              </div>
            </div>
          </div>

          <!-- Form panel -->
          <div class="flex items-center justify-center p-6 sm:p-12">
            <div class="w-full max-w-md animate-fade-in-up">
              ${content}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async function loginPage(root) {
    root.innerHTML = renderAuthShell(`
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

        <div id="lError" class="hidden px-3.5 py-2.5 text-sm rounded-lg bg-rose-50 text-rose-700 ring-1 ring-rose-200"></div>

        <button id="lSubmit" type="submit"
          class="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-ink-900 text-white hover:bg-ink-800 transition shadow-soft-md disabled:opacity-60">
          <span class="lbl">Sign In</span>
          <span class="spin hidden">
            <svg class="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
          </span>
        </button>
      </form>

      <div class="mt-6 pt-5 border-t border-ink-100 text-center text-sm text-ink-500">
        Need an account?
        <a href="#" id="goRegister" class="font-semibold text-ink-900 hover:text-deped-blue transition ml-1">Register</a>
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
        UI.toast('Welcome back, ' + res.user.name + '!');
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

  async function registerPage(root) {
    root.innerHTML = renderAuthShell(`
      <div class="space-y-1.5 mb-7">
        <h1 class="text-2xl font-bold tracking-tight text-ink-900">Create your account</h1>
        <p class="text-sm text-ink-500">Access is reserved for DepEd personnel.</p>
      </div>

      <form id="rForm" class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <label class="block text-xs font-semibold text-ink-700">Full Name</label>
            <input id="rName" required class="w-full px-3.5 py-2.5 text-sm bg-white border border-ink-200 rounded-xl transition placeholder:text-ink-300" placeholder="Juan Dela Cruz">
          </div>
          <div class="space-y-1.5">
            <label class="block text-xs font-semibold text-ink-700">Role</label>
            <select id="rRole" class="w-full px-3.5 py-2.5 text-sm bg-white border border-ink-200 rounded-xl transition cursor-pointer">
              <option value="Viewer">Viewer</option>
              <option value="Editor">Editor</option>
            </select>
          </div>
        </div>

        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-ink-700">DepEd Email</label>
          <input id="rEmail" type="email" required class="w-full px-3.5 py-2.5 text-sm bg-white border border-ink-200 rounded-xl transition placeholder:text-ink-300" placeholder="yourname@deped.gov.ph">
        </div>

        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-ink-700">School / Office</label>
          <input id="rSchool" required class="w-full px-3.5 py-2.5 text-sm bg-white border border-ink-200 rounded-xl transition placeholder:text-ink-300" placeholder="e.g. Sipalay City NHS">
        </div>

        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-ink-700">Password</label>
          <input id="rPassword" type="password" required class="w-full px-3.5 py-2.5 text-sm bg-white border border-ink-200 rounded-xl transition placeholder:text-ink-300" placeholder="Minimum 8 characters">
        </div>

        <div id="rError" class="hidden px-3.5 py-2.5 text-sm rounded-lg bg-rose-50 text-rose-700 ring-1 ring-rose-200"></div>

        <button id="rSubmit" type="submit" class="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-ink-900 text-white hover:bg-ink-800 transition shadow-soft-md disabled:opacity-60">
          <span class="lbl">Create Account</span>
          <span class="spin hidden">
            <svg class="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          </span>
        </button>
      </form>

      <div class="mt-6 pt-5 border-t border-ink-100 text-center text-sm text-ink-500">
        Already have an account?
        <a href="#" id="goLogin" class="font-semibold text-ink-900 hover:text-deped-blue transition ml-1">Sign in</a>
      </div>
    `);

    document.getElementById('rForm').onsubmit = async (e) => {
      e.preventDefault();
      const btn = document.getElementById('rSubmit');
      const err = document.getElementById('rError');
      err.classList.add('hidden');
      btn.disabled = true;
      btn.querySelector('.lbl').textContent = 'Creating...';
      btn.querySelector('.spin').classList.remove('hidden');
      try {
        const res = await Api.register({
          name: document.getElementById('rName').value.trim(),
          email: document.getElementById('rEmail').value.trim(),
          school: document.getElementById('rSchool').value.trim(),
          password: document.getElementById('rPassword').value,
          role: document.getElementById('rRole').value
        });
        Api.setToken(res.token);
        Store.setSession(res.user);
        UI.toast('Account created — welcome!');
        Router.go('dashboard');
      } catch (e) {
        err.textContent = e.message || 'Registration failed.';
        err.classList.remove('hidden');
        btn.disabled = false;
        btn.querySelector('.lbl').textContent = 'Create Account';
        btn.querySelector('.spin').classList.add('hidden');
      }
    };

    document.getElementById('goLogin').onclick = (e) => { e.preventDefault(); Router.go('login'); };
  }

  window.AuthViews = { loginPage, registerPage };
})();
