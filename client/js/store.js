// Lightweight in-memory cache + auth session helpers
(function() {
  let session = null;

  function displayName(u) {
    if (!u) return '';
    const mid = u.middleName ? u.middleName.trim()[0] + '.' : '';
    const sfx = u.suffix ? ', ' + u.suffix.trim() : '';
    return [u.firstName, mid, u.lastName].filter(Boolean).join(' ') + sfx;
  }

  function fullName(u) {
    if (!u) return '';
    const sfx = u.suffix ? ', ' + u.suffix.trim() : '';
    return [u.firstName, u.middleName, u.lastName].filter(Boolean).join(' ') + sfx;
  }

  function initials(u) {
    if (!u) return '??';
    const a = (u.firstName || '?')[0] || '?';
    const b = (u.lastName || '?')[0] || '?';
    return (a + b).toUpperCase();
  }

  const Store = {
    setSession(s) { session = s; },
    getSession() { return session; },
    clearSession() { session = null; Api.setToken(null); },

    isDivision() { return session && session.registrationType === 'Division'; },
    isSchool() { return session && session.registrationType === 'School'; },

    // Compatibility shims for existing views written under the old role system.
    // Now: anyone authenticated can edit/delete their own records (within scope).
    canEdit() { return !!session; },
    canDelete() { return !!session; },
    isAdmin() { return this.isDivision(); },

    displayName, fullName, initials,
    sessionDisplayName() { return displayName(session); },
    sessionInitials() { return initials(session); }
  };

  window.Store = Store;
})();
