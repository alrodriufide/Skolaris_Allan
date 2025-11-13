const express = require('express');
const app = express(); // <-- Esto debe ir antes de usar `app`

require('dotenv').config();

// Importando rutas (solo las que no dependen de MongoDB)
const simpleAuthRoutes = require('./routes/simpleAuthRoutes');
const simpleRoutes = require('./routes/simpleRoutes');

// Configuración
const cors = require('cors');
const PORT = process.env.PORT || 8000;

// Middlewares
app.use(cors());
app.use(express.json());

// Montando las rutas (solo las simples, sin MongoDB)
app.use('/api/simple-auth', simpleAuthRoutes); // rutas auth simple
app.use('/api/simple', simpleRoutes); // rutas base de datos simple

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
  console.log('📝 Modo: Base de datos Simple (sin MongoDB)');
  console.log('👥 Login de prueba: juan.perez@skolaris.edu / password');
  console.log('👥 Login profesor: maria.gonzalez@skolaris.edu / password');
});