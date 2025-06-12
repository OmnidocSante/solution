const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../config/database');

// Configuration du stockage
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    try {
      const abonneId = req.params.abonneId;
      // Récupérer le numéro d'identification de l'abonné
      const [abonnes] = await pool.execute(
        'SELECT numero_identification FROM abonnes WHERE id = ?',
        [abonneId]
      );
      
      if (abonnes.length === 0) {
        return cb(new Error('Abonné non trouvé'));
      }
      
      const numeroIdentification = abonnes[0].numero_identification;
      const uploadPath = path.join(__dirname, '..', 'uploads', numeroIdentification);
      
      // Créer le dossier s'il n'existe pas
      fs.mkdirSync(uploadPath, { recursive: true });
      
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: function (req, file, cb) {
    // Garder le nom original du fichier
    cb(null, file.originalname);
  }
});

// Filtre pour les types de fichiers acceptés
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé'));
  }
};

// Configuration de multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // Limite de 5MB
  }
});

module.exports = upload; 