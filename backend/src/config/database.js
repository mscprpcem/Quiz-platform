const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

let sequelize;

const dbHost = process.env.DB_HOST;
const dbPort = process.env.DB_PORT;
const dbName = process.env.DB_NAME;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;

// Check if PostgreSQL configuration is fully provided
if (dbHost && dbName && dbUser && dbPassword) {
  console.log('PostgreSQL configuration found. Initializing connection to PostgreSQL...');
  sequelize = new Sequelize(dbName, dbUser, dbPassword, {
    host: dbHost,
    port: dbPort || 5432,
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  });
} else {
  console.log('PostgreSQL configuration not fully provided. Falling back to local SQLite database...');
  const sqlitePath = path.join(__dirname, '..', '..', 'database.sqlite');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: sqlitePath,
    logging: false,
    hooks: {
      afterConnect: (connection, config) => {
        return new Promise((resolve, reject) => {
          connection.run('PRAGMA foreign_keys = ON;', (err) => {
            if (err) {
              console.error('Failed to enable SQLite foreign keys on connection:', err);
              reject(err);
            } else {
              resolve();
            }
          });
        });
      }
    }
  });
}

module.exports = sequelize;
