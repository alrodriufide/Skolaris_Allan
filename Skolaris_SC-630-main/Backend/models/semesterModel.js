const mongoose = require('mongoose');

const semesterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  start_date: {
    type: Date,
    required: true
  },
  end_date: {
    type: Date,
    required: true
  },
  is_current: {
    type: Boolean,
    default: false
  },
  is_active: {
    type: Boolean,
    default: true
  }
});

semesterSchema.index({ year: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Semester', semesterSchema);