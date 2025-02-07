const sql = require("mysql");
const dotenv = require("dotenv")
dotenv.config()
const db = sql.createConnection({
    host:"localhost",
    user:"root",
    password:"root",
    database:"db_SecuWeb",
    port:"6033"
})
 
module.exports = db;