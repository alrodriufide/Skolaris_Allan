const simpleDbService = require('../services/simpleDbService');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Simple password hash for demo purposes
const DEMO_PASSWORD_HASH = '$2a$10$rJ8K8q8q8q8q8q8q8q8qO'; // "password"

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user by email
    const user = await simpleDbService.findUserByEmail(email);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password (simple check for demo)
    if (password !== 'password') {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        rol: user.rol
      },
      process.env.JWT_SECRET || 'supersecreto123',
      { expiresIn: '24h' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          nombre: user.nombre,
          apellido: user.apellido,
          email: user.email,
          rol: user.rol
        }
      }
    });

  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const validateToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecreto123');

    // Find user
    const user = await simpleDbService.findUserById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          nombre: user.nombre,
          apellido: user.apellido,
          email: user.email,
          rol: user.rol
        }
      }
    });

  } catch (error) {
    console.error('Error validating token:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

const getUsers = async (req, res) => {
  try {
    const { rol } = req.query;

    let users = await simpleDbService.findUsers({});

    if (rol) {
      users = users.filter(u => u.rol && u.rol.includes(rol));
    }

    // Remove password field from response
    const usersWithoutPassword = users.map(({ contrasena, ...user }) => user);

    res.status(200).json({
      success: true,
      data: usersWithoutPassword
    });

  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  login,
  validateToken,
  getUsers
};