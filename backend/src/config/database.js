const { Sequelize } = require("sequelize");
const path = require("path");
require("dotenv").config();

let sequelize;

const isProduction = process.env.NODE_ENV === "production" || process.env.USE_POSTGRES === "true";
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0);

if (hasDatabaseUrl && isProduction) {
    console.log("🐘 Connecting to Neon PostgreSQL (Production Mode)...");

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
                rejectUnauthorized: false
            }
        }
    });

} else {
    console.log("📁 Using Local SQLite Database (Local Development Mode)...");

    const sqlitePath = path.join(__dirname, "..", "..", "database.sqlite");

    sequelize = new Sequelize({
        dialect: "sqlite",
        storage: sqlitePath,
        logging: false
    });
}

module.exports = sequelize;