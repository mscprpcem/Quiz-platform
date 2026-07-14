const { Sequelize } = require("sequelize");
const path = require("path");
require("dotenv").config();

let sequelize;

if (process.env.DATABASE_URL) {

    console.log("Using Neon PostgreSQL");

    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: "postgres",
        logging: false,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
    });

} else {

    console.log("Using SQLite");

    const sqlitePath = path.join(__dirname, "..", "..", "database.sqlite");

    sequelize = new Sequelize({
        dialect: "sqlite",
        storage: sqlitePath,
        logging: false
    });

}

module.exports = sequelize;