const express = require('express');
const router = express.Router();
const db = require('../database'); // Connexion à la base de données
const bcrypt = require('bcryptjs'); // Pour comparer le mot de passe de manière sécurisée

// Contrôleur pour afficher la page de connexion
const controller = require("../controllers/UserController");
router.get('/', controller.get);

// Route POST pour la connexion
router.post('/', (req, res) => {
    const { email, password } = req.body;
    console.log(req.body)
    // Vérifier si l'email et le mot de passe sont envoyés
    if (!email || !password) {
        return res.status(400).send('Email et mot de passe sont obligatoires !');
    }

    // Requête SQL pour trouver l'utilisateur avec l'email donné
    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], async (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Erreur lors de la recherche de l\'utilisateur');
        }

        if (results.length === 0) {
            return res.status(401).send('Utilisateur non trouvé');
        }

        const user = results[0];

        // Comparer le mot de passe envoyé avec celui stocké (hashé)
        const match = await bcrypt.compare(password, user.password);
        if (match) {
            return res.status(200).send('Connexion réussie');
        } else {
            return res.status(401).send('Mot de passe incorrect');
        }
    });
});

module.exports = router;
