// Importer les modules nécessaires
const express = require('express');
const fs = require('fs');
const https = require('https');
const path = require('path');
const bcrypt = require('bcryptjs'); // Pour comparer et hacher les mots de passe
// Charger les clés SSL
const privateKey = fs.readFileSync('../privkey.key', 'utf8');
const certificate = fs.readFileSync('../certificate.crt', 'utf8');
const credentials = { key: privateKey, cert: certificate };


//   // Fonction pour créer un utilisateur avec mot de passe haché
//   async function createUser(email, password) {
//       try {
//           // Hachage du mot de passe
//           const salt = await bcrypt.genSalt(10); // Crée un sel avec une complexité de 10
//           const hashedPassword = await bcrypt.hash(password, salt); // Hache le mot de passe avec le sel
//
//           // Requête SQL pour insérer un nouvel utilisateur dans la base de données
//           const query = 'INSERT INTO t_users (email, mdpHash) VALUES (?, ?)';
//           db.query(query, [email, hashedPassword], (err, results) => {
//               if (err) {
//                   console.error('Erreur lors de l\'insertion dans la base de données:', err);
//                   return;
//               }
//               console.log('Utilisateur ajouté avec succès');
//           });
//       } catch (error) {
//           console.error('Erreur lors du hachage du mot de passe:', error);
//       }
//   }   
//
//   // Exemple d'utilisation : créer un utilisateur avec un email et un mot de passe
//   createUser('abiram@gmail.com', '123456'); 


const app = express();

const session = require('express-session');

app.use(session({
    secret: 'monSuperSecret', // Clé secrète pour signer la session
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Met à true si HTTPS en production
}));


app.use(express.urlencoded({extended: true}))
app.use(express.json()); // Pour traiter les données JSON
const userRoute = require('./routes/User');
const exp = require('constants');
app.use('/user', userRoute);

// Créer le serveur HTTPS

const httpsServer = https.createServer(credentials, app);

const db = require('./database'); // Connexion à la base de données

// Démarrage du serveur
httpsServer.listen(443, () => {
    console.log('Server running on port https://localhost:443/user');
});