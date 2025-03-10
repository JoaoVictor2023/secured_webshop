const mysql = require('mysql2')

// Informations de connexion pour la db
 const db = mysql.createConnection({
  host: 'localhost',
  port: '6033',
  user: 'root',
  password: 'root',
  database: 'db_SecuWeb',
});

module.exports = db