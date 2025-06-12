const express = require('express');
const router = express.Router();
const rapportController = require('../controllers/rapportController');
const authMiddleware = require('../middlewares/authMiddleware');

// Routes protégées par l'authentification
router.use(authMiddleware);

// Routes pour les rapports
router.get('/statistiques', rapportController.getStatistiques);
router.get('/abonnes', rapportController.getRapportAbonnes);

module.exports = router; 