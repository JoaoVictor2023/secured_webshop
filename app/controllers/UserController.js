module.exports = {
    get: (req, res) => {
        res.sendFile('login.html', { root: './view' });  // Page de connexion
    },
    home: (req, res) => {
        res.sendFile('index.html', { root: './view' });  // Page de connexion
    }
};