/* ── R B Constructions – Main JS ─────────────────────────────────────────────── */

const API = '';

// ── Nav scroll behavior ──────────────────────────────────────────────────────
const header = document.getElementById('header');
const scrollTop = document.getElementById('scrollTop');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 40);
  scrollTop.classList.toggle('visible', window.scrollY > 400);
  updateActiveNav();
});
scrollTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// ── Active nav link ──────────────────────────────────────────────────────────
function updateActiveNav() {
  const sections = ['home','services','vehicles','inventory','about','contact'];
  let current = 'home';
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el && window.scrollY >= el.offsetTop - 120) current = id;
  });
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === '#' + current);
  });
}

// ── Hamburger menu ───────────────────────────────────────────────────────────
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
navLinks.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => navLinks.classList.remove('open'));
});

// ── Counter animation ────────────────────────────────────────────────────────
function animateCounters() {
  document.querySelectorAll('.stat-num[data-target]').forEach(el => {
    const target = parseInt(el.dataset.target);
    const duration = 1800;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

// ── Reveal on scroll ─────────────────────────────────────────────────────────
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); revealObserver.unobserve(e.target); } });
}, { threshold: 0.1 });

function setupReveal() {
  document.querySelectorAll('.service-card, .vehicle-card, .about-content, .about-visual, .contact-card, .contact-form-wrap, .pillar').forEach((el, i) => {
    el.classList.add('reveal');
    el.style.transitionDelay = (i % 3) * 0.1 + 's';
    revealObserver.observe(el);
  });
}

// ── Hero counter trigger ─────────────────────────────────────────────────────
const heroObserver = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting) { animateCounters(); heroObserver.disconnect(); }
}, { threshold: 0.5 });
const heroSection = document.getElementById('home');
if (heroSection) heroObserver.observe(heroSection);

// ── Vehicle icons ────────────────────────────────────────────────────────────
const vehicleEmoji = { mixer: '🚛', bulker: '🚚', excavator: '🏗️' };

// ── Fetch & render vehicles ──────────────────────────────────────────────────
async function loadVehicles() {
  const grid = document.getElementById('vehiclesGrid');
  try {
    const res = await fetch(`${API}/api/vehicles`);
    const { data } = await res.json();
    grid.innerHTML = data.map(v => `
      <div class="vehicle-card reveal">
        <div class="vehicle-header">
          <div class="vehicle-icon-wrap">${vehicleEmoji[v.icon] || '🚧'}</div>
          <div class="vehicle-category">${v.category}</div>
          <div class="vehicle-name">${v.name}</div>
        </div>
        <div class="vehicle-body">
          <p class="vehicle-desc">${v.description}</p>
          <div class="vehicle-rate">
            <div class="rate-label">Rental Rate</div>
            <span class="rate-value">₹${v.rate.toLocaleString('en-IN')}</span>
            <span class="rate-unit"> / ${v.unit}</span>
          </div>
          <div class="vehicle-capacity">📦 Capacity: ${v.capacity}</div>
          <div class="vehicle-specs">${v.specs.map(s => `<div class="spec-item">${s}</div>`).join('')}</div>
          <div class="vehicle-avail"><div class="avail-dot"></div>Available Now</div>
          <button class="btn-primary" style="width:100%" onclick="openVehicleModal(${JSON.stringify(v).replace(/"/g,'&quot;')})">
            Request Booking ↗
          </button>
        </div>
      </div>`).join('');
    grid.querySelectorAll('.reveal').forEach((el, i) => {
      el.style.transitionDelay = i * 0.12 + 's';
      revealObserver.observe(el);
    });
  } catch (e) {
    grid.innerHTML = '<p style="color:var(--text-muted);text-align:center;grid-column:1/-1;padding:48px">Unable to load fleet. Please contact us directly.</p>';
  }
}

// ── Fetch & render inventory ─────────────────────────────────────────────────
let allInventory = [];
let activeCategory = 'All';

async function loadInventory() {
  try {
    const res = await fetch(`${API}/api/inventory`);
    const { data, categories } = await res.json();
    allInventory = data;
    renderCategories(categories);
    renderInventory(data);
  } catch (e) {
    document.getElementById('inventoryBody').innerHTML = '<tr><td colspan="7" style="text-align:center;padding:32px;color:#999">Unable to load inventory. Please contact us directly.</td></tr>';
  }
}

function renderCategories(categories) {
  const container = document.getElementById('categoryFilters');
  container.innerHTML = categories.map(c =>
    `<button class="cat-btn ${c === 'All' ? 'active' : ''}" data-cat="${c}">${c}</button>`
  ).join('');
  container.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeCategory = btn.dataset.cat;
      container.querySelectorAll('.cat-btn').forEach(b => b.classList.toggle('active', b === btn));
      filterInventory();
    });
  });
}

