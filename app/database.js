const mysql = require('mysql');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'test',  // Nom de ta base de données
});

db.connect((err) => {
    if (err)  err;
    console.log('Base de données connectée avec succès !');
});

module.exports = db;
 