const express = require('express');
const router = express.Router();
const abonneController = require('../controllers/abonneController');
const authMiddleware = require('../middlewares/authMiddleware');

// Routes protégées par l'authentification
router.use(authMiddleware);

// Routes pour les abonnés
router.post('/', abonneController.createAbonne);
router.get('/', abonneController.getAllAbonnes);
router.get('/:id', abonneController.getAbonneById);
router.put('/:id', abonneController.updateAbonne);
router.delete('/:id', abonneController.deleteAbonne);

module.exports = router; 