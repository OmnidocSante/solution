const pool = require('../config/database');
const PDFService = require('../services/pdfService');

// Générer un PDF pour un abonné
exports.generateAbonnePDF = async (req, res) => {
  try {
    const { abonne_id } = req.params;
    const { filename, filepath } = await PDFService.generateAbonnePDF(abonne_id);
    res.download(filepath, filename);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la génération du PDF' });
  }
};

// Générer un rapport PDF avec filtres
exports.generateRapportPDF = async (req, res) => {
  try {
    const filters = req.body;
    const { filename, filepath } = await PDFService.generateRapportPDF(filters);
    res.download(filepath, filename);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la génération du rapport' });
  }
};

// Obtenir les statistiques générales
const getStatistiques = async (req, res) => {
  try {
    // Nombre total d'abonnés
    const [totalAbonnes] = await pool.query('SELECT COUNT(*) as total FROM abonnes');
    
    // Nombre d'abonnés par ville
    const [abonnesParVille] = await pool.query(`
      SELECT ville, COUNT(*) as nombre
      FROM abonnes
      GROUP BY ville
      ORDER BY nombre DESC
    `);

    // Nombre d'enfants par abonné
    const [enfantsParAbonne] = await pool.query(`
      SELECT a.id, a.nom, a.prenom, COUNT(e.id) as nombre_enfants
      FROM abonnes a
      LEFT JOIN enfants e ON a.id = e.abonne_id
      GROUP BY a.id
      ORDER BY nombre_enfants DESC
    `);

    // Nombre d'abonnés avec conjoint
    const [abonnesAvecConjoint] = await pool.query(`
      SELECT COUNT(DISTINCT a.id) as total
      FROM abonnes a
      INNER JOIN conjoints c ON a.id = c.abonne_id
    `);

    res.json({
      totalAbonnes: totalAbonnes[0].total,
      abonnesParVille,
      enfantsParAbonne,
      abonnesAvecConjoint: abonnesAvecConjoint[0].total
    });
  } catch (error) {
    console.error('Erreur récupération statistiques:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des statistiques' });
  }
};

// Obtenir le rapport des abonnés avec filtres
const getRapportAbonnes = async (req, res) => {
  try {
    const { ville, dateDebut, dateFin } = req.query;
    let query = `
      SELECT 
        a.*,
        COUNT(DISTINCT e.id) as nombre_enfants,
        COUNT(DISTINCT c.id) as nombre_conjoints,
        COUNT(DISTINCT d.id) as nombre_documents
      FROM abonnes a
      LEFT JOIN enfants e ON a.id = e.abonne_id
      LEFT JOIN conjoints c ON a.id = c.abonne_id
      LEFT JOIN documents d ON a.id = d.abonne_id
    `;

    const params = [];
    const conditions = [];

    if (ville) {
      conditions.push('a.ville = ?');
      params.push(ville);
    }

    if (dateDebut) {
      conditions.push('a.date_debut >= ?');
      params.push(dateDebut);
    }

    if (dateFin) {
      conditions.push('a.date_debut <= ?');
      params.push(dateFin);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' GROUP BY a.id ORDER BY a.date_debut DESC';

    const [abonnes] = await pool.query(query, params);
    res.json(abonnes);
  } catch (error) {
    console.error('Erreur récupération rapport abonnés:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du rapport des abonnés' });
  }
};

// Obtenir les abonnés avec filtres
exports.getAbonnesWithFilters = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    try {
      const { agence, statut, dateDebut, dateFin, search } = req.query;
      let query = 'SELECT * FROM abonnes WHERE 1=1';
      const params = [];

      if (agence) {
        query += ' AND agence = ?';
        params.push(agence);
      }

      if (statut) {
        query += ' AND statut = ?';
        params.push(statut);
      }

      if (dateDebut) {
        query += ' AND date_inscription >= ?';
        params.push(dateDebut);
      }

      if (dateFin) {
        query += ' AND date_inscription <= ?';
        params.push(dateFin);
      }

      if (search) {
        query += ' AND (numero LIKE ? OR nom LIKE ? OR prenom LIKE ? OR email LIKE ?)';
        const searchParam = `%${search}%`;
        params.push(searchParam, searchParam, searchParam, searchParam);
      }

      // Limiter aux abonnés de l'agence si l'utilisateur n'est pas admin
      if (req.user.role !== 'admin' && req.user.role !== 'controleur') {
        query += ' AND agence = ?';
        params.push(req.user.agence);
      }

      query += ' ORDER BY date_inscription DESC';

      const [abonnes] = await connection.execute(query, params);
      res.json(abonnes);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération des abonnés' });
  }
};

module.exports = {
  getStatistiques,
  getRapportAbonnes
}; 