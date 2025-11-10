// config/db.js
require('dotenv').config();
const mongoose = require('mongoose');

const env = process.env.NODE_ENV || 'development';

const mongoURI = env === 'production' ? process.env.MONGO_PRODUCCION
               : env === 'qa' ? process.env.MONGO_QA
               : process.env.MONGO_URI;

const connectDB = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log(`✅ Conectado a MongoDB (${env})`);
  } catch (err) {
    console.error('❌ Error al conectar con MongoDB:', err);
    process.exit(1);
  }
};

module.exports = connectDB;
