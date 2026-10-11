// app.js — talks to our Express API and renders the console.

const state = { users: [], roles: [], authorizations: [], sodRules: [], violations: [], audit: [], userRoles: [] };

// ---- Navigation ----
document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    btn.classList.add('active');
    document.getElementById('view-' + btn.dataset.view).classList.remove('hidden');
  });
});

// ---- Data loading ----
async function api(path, options) {
  const res = await fetch('/api' + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (res.status === 401) {
    window.location.href = '/login.html';
    return new Promise(() => {});
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || 'Request failed');
  return body;
}

async function loadSession() {
  try {
    const me = await api('/auth/me');
    document.getElementById('session-user').textContent = `${me.username} · ${me.role}`;
  } catch (err) { }
}
document.getElementById('logout-btn').addEventListener('click', async () => {
  await api('/auth/logout', { method: 'POST' });
  window.location.href = '/login.html';
});

async function loadAll() {
  const [users, roles, authorizations, sodRules, violations, audit, userRoles] = await Promise.all([
    api('/users'), api('/roles'), api('/authorizations'),
    api('/sod/rules'), api('/sod/violations'), api('/audit'), api('/users/role-map')
  ]);
  Object.assign(state, { users, roles, authorizations, sodRules, violations, audit, userRoles });
  renderAll();
}

function renderAll() {
  renderDashboard();
  renderUsers();
  renderRoles();
  renderAuths();
  renderSod();
  renderAudit();
  document.getElementById('scan-status').innerHTML =
    `<div class="scan-dot"></div><span>Live · last scan just now</span>`;
}

// ---- Dashboard ----
function renderDashboard() {
  document.getElementById('stat-users').textContent = state.users.length;
  document.getElementById('stat-roles').textContent = state.roles.length;
  document.getElementById('stat-rules').textContent = state.sodRules.length;
  document.getElementById('stat-violations').textContent = state.violations.length;
  document.getElementById('dash-violations').innerHTML = violationCards(state.violations);
}

function violationCards(violations) {
  if (!violations.length) return `<div class="empty-state">No SoD conflicts detected across current users and roles.</div>`;
  return violations.map(v => `
    <div class="violation-card">
      <span class="badge ${v.riskLevel.toLowerCase()}">${v.riskLevel}</span>
      <span class="who">${v.username}</span>
      <span class="clash"><b>${v.auth1}</b> + <b>${v.auth2}</b></span>
      <span class="desc">${v.description || ''}</span>
    </div>
  `).join('');
}

// ---- Users ----
function renderUsers() {
  const rows = state.users.map(u => {
    const assigned = state.roles.filter(r => hasRole(u.id, r.id));
    const roleChips = assigned.map(r => `
      <span class="badge ${r.type}">${r.name}
        <button class="link-btn" style="margin-left:4px;color:inherit" onclick="removeRole(${u.id},${r.id})">×</button>
      </span>`).join(' ');
    const assignableRoles = state.roles.filter(r => !hasRole(u.id, r.id));
    const roleSelect = assignableRoles.length ? `
      <select onchange="if(this.value) assignRole(${u.id}, parseInt(this.value))">
        <option value="">+ assign role</option>
        ${assignableRoles.map(r => `<option value="${r.id}">${r.name}</option>`).join('')}
      </select>` : '';
    return `<tr>
      <td class="mono">${u.username}</td>
      <td>${u.fullName}</td>
      <td class="muted">${u.department}</td>
      <td class="muted">${u.userType}</td>
      <td>${roleChips || '<span class="muted">—</span>'} ${roleSelect}</td>
      <td><button class="link-btn" onclick="deleteUser(${u.id})">Remove</button></td>
    </tr>`;
  }).join('');
  document.getElementById('table-users').innerHTML = `
    <tr><th>Username</th><th>Full name</th><th>Dept</th><th>Type</th><th>Roles</th><th></th></tr>
    ${rows}`;
}

function hasRole(userId, roleId) {
  return state.userRoles.some(ur => ur.userId === userId && ur.roleId === roleId);
}

document.getElementById('form-user').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  try {
    await api('/users', { method: 'POST', body: JSON.stringify(Object.fromEntries(fd)) });
    e.target.reset();
    await loadAll();
  } catch (err) { alert(err.message); }
});

async function deleteUser(id) {
  if (!confirm('Remove this user? (Leaver process)')) return;
  await api('/users/' + id, { method: 'DELETE' });
  await loadAll();
}

async function assignRole(userId, roleId) {
  try {
    await api(`/users/${userId}/roles`, { method: 'POST', body: JSON.stringify({ roleId }) });
    await loadAll();
  } catch (err) { alert(err.message); }
}

async function removeRole(userId, roleId) {
  await api(`/users/${userId}/roles/${roleId}`, { method: 'DELETE' });
  await loadAll();
}

