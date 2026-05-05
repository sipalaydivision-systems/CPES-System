// CPES API client — talks to /api/* endpoints
(function() {
  const BASE = '/api';

  function getToken() { return localStorage.getItem('cpes_token'); }
  function setToken(t) { if (t) localStorage.setItem('cpes_token', t); else localStorage.removeItem('cpes_token'); }

  async function request(method, path, body, extra) {
    const headers = { 'Accept': 'application/json' };
    const tok = getToken();
    if (tok) headers['Authorization'] = 'Bearer ' + tok;

    const opts = { method, headers };
    if (body instanceof FormData) {
      opts.body = body;
    } else if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    if (extra) Object.assign(opts, extra);

    const res = await fetch(BASE + path, opts);
    if (res.status === 204) return null;

    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      if (!res.ok) throw new ApiError(res.status, 'Request failed', null);
      return res;
    }
    const data = await res.json();
    if (!res.ok) {
      const err = data.error || { code: 'UNKNOWN', message: 'Request failed.' };
      throw new ApiError(res.status, err.message, err.code);
    }
    return data;
  }

  class ApiError extends Error {
    constructor(status, message, code) {
      super(message);
      this.status = status;
      this.code = code;
    }
  }

  const Api = {
    ApiError,
    getToken, setToken,

    // auth
    login: (email, password) => request('POST', '/auth/login', { email, password }),
    register: (data) => request('POST', '/auth/register', data),
    me: () => request('GET', '/auth/me'),

    // generic CRUD
    list: (resource) => request('GET', '/' + resource),
    get: (resource, id) => request('GET', `/${resource}/${id}`),
    create: (resource, body) => request('POST', '/' + resource, body),
    update: (resource, id, body) => request('PATCH', `/${resource}/${id}`, body),
    remove: (resource, id) => request('DELETE', `/${resource}/${id}`),

    // aggregations
    transmittalsByPeriod: () => request('GET', '/transmittals/aggregate/by-period'),
    transmittalsByCluster: (params) => {
      const q = new URLSearchParams(params || {}).toString();
      return request('GET', '/transmittals/aggregate/by-cluster' + (q ? '?' + q : ''));
    },

    // files
    uploadFile: async (file) => {
      const fd = new FormData();
      fd.append('file', file);
      return request('POST', '/files', fd);
    },
    fileMeta: (id) => request('GET', `/files/${id}/meta`),
    fileUrl: (id) => `${BASE}/files/${id}`,
    fileAuthDownload: async (id, filename) => {
      const headers = {};
      const tok = getToken();
      if (tok) headers['Authorization'] = 'Bearer ' + tok;
      const res = await fetch(`${BASE}/files/${id}`, { headers });
      if (!res.ok) throw new ApiError(res.status, 'Download failed.');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename || 'download';
      document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 100);
    }
  };

  window.Api = Api;
})();
