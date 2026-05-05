// User Management — Admin only
(function() {
  window.Views = window.Views || {};

  Views.users = async function(page) {
    if (!Store.isAdmin()) {
      page.innerHTML = `
        <div class="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center max-w-md mx-auto">
          <h2 class="text-base font-semibold text-rose-800 mb-1">Access Restricted</h2>
          <p class="text-sm text-rose-700">User management is only accessible to Admins.</p>
        </div>
      `;
      return;
    }
    await render(page);
  };

  async function render(page) {
    page.innerHTML = `
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div class="text-[10px] font-bold tracking-widest text-ink-500 mb-1">ADMINISTRATION</div>
          <h1 class="text-2xl font-bold tracking-tight text-ink-900">User Management</h1>
          <p class="text-sm text-ink-500 mt-1">Manage user accounts, roles, and access permissions.</p>
        </div>
        <button id="addBtn" class="self-start inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-lg bg-ink-900 text-white hover:bg-ink-800 transition shadow-soft">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
          New User
        </button>
      </div>
      <div id="u-body" class="mt-5">${UI.skeletonCard(4)}</div>
    `;

    document.getElementById('addBtn').onclick = () => openForm(null, page);
    const items = await Api.list('users');
    document.getElementById('u-body').innerHTML = renderTable(items);
    wire(items, page);
  }

  function renderTable(items) {
    if (!items.length) {
      return `<div class="bg-white rounded-2xl shadow-soft ring-1 ring-ink-100">${UI.emptyState({ title: 'No users yet' })}</div>`;
    }
    return `
      <div class="bg-white rounded-2xl shadow-soft ring-1 ring-ink-100 overflow-hidden">
        <div class="overflow-x-auto scrollbar-thin">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-ink-50/80 border-b border-ink-100">
                <th class="text-left font-semibold text-[11px] uppercase tracking-wider text-ink-500 px-4 py-3">Name</th>
                <th class="text-left font-semibold text-[11px] uppercase tracking-wider text-ink-500 px-4 py-3">Email</th>
                <th class="text-left font-semibold text-[11px] uppercase tracking-wider text-ink-500 px-4 py-3">Role</th>
                <th class="text-left font-semibold text-[11px] uppercase tracking-wider text-ink-500 px-4 py-3">School / Office</th>
                <th class="text-left font-semibold text-[11px] uppercase tracking-wider text-ink-500 px-4 py-3">Status</th>
                <th class="text-right font-semibold text-[11px] uppercase tracking-wider text-ink-500 px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-ink-100">
              ${items.map(u => {
                const isMe = Store.getSession().id === u.id;
                return `
                  <tr class="hover:bg-ink-50/60 transition">
                    <td class="px-4 py-3">
                      <div class="flex items-center gap-2.5">
                        <div class="w-7 h-7 rounded-full bg-gradient-to-br from-ink-700 to-ink-900 text-deped-yellow flex items-center justify-center text-[10px] font-bold">${u.name.split(' ').map(w => w[0] || '').join('').slice(0,2).toUpperCase()}</div>
                        <div>
                          <div class="font-medium text-ink-800">${UI.esc(u.name)}${isMe ? ' <span class="text-[10px] text-ink-400 ml-1">(you)</span>' : ''}</div>
                        </div>
                      </div>
                    </td>
                    <td class="px-4 py-3 text-ink-600 font-mono text-xs">${UI.esc(u.email)}</td>
                    <td class="px-4 py-3">${UI.badge(u.role, u.role === 'Admin' ? 'red' : u.role === 'Editor' ? 'blue' : 'gray')}</td>
                    <td class="px-4 py-3 text-ink-600">${UI.esc(u.school)}</td>
                    <td class="px-4 py-3">${UI.statusBadge(u.status)}</td>
                    <td class="px-4 py-3 text-right whitespace-nowrap">
                      <button data-action="edit" data-id="${u.id}" class="action-btn px-2.5 py-1 rounded-md text-[11px] font-semibold text-ink-700 hover:bg-ink-100 transition">Edit</button>
                      ${!isMe ? `<button data-action="delete" data-id="${u.id}" class="action-btn px-2.5 py-1 rounded-md text-[11px] font-semibold text-rose-600 hover:bg-rose-50 transition">Delete</button>` : ''}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function wire(items, page) {
    document.querySelectorAll('.action-btn').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        const action = btn.dataset.action;
        const rec = items.find(r => r.id === id);
        if (!rec) return;
        if (action === 'edit') openForm(rec, page);
        else if (action === 'delete') {
          UI.confirmDialog('Delete this user permanently?', async () => {
            await Api.remove('users', id);
            UI.toast('User deleted.', 'warning');
            render(page);
          }, { danger: true, confirmLabel: 'Delete' });
        }
      };
    });
  }

  function openForm(rec, page) {
    const isEdit = !!rec;
    const body = `
      <div class="space-y-5">
        ${UI.fieldGroup('Account Details',
          UI.row2(
            UI.field('Full Name', UI.input('uf_name', { value: rec ? rec.name : '' }), null, true),
            UI.field('Role', UI.select('uf_role', ['Admin', 'Editor', 'Viewer'], rec ? rec.role : 'Viewer'), null, true)
          ) +
          UI.field('Email Address', UI.input('uf_email', { type: 'email', value: rec ? rec.email : '' }), null, true) +
          UI.field('School / Office', UI.input('uf_school', { value: rec ? rec.school : '' }), null, true)
        )}
        ${UI.fieldGroup('Security',
          UI.field(
            isEdit ? 'New Password' : 'Password',
            UI.input('uf_pw', { type: 'password', placeholder: isEdit ? 'Leave blank to keep current' : 'Min. 8 characters' }),
            isEdit ? 'Leave blank to keep current password' : 'Minimum 8 characters',
            !isEdit
          ) +
          UI.field('Status', UI.select('uf_status', ['Active', 'Inactive'], rec ? rec.status : 'Active'))
        )}
      </div>
    `;
    UI.modal({
      title: isEdit ? 'Edit User' : 'New User',
      size: 'md',
      body,
      footer: (foot, close) => {
        foot.appendChild(UI.btn('Cancel', { tone: 'secondary', onClick: close }));
        const save = UI.btn(isEdit ? 'Save Changes' : 'Create User', {
          tone: 'primary',
          onClick: async () => {
            const data = {
              name: UI.val('uf_name').trim(),
              email: UI.val('uf_email').trim(),
              school: UI.val('uf_school').trim(),
              role: UI.val('uf_role'),
              status: UI.val('uf_status')
            };
            const pw = UI.val('uf_pw');
            if (!data.name || !data.email || !data.school) { UI.toast('Name, email, and school are required.', 'error'); return; }
            if (!isEdit && pw.length < 8) { UI.toast('Password must be at least 8 characters.', 'error'); return; }
            if (pw && pw.length >= 8) data.password = pw;
            try {
              if (isEdit) await Api.update('users', rec.id, data);
              else { data.password = pw; await Api.create('users', data); }
              UI.toast(isEdit ? 'User updated.' : 'User created.');
              close();
              render(page);
            } catch (e) { UI.toast(e.message, 'error'); }
          }
        });
        foot.appendChild(save);
      }
    });
  }
})();
