const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

class PDFService {
  static async generateAbonnePDF(abonneId) {
    const connection = await pool.getConnection();
    try {
      // Récupérer les informations de l'abonné
      const [abonnes] = await connection.execute(
        'SELECT * FROM abonnes WHERE id = ?',
        [abonneId]
      );

      if (abonnes.length === 0) {
        throw new Error('Abonné non trouvé');
      }

      const abonne = abonnes[0];

      // Récupérer le conjoint
      const [conjoints] = await connection.execute(
        'SELECT * FROM conjoints WHERE abonne_id = ?',
        [abonneId]
      );

      // Récupérer les enfants
      const [enfants] = await connection.execute(
        'SELECT * FROM enfants WHERE abonne_id = ? ORDER BY date_naissance',
        [abonneId]
      );

      // Créer le document PDF
      const doc = new PDFDocument();
      const filename = `abonne-${abonne.numero}-${Date.now()}.pdf`;
      const filepath = path.join(__dirname, '../uploads', filename);
      const stream = fs.createWriteStream(filepath);

      doc.pipe(stream);

      // En-tête
      doc.fontSize(20).text('Fiche Abonné', { align: 'center' });
      doc.moveDown();

      // Informations de l'abonné
      doc.fontSize(16).text('Informations de l\'abonné');
      doc.fontSize(12);
      doc.text(`Numéro: ${abonne.numero}`);
      doc.text(`Nom: ${abonne.nom}`);
      doc.text(`Prénom: ${abonne.prenom}`);
      doc.text(`Date de naissance: ${new Date(abonne.date_naissance).toLocaleDateString()}`);
      doc.text(`Adresse: ${abonne.adresse}`);
      doc.text(`Téléphone: ${abonne.telephone}`);
      doc.text(`Email: ${abonne.email || 'Non renseigné'}`);
      doc.text(`Statut: ${abonne.statut}`);
      doc.text(`Agence: ${abonne.agence}`);
      doc.moveDown();

      // Informations du conjoint
      if (conjoints.length > 0) {
        const conjoint = conjoints[0];
        doc.fontSize(16).text('Informations du conjoint');
        doc.fontSize(12);
        doc.text(`Nom: ${conjoint.nom}`);
        doc.text(`Prénom: ${conjoint.prenom}`);
        doc.text(`Date de naissance: ${new Date(conjoint.date_naissance).toLocaleDateString()}`);
        doc.text(`Date de mariage: ${new Date(conjoint.date_mariage).toLocaleDateString()}`);
        doc.moveDown();
      }

      // Informations des enfants
      if (enfants.length > 0) {
        doc.fontSize(16).text('Enfants');
        doc.fontSize(12);
        enfants.forEach((enfant, index) => {
          doc.text(`${index + 1}. ${enfant.prenom} ${enfant.nom}`);
          doc.text(`   Date de naissance: ${new Date(enfant.date_naissance).toLocaleDateString()}`);
        });
      }

      // Pied de page
      doc.fontSize(10);
      doc.text(
        `Document généré le ${new Date().toLocaleString()}`,
        50,
        doc.page.height - 50,
        { align: 'center' }
      );

      // Finaliser le PDF
      doc.end();

      return new Promise((resolve, reject) => {
        stream.on('finish', () => {
          resolve({
            filename,
            filepath
          });
        });
        stream.on('error', reject);
      });
    } finally {
      connection.release();
    }
  }

