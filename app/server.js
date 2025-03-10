require('dotenv').config(); // Charger les variables d'environnement
// Importer les modules nécessaires
const express = require('express');
const fs = require('fs');
const https = require('https');
const path = require('path');
const bcrypt = require('bcryptjs'); // Pour comparer et hacher les mots de passe
const jwt = require('jsonwebtoken'); // Importer jsonwebtoken
const cookieParser = require('cookie-parser'); // Importer cookie-parser
// Charger les clés SSL
const privateKey = fs.readFileSync('../privkey.key', 'utf8');
const certificate = fs.readFileSync('../certificate.crt', 'utf8');
const credentials = { key: privateKey, cert: certificate };


const app = express();

app.set("view engine", "ejs")
app.set('views', "./view")

const session = require('express-session');

app.use(session({
    secret: 'monSuperSecret', // ma clé secrète pour signer la session
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true }
}));

app.use(cookieParser()); // Utiliser cookie-parser

app.use(express.urlencoded({extended: true}))
app.use(express.json()); // Pour traiter les données JSON

// Ajouter cette ligne pour servir les fichiers statiques du dossier public
app.use(express.static(path.join(__dirname, '../public')));

const userRoute = require('./routes/User');
const exp = require('constants');
app.use('/user', userRoute);
app.use(express.static(path.join(__dirname, 'view'))); 

const authenticateToken = require('./middleware/authMiddleware'); // Importer le middleware d'authentification

app.get('/api/user', authenticateToken, (req, res) => {
    const userEmail = req.user.email;
    const query = 'SELECT role FROM t_users WHERE email = ?';
    db.query(query, [userEmail], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erreur serveur' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
        res.json({ email: userEmail, role: results[0].role });
    });
});

app.use((req, res, next) => {
    res.status(404).send("Aucune page trouvée")
})

// Créer le serveur HTTPS

const httpsServer = https.createServer(credentials, app);

const db = require('./database'); // Connexion à la base de données

// Démarrage du serveur
httpsServer.listen(443, () => {
    console.log('Server running on port https://localhost:443/user');
});