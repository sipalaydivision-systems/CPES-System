// Router + boot
(function() {
  const Router = {
    routes: {},
    current: null,
    register(name, fn) { this.routes[name] = fn; },
    async go(name, params) {
      const fn = this.routes[name];
      if (!fn) { console.error('No route:', name); return; }
      this.current = name;

      const isAuthRoute = name === 'login' || name === 'register';
      const root = document.getElementById('root');
      const page = document.getElementById('page');

      if (isAuthRoute) {
        try { await fn(root, params || {}); }
        catch (e) { console.error(e); UI.toast(e.message || 'Failed to load page.', 'error'); }
        return;
      }

      // Protected route — ensure shell is rendered
      if (!Store.getSession()) { return Router.go('login'); }
      if (!page) Shell.render();
      Shell.setActive(name);
      const target = document.getElementById('page');
      target.innerHTML = '';
      target.classList.remove('animate-fade-in');
      void target.offsetWidth;  // restart animation
      target.classList.add('animate-fade-in');

      try { await fn(target, params || {}); }
      catch (e) {
        console.error(e);
        if (e instanceof Api.ApiError && e.status === 401) {
          Store.clearSession();
          Router.go('login');
          UI.toast('Session expired. Please sign in again.', 'warning');
        } else {
          UI.toast(e.message || 'Failed to load page.', 'error');
        }
      }
    }
  };

  // Register routes
  Router.register('login', AuthViews.loginPage);
  Router.register('register', AuthViews.registerPage);
  Router.register('dashboard', Views.dashboard);
  Router.register('transmittals', Views.transmittals);
  Router.register('research', Views.research);
  Router.register('donations', Views.donations);
  Router.register('etmrs', Views.etmrs);
  Router.register('certifications', Views.certifications);
  Router.register('agreements', Views.agreements);
  Router.register('users', Views.users);

  window.Router = Router;

  // ----- BOOT -----
  (async function boot() {
    const tok = Api.getToken();
    if (!tok) { Router.go('login'); return; }
    try {
      const me = await Api.me();
      Store.setSession(me);
      Shell.render();
      Router.go('dashboard');
    } catch (e) {
      Store.clearSession();
      Router.go('login');
    }
  })();
})();
