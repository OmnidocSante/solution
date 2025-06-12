const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const fs = require('fs');
const morgan = require('morgan');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const abonnesRoutes = require('./routes/abonnes');
const enfantsRoutes = require('./routes/enfant');
const conjointsRoutes = require('./routes/conjoint');
const documentsRoutes = require('./routes/document');
const rapportRoutes = require('./routes/rapports');
const usersRoutes = require('./routes/users');

// Import Socket.IO service
const socketService = require('./services/socketService');

const app = express();
const server = http.createServer(app);

// Configuration CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Middleware pour parser le JSON
app.use(express.json());

// Middleware pour logger les requêtes
app.use(morgan('dev'));

// Initialize Socket.IO
socketService.initialize(server);

// Créer le dossier uploads s'il n'existe pas
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/abonnes', abonnesRoutes);
app.use('/api/enfants', enfantsRoutes);
app.use('/api/conjoints', conjointsRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/rapports', rapportRoutes);
app.use('/api/users', usersRoutes);

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Une erreur est survenue' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
}); 