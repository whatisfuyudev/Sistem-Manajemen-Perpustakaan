// config/db.config.js
// should be a .env instead

module.exports = {
  HOST: "localhost",
  USER: "postgres",
  PASSWORD: "admin",
  DB: "librarydb",
  dialect: "postgres",
  pool: {
    max: 5,         // Maximum number of connections in pool
    min: 0,         // Minimum number of connections in pool
    acquire: 30000, // Maximum time, in milliseconds, that pool will try to get connection before throwing error
    idle: 10000     // Maximum time, in milliseconds, that a connection can be idle before being released
  }
};
