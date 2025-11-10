const mongoose = require('mongoose');

const materiaSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
});

module.exports = mongoose.model('Materia', materiaSchema);