// ---- Roles ----
document.getElementById('role-type-select').addEventListener('change', renderRoleExtraField);
function renderRoleExtraField() {
  const type = document.getElementById('role-type-select').value;
  const el = document.getElementById('role-extra-field');
  if (type === 'single') {
    el.innerHTML = `
      <select name="authIds" multiple size="1" style="min-width:180px">
        ${state.authorizations.map(a => `<option value="${a.id}">${a.code}</option>`).join('')}
      </select>`;
  } else {
    const singles = state.roles.filter(r => r.type === 'single');
    el.innerHTML = `
      <select name="childRoleIds" multiple size="1" style="min-width:180px">
        ${singles.map(r => `<option value="${r.id}">${r.name}</option>`).join('')}
      </select>`;
  }
}

function renderRoles() {
  renderRoleExtraField();
  const rows = state.roles.map(r => {
    const detail = r.type === 'single'
      ? (r.authIds || []).map(id => state.authorizations.find(a => a.id === id)?.code).filter(Boolean).join(', ')
      : (r.childRoleIds || []).map(id => state.roles.find(x => x.id === id)?.name).filter(Boolean).join(', ');
    return `<tr>
      <td class="mono">${r.name}</td>
      <td><span class="badge ${r.type}">${r.type}</span></td>
      <td class="muted">${r.description}</td>
      <td class="mono muted">${detail || '—'}</td>
    </tr>`;
  }).join('');
  document.getElementById('table-roles').innerHTML = `
    <tr><th>Role</th><th>Type</th><th>Description</th><th>Contains</th></tr>
    ${rows}`;
}

document.getElementById('form-role').addEventListener('submit', async (e) => {
  e.preventDefault();
  const type = document.getElementById('role-type-select').value;
  const fd = new FormData(e.target);
  const payload = {
    name: fd.get('name'), type, description: fd.get('description')
  };
  const extraSelect = document.querySelector(type === 'single' ? '[name=authIds]' : '[name=childRoleIds]');
  const selected = extraSelect ? Array.from(extraSelect.selectedOptions).map(o => parseInt(o.value)) : [];
  if (type === 'single') payload.authIds = selected; else payload.childRoleIds = selected;

  try {
    await api('/roles', { method: 'POST', body: JSON.stringify(payload) });
    e.target.reset();
    await loadAll();
  } catch (err) { alert(err.message); }
});

// ---- Authorizations ----
function renderAuths() {
  const rows = state.authorizations.map(a => `
    <tr><td class="mono">${a.code}</td><td class="muted">${a.description}</td></tr>
  `).join('');
  document.getElementById('table-auths').innerHTML = `<tr><th>Code</th><th>Description</th></tr>${rows}`;

  const opts = state.authorizations.map(a => `<option value="${a.id}">${a.code}</option>`).join('');
  document.getElementById('sod-auth-1').innerHTML = opts;
  document.getElementById('sod-auth-2').innerHTML = opts;
}

document.getElementById('form-auth').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  await api('/authorizations', { method: 'POST', body: JSON.stringify(Object.fromEntries(fd)) });
  e.target.reset();
  await loadAll();
});

// ---- SoD ----
function renderSod() {
  const ruleRows = state.sodRules.map(r => {
    const a1 = state.authorizations.find(a => a.id === r.authId1)?.code || '?';
    const a2 = state.authorizations.find(a => a.id === r.authId2)?.code || '?';
    return `<tr>
      <td class="mono"><b>${a1}</b> ↔ <b>${a2}</b></td>
      <td><span class="badge ${r.riskLevel.toLowerCase()}">${r.riskLevel}</span></td>
      <td class="muted">${r.description}</td>
    </tr>`;
  }).join('');
  document.getElementById('table-sod-rules').innerHTML =
    `<tr><th>Conflicting pair</th><th>Risk</th><th>Rationale</th></tr>${ruleRows}`;
  document.getElementById('sod-violations').innerHTML = violationCards(state.violations);
}

document.getElementById('form-sod-rule').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const payload = {
    authId1: parseInt(fd.get('authId1')),
    authId2: parseInt(fd.get('authId2')),
    riskLevel: fd.get('riskLevel'),
    description: fd.get('description')
  };
  try {
    await api('/sod/rules', { method: 'POST', body: JSON.stringify(payload) });
    e.target.reset();
    await loadAll();
  } catch (err) { alert(err.message); }
});

// ---- Audit ----
function renderAudit() {
  const rows = state.audit.map(a => `
    <tr>
      <td class="mono muted">${new Date(a.timestamp).toLocaleString()}</td>
      <td class="mono">${a.action}</td>
      <td>${a.details}</td>
      <td class="mono muted">${a.performedBy || '—'}</td>
    </tr>`).join('');
  document.getElementById('table-audit').innerHTML =
    `<tr><th>Timestamp</th><th>Action</th><th>Details</th><th>Performed By</th></tr>${rows || '<tr><td class="muted" colspan="4">No events yet.</td></tr>'}`;
}

loadSession();
loadAll();