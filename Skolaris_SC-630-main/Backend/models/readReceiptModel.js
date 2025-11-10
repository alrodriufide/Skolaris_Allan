const mongoose = require('mongoose');

const readReceiptSchema = new mongoose.Schema({
  report_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report',
    required: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  read_at: {
    type: Date,
    default: Date.now
  },
  ip_address: {
    type: String,
    default: null
  },
  user_agent: {
    type: String,
    default: null
  },
  confirmation_method: {
    type: String,
    enum: ['checkbox', 'signature', 'electronic'],
    default: 'checkbox'
  }
});

readReceiptSchema.index({ read_at: 1 });
readReceiptSchema.index({ user_id: 1, report_id: 1 });

module.exports = mongoose.model('ReadReceipt', readReceiptSchema);