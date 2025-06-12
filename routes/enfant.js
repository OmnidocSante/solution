const express = require('express');
const router = express.Router();
const enfantController = require('../controllers/enfantController');
const authMiddleware = require('../middlewares/authMiddleware');

// Routes protégées par l'authentification
router.use(authMiddleware);

// Routes pour les enfants
router.get('/abonnes/:abonneId/enfants', enfantController.getEnfantsByAbonne);
router.post('/abonnes/:abonneId/enfants', enfantController.addEnfant);
router.put('/abonnes/:abonneId/enfants/:enfantId', enfantController.updateEnfant);
router.delete('/abonnes/:abonneId/enfants/:enfantId', enfantController.deleteEnfant);

module.exports = router; 