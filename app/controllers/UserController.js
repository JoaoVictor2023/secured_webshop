// const path = require('../view/index.html'); // Importation du module path pour manipuler les chemins des archives

module.exports = {
    get: (req, res) => {
        // res.sendFile('C:/Users/pg05lby/Documents/GitHub/secured_webshop/app/view/index.html')
        
        res.sendFile('index.html', {root: './view'})
    }
}; 