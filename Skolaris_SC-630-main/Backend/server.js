const express = require('express');
const app = express(); // <-- Esto debe ir antes de usar `app`

require('dotenv').config();
// Importando rutas
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes'); // ruta usuarios
const horarioRoutes = require('./routes/horarioRoutes'); // ruta horarios
const gradoRoutes = require('./routes/gradoRoutes'); // ruta grados
const claseRoutes = require('./routes/claseRoutes'); // ruta clases
const grupoRoutes = require('./routes/grupoRoutes'); // ruta grupos
const academicoRoutes = require('./routes/academicoRoutes'); //ruta agrupada para docentes
const asistenciaRoutes = require('./routes/asistenciaRoutes'); // ruta asistencias
const gradesRoutes = require('./routes/gradesRoutes'); // rutas calificaciones
const reportsRoutes = require('./routes/reportsRoutes'); // rutas reportes
const receiptsRoutes = require('./routes/receiptsRoutes'); // rutas recibos

// Configuración
const cors = require('cors');
const PORT = process.env.PORT || 8000;

// Conectar DB
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());

// Montando las rutas
app.use('/api/auth', authRoutes); // ruta auth
app.use('/api/usuarios', usuarioRoutes); // ruta usuarios
app.use('/api/horarios', horarioRoutes); // ruta horarios
app.use('/api/grados', gradoRoutes); // ruta grados
app.use('/api/grupos', grupoRoutes); // ruta grupos
app.use('/api/clases', claseRoutes); // ruta clases
app.use('/api/academico', academicoRoutes);
app.use('/api/asistencia', asistenciaRoutes); // ruta asistencias
app.use('/api/grades', gradesRoutes); // rutas calificaciones
app.use('/api/reports', reportsRoutes); // rutas reportes
app.use('/api/receipts', receiptsRoutes); // rutas recibos

// Error handler
app.use((err, req, res, next) => {
  console.error('Error global:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Inicializar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});