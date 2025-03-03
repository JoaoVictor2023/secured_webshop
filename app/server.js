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

const app = express();

const session = require('express-session');

app.use(session({
    secret: 'monSuperSecret', // ma clé secrète pour signer la session
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true }
}));


app.use(express.urlencoded({extended: true}))
app.use(express.json()); // Pour traiter les données JSON
const userRoute = require('./routes/User');
const exp = require('constants');
app.use('/user', userRoute);
app.use(express.static(path.join(__dirname, 'view')));

// Créer le serveur HTTPS

const httpsServer = https.createServer(credentials, app);

const db = require('./database'); // Connexion à la base de données

// Démarrage du serveur
httpsServer.listen(443, () => {
    console.log('Server running on port https://localhost:443/user');
});