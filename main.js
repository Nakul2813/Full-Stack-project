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
}, { threshold: 0 });

// Helper: observe an element and force-show it if already in viewport
function observeReveal(el) {
  revealObserver.observe(el);
  // If the element is already visible in viewport, show it immediately
  const rect = el.getBoundingClientRect();
  if (rect.top < window.innerHeight && rect.bottom > 0) {
    el.classList.add('visible');
  }
}

function setupReveal() {
  document.querySelectorAll('.service-card, .about-content, .about-visual, .contact-card, .contact-form-wrap, .pillar').forEach((el, i) => {
    el.classList.add('reveal');
    el.style.transitionDelay = (i % 3) * 0.1 + 's';
    observeReveal(el);
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
      <div class="vehicle-card">
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
    // Directly show cards with a staggered fade-in (no scroll-reveal needed — they're already in viewport)
    grid.querySelectorAll('.vehicle-card').forEach((el, i) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(24px)';
      el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      el.style.transitionDelay = (i * 0.15) + 's';
      // Use requestAnimationFrame to ensure DOM paint happens before transition starts
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        });
      });
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

// ── Service Detail Data ──────────────────────────────────────────────────────
const serviceData = {
  building: {
    icon: '🏗️',
    title: 'Building Construction',
    subtitle: 'Residential · Commercial · Industrial',
    description: `<p>R B Constructions delivers end-to-end building construction services across Kathua, Jammu & Kashmir and neighbouring districts. Whether you're building your dream home, a commercial complex, or an industrial facility — our team of 50+ skilled professionals ensures top-quality construction with on-time delivery.</p>
    <p>We use ISI-certified materials, modern construction techniques, and adhere to all local building codes and seismic safety standards required in the J&K region. Every project comes with a detailed timeline, transparent costing, and regular progress updates.</p>`,
    pricing: [
      { name: 'Residential (Basic)', value: '₹1,400', unit: 'per sq. ft. (structure only)' },
      { name: 'Residential (Premium)', value: '₹2,200', unit: 'per sq. ft. (turnkey finish)' },
      { name: 'Commercial Build', value: '₹1,600', unit: 'per sq. ft. (starting)' },
      { name: 'Renovation / Remodelling', value: '₹800', unit: 'per sq. ft. (starting)' }
    ],
    features: [
      'Complete RCC frame structure with ISI steel',
      'Earthquake-resistant design (Zone V compliant)',
      'Interior & exterior finishing included',
      'Electrical, plumbing & sanitary work',
      'Waterproofing & damp-proofing',
      'Modular kitchen & wardrobe installation',
      'Painting, POP, and false ceiling',
      'Project insurance & safety compliance',
      'Free site inspection & soil testing',
      '1-year structural warranty'
    ],
    process: [
      { title: 'Site Visit & Consultation', desc: 'Free site inspection, soil testing, and requirement discussion with our structural engineer.' },
      { title: 'Design & Estimation', desc: 'Architectural drawings, structural design, and detailed cost estimation with material breakdown.' },
      { title: 'Agreement & Timeline', desc: 'Transparent contract with milestone-based payments and a fixed project timeline.' },
      { title: 'Foundation & Structure', desc: 'Excavation, foundation, columns, beams, slabs — all as per structural drawings with quality checks.' },
      { title: 'Finishing & Handover', desc: 'Plastering, flooring, painting, fixtures, electrical, plumbing — complete turnkey finish and handover.' }
    ]
  },
  vehicle: {
    icon: '🚛',
    title: 'Heavy Vehicle Rental',
    subtitle: 'Transit Mixers · Bulkers · Excavators',
    description: `<p>Our fleet of well-maintained heavy vehicles is available for rent across Jammu & Kashmir. Each vehicle comes with a trained, experienced operator who knows the local terrain and road conditions.</p>
    <p>We serve RMC plants, construction sites, road projects, and government contractors. GPS-tracked vehicles ensure transparency and accountability. All vehicles are insured and regularly serviced for maximum uptime.</p>`,
    pricing: [
      { name: 'Transit Mixer', value: '₹400', unit: 'per cubic meter delivered' },
      { name: 'Bulker (Cement/Fly Ash)', value: '₹3,500', unit: 'per ton transported' },
      { name: 'Excavator (20-25T)', value: '₹3,000', unit: 'per hour (min. 4 hrs)' },
      { name: 'Monthly Contract', value: 'Custom', unit: 'Discounted rates available' }
    ],
    features: [
      'Trained & licensed operators included',
      'GPS tracking on all vehicles',
      'Fuel charged separately at actuals',
      'Fully insured fleet',
      'Available 7 days a week',
      'Emergency breakdown support',
      'Flexible daily/weekly/monthly plans',
      'On-time dispatch guarantee'
    ],
    process: [
      { title: 'Requirement Call', desc: 'Tell us your site location, vehicle type, duration, and schedule.' },
      { title: 'Availability Check', desc: 'We confirm vehicle availability and dispatch timeline within 30 minutes.' },
      { title: 'Dispatch & Tracking', desc: 'Vehicle dispatched with operator. Track in real-time via GPS link shared with you.' },
      { title: 'Usage & Billing', desc: 'Transparent billing based on actual usage hours/trips. No hidden charges.' }
    ]
  },
  road: {
    icon: '🛣️',
    title: 'Road & Infrastructure',
    subtitle: 'Roads · Drainage · Retaining Walls · Bridges',
    description: `<p>R B Constructions has extensive experience in civil infrastructure projects across the hilly terrain of Jammu & Kashmir. We specialize in rural and urban road construction, stormwater drainage systems, retaining walls, culverts, and small bridge construction.</p>
    <p>Our team understands the unique challenges of J&K's geography — landslide-prone areas, high-altitude conditions, and seasonal weather constraints. We use heavy machinery and local expertise to deliver durable infrastructure.</p>`,
    pricing: [
      { name: 'Bituminous Road', value: '₹25L', unit: 'per km (approx., varies by width)' },
      { name: 'Concrete Road (CC)', value: '₹35L', unit: 'per km (approx.)' },
      { name: 'Stone Retaining Wall', value: '₹1,800', unit: 'per cubic meter' },
      { name: 'RCC Drain / Nallah', value: '₹3,500', unit: 'per running meter' }
    ],
    features: [
      'WBM, DBM, and bituminous surfacing',
      'RCC & stone masonry retaining walls',
      'Stormwater drainage & culvert systems',
      'Slope stabilization & erosion control',
      'Land grading and leveling',
      'Bridge & culvert construction',
      'Government project experience (PMGSY, JKRRDA)',
      'Quality testing with lab reports'
    ],
    process: [
      { title: 'Survey & Assessment', desc: 'Detailed site survey, topographic mapping, and geotechnical assessment of terrain.' },
      { title: 'Design & DPR', desc: 'Detailed Project Report (DPR) including design, BOQ, cost estimates, and timeline.' },
      { title: 'Mobilization', desc: 'Machinery, material, and workforce mobilized to site. Base camp established.' },
      { title: 'Execution & Testing', desc: 'Layer-by-layer construction with quality tests at every stage. Regular progress reports.' },
      { title: 'Completion & Handover', desc: 'Final inspection, defect rectification, and project handover with documentation.' }
    ]
  },
  material: {
    icon: '📦',
    title: 'Material Supply',
    subtitle: 'Cement · Steel · Aggregates · Finishing Materials',
    description: `<p>We supply a comprehensive range of ISI-certified construction materials sourced directly from top manufacturers. Bulk buying power means competitive prices for our clients. We stock everything from foundation to finishing.</p>
    <p>All materials are delivered directly to your construction site with proper challan and quality certificates. We maintain a large inventory at our Lakhanpur warehouse for immediate dispatch.</p>`,
    pricing: [
      { name: 'Portland Cement (50kg)', value: '₹380', unit: 'per bag (bulk discounts available)' },
      { name: 'TMT Steel (Fe 500D)', value: '₹72', unit: 'per kg' },
      { name: 'River Sand', value: '₹45', unit: 'per cft' },
      { name: 'Crushed Aggregate 20mm', value: '₹1,200', unit: 'per ton' }
    ],
    features: [
      'ISI-certified and lab-tested materials',
      'Direct site delivery with challan',
      'Bulk order discounts (10+ tons)',
      'Credit facility for regular contractors',
      'Cement, sand, aggregate, bricks',
      'TMT steel bars (all sizes)',
      'Plumbing & electrical supplies',
      'Tiles, putty, paint & waterproofing',
      'Safety equipment & tools',
      'Free material estimation service'
    ],
    process: [
      { title: 'Material Estimation', desc: 'Share your floor plan or BOQ — we calculate exact quantities needed (free service).' },
      { title: 'Quotation', desc: 'Itemized quotation with current market rates. Transparent pricing, no middlemen.' },
      { title: 'Order & Payment', desc: 'Confirm order with advance. Flexible payment terms for bulk and repeat orders.' },
      { title: 'Delivery', desc: 'Materials delivered to your site within 24-48 hours. Unloading assistance available.' }
    ]
  },
  project: {
    icon: '📐',
    title: 'Project Management',
    subtitle: 'Planning · Execution · Monitoring · Handover',
    description: `<p>Our project management services ensure your construction project is completed on time, within budget, and to the highest quality standards. We act as your single point of contact — coordinating architects, engineers, contractors, and suppliers.</p>
    <p>From the first blueprint to final handover, our project managers provide detailed scheduling, cost tracking, quality assurance, and regular progress reports — so you always know exactly where your project stands.</p>`,
    pricing: [
      { name: 'Small Projects (< 2000 sqft)', value: '5%', unit: 'of total project cost' },
      { name: 'Medium Projects (2000-10000 sqft)', value: '4%', unit: 'of total project cost' },
      { name: 'Large / Infra Projects', value: '3%', unit: 'of total project cost (negotiable)' },
      { name: 'Consultation Only', value: '₹5,000', unit: 'per site visit' }
    ],
    features: [
      'Dedicated project manager assigned',
      'Detailed Gantt chart & milestone tracking',
      'Weekly progress reports with photos',
      'Quality checks at every construction stage',
      'Vendor & subcontractor management',
      'Budget tracking & cost optimization',
      'Regulatory compliance & permit handling',
      'Risk assessment & mitigation planning'
    ],
    process: [
      { title: 'Project Scoping', desc: 'Understand requirements, constraints, budget, and timeline expectations.' },
      { title: 'Planning & Scheduling', desc: 'Create detailed work breakdown, resource plan, procurement schedule, and Gantt chart.' },
      { title: 'Execution & Monitoring', desc: 'Daily oversight, quality inspections, safety audits, and coordination of all trades.' },
      { title: 'Reporting & Communication', desc: 'Weekly photo reports, budget updates, and milestone notifications to client.' },
      { title: 'Handover & Documentation', desc: 'Final punch list, defect rectification, as-built drawings, and warranty documentation.' }
    ]
  },
  labour: {
    icon: '👷',
    title: 'Skilled Labour',
    subtitle: 'Masons · Carpenters · Electricians · Supervisors',
    description: `<p>We maintain a qualified workforce of 100+ trained construction workers available for deployment on your project. All workers are experienced, background-verified, and trained in safety protocols.</p>
    <p>Whether you need a small team of masons for a house project or a large crew with supervisors for a commercial site — we provide reliable, skilled labour with daily attendance tracking and quality oversight.</p>`,
    pricing: [
      { name: 'Mason (Skilled)', value: '₹800', unit: 'per day' },
      { name: 'Carpenter', value: '₹750', unit: 'per day' },
      { name: 'Electrician', value: '₹700', unit: 'per day' },
      { name: 'Helper / Labourer', value: '₹450', unit: 'per day' },
      { name: 'Site Supervisor', value: '₹1,200', unit: 'per day' },
      { name: 'Plumber', value: '₹700', unit: 'per day' }
    ],
    features: [
      'Background-verified workforce',
      'Trained in construction safety standards',
      'Daily attendance & work tracking',
      'Supervisor included for teams of 10+',
      'Replacement guarantee within 24 hours',
      'Available for short-term & long-term projects',
      'Specializations: masonry, carpentry, plumbing, electrical, painting, tiling',
      'All tools & PPE provided by us'
    ],
    process: [
      { title: 'Requirement Brief', desc: 'Tell us the trade, team size, duration, and site location.' },
      { title: 'Worker Selection', desc: 'We shortlist workers based on skill level and project type. Supervisor assigned for large teams.' },
      { title: 'Deployment', desc: 'Workers report to your site on the agreed date. Daily work hours: 8 AM – 6 PM.' },
      { title: 'Monitoring & Billing', desc: 'Daily attendance tracked. Weekly billing with detailed work logs. Immediate replacement for no-shows.' }
    ]
  }
};

