const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

// Route publique pour la connexion
router.post('/login', authController.login);

// Route protégée pour la validation du token
router.get('/validate', authMiddleware, authController.validateToken);

module.exports = router; 