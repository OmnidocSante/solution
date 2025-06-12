const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const socketService = require('../services/socketService');

// Obtenir tous les utilisateurs
const getAllUsers = async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, nom, prenom, email, role, agence, ville, poste, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(users);
  } catch (error) {
    console.error('Erreur récupération utilisateurs:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs' });
  }
};

// Obtenir un utilisateur par son ID
const getUserById = async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, nom, prenom, email, role, agence, ville, poste, created_at FROM users WHERE id = ?',
      [req.params.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('Erreur récupération utilisateur:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'utilisateur' });
  }
};

// Créer un nouvel utilisateur
const createUser = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const {
      nom,
      prenom,
      email,
      password,
      role,
      agence,
      ville,
      poste
    } = req.body;

    // Vérifier si l'email existe déjà
    const [existingUsers] = await connection.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const [result] = await connection.query(
      `INSERT INTO users (
        nom, prenom, email, password, role, agence, ville, poste
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nom, prenom, email, hashedPassword, role, agence, ville, poste]
    );

    // Récupérer l'utilisateur créé
    const [newUser] = await connection.query(
      'SELECT id, nom, prenom, email, role, agence, ville, poste, created_at FROM users WHERE id = ?',
      [result.insertId]
    );

    await connection.commit();

    // Envoyer une notification en temps réel
    socketService.notifyNewUser(newUser[0]);
    socketService.notifySystemMessage(`Nouvel utilisateur créé: ${nom} ${prenom}`);

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user: newUser[0]
    });
  } catch (error) {
    await connection.rollback();
    console.error('Erreur création utilisateur:', error);
    res.status(500).json({ message: 'Erreur lors de la création de l\'utilisateur' });
  } finally {
    connection.release();
  }
};

// Mettre à jour un utilisateur
const updateUser = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const {
      nom,
      prenom,
      email,
      role,
      agence,
      ville,
      poste
    } = req.body;

    // Vérifier si l'utilisateur existe
    const [users] = await connection.query(
      'SELECT id FROM users WHERE id = ?',
      [req.params.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérifier si le nouvel email est déjà utilisé par un autre utilisateur
    const [existingUsers] = await connection.query(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email, req.params.id]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    // Mettre à jour l'utilisateur
    await connection.query(
      `UPDATE users SET
        nom = ?, prenom = ?, email = ?, role = ?,
        agence = ?, ville = ?, poste = ?
      WHERE id = ?`,
      [nom, prenom, email, role, agence, ville, poste, req.params.id]
    );

    // Récupérer l'utilisateur mis à jour
    const [updatedUser] = await connection.query(
      'SELECT id, nom, prenom, email, role, agence, ville, poste, created_at FROM users WHERE id = ?',
      [req.params.id]
    );

    await connection.commit();

    // Envoyer une notification en temps réel
    socketService.notifyUpdateUser(updatedUser[0]);
    socketService.notifySystemMessage(`Utilisateur mis à jour: ${nom} ${prenom}`);

    res.json({
      message: 'Utilisateur mis à jour avec succès',
      user: updatedUser[0]
    });
  } catch (error) {
    await connection.rollback();
    console.error('Erreur mise à jour utilisateur:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'utilisateur' });
  } finally {
    connection.release();
  }
};

// Supprimer un utilisateur
const deleteUser = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Récupérer les informations de l'utilisateur avant la suppression
    const [userToDelete] = await connection.query(
      'SELECT nom, prenom FROM users WHERE id = ?',
      [req.params.id]
    );

    if (userToDelete.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Supprimer l'utilisateur
    await connection.query('DELETE FROM users WHERE id = ?', [req.params.id]);

    await connection.commit();

    // Envoyer une notification en temps réel
    socketService.notifyDeleteUser(req.params.id);
    socketService.notifySystemMessage(`Utilisateur supprimé: ${userToDelete[0].nom} ${userToDelete[0].prenom}`);

    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    await connection.rollback();
    console.error('Erreur suppression utilisateur:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'utilisateur' });
  } finally {
    connection.release();
  }
};

// Changer le mot de passe d'un utilisateur
const changePassword = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { currentPassword, newPassword } = req.body;
    const userId = req.params.id;

    // Vérifier l'ancien mot de passe
    const [users] = await connection.query(
      'SELECT password, nom, prenom FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const isValidPassword = await bcrypt.compare(currentPassword, users[0].password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Mot de passe actuel incorrect' });
    }

    // Hasher et mettre à jour le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await connection.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, userId]
    );

    await connection.commit();

    // Envoyer une notification en temps réel
    socketService.notifySystemMessage(`Mot de passe modifié pour: ${users[0].nom} ${users[0].prenom}`);

    res.json({ message: 'Mot de passe modifié avec succès' });
  } catch (error) {
    await connection.rollback();
    console.error('Erreur changement mot de passe:', error);
    res.status(500).json({ message: 'Erreur lors du changement de mot de passe' });
  } finally {
    connection.release();
  }
};

// Obtenir l'utilisateur connecté
const getCurrentUser = async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, nom, prenom, email, role, agence, ville, poste, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('Erreur récupération utilisateur:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'utilisateur' });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  changePassword,
  getCurrentUser
}; 