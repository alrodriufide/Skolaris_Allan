const mongoose = require('mongoose');

const gradeHistorySchema = new mongoose.Schema({
  grade_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Grade',
    required: true
  },
  old_value: {
    type: Number
  },
  new_value: {
    type: Number
  },
  changed_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  change_reason: {
    type: String,
    required: true
  },
  changed_at: {
    type: Date,
    default: Date.now
  }
});

gradeHistorySchema.index({ grade_id: 1, changed_at: -1 });

module.exports = mongoose.model('GradeHistory', gradeHistorySchema);