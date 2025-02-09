const { Sequelize } = require("sequelize");
const dbConfig = require("../config/db.config");

// Initialize Sequelize (only once)
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  pool: dbConfig.pool,
});

module.exports = sequelize;