// ── Service Modal Logic ──────────────────────────────────────────────────────
const svcOverlay = document.getElementById('svcModalOverlay');
const svcClose = document.getElementById('svcModalClose');

function openServiceModal(key) {
  const svc = serviceData[key];
  if (!svc) return;
  document.getElementById('svcModalIcon').textContent = svc.icon;
  document.getElementById('svcModalTitle').textContent = svc.title;
  document.getElementById('svcModalSubtitle').textContent = svc.subtitle;
  document.getElementById('svcDesc').innerHTML = svc.description;
  document.getElementById('svcPricing').innerHTML = svc.pricing.map(p => `
    <div class="svc-price-card">
      <div class="price-item-name">${p.name}</div>
      <div class="price-item-value">${p.value}</div>
      <div class="price-item-unit">${p.unit}</div>
    </div>`).join('');
  document.getElementById('svcFeatures').innerHTML = svc.features.map(f =>
    `<div class="svc-feature-item">${f}</div>`).join('');
  document.getElementById('svcProcess').innerHTML = svc.process.map((s, i) => `
    <div class="svc-process-step">
      <div class="svc-step-num">${i + 1}</div>
      <div class="svc-step-text"><strong>${s.title}</strong>${s.desc}</div>
    </div>`).join('');
  svcOverlay.classList.add('open');
  document.getElementById('svcModal').scrollTop = 0;
}

svcClose.addEventListener('click', () => svcOverlay.classList.remove('open'));
svcOverlay.addEventListener('click', e => { if (e.target === svcOverlay) svcOverlay.classList.remove('open'); });

// Attach click handlers to service cards
document.querySelectorAll('.service-card[data-service]').forEach(card => {
  card.addEventListener('click', () => openServiceModal(card.dataset.service));
});

// ── Init ─────────────────────────────────────────────────────────────────────
loadVehicles();
loadInventory();
setupReveal();