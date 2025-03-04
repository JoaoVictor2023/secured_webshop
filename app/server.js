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


// API endpoint to get all users for admin dashboard
app.get('/api/users', (req, res) => {
    // Check if user is admin
    if (!req.session.isAdmin) {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    // Query the database for all users
    db.query(
        'SELECT idUser, email, role FROM t_users',
        (error, results) => {
            if (error) {
                console.error('Database error:', error);
                return res.status(500).json({ error: 'Internal server error' });
            }
            // Return the results as JSON
            res.json(results);
        }
    );
});
 
// API endpoint to get user statistics
app.get('/api/user-stats', (req, res) => {
    // Check if user is admin
    if (req.session.role !== "admin") {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    // Get total users
    db.query('SELECT COUNT(*) as totalUsers FROM t_users', (error, totalResults) => {
        if (error) {
            return res.status(500).json({ error: 'Internal server error' });
        }
        // Get admin count
        db.query('SELECT COUNT(*) as adminCount FROM Users WHERE role = "admin"', (error, adminResults) => {
            if (error) {
                return res.status(500).json({ error: 'Internal server error' });
            }
        });
    });
});


// Créer le serveur HTTPS

const httpsServer = https.createServer(credentials, app);

const db = require('./database'); // Connexion à la base de données

// Démarrage du serveur
httpsServer.listen(443, () => {
    console.log('Server running on port https://localhost:443/user');
});