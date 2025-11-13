const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  teacher_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  group_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Grupo',
    required: true
  },
  subject_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Materia',
    required: true
  },
  semester_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  grade_value: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  grade_scale: {
    type: String,
    required: true,
    default: '0-100',
    enum: ['0-100', '1-10', 'A-F']
  },
  comments: {
    type: String,
    default: ''
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  modified_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  }
});

gradeSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

gradeSchema.index({ student_id: 1, semester_id: 1 });
gradeSchema.index({ grade_value: 1 });

module.exports = mongoose.model('Grade', gradeSchema);