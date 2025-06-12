const pool = require('../config/database');
const socketService = require('../services/socketService');

// Créer un nouvel abonné
const createAbonne = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const {
      nom,
      prenom,
      date_naissance,
      cin,
      telephone,
      ville,
      adresse,
      numero_identification,
      date_debut,
      date_expiration
    } = req.body;

    const [result] = await connection.query(
      `INSERT INTO abonnes (
        nom, prenom, date_naissance, cin, telephone, ville, adresse,
        numero_identification, date_debut, date_expiration, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)`,
      [
        nom,
        prenom,
        date_naissance,
        cin,
        telephone,
        ville,
        adresse,
        numero_identification,
        date_debut,
        date_expiration,
        req.user.id
      ]
    );

    await connection.commit();
    
    // Notification en temps réel
    const newAbonne = {
      id: result.insertId,
      nom,
      prenom,
      date_naissance,
      cin,
      telephone,
      ville,
      adresse,
      numero_identification,
      date_debut,
      date_expiration,
      user_id: req.user.id
    };
    socketService.notifyNewAbonne(newAbonne);

    res.status(201).json({
      message: 'Abonné créé avec succès',
      id: result.insertId
    });
  } catch (error) {
    await connection.rollback();
    console.error('Erreur création abonné:', error);
    res.status(500).json({ message: 'Erreur lors de la création de l\'abonné' });
  } finally {
    connection.release();
  }
};

// Obtenir tous les abonnés
const getAllAbonnes = async (req, res) => {
  try {
    const [abonnes] = await pool.query(`
      SELECT a.*, u.nom as user_nom, u.prenom as user_prenom
      FROM abonnes a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.date_debut DESC
    `);
    res.json(abonnes);
  } catch (error) {
    console.error('Erreur récupération abonnés:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des abonnés' });
  }
};

// Obtenir un abonné par son ID
const getAbonneById = async (req, res) => {
  try {
    const [abonnes] = await pool.query(
      'SELECT * FROM abonnes WHERE id = ?',
      [req.params.id]
    );

    if (abonnes.length === 0) {
      return res.status(404).json({ message: 'Abonné non trouvé' });
    }

    const abonne = abonnes[0];

    // Récupérer les conjoints
    const [conjoints] = await pool.query(
      'SELECT * FROM conjoints WHERE abonne_id = ?',
      [req.params.id]
    );

    // Récupérer les enfants
    const [enfants] = await pool.query(
      'SELECT * FROM enfants WHERE abonne_id = ?',
      [req.params.id]
    );

    // Récupérer les documents
    const [documents] = await pool.query(
      'SELECT * FROM documents WHERE abonne_id = ?',
      [req.params.id]
    );

    res.json({
      ...abonne,
      conjoints,
      enfants,
      documents
    });
  } catch (error) {
    console.error('Erreur récupération abonné:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'abonné' });
  }
};

// Mettre à jour un abonné
const updateAbonne = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const {
      nom,
      prenom,
      date_naissance,
      cin,
      telephone,
      ville,
      adresse,
      numero_identification,
      date_debut,
      date_expiration
    } = req.body;

    await connection.query(
      `UPDATE abonnes SET
        nom = ?, prenom = ?, date_naissance = ?, cin = ?,
        telephone = ?, ville = ?, adresse = ?,
        numero_identification = ?, date_debut = ?, date_expiration = ?
      WHERE id = ?`,
      [
        nom,
        prenom,
        date_naissance,
        cin,
        telephone,
        ville,
        adresse,
        numero_identification,
        date_debut,
        date_expiration,
        req.params.id
      ]
    );

    await connection.commit();

    // Notification en temps réel
    const updatedAbonne = {
      id: req.params.id,
      nom,
      prenom,
      date_naissance,
      cin,
      telephone,
      ville,
      adresse,
      numero_identification,
      date_debut,
      date_expiration,
      user_id: req.user.id
    };
    socketService.notifyUpdateAbonne(updatedAbonne);

    res.json({ message: 'Abonné mis à jour avec succès' });
  } catch (error) {
    await connection.rollback();
    console.error('Erreur mise à jour abonné:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'abonné' });
  } finally {
    connection.release();
  }
};

// Supprimer un abonné
const deleteAbonne = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Récupérer les informations de l'abonné avant suppression
    const [abonnes] = await connection.query(
      'SELECT * FROM abonnes WHERE id = ?',
      [req.params.id]
    );

    if (abonnes.length === 0) {
      return res.status(404).json({ message: 'Abonné non trouvé' });
    }

    const abonne = abonnes[0];

    // Supprimer l'abonné (les conjoints, enfants et documents seront supprimés automatiquement grâce à ON DELETE CASCADE)
    await connection.query('DELETE FROM abonnes WHERE id = ?', [req.params.id]);

    await connection.commit();

    // Notification en temps réel
    socketService.notifyDeleteAbonne(abonne);

    res.json({ message: 'Abonné supprimé avec succès' });
  } catch (error) {
    await connection.rollback();
    console.error('Erreur suppression abonné:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'abonné' });
  } finally {
    connection.release();
  }
};

module.exports = {
  createAbonne,
  getAllAbonnes,
  getAbonneById,
  updateAbonne,
  deleteAbonne
}; 