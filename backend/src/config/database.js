const { Sequelize } = require("sequelize");
const path = require("path");
require("dotenv").config();

let sequelize;

if (process.env.DATABASE_URL) {

    console.log("Using Neon PostgreSQL");

    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: "postgres",
        logging: false,
        pool: {
            max: 40,
            min: 5,
            acquire: 30000,
            idle: 10000
        },
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'false' ? false : (process.env.NODE_ENV === 'production')
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