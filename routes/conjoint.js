const express = require('express');
const router = express.Router();
const conjointController = require('../controllers/conjointController');
const authMiddleware = require('../middlewares/authMiddleware');

// Routes protégées par l'authentification
router.use(authMiddleware);

// Routes pour les conjoints
router.get('/abonnes/:abonneId/conjoints', conjointController.getConjointsByAbonne);
router.post('/abonnes/:abonneId/conjoints', conjointController.addConjoint);
router.put('/abonnes/:abonneId/conjoints/:conjointId', conjointController.updateConjoint);
router.delete('/abonnes/:abonneId/conjoints/:conjointId', conjointController.deleteConjoint);

module.exports = router; 