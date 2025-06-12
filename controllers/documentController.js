const pool = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const socketService = require('../services/socketService');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

// Fonction utilitaire pour créer le dossier de l'abonné
const createAbonneDirectory = async (numeroIdentification) => {
  const abonnePath = path.join('uploads', numeroIdentification);
  try {
    await fsPromises.mkdir(abonnePath, { recursive: true });
    return abonnePath;
  } catch (error) {
    console.error('Erreur lors de la création du dossier abonné:', error);
    throw error;
  }
};

// Configuration de Multer pour le stockage des fichiers
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const abonneId = req.params.abonneId || req.body.abonne_id;
      // Récupérer le numéro d'identification de l'abonné
      const [abonnes] = await pool.execute(
        'SELECT numero_identification FROM abonnes WHERE id = ?',
        [abonneId]
      );
      
      if (abonnes.length === 0) {
        return cb(new Error('Abonné non trouvé'));
      }
      
      const numeroIdentification = abonnes[0].numero_identification;
      const abonnePath = await createAbonneDirectory(numeroIdentification);
      cb(null, abonnePath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé'));
    }
  }
}).single('document');

// Upload d'un document
exports.uploadDocument = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier n\'a été uploadé' });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const { abonne_id, type } = req.body;
      const { filename, path: filepath, size } = req.file;

      // Vérifier si l'abonné existe
      const [abonnes] = await connection.execute(
        'SELECT * FROM abonnes WHERE id = ?',
        [abonne_id]
      );

      if (abonnes.length === 0) {
        await fsPromises.unlink(filepath);
        return res.status(404).json({ message: 'Abonné non trouvé' });
      }

      // Enregistrer le document dans la base de données
      const [result] = await connection.execute(
        `INSERT INTO documents (
          abonne_id, type, chemin_fichier,
          nom_fichier, taille_fichier, created_by
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [abonne_id, type, filepath, filename, size, req.user.id]
      );

      const [document] = await connection.execute(
        'SELECT * FROM documents WHERE id = ?',
        [result.insertId]
      );

      await connection.commit();

      // Notifier les utilisateurs de l'agence
      socketService.emitToAgency(req.user.agence, 'document:uploaded', {
        document: document[0],
        abonne_id,
        uploadedBy: req.user.id
      });

      res.status(201).json(document[0]);
    } catch (error) {
      await connection.rollback();
      await fsPromises.unlink(req.file.path);
      console.error(error);
      res.status(500).json({ message: 'Erreur lors de l\'upload du document' });
    } finally {
      connection.release();
    }
  });
};

// Supprimer un document
exports.deleteDocument = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;

    // Récupérer les informations du document
    const [documents] = await connection.execute(
      'SELECT * FROM documents WHERE id = ?',
      [id]
    );

    if (documents.length === 0) {
      return res.status(404).json({ message: 'Document non trouvé' });
    }

    const document = documents[0];

    // Supprimer le fichier physique
    try {
      await fsPromises.unlink(document.chemin_fichier);
    } catch (error) {
      console.error('Erreur lors de la suppression du fichier:', error);
    }

    // Supprimer l'enregistrement de la base de données
    await connection.execute(
      'DELETE FROM documents WHERE id = ?',
      [id]
    );

    await connection.commit();

    // Notifier les utilisateurs de l'agence
    socketService.emitToAgency(req.user.agence, 'document:deleted', {
      documentId: id,
      abonne_id: document.abonne_id,
      deletedBy: req.user.id
    });

    res.json({ message: 'Document supprimé avec succès' });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la suppression du document' });
  } finally {
    connection.release();
  }
};

// Obtenir tous les documents d'un abonné
exports.getDocumentsByAbonne = async (req, res) => {
  try {
    const { abonne_id } = req.params;

    const [documents] = await pool.execute(
      'SELECT * FROM documents WHERE abonne_id = ? ORDER BY created_at DESC',
      [abonne_id]
    );

    res.json(documents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération des documents' });
  }
};

// Ajouter un document
const addDocument = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { type } = req.body;
    const abonne_id = req.params.abonneId;

    // Récupérer les infos de l'abonné
    const [abonnes] = await connection.query('SELECT * FROM abonnes WHERE id = ?', [abonne_id]);
    if (abonnes.length === 0) {
      return res.status(404).json({ message: 'Abonné non trouvé' });
    }
    const abonne = abonnes[0];

    // Créer le dossier de l'abonné
    const abonnePath = await createAbonneDirectory(abonne.numero_identification);

    let nom_fichier, pdfPath, relativePdfPath, taille_fichier;

    // Si c'est un certificat, on le génère automatiquement
    if (type === 'certificat') {
      nom_fichier = `certificat_abonnement_${abonne.numero_identification}.pdf`;
      pdfPath = path.join(abonnePath, nom_fichier);
      relativePdfPath = path.join('uploads', abonne.numero_identification, nom_fichier);

      // Charger le template PDF (fond/logo, sans champs)
      const templatePath = path.join(__dirname, 'templates', 'certificat_template.pdf');
      const templateBytes = await fsPromises.readFile(templatePath);
      const pdfDoc = await PDFDocument.load(templateBytes);

      // Utiliser la première page du template
      const page = pdfDoc.getPages()[0];
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Variables dynamiques
      const nomComplet = `Monsieur/Madame ${abonne.nom} ${abonne.prenom || ''}`;
      const cin = abonne.cin || abonne.numero_identification || '';
      const ville = abonne.ville || 'Rabat';
      const dateDebut = abonne.date_debut
        ? new Date(abonne.date_debut).toLocaleDateString('fr-FR')
        : new Date().toLocaleDateString('fr-FR');
      const signature = Math.random().toString(36).substring(2, 22);

      // Titre (centré, gras)
      page.drawText('Attestation de Garantie', {
        x: 200, y: 742, size: 18, font: fontBold, color: rgb(0,0,0)
      });

      // Détails de l'assuré
      page.drawText('Omnidoc Assist, sous le partenariat avec Credit Solutions, atteste que :', {
        x: 50, y: 701, size: 11, font, color: rgb(0,0,0)
      });
      page.drawText(nomComplet, {
        x: 154, y: 660, size: 14, font: fontBold, color: rgb(0,0,0)
      });
      page.drawText(`CIN : ${cin}`, {
        x: 255, y: 632, size: 12, font: fontBold, color: rgb(0,0,0)
      });

      // Texte avant la liste à puces
      page.drawText(
        "bénéficie des garanties suivantes dans le cadre de notre service d'assistance médicale Premium :",
        { x: 50, y: 592, size: 11, font, color: rgb(0,0,0) }
      );

      // Garanties listées (puces)
      const garanties = [
        "Transport d'Ambulance Illimité : En cas d'urgence médicale.",
        "Consultations à Domicile : Tarif préférentiel de 150,00 Dh.",
        "Couverture Nationale : Services accessibles sur l'ensemble du territoire.",
        "Assistance Médicale Téléphonique : Disponible 24/7. : 0522240404"
      ];
      let y = 565;
      garanties.forEach(g => {
        page.drawText(`• ${g}`, { x: 66, y, size: 10.5, font, color: rgb(0,0,0) });
        y -= 18;
      });

      // Conditions
      page.drawText(
        "Cette garantie est valable pour une durée d'un an à compter de la date de souscription.",
        { x: 50, y: y - 10, size: 10.5, font, color: rgb(0,0,0) }
      );
      page.drawText(
        "Elle ne s'applique pas aux personnes atteintes de maladies chroniques.",
        { x: 50, y: y - 28, size: 10.5, font, color: rgb(0,0,0) }
      );

      // Signature / Date / Lieu (plus à droite)
      page.drawText(`Fait à ${ville}, le ${dateDebut}`, {
        x: 423, y: 214, size: 11, font, color: rgb(0,0,0)
      });

      // Signature électronique (centré, juste au-dessus de la barre du bas)
      page.drawText(`Ce PDF est signé électroniquement avec : t${signature}==`, {
        x: 370, y: 171, size: 8, font, color: rgb(0,0,0)
      });

      // Sauvegarder le PDF dans le dossier de l'abonné
      const pdfBytes = await pdfDoc.save();
      await fsPromises.writeFile(pdfPath, pdfBytes);

      // Obtenir la taille du fichier après sa création
      const stats = await fsPromises.stat(pdfPath);
      taille_fichier = stats.size;
    } else {
      // Pour les autres types de documents, on vérifie l'upload
      if (!req.file) {
        return res.status(400).json({ message: 'Aucun fichier n\'a été uploadé' });
      }

      nom_fichier = req.file.originalname;
      pdfPath = path.join(abonnePath, nom_fichier);
      relativePdfPath = path.join('uploads', abonne.numero_identification, nom_fichier);

      // Obtenir la taille du fichier uploadé
      const stats = await fsPromises.stat(req.file.path);
      taille_fichier = stats.size;
    }

    // Enregistrer dans la base de données avec le chemin relatif
    const [result] = await connection.query(
      'INSERT INTO documents (abonne_id, type, nom_fichier, chemin_fichier, taille_fichier) VALUES (?, ?, ?, ?, ?)',
      [abonne_id, type, nom_fichier, relativePdfPath, taille_fichier]
    );

    await connection.commit();

    // Notification en temps réel
    socketService.notifyNewDocument({
      id: result.insertId,
      abonne_id,
      type,
      nom_fichier
    });

    res.status(201).json({
      message: 'Document ajouté avec succès',
      document: {
        id: result.insertId,
        type,
        nom_fichier,
        chemin_fichier: relativePdfPath,
        taille_fichier
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Erreur ajout document:', error);
    res.status(500).json({ message: 'Erreur lors de l\'ajout du document' });
  } finally {
    connection.release();
  }
};

// Mettre à jour un document
const updateDocument = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { type, numero, date_upload, date_expiration, fichier } = req.body;
    const { abonneId, documentId } = req.params;

    await connection.query(
      'UPDATE documents SET type = ?, numero = ?, date_upload = ?, date_expiration = ?, fichier = ? WHERE id = ? AND abonne_id = ?',
      [type, numero, date_upload, date_expiration, fichier, documentId, abonneId]
    );

    await connection.commit();

    // Notification en temps réel
    socketService.notifyUpdateDocument({
      id: documentId,
      abonne_id: abonneId,
      type,
      numero
    });

    res.json({ message: 'Document mis à jour avec succès' });
  } catch (error) {
    await connection.rollback();
    console.error('Erreur mise à jour document:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du document' });
  } finally {
    connection.release();
  }
};

// Supprimer un document
const deleteDocument = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { abonneId, documentId } = req.params;

    // Récupérer les informations du document avant suppression
    const [documents] = await connection.query(
      'SELECT * FROM documents WHERE id = ? AND abonne_id = ?',
      [documentId, abonneId]
    );

    if (documents.length === 0) {
      return res.status(404).json({ message: 'Document non trouvé' });
    }

    const document = documents[0];

    await connection.query(
      'DELETE FROM documents WHERE id = ? AND abonne_id = ?',
      [documentId, abonneId]
    );

    await connection.commit();

    // Notification en temps réel
    socketService.notifyDeleteDocument({
      id: documentId,
      abonne_id: abonneId,
      type: document.type,
      numero: document.numero
    });

    res.json({ message: 'Document supprimé avec succès' });
  } catch (error) {
    await connection.rollback();
    console.error('Erreur suppression document:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression du document' });
  } finally {
    connection.release();
  }
};

// Obtenir tous les documents d'un abonné
const getDocumentsByAbonne = async (req, res) => {
  try {
    const [documents] = await pool.query(
      'SELECT * FROM documents WHERE abonne_id = ? ORDER BY date_upload DESC',
      [req.params.abonneId]
    );
    res.json(documents);
  } catch (error) {
    console.error('Erreur récupération documents:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des documents' });
  }
};

module.exports = {
  addDocument,
  updateDocument,
  deleteDocument,
  getDocumentsByAbonne
}; 