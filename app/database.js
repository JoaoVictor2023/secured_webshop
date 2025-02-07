const mysql = require('mysql');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'db_SecuWeb',  // Nom de ta base de données
});

db.connect((err) => {
   // if (err) {
   //     console.error("Erreur de connexion à la base de données :", err);
   //     return;
   // }
});

module.exports = db;
    