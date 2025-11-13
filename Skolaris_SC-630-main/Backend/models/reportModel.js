const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  report_type: {
    type: String,
    required: true,
    enum: ['grades', 'attendance', 'combined']
  },
  semester_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  report_data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  generated_at: {
    type: Date,
    default: Date.now
  },
  expires_at: {
    type: Date
  },
  is_active: {
    type: Boolean,
    default: true
  }
});

reportSchema.index({ student_id: 1, semester_id: 1 });

module.exports = mongoose.model('Report', reportSchema);