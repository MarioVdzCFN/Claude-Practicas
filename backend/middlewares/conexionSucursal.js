// backend/middlewares/conexionSucursal.js
function conexionSucursal(req, res, next) {
    // Se pueden recibir por headers HTTP enviados desde axios/fetch en el frontend
    req.dbConfig = {
      host: req.headers["x-sucursal-ip"] || process.env.DB_HOST,
      port: req.headers["x-sucursal-port"] ? Number(req.headers["x-sucursal-port"]) : Number(process.env.DB_PORT) || 3306,
      database: req.headers["x-db-name"] || process.env.DB_NAME || "fruteria",
    };
    next();
  }
  
  module.exports = conexionSucursal;