function filterInventory() {
  const search = document.getElementById('inventorySearch').value.toLowerCase();
  const filtered = allInventory.filter(item => {
    const matchCat = activeCategory === 'All' || item.category === activeCategory;
    const matchSearch = !search || item.name.toLowerCase().includes(search) || item.sku.toLowerCase().includes(search);
    return matchCat && matchSearch;
  });
  renderInventory(filtered);
}

function renderInventory(items) {
  const tbody = document.getElementById('inventoryBody');
  const footer = document.getElementById('inventoryFooter');
  if (!items.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:32px;color:#999">No items found for your search.</td></tr>';
    footer.textContent = '';
    return;
  }
  tbody.innerHTML = items.map(item => `
    <tr>
      <td><span class="sku-badge">${item.sku}</span></td>
      <td style="font-weight:500">${item.name}</td>
      <td><span class="cat-tag">${item.category}</span></td>
      <td style="color:#777">${item.unit}</td>
      <td style="font-weight:600;color:#1A1A1A">₹${item.price.toLocaleString('en-IN')}</td>
      <td><span class="stock-in">In Stock</span></td>
      <td><button class="btn-inquiry" onclick="openItemModal('${item.name.replace(/'/g,"\\'")}', '${item.sku}')">Enquire</button></td>
    </tr>`).join('');
  footer.textContent = `Showing ${items.length} item${items.length !== 1 ? 's' : ''}`;
}

document.getElementById('inventorySearch').addEventListener('input', filterInventory);

// ── Modal logic ──────────────────────────────────────────────────────────────
const modalOverlay = document.getElementById('modalOverlay');
const modalClose = document.getElementById('modalClose');

function openModal(title, desc, service) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalDesc').textContent = desc;
  document.getElementById('modalService').value = service;
  document.getElementById('mName').value = '';
  document.getElementById('mPhone').value = '';
  document.getElementById('mMessage').value = '';
  document.getElementById('modalMsg').textContent = '';
  document.getElementById('modalMsg').className = 'form-message';
  modalOverlay.classList.add('open');
}

function openVehicleModal(v) {
  openModal(`Rent – ${v.name}`, `Rate: ₹${v.rate.toLocaleString('en-IN')} ${v.unit}. Fill the form and we'll call you back.`, `${v.name} Rental`);
}

function openItemModal(name, sku) {
  openModal(`Enquiry – ${name}`, `SKU: ${sku}. Enter your details and we'll get back to you with availability and pricing.`, `Material: ${name} (${sku})`);
}

modalClose.addEventListener('click', () => modalOverlay.classList.remove('open'));
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) modalOverlay.classList.remove('open'); });

document.getElementById('modalForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msgEl = document.getElementById('modalMsg');
  const btn = e.target.querySelector('button[type=submit]');
  btn.textContent = 'Sending...'; btn.disabled = true;
  try {
    const res = await fetch(`${API}/api/inquiry`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: document.getElementById('mName').value,
        phone: document.getElementById('mPhone').value,
        email: '',
        service: document.getElementById('modalService').value,
        message: document.getElementById('mMessage').value
      })
    });
    const data = await res.json();
    msgEl.textContent = data.message;
    msgEl.className = 'form-message ' + (data.success ? 'success' : 'error');
    if (data.success) { document.getElementById('modalForm').reset(); setTimeout(() => modalOverlay.classList.remove('open'), 2800); }
  } catch {
    msgEl.textContent = 'Error sending. Please call us directly at +91 77809 88600.';
    msgEl.className = 'form-message error';
  }
  btn.textContent = 'Submit Inquiry ↗'; btn.disabled = false;
});

// ── Contact form ─────────────────────────────────────────────────────────────
document.getElementById('contactForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msgEl = document.getElementById('formMsg');
  const btn = document.getElementById('submitBtn');
  btn.querySelector('.btn-text').style.display = 'none';
  btn.querySelector('.btn-loader').style.display = 'inline';
  btn.disabled = true;
  const form = e.target;
  try {
    const res = await fetch(`${API}/api/inquiry`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name.value, phone: form.phone.value,
        email: form.email.value, service: form.service.value, message: form.message.value
      })
    });
    const data = await res.json();
    msgEl.textContent = data.message;
    msgEl.className = 'form-message ' + (data.success ? 'success' : 'error');
    if (data.success) form.reset();
  } catch {
    msgEl.textContent = 'Something went wrong. Please call us at +91 77809 88600.';
    msgEl.className = 'form-message error';
  }
  btn.querySelector('.btn-text').style.display = 'inline';
  btn.querySelector('.btn-loader').style.display = 'none';
  btn.disabled = false;
});

// ── Smooth scroll for anchor links ───────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
});

// ── Init ─────────────────────────────────────────────────────────────────────
loadVehicles();
loadInventory();
setupReveal();