const express = require('express');
const router = express.Router();
const sql = require('mysql2');
const db = require('../database'); // Connexion à la base de données
const bcrypt = require('bcryptjs'); // Pour comparer et hacher les mots de passe
const path = require('path');


// Contrôleur pour afficher la page de connexion
const controller = require("../controllers/UserController");
router.get('/', controller.get);
router.get('/signup', controller.signup);
router.get('/home', (req, res) => {
    if (req.session.user) {
        const userEmail = req.session.user.email;

        // Récupère le rôle de l'utilisateur dans la base de données
        const query = 'SELECT role FROM t_users WHERE email = ?';
        db.query(query, [userEmail], (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Erreur lors de la récupération du rôle.');
            }

            // Vérifie si l'utilisateur existe
            if (results.length === 0) {
                return res.status(404).send('Utilisateur non trouvé.');
            }

            const role = results[0].role;

            // Envoie le fichier HTML avec la donnée du rôle
            res.send(`
                <!DOCTYPE html>
                <html lang="fr">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Page d'accueil</title>
                </head>
                <body>
                    <h1>Bienvenue, ${userEmail}!</h1>
                    <p>C'est la page d'accueil.</p>

                    <div id="admin-link" style="display: none;">
                        <a href="/admin.html">Accéder à la page d'administration</a>
                    </div>

                    <p><a href="/logout">Se déconnecter</a></p>

                    <script>
                        // On passe le rôle de l'utilisateur directement dans un script
                        const userRole = '${role}';
                        if (userRole === 'admin') {
                            document.getElementById('admin-link').style.display = 'block';
                        }
                    </script>
                </body>
                </html>
            `);
        });
    } else {
        res.redirect('/user');  // Si l'utilisateur n'est pas connecté, redirige vers la page de connexion
    }
});

// Route pour la page admin.html (uniquement pour les administrateurs)
router.get('/admin.html', (req, res) => {
    console.log("Accès à /admin.html - Session:", req.session.user);
    if (req.session.user && req.session.user.role === 'admin') {
        res.sendFile(path.join(__dirname, '../view', 'admin.html')); // Assure-toi que le chemin est correct
    } else {
        console.log("Redirection car pas admin");
        res.redirect('/user/home');
    }
});

// Route pour se déconnecter
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Erreur lors de la déconnexion.');
        }
        res.redirect('/user');  // Redirige vers la page de connexion
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



router.get('/admin', (req, res) => {
    // Vérifier si l'utilisateur est connecté et est un administrateur
    const userEmail = req.session.user?.email;
    if (!userEmail) {
        return res.redirect('/user/login'); // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
    }

    const query = 'SELECT role FROM t_users WHERE email = ?';
    db.query(query, [userEmail], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Erreur lors de la vérification du rôle.');
        }

        // Vérifier si l'utilisateur a le rôle d'administrateur
        if (results.length === 0 || results[0].role !== 'admin') {
            return res.status(403).send('Accès interdit. Vous devez être un administrateur.');
        }

        // Si l'utilisateur est un admin, afficher la page d'administration
        res.render('admin');
    });
});




// Route GET pour récupérer tous les utilisateurs (accessible uniquement aux administrateurs)
router.get('/admin/users', (req, res) => {
    // Vérifier si l'utilisateur est un administrateur
    const userEmail = req.session.user?.email; // Accéder à l'email dans req.session.user
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
            res.status(200).json({ success: true, redirect: '/user' });
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
            req.session.user = { email: user.email, role: user.role }; // Stocke aussi le rôle
            return res.redirect('/user/home');
        } else {
            return res.status(401).send('Mot de passe incorrect');
        }
    });
});


module.exports = router;