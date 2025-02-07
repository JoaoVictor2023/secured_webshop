// Importer les modules nécessaires
const express = require('express');
const fs = require('fs');
const https = require('https');
const path = require('path');
const exp = require('constants');
const app = express();

// Charger les clés SSL
const privateKey = fs.readFileSync('../privkey.key', 'utf8');
const certificate = fs.readFileSync('../certificate.crt', 'utf8');
const credentials = { key: privateKey, cert: certificate };



app.use(express.urlencoded({extended: true}))
app.use(express.json()); // Pour traiter les données JSON
const userRoute = require('./routes/User');
app.use('/user', userRoute);

// Créer le serveur HTTPS
const httpsServer = https.createServer(credentials, app);
const port = 443;

// Démarrage du serveur
httpsServer.listen(port, () => {
    console.log(`Server running on port https://localhost:${port}/user`);
});