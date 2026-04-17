const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  phone:     { type: String, required: true, trim: true },
  email:     { type: String, trim: true, default: '' },
  service:   { type: String, trim: true, default: '' },
  message:   { type: String, required: true, trim: true },
  status:    { type: String, enum: ['new', 'contacted', 'closed'], default: 'new' },
}, {
  timestamps: true   // auto-adds createdAt and updatedAt fields
});

module.exports = mongoose.model('Inquiry', inquirySchema);
