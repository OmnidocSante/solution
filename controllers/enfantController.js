const pool = require('../config/database');
const socketService = require('../services/socketService');

// Ajouter un enfant
const addEnfant = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { nom, prenom, date_naissance } = req.body;
    const abonne_id = req.params.abonneId;

    const [result] = await connection.query(
      'INSERT INTO enfants (abonne_id, nom, prenom, date_naissance) VALUES (?, ?, ?, ?)',
      [abonne_id, nom, prenom, date_naissance]
    );

    await connection.commit();

    // Notification en temps réel
    socketService.notifyNewEnfant({
      id: result.insertId,
      abonne_id,
      nom,
      prenom
    });

    res.status(201).json({
      message: 'Enfant ajouté avec succès',
      id: result.insertId
    });
  } catch (error) {
    await connection.rollback();
    console.error('Erreur ajout enfant:', error);
    res.status(500).json({ message: 'Erreur lors de l\'ajout de l\'enfant' });
  } finally {
    connection.release();
  }
};

// Mettre à jour un enfant
const updateEnfant = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { nom, prenom, date_naissance } = req.body;
    const { abonneId, enfantId } = req.params;

    await connection.query(
      'UPDATE enfants SET nom = ?, prenom = ?, date_naissance = ? WHERE id = ? AND abonne_id = ?',
      [nom, prenom, date_naissance, enfantId, abonneId]
    );

    await connection.commit();

    // Notification en temps réel
    socketService.notifyUpdateEnfant({
      id: enfantId,
      abonne_id: abonneId,
      nom,
      prenom
    });

    res.json({ message: 'Enfant mis à jour avec succès' });
  } catch (error) {
    await connection.rollback();
    console.error('Erreur mise à jour enfant:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'enfant' });
  } finally {
    connection.release();
  }
};

// Supprimer un enfant
const deleteEnfant = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { abonneId, enfantId } = req.params;

    // Récupérer les informations de l'enfant avant suppression
    const [enfants] = await connection.query(
      'SELECT * FROM enfants WHERE id = ? AND abonne_id = ?',
      [enfantId, abonneId]
    );

    if (enfants.length === 0) {
      return res.status(404).json({ message: 'Enfant non trouvé' });
    }

    const enfant = enfants[0];

    await connection.query(
      'DELETE FROM enfants WHERE id = ? AND abonne_id = ?',
      [enfantId, abonneId]
    );

    await connection.commit();

    // Notification en temps réel
    socketService.notifyDeleteEnfant({
      id: enfantId,
      abonne_id: abonneId,
      nom: enfant.nom,
      prenom: enfant.prenom
    });

    res.json({ message: 'Enfant supprimé avec succès' });
  } catch (error) {
    await connection.rollback();
    console.error('Erreur suppression enfant:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'enfant' });
  } finally {
    connection.release();
  }
};

// Obtenir tous les enfants d'un abonné
const getEnfantsByAbonne = async (req, res) => {
  try {
    const abonne_id = req.params.abonneId;
    const [enfants] = await pool.query(
      'SELECT * FROM enfants WHERE abonne_id = ? ORDER BY nom, prenom',
      [abonne_id]
    );
    res.json(enfants);
  } catch (error) {
    console.error('Erreur récupération enfants:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des enfants' });
  }
};

module.exports = {
  addEnfant,
  updateEnfant,
  deleteEnfant,
  getEnfantsByAbonne
}; 