const { Sequelize } = require("sequelize");
const dbConfig = require("../config/db.config");
const pg = require('pg');

const sequelize = new Sequelize(dbConfig.development.url, {
  dialectOptions: {
    ssl: {
      require: true,
    },
  },
  dialectModule: pg
});

module.exports = sequelize;
