const pool = require('../config/database');
const socketService = require('../services/socketService');

// Obtenir un conjoint par son ID
const getConjoint = async (req, res) => {
  try {
    const { abonneId, conjointId } = req.params;
    const [conjoints] = await pool.query(
      'SELECT * FROM conjoints WHERE id = ? AND abonne_id = ?',
      [conjointId, abonneId]
    );

    if (conjoints.length === 0) {
      return res.status(404).json({ message: 'Conjoint non trouvé' });
    }

    res.json(conjoints[0]);
  } catch (error) {
    console.error('Erreur récupération conjoint:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du conjoint' });
  }
};

// Obtenir tous les conjoints d'un abonné
const getConjointsByAbonne = async (req, res) => {
  try {
    const abonne_id = req.params.abonneId;
    const [conjoints] = await pool.query(
      'SELECT * FROM conjoints WHERE abonne_id = ? ORDER BY nom, prenom',
      [abonne_id]
    );
    res.json(conjoints);
  } catch (error) {
    console.error('Erreur récupération conjoints:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des conjoints' });
  }
};

// Ajouter un conjoint
const addConjoint = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { nom, prenom, date_naissance } = req.body;
    const abonne_id = req.params.abonneId;

    const [result] = await connection.query(
      'INSERT INTO conjoints (abonne_id, nom, prenom, date_naissance) VALUES (?, ?, ?, ?)',
      [abonne_id, nom, prenom, date_naissance]
    );

    await connection.commit();

    // Notification en temps réel
    socketService.notifyNewConjoint({
      id: result.insertId,
      abonne_id,
      nom,
      prenom
    });

    res.status(201).json({
      message: 'Conjoint ajouté avec succès',
      id: result.insertId
    });
  } catch (error) {
    await connection.rollback();
    console.error('Erreur ajout conjoint:', error);
    res.status(500).json({ message: 'Erreur lors de l\'ajout du conjoint' });
  } finally {
    connection.release();
  }
};

// Mettre à jour un conjoint
const updateConjoint = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { nom, prenom, date_naissance } = req.body;
    const { abonneId, conjointId } = req.params;

    await connection.query(
      'UPDATE conjoints SET nom = ?, prenom = ?, date_naissance = ? WHERE id = ? AND abonne_id = ?',
      [nom, prenom, date_naissance, conjointId, abonneId]
    );

    await connection.commit();

    // Notification en temps réel
    socketService.notifyUpdateConjoint({
      id: conjointId,
      abonne_id: abonneId,
      nom,
      prenom
    });

    res.json({ message: 'Conjoint mis à jour avec succès' });
  } catch (error) {
    await connection.rollback();
    console.error('Erreur mise à jour conjoint:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du conjoint' });
  } finally {
    connection.release();
  }
};

// Supprimer un conjoint
const deleteConjoint = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { abonneId, conjointId } = req.params;

    // Récupérer les informations du conjoint avant suppression
    const [conjoints] = await connection.query(
      'SELECT * FROM conjoints WHERE id = ? AND abonne_id = ?',
      [conjointId, abonneId]
    );

    if (conjoints.length === 0) {
      return res.status(404).json({ message: 'Conjoint non trouvé' });
    }

    const conjoint = conjoints[0];

    await connection.query(
      'DELETE FROM conjoints WHERE id = ? AND abonne_id = ?',
      [conjointId, abonneId]
    );

    await connection.commit();

    // Notification en temps réel
    socketService.notifyDeleteConjoint({
      id: conjointId,
      abonne_id: abonneId,
      nom: conjoint.nom,
      prenom: conjoint.prenom
    });

    res.json({ message: 'Conjoint supprimé avec succès' });
  } catch (error) {
    await connection.rollback();
    console.error('Erreur suppression conjoint:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression du conjoint' });
  } finally {
    connection.release();
  }
};

module.exports = {
  getConjoint,
  getConjointsByAbonne,
  addConjoint,
  updateConjoint,
  deleteConjoint
}; 