const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const Inquiry = require('./models/Inquiry');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Email transporter ─────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const NOTIFY_EMAILS = (process.env.NOTIFY_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);

async function sendNotificationEmail(inquiry) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || NOTIFY_EMAILS.length === 0) {
    console.log('⚠️  Email not configured — skipping notification.');
    return;
  }
  try {
    // Email to business owners
    await transporter.sendMail({
      from: `"R B Constructions" <${process.env.EMAIL_USER}>`,
      to: NOTIFY_EMAILS.join(', '),
      subject: `🏗️ New Inquiry: ${inquiry.service || 'General'} — ${inquiry.name}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #E0DDD5;border-radius:8px;overflow:hidden">
          <div style="background:#1A1D24;padding:24px 28px">
            <h2 style="color:#C8A84B;margin:0;font-size:20px">🏗️ New Client Inquiry</h2>
            <p style="color:#9A9FA8;margin:4px 0 0;font-size:13px">${new Date(inquiry.createdAt).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}</p>
          </div>
          <div style="padding:24px 28px;background:#fff">
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#999;width:120px">Name</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-weight:600">${inquiry.name}</td></tr>
              <tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#999">Phone</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0"><a href="tel:${inquiry.phone}" style="color:#1a73e8">${inquiry.phone}</a></td></tr>
              <tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#999">Email</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0">${inquiry.email || '—'}</td></tr>
              <tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#999">Service</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#C8A84B;font-weight:600">${inquiry.service || '—'}</td></tr>
              <tr><td style="padding:10px 0;color:#999">Message</td><td style="padding:10px 0">${inquiry.message}</td></tr>
            </table>
          </div>
          <div style="background:#f7f6f3;padding:14px 28px;font-size:12px;color:#999">
            This inquiry was submitted via the R B Constructions website. Reply to the client within 24 hours.
          </div>
        </div>`
    });
    console.log('📧 Notification email sent to:', NOTIFY_EMAILS.join(', '));

    // Auto-reply to client (if they provided an email)
    if (inquiry.email) {
      await transporter.sendMail({
        from: `"R B Constructions" <${process.env.EMAIL_USER}>`,
        to: inquiry.email,
        subject: 'Thank you for your inquiry — R B Constructions',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #E0DDD5;border-radius:8px;overflow:hidden">
            <div style="background:#1A1D24;padding:24px 28px">
              <h2 style="color:#C8A84B;margin:0;font-size:20px">R B Constructions</h2>
              <p style="color:#C8A84B;margin:4px 0 0;font-size:11px;letter-spacing:2px">BUILDING EXCELLENCE</p>
            </div>
            <div style="padding:28px;background:#fff;color:#333;line-height:1.7">
              <p>Dear <strong>${inquiry.name}</strong>,</p>
              <p>Thank you for reaching out to R B Constructions! We have received your inquiry regarding <strong>${inquiry.service || 'our services'}</strong>.</p>
              <p>Our team will review your request and get back to you within <strong>24 hours</strong>. If you need immediate assistance, please call us:</p>
              <p style="font-size:16px;font-weight:600">📞 +91 77809 88600 &nbsp;|&nbsp; +91 95411 82006</p>
              <p style="margin-top:24px">Warm regards,<br><strong>R B Constructions Team</strong><br>Lakhanpur, Kathua, J&K – 184152</p>
            </div>
          </div>`
      });
      console.log('📧 Auto-reply sent to client:', inquiry.email);
    }
  } catch (err) {
    console.error('❌ Email sending failed:', err.message);
  }
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

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

// inquiries are now stored in MongoDB via the Inquiry model

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

app.post('/api/inquiry', async (req, res) => {
  const { name, phone, email, service, message } = req.body;
  if (!name || !phone || !message) return res.status(400).json({ success: false, message: 'Name, phone and message are required.' });
  try {
    const inquiry = await Inquiry.create({ name, phone, email, service, message });
    console.log('✅ New inquiry saved to DB:', { id: inquiry._id, name, phone, service });
    // Send email notification (non-blocking — don't wait for it)
    sendNotificationEmail(inquiry);
    res.json({ success: true, message: 'Inquiry submitted successfully! We will contact you within 24 hours.', data: inquiry });
  } catch (err) {
    console.error('❌ Failed to save inquiry:', err.message);
    res.status(500).json({ success: false, message: 'Something went wrong. Please call us at +91 77809 88600.' });
  }
});



app.get('/api/stats', (req, res) => res.json({
  success: true,
  data: { projects: 150, clients: 80, experience: 12, vehicles: vehicles.length }
}));

// ── Admin API Routes ──────────────────────────────────────────────────────────
const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || 'admin123').trim();
console.log('⚙️  ADMIN_PASSWORD loaded from .env:', Boolean(ADMIN_PASSWORD));
const ADMIN_TOKEN = Buffer.from(ADMIN_PASSWORD + ':' + Date.now()).toString('base64');
let adminToken = ADMIN_TOKEN; // Simple token — regenerated on each server restart

function normalizeAdminPassword(value) {
  return String(value || '').trim().replace(/^["']|["']$/g, '');
}

function authAdmin(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (token !== adminToken) return res.status(401).json({ success: false, message: 'Unauthorized' });
  next();
}

app.post('/api/admin/login', (req, res) => {
  const password = normalizeAdminPassword(req.body?.password);
  const expectedPassword = normalizeAdminPassword(ADMIN_PASSWORD);
  if (password === expectedPassword) {
    res.json({ success: true, token: adminToken });
  } else {
    console.warn('⚠️  Admin login failed:', {
      receivedLength: password.length,
      expectedLength: expectedPassword.length
    });
    res.status(401).json({ success: false, message: 'Incorrect password.' });
  }
});

// Protected: Get all inquiries
app.get('/api/inquiries', authAdmin, async (req, res) => {
  try {
    const data = await Inquiry.find().sort({ createdAt: -1 });
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch inquiries.' });
  }
});

// Protected: Update inquiry status
app.patch('/api/admin/inquiries/:id', authAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['new', 'contacted', 'closed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }
    const inquiry = await Inquiry.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!inquiry) return res.status(404).json({ success: false, message: 'Inquiry not found.' });
    console.log(`📝 Inquiry ${inquiry._id} status → ${status}`);
    res.json({ success: true, data: inquiry });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update inquiry.' });
  }
});

// Protected: Delete inquiry
app.delete('/api/admin/inquiries/:id', authAdmin, async (req, res) => {
  try {
    const inquiry = await Inquiry.findByIdAndDelete(req.params.id);
    if (!inquiry) return res.status(404).json({ success: false, message: 'Inquiry not found.' });
    console.log(`🗑️  Inquiry ${inquiry._id} deleted`);
    res.json({ success: true, message: 'Inquiry deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete inquiry.' });
  }
});

// ── Serve frontend ────────────────────────────────────────────────────────────
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));
app.get('/{*splat}', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// ── Start server with MongoDB connection ──────────────────────────────────────
const MONGO_URI = process.env.MONGODB_URI;

if (MONGO_URI && !MONGO_URI.includes('YOUR_')) {
  mongoose.connect(MONGO_URI)
    .then(() => {
      console.log('✅ Connected to MongoDB Atlas');
      app.listen(PORT, () => console.log(`🏗️  R B Constructions server running on http://localhost:${PORT}`));
    })
    .catch(err => {
      console.error('❌ MongoDB connection failed:', err.message);
      console.log('⚠️  Starting server without database — inquiries will NOT be saved.');
      app.listen(PORT, () => console.log(`🏗️  R B Constructions server running on http://localhost:${PORT} (NO DATABASE)`));
    });
} else {
  console.log('⚠️  MONGODB_URI not set in .env — starting without database.');
  console.log('   Inquiries will only print to console and will NOT be saved.');
  app.listen(PORT, () => console.log(`🏗️  R B Constructions server running on http://localhost:${PORT} (NO DATABASE)`));
}
