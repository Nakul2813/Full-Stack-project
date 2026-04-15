const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ── Data ──────────────────────────────────────────────────────────────────────

const vehicles = [
  {
    id: 1,
    name: 'Transit Mixer',
    category: 'Concrete Equipment',
    rate: 400,
    unit: 'per cubic meter',
    description: 'High-capacity transit mixer for fresh concrete transport. Maintains mix homogeneity across all distances.',
    capacity: 'Up to 9 m³',
    specs: ['Drum rotation: 1–14 RPM', 'Water tank: 200L', 'Fuel: Diesel'],
    available: true,
    icon: 'mixer'
  },
  {
    id: 2,
    name: 'Bulker',
    category: 'Material Transport',
    rate: 3500,
    unit: 'per ton',
    description: 'Heavy-duty bulk material tanker ideal for cement, fly ash, and aggregate transport to construction sites.',
    capacity: 'Up to 25 tons',
    specs: ['Pressurized discharge', 'GPS tracked', 'Tare weight: 8T'],
    available: true,
    icon: 'bulker'
  },
  {
    id: 3,
    name: 'Excavator',
    category: 'Earthmoving',
    rate: 3000,
    unit: 'per hour',
    description: 'Powerful hydraulic excavator for digging, trenching, demolition, and material handling operations.',
    capacity: '20–25 ton class',
    specs: ['Bucket capacity: 1.2 m³', 'Max dig depth: 6.5m', 'Reach: 9.5m'],
    available: true,
    icon: 'excavator'
  }
];

const inventory = [
  { id: 1, category: 'Concrete & Masonry', name: 'Portland Cement (50kg bag)', unit: 'Bag', price: 380, stock: 500, sku: 'CM-001' },
  { id: 2, category: 'Concrete & Masonry', name: 'River Sand (per cft)', unit: 'Cft', price: 45, stock: 1000, sku: 'CM-002' },
  { id: 3, category: 'Concrete & Masonry', name: 'Crushed Stone Aggregate (20mm)', unit: 'Ton', price: 1200, stock: 200, sku: 'CM-003' },
  { id: 4, category: 'Concrete & Masonry', name: 'Fly Ash Brick', unit: 'Piece', price: 8, stock: 10000, sku: 'CM-004' },
  { id: 5, category: 'Steel & Metal', name: 'TMT Steel Bar (Fe 500D, 12mm)', unit: 'Kg', price: 72, stock: 5000, sku: 'ST-001' },
  { id: 6, category: 'Steel & Metal', name: 'TMT Steel Bar (Fe 500D, 16mm)', unit: 'Kg', price: 71, stock: 4000, sku: 'ST-002' },
  { id: 7, category: 'Steel & Metal', name: 'MS Binding Wire', unit: 'Kg', price: 65, stock: 300, sku: 'ST-003' },
  { id: 8, category: 'Steel & Metal', name: 'GI Pipe (1 inch)', unit: 'Meter', price: 220, stock: 800, sku: 'ST-004' },
  { id: 9, category: 'Tools & Equipment', name: 'Concrete Vibrator (1HP)', unit: 'Unit', price: 8500, stock: 12, sku: 'TE-001' },
  { id: 10, category: 'Tools & Equipment', name: 'Angle Grinder (4.5 inch)', unit: 'Unit', price: 2200, stock: 20, sku: 'TE-002' },
  { id: 11, category: 'Tools & Equipment', name: 'Electric Drill Machine', unit: 'Unit', price: 1800, stock: 15, sku: 'TE-003' },
  { id: 12, category: 'Tools & Equipment', name: 'Masonry Trowel Set', unit: 'Set', price: 350, stock: 40, sku: 'TE-004' },
  { id: 13, category: 'Safety Equipment', name: 'Safety Helmet (ISI)', unit: 'Unit', price: 250, stock: 200, sku: 'SF-001' },
  { id: 14, category: 'Safety Equipment', name: 'Reflective Safety Vest', unit: 'Unit', price: 180, stock: 150, sku: 'SF-002' },
  { id: 15, category: 'Safety Equipment', name: 'Safety Gloves (Leather)', unit: 'Pair', price: 120, stock: 300, sku: 'SF-003' },
  { id: 16, category: 'Safety Equipment', name: 'Safety Boots (Size 8)', unit: 'Pair', price: 850, stock: 50, sku: 'SF-004' },
  { id: 17, category: 'Plumbing & Electrical', name: 'CPVC Pipe (1 inch, 3m)', unit: 'Piece', price: 320, stock: 500, sku: 'PE-001' },
  { id: 18, category: 'Plumbing & Electrical', name: 'PVC Conduit Pipe (25mm)', unit: 'Meter', price: 45, stock: 1000, sku: 'PE-002' },
  { id: 19, category: 'Plumbing & Electrical', name: 'Wire (4mm², copper)', unit: 'Meter', price: 85, stock: 2000, sku: 'PE-003' },
  { id: 20, category: 'Plumbing & Electrical', name: 'Ball Valve (1 inch, brass)', unit: 'Unit', price: 280, stock: 100, sku: 'PE-004' },
  { id: 21, category: 'Finishing Materials', name: 'Wall Putty (40kg bag)', unit: 'Bag', price: 650, stock: 300, sku: 'FM-001' },
  { id: 22, category: 'Finishing Materials', name: 'Ceramic Floor Tile (60×60cm)', unit: 'Sq. Meter', price: 480, stock: 800, sku: 'FM-002' },
  { id: 23, category: 'Finishing Materials', name: 'White Cement (5kg bag)', unit: 'Bag', price: 320, stock: 200, sku: 'FM-003' },
  { id: 24, category: 'Finishing Materials', name: 'Waterproofing Compound', unit: 'Liter', price: 180, stock: 500, sku: 'FM-004' },
];

const inquiries = [];

// ── API Routes ────────────────────────────────────────────────────────────────

app.get('/api/vehicles', (req, res) => res.json({ success: true, data: vehicles }));
app.get('/api/vehicles/:id', (req, res) => {
  const v = vehicles.find(v => v.id === parseInt(req.params.id));
  v ? res.json({ success: true, data: v }) : res.status(404).json({ success: false, message: 'Vehicle not found' });
});

app.get('/api/inventory', (req, res) => {
  const { category, search } = req.query;
  let data = [...inventory];
  if (category && category !== 'All') data = data.filter(i => i.category === category);
  if (search) data = data.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
  const categories = ['All', ...new Set(inventory.map(i => i.category))];
  res.json({ success: true, data, categories });
});

app.post('/api/inquiry', (req, res) => {
  const { name, phone, email, service, message } = req.body;
  if (!name || !phone || !message) return res.status(400).json({ success: false, message: 'Name, phone and message are required.' });
  const inquiry = { id: inquiries.length + 1, name, phone, email, service, message, createdAt: new Date().toISOString() };
  inquiries.push(inquiry);
  console.log('New inquiry:', inquiry);
  res.json({ success: true, message: 'Inquiry submitted successfully! We will contact you within 24 hours.', data: inquiry });
});

app.get('/api/stats', (req, res) => res.json({
  success: true,
  data: { projects: 150, clients: 80, experience: 12, vehicles: vehicles.length }
}));

// ── Serve frontend ────────────────────────────────────────────────────────────
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => console.log(`🏗️  R B Constructions server running on http://localhost:${PORT}`));