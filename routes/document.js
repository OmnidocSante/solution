const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// Routes protégées par l'authentification
router.use(authMiddleware);

// Routes pour les documents
router.post('/abonnes/:abonneId/documents', upload.single('document'), documentController.addDocument);
router.put('/abonnes/:abonneId/documents/:documentId', documentController.updateDocument);
router.delete('/abonnes/:abonneId/documents/:documentId', documentController.deleteDocument);
router.get('/abonnes/:abonneId/documents', documentController.getDocumentsByAbonne);

module.exports = router; 