  static async generateRapportPDF(filters) {
    const connection = await pool.getConnection();
    try {
      let query = 'SELECT * FROM abonnes WHERE 1=1';
      const params = [];

      if (filters.agence) {
        query += ' AND agence = ?';
        params.push(filters.agence);
      }

      if (filters.statut) {
        query += ' AND statut = ?';
        params.push(filters.statut);
      }

      if (filters.dateDebut) {
        query += ' AND date_inscription >= ?';
        params.push(filters.dateDebut);
      }

      if (filters.dateFin) {
        query += ' AND date_inscription <= ?';
        params.push(filters.dateFin);
      }

      const [abonnes] = await connection.execute(query, params);

      // Créer le document PDF
      const doc = new PDFDocument();
      const filename = `rapport-${Date.now()}.pdf`;
      const filepath = path.join(__dirname, '../uploads', filename);
      const stream = fs.createWriteStream(filepath);

      doc.pipe(stream);

      // En-tête
      doc.fontSize(20).text('Rapport des Abonnés', { align: 'center' });
      doc.moveDown();

      // Filtres appliqués
      doc.fontSize(14).text('Filtres appliqués:');
      doc.fontSize(12);
      if (filters.agence) doc.text(`Agence: ${filters.agence}`);
      if (filters.statut) doc.text(`Statut: ${filters.statut}`);
      if (filters.dateDebut) doc.text(`Date début: ${new Date(filters.dateDebut).toLocaleDateString()}`);
      if (filters.dateFin) doc.text(`Date fin: ${new Date(filters.dateFin).toLocaleDateString()}`);
      doc.moveDown();

      // Tableau des abonnés
      doc.fontSize(14).text('Liste des abonnés:');
      doc.moveDown();

      // En-tête du tableau
      const tableTop = doc.y;
      const tableLeft = 50;
      const colWidth = 100;
      const rowHeight = 30;

      // Dessiner l'en-tête
      doc.fontSize(10);
      doc.text('Numéro', tableLeft, tableTop);
      doc.text('Nom', tableLeft + colWidth, tableTop);
      doc.text('Prénom', tableLeft + colWidth * 2, tableTop);
      doc.text('Statut', tableLeft + colWidth * 3, tableTop);
      doc.text('Agence', tableLeft + colWidth * 4, tableTop);

      // Dessiner les lignes
      let y = tableTop + rowHeight;
      abonnes.forEach((abonne, index) => {
        if (y > doc.page.height - 100) {
          doc.addPage();
          y = 50;
        }

        doc.text(abonne.numero, tableLeft, y);
        doc.text(abonne.nom, tableLeft + colWidth, y);
        doc.text(abonne.prenom, tableLeft + colWidth * 2, y);
        doc.text(abonne.statut, tableLeft + colWidth * 3, y);
        doc.text(abonne.agence, tableLeft + colWidth * 4, y);

        y += rowHeight;
      });

      // Statistiques
      doc.addPage();
      doc.fontSize(16).text('Statistiques', { align: 'center' });
      doc.moveDown();

      // Nombre total d'abonnés
      doc.fontSize(12).text(`Nombre total d'abonnés: ${abonnes.length}`);

      // Répartition par statut
      const statuts = {};
      abonnes.forEach(abonne => {
        statuts[abonne.statut] = (statuts[abonne.statut] || 0) + 1;
      });

      doc.moveDown();
      doc.text('Répartition par statut:');
      Object.entries(statuts).forEach(([statut, count]) => {
        doc.text(`${statut}: ${count} (${((count / abonnes.length) * 100).toFixed(1)}%)`);
      });

      // Répartition par agence
      const agences = {};
      abonnes.forEach(abonne => {
        agences[abonne.agence] = (agences[abonne.agence] || 0) + 1;
      });

      doc.moveDown();
      doc.text('Répartition par agence:');
      Object.entries(agences).forEach(([agence, count]) => {
        doc.text(`${agence}: ${count} (${((count / abonnes.length) * 100).toFixed(1)}%)`);
      });

      // Pied de page
      doc.fontSize(10);
      doc.text(
        `Document généré le ${new Date().toLocaleString()}`,
        50,
        doc.page.height - 50,
        { align: 'center' }
      );

      // Finaliser le PDF
      doc.end();

      return new Promise((resolve, reject) => {
        stream.on('finish', () => {
          resolve({
            filename,
            filepath
          });
        });
        stream.on('error', reject);
      });
    } finally {
      connection.release();
    }
  }
}

module.exports = PDFService; 