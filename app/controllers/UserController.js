module.exports = {
    get: (req, res) => {
        res.sendFile('login.html', { root: './view' });  // Page de connexion
    }
};
