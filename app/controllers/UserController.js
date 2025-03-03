module.exports = {
    get: (req, res) => {
        res.sendFile('login.html', { root: './view' });  // Page de connexion
    },
    home: (req, res) => {
        res.sendFile('index.html', { root: './view' });  // Page d'accueil pour les utilisateurs
    },
    Admin: (req, res) => {
        res.sendFile('admin.html', { root: './view' });  // Page d'administration pour les admins
    },
    signup: (req, res) => {
        res.sendFile('signup.html', { root: './view' });  // Page d'inscription
    }
};
