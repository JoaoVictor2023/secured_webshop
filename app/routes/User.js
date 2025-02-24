const express = require('express');
const router = express.Router();
const sql = require('mysql2');
const db = require('../database'); // Connexion à la base de données
const bcrypt = require('bcryptjs'); // Pour comparer et hacher les mots de passe

// Contrôleur pour afficher la page de connexion
const controller = require("../controllers/UserController");
router.get('/', controller.get);
router.get('/home', controller.home);
// Route POST pour l'inscription (création d'un nouvel utilisateur)
router.post('/signup', async (req, res) => {
    const { email, password } = req.body;
    
    // Vérification que l'email et le mot de passe sont fournis
    if (!email || !password) {
        return res.status(400).send('Email et mot de passe sont obligatoires !');
    }
    console.log(req.body);

    try {
        // Hachage du mot de passe avant de l'enregistrer dans la base de données
        const salt = await bcrypt.genSalt(10); // Crée un sel avec une complexité de 10
        const hashedPassword = await bcrypt.hash(password, salt); // Hache le mot de passe avec le sel

        // Requête SQL pour insérer un nouvel utilisateur avec le mot de passe haché
        const query = 'INSERT INTO t_users (email, mdpHash) VALUES (?, ?)';
        db.query(query, [email, hashedPassword], (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Erreur lors de l\'enregistrement de l\'utilisateur');
            }
            res.status(200).send('Utilisateur créé avec succès');
        });
    } catch (err) {
        console.error(err);
        return res.status(500).send('Erreur lors du hachage du mot de passe');
    }
});

// Route POST pour la connexion
router.post('/', (req, res) => {
    const { email, password } = req.body;

    // Vérification des champs email et mot de passe
    if (!email || !password) {
        return res.status(400).send('Email et mot de passe sont obligatoires !');
    }

    // Requête pour trouver l'utilisateur avec l'email fourni
    const query = 'SELECT * FROM t_users WHERE email = ?';
    db.query(query, [email], async (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Erreur lors de la recherche de l\'utilisateur');
        }

        // Si aucun utilisateur n'est trouvé
        if (results.length === 0) {
            return res.status(401).send('Utilisateur non trouvé');
        }

        // Récupérer l'utilisateur et comparer le mot de passe
        const user = results[0];

        // Comparaison du mot de passe envoyé avec celui stocké (haché)
        const match = await bcrypt.compareSync(password, user.mdpHash);
        if (match) {
            return res.redirect('/user/home');
        } else {            
            return res.status(401).send('Mot de passe incorrect');
        }
        
    });
});

module.exports = router;
