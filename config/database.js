const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

const pool = mysql.createPool({
    host: 'dbomni.mysql.database.azure.com',
    user: 'omnidocdb',
    password: 'Regulation@2025',
    database: 'gestionabonnés',
    port: 3306,
    ssl: {
      ca: fs.readFileSync(__dirname + '/DigiCertGlobalRootCA.crt.pem')
    },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test de la connexion
pool.getConnection()
  .then(connection => {
    console.log('Connecté à la base de données MySQL Azure');
    connection.release();
  })
  .catch(err => {
    console.error('Erreur de connexion à la base de données Azure:', err);
  });

module.exports = pool; 