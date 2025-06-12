const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Routes protégées par l'authentification
router.use(authMiddleware);

// Route pour obtenir les informations de l'utilisateur connecté
router.get('/me', userController.getCurrentUser);

// Routes accessibles uniquement aux administrateurs
router.get('/', roleMiddleware(['admin']), userController.getAllUsers);
router.get('/:id', roleMiddleware(['admin']), userController.getUserById);
router.post('/', roleMiddleware(['admin']), userController.createUser);
router.put('/:id', roleMiddleware(['admin']), userController.updateUser);
router.delete('/:id', roleMiddleware(['admin']), userController.deleteUser);

// Route pour changer le mot de passe (accessible à l'utilisateur lui-même)
router.put('/:id/password', userController.changePassword);

module.exports = router; 