require('dotenv').config(); // Pour charger les variables d'environnement
const express = require('express');
const router = express.Router();
const sql = require('mysql2');
const db = require('../database'); // Connexion à la base de données
const bcrypt = require('bcryptjs'); // Pour comparer et hacher les mots de passe
const path = require('path');
const jwt = require('jsonwebtoken'); // Pour générer et vérifier les tokens JWT
const authenticateToken = require('../middleware/authMiddleware'); // Importer le middleware d'authentification

// Contrôleur pour afficher la page de connexion
const controller = require("../controllers/UserController");
router.get('/', controller.get);
router.get('/signup', controller.signup);

// Route pour la page d'accueil (redirige uniquement si l'utilisateur est connecté)
router.get('/home', authenticateToken, (req, res) => {
    res.redirect('/index.html'); // Redirection vers index.html
});

// Route pour la page admin.html (uniquement pour les administrateurs)
router.get('/admin', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        console.log("Redirection car pas admin");
        return res.redirect('/user/home');
    }

    if (!req.query.search) {
        req.query.search = "";
    }

    const users = db.query(
        "SELECT idUser, email, role FROM t_users WHERE email LIKE ?",
        [`%${req.query.search}%`], (err, result) => {

            if(err) {
                console.error("Aie ! une erreur est survenue")
            }
            console.log(result)

            // Si Admin renvoie la page admin
            return res.render("admin.ejs", {
                users: result,
                search: req.query.search,
            });

        });
});


router.get('/session', (req, res) => {
    if (req.session.user) {
        const { email, role } = req.session.user;
        res.json({ email, role });
    } else {
        res.json({ email: null, role: null });
    }
});

// Route GET pour récupérer tous les utilisateurs (accessible uniquement aux administrateurs)
router.get('/admin/users', authenticateToken, (req, res) => {
    // Vérifier si l'utilisateur est un administrateur
    const userEmail = req.user.email; // Accéder à l'email dans req.user
    if (!userEmail) {
        return res.status(401).send('Vous devez être connecté pour voir cette page.');
    }

    // Requête pour vérifier le rôle de l'utilisateur
    const query = 'SELECT role FROM t_users WHERE email = ?';
    db.query(query, [userEmail], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Erreur lors de la vérification du rôle.');
        }

        // Si l'utilisateur n'est pas un admin
        if (results.length === 0 || results[0].role !== 'admin') {
            return res.status(403).send('Accès interdit. Vous devez être un administrateur.');
        }

        // Si l'utilisateur est un admin, récupérer tous les utilisateurs
        const fetchUsersQuery = 'SELECT email, role FROM t_users';
        db.query(fetchUsersQuery, (err, users) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Erreur lors de la récupération des utilisateurs.');
            }
            res.json(users); // Retourne la liste des utilisateurs
        });
    });
});

// Route pour récupérer l'ID de l'utilisateur à partir de son email
router.get('/getUserId/:email', authenticateToken, (req, res) => {
    const email = req.params.email;
    
    const query = 'SELECT idUser FROM t_users WHERE email = ?';
    db.query(query, [email], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Erreur lors de la récupération de l\'ID');
        }

        if (results.length === 0) {
            return res.status(404).send('Utilisateur non trouvé');
        }

        res.json({ id: results[0].idUser });
    });
});

// Route POST pour l'inscription (création d'un nouvel utilisateur)
router.post('/signup', async (req, res) => {
    const { email, password, role } = req.body;

    if (!email || !password) {
        return res.status(400).send('Email et mot de passe sont obligatoires !');
    }

    // Vérifier si le rôle est valide
    const validRoles = ['admin', 'user'];
    const userRole = validRoles.includes(role) ? role : 'user';

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const query = 'INSERT INTO t_users (email, mdpHash, role) VALUES (?, ?, ?)';
        db.query(query, [email, hashedPassword, userRole], (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Erreur lors de l\'enregistrement de l\'utilisateur');
            }
            const token = jwt.sign({ email, role: userRole }, process.env.JWT_SECRET, { expiresIn: '1h' });
            res.cookie('token', token, {
                httpOnly: true,
                secure: true,
                sameSite: 'strict',
                maxAge: 3600000 // 1 heure
            });
            res.status(200).json({ success: true });
        });
    } catch (err) {
        console.error(err);
        return res.status(500).send('Erreur lors du hachage du mot de passe');
    }
});

router.post('/', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send('Email et mot de passe sont obligatoires !');
    }

    const query = 'SELECT * FROM t_users WHERE email = ?';
    db.query(query, [email], async (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Erreur lors de la recherche de l\'utilisateur');
        }

        if (results.length === 0) {
            return res.status(401).send('Utilisateur non trouvé');
        }

        const user = results[0];

        const match = await bcrypt.compare(password, user.mdpHash);

        if (match) {
            const token = jwt.sign({ email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
            res.cookie('token', token, {
                httpOnly: true,
                secure: true,
                sameSite: 'strict',
                maxAge: 3600000 // 1 heure
            });
            return res.status(200).json({ success: true });
        } else {
            return res.status(401).send('Mot de passe incorrect');
        }
    });
});


// Route pour se déconnecter
router.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/user');
});

// Route pour afficher le profil d'un utilisateur
router.get('/:id', authenticateToken, (req, res) => {
    const userId = req.params.id;
    const currentUserEmail = req.user.email;
    const currentUserRole = req.user.role;

    // Vérifier si l'utilisateur actuel est autorisé à voir ce profil
    const query = 'SELECT idUser, email, role FROM t_users WHERE idUser = ?';
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Erreur lors de la récupération du profil');
        }

        if (results.length === 0) {
            return res.status(404).send('Utilisateur non trouvé');
        }

        const profileUser = results[0];

        // Vérifier si l'utilisateur actuel est admin ou le propriétaire du profil
        if (currentUserRole !== 'admin' && currentUserEmail !== profileUser.email) {
            return res.status(403).send('Accès non autorisé');
        }

        // Rendre la vue avec les données de l'utilisateur
        res.render('profile', { user: profileUser });
    });
});


module.exports = router;