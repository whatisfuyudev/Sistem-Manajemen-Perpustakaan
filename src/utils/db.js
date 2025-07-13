const { Sequelize } = require("sequelize");
const dbConfig = require("../config/db.config");

const sequelize = new Sequelize(dbConfig.development.url, {
  dialectOptions: {
    ssl: {
      require: true,
    },
  },
});

module.exports = sequelize;
