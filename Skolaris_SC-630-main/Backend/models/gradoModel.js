const mongoose = require('mongoose');

const gradoSchema = new mongoose.Schema({
  nombre: { type: String, required: true }
});

module.exports = mongoose.model('Grado', gradoSchema);
