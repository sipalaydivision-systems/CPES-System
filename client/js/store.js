// Lightweight in-memory cache + auth session helper
(function() {
  let session = null;

  const Store = {
    setSession(s) { session = s; },
    getSession() { return session; },
    clearSession() { session = null; Api.setToken(null); },
    isAdmin() { return session && session.role === 'Admin'; },
    canEdit() { return session && (session.role === 'Admin' || session.role === 'Editor'); },
    canDelete() { return session && session.role === 'Admin'; }
  };

  window.Store = Store;
})();
