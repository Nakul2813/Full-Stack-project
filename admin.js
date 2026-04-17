/* ── Admin Dashboard JS ────────────────────────────────────────────────────── */

const API = '';
let allInquiries = [];
let activeFilter = 'all';
let adminToken = '';

// ── Login ─────────────────────────────────────────────────────────────────────
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const pass = document.getElementById('loginPass').value;
  const errEl = document.getElementById('loginError');
  try {
    const res = await fetch(`${API}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pass })
    });
    const data = await res.json();
    if (data.success) {
      adminToken = data.token;
      sessionStorage.setItem('adminToken', adminToken);
      showDashboard();
    } else {
      errEl.textContent = data.message || 'Invalid password.';
    }
  } catch {
    errEl.textContent = 'Server error. Make sure the server is running.';
  }
});

function showDashboard() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('dashboard').style.display = 'flex';
  loadInquiries();
}

// Check for existing session
if (sessionStorage.getItem('adminToken')) {
  adminToken = sessionStorage.getItem('adminToken');
  showDashboard();
}

// ── Logout ────────────────────────────────────────────────────────────────────
document.getElementById('logoutBtn').addEventListener('click', () => {
  sessionStorage.removeItem('adminToken');
  adminToken = '';
  document.getElementById('dashboard').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('loginPass').value = '';
  document.getElementById('loginError').textContent = '';
});

// ── Tab Switching ─────────────────────────────────────────────────────────────
document.querySelectorAll('.sidebar-link[data-tab]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const tab = link.dataset.tab;
    document.querySelectorAll('.sidebar-link[data-tab]').forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById('tab-' + tab).classList.add('active');
    document.getElementById('dashTitle').textContent = tab === 'overview' ? 'Overview' : 'All Inquiries';
    document.getElementById('dashSubtitle').textContent = tab === 'overview' ? 'Welcome back, Admin' : `${allInquiries.length} total inquiries`;
  });
});

// ── Fetch Inquiries ───────────────────────────────────────────────────────────
async function loadInquiries() {
  try {
    const res = await fetch(`${API}/api/inquiries`, {
      headers: { 'Authorization': 'Bearer ' + adminToken }
    });
    const data = await res.json();
    if (data.success) {
      allInquiries = data.data;
      updateStats();
      renderRecentTable();
      renderInquiriesTable();
    }
  } catch (err) {
    console.error('Failed to load inquiries:', err);
  }
}

// ── Stats ─────────────────────────────────────────────────────────────────────
function updateStats() {
  document.getElementById('statTotal').textContent = allInquiries.length;
  document.getElementById('statNew').textContent = allInquiries.filter(i => i.status === 'new').length;
  document.getElementById('statContacted').textContent = allInquiries.filter(i => i.status === 'contacted').length;
  document.getElementById('statClosed').textContent = allInquiries.filter(i => i.status === 'closed').length;
}

// ── Recent Table (Overview) ───────────────────────────────────────────────────
function renderRecentTable() {
  const tbody = document.getElementById('recentBody');
  const recent = allInquiries.slice(0, 5);
  if (!recent.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No inquiries yet.</td></tr>';
    return;
  }
  tbody.innerHTML = recent.map(i => `
    <tr onclick="showDetail('${i._id}')">
      <td>${formatDate(i.createdAt)}</td>
      <td class="name-cell">${esc(i.name)}</td>
      <td class="phone-cell">${esc(i.phone)}</td>
      <td>${esc(i.service || '—')}</td>
      <td><span class="status-badge ${i.status}">${i.status}</span></td>
    </tr>`).join('');
}

// ── Full Inquiries Table ──────────────────────────────────────────────────────
function renderInquiriesTable() {
  const tbody = document.getElementById('inquiriesBody');
  const search = (document.getElementById('searchInput')?.value || '').toLowerCase();
  let filtered = allInquiries;
  if (activeFilter !== 'all') filtered = filtered.filter(i => i.status === activeFilter);
  if (search) filtered = filtered.filter(i =>
    i.name.toLowerCase().includes(search) ||
    i.phone.includes(search) ||
    (i.service || '').toLowerCase().includes(search) ||
    (i.email || '').toLowerCase().includes(search)
  );
  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No inquiries found.</td></tr>';
    document.getElementById('tableFooter').textContent = '';
    return;
  }
  tbody.innerHTML = filtered.map(i => `
    <tr>
      <td>${formatDate(i.createdAt)}</td>
      <td class="name-cell">${esc(i.name)}</td>
      <td class="phone-cell"><a href="tel:${i.phone}">${esc(i.phone)}</a></td>
      <td>${esc(i.email || '—')}</td>
      <td>${esc(i.service || '—')}</td>
      <td class="msg-cell" title="${esc(i.message)}">${esc(i.message)}</td>
      <td><span class="status-badge ${i.status}">${i.status}</span></td>
      <td>
        <div class="row-actions">
          <button class="row-btn view" onclick="event.stopPropagation(); showDetail('${i._id}')">View</button>
          <button class="row-btn status-btn" onclick="event.stopPropagation(); cycleStatus('${i._id}', '${i.status}')">${nextStatusLabel(i.status)}</button>
          <button class="row-btn delete" onclick="event.stopPropagation(); deleteInquiry('${i._id}')">Delete</button>
        </div>
      </td>
    </tr>`).join('');
  document.getElementById('tableFooter').textContent = `Showing ${filtered.length} of ${allInquiries.length} inquiries`;
}

// ── Search & Filter ───────────────────────────────────────────────────────────
document.getElementById('searchInput').addEventListener('input', renderInquiriesTable);
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    activeFilter = btn.dataset.filter;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b === btn));
    renderInquiriesTable();
  });
});

// ── Detail Modal ──────────────────────────────────────────────────────────────
const detailOverlay = document.getElementById('detailOverlay');
document.getElementById('detailClose').addEventListener('click', () => detailOverlay.classList.remove('open'));
detailOverlay.addEventListener('click', e => { if (e.target === detailOverlay) detailOverlay.classList.remove('open'); });

function showDetail(id) {
  const i = allInquiries.find(x => x._id === id);
  if (!i) return;
  document.getElementById('detailTitle').textContent = `Inquiry from ${i.name}`;
  document.getElementById('detailGrid').innerHTML = `
    <div class="detail-label">Name</div><div class="detail-value">${esc(i.name)}</div>
    <div class="detail-label">Phone</div><div class="detail-value"><a href="tel:${i.phone}">${esc(i.phone)}</a></div>
    <div class="detail-label">Email</div><div class="detail-value">${i.email ? `<a href="mailto:${i.email}">${esc(i.email)}</a>` : '—'}</div>
    <div class="detail-label">Service</div><div class="detail-value">${esc(i.service || '—')}</div>
    <div class="detail-label">Status</div><div class="detail-value"><span class="status-badge ${i.status}">${i.status}</span></div>
    <div class="detail-label">Submitted</div><div class="detail-value">${new Date(i.createdAt).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}</div>
  `;
  document.getElementById('detailMessage').textContent = i.message;
  document.getElementById('detailActions').innerHTML = `
    <button class="row-btn status-btn" onclick="cycleStatus('${i._id}', '${i.status}'); detailOverlay.classList.remove('open');">${nextStatusLabel(i.status)}</button>
    <button class="row-btn delete" onclick="deleteInquiry('${i._id}'); detailOverlay.classList.remove('open');">Delete</button>
    <a href="tel:${i.phone}" class="row-btn view">📞 Call</a>
    ${i.email ? `<a href="mailto:${i.email}" class="row-btn view">✉️ Email</a>` : ''}
  `;
  detailOverlay.classList.add('open');
}

// ── Status Cycling ────────────────────────────────────────────────────────────
function nextStatus(current) {
  if (current === 'new') return 'contacted';
  if (current === 'contacted') return 'closed';
  return 'new';
}
function nextStatusLabel(current) {
  if (current === 'new') return '→ Contacted';
  if (current === 'contacted') return '→ Closed';
  return '→ Reopen';
}

async function cycleStatus(id, current) {
  const newStatus = nextStatus(current);
  try {
    const res = await fetch(`${API}/api/admin/inquiries/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + adminToken },
      body: JSON.stringify({ status: newStatus })
    });
    const data = await res.json();
    if (data.success) {
      const idx = allInquiries.findIndex(i => i._id === id);
      if (idx !== -1) allInquiries[idx].status = newStatus;
      updateStats();
      renderRecentTable();
      renderInquiriesTable();
    }
  } catch (err) {
    console.error('Failed to update status:', err);
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────
async function deleteInquiry(id) {
  if (!confirm('Are you sure you want to delete this inquiry? This cannot be undone.')) return;
  try {
    const res = await fetch(`${API}/api/admin/inquiries/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + adminToken }
    });
    const data = await res.json();
    if (data.success) {
      allInquiries = allInquiries.filter(i => i._id !== id);
      updateStats();
      renderRecentTable();
      renderInquiriesTable();
    }
  } catch (err) {
    console.error('Failed to delete:', err);
  }
}

// ── Export CSV ─────────────────────────────────────────────────────────────────
document.getElementById('exportBtn').addEventListener('click', () => {
  if (!allInquiries.length) return alert('No inquiries to export.');
  const headers = ['Date', 'Name', 'Phone', 'Email', 'Service', 'Message', 'Status'];
  const rows = allInquiries.map(i => [
    formatDate(i.createdAt), i.name, i.phone, i.email || '', i.service || '', `"${i.message.replace(/"/g, '""')}"`, i.status
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `rb-constructions-inquiries-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
});

// ── Refresh ───────────────────────────────────────────────────────────────────
document.getElementById('refreshBtn').addEventListener('click', loadInquiries);

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function esc(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
