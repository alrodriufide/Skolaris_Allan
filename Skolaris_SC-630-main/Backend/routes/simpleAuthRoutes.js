const express = require('express');
const router = express.Router();

const simpleAuthController = require('../controllers/simpleAuthController');

// Login route
router.post('/login', simpleAuthController.login);

// Validate token route
router.post('/validate', simpleAuthController.validateToken);

// Get users for testing
router.get('/users', simpleAuthController.getUsers);

module.exports = router;