// backend/config/db.js
const mysql = require("mysql2/promise");
require("dotenv").config();

// Almacén de pools en memoria: "host:port/database" => pool
const pools = new Map();

/**
 * Obtiene o crea un pool de conexiones para una sucursal o base de datos específica.
 */
function getPool(config = {}) {
  // Soporta tanto host/port como ip/puerto (del middleware de sucursales)
  const host = config.host || config.ip || process.env.DB_HOST || "127.0.0.1";
  const port = Number(config.port || config.puerto || process.env.DB_PORT) || 3306;
  const database = config.database || process.env.DB_NAME || "fruteria";
  const user = config.user || process.env.DB_USER || "root";
  const password = config.password !== undefined ? config.password : (process.env.DB_PASSWORD || "");

  const clavePool = `${host}:${port}/${database}`;

  if (!pools.has(clavePool)) {
    const nuevoPool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 5000,
    });

    pools.set(clavePool, nuevoPool);
  }

  return pools.get(clavePool);
}

/**
 * Función auxiliar para ejecutar consultas directamente.
 */
async function query(sql, params = [], configConexion = {}) {
  const pool = getPool(configConexion);
  const [rows] = await pool.query(sql, params);
  return rows;
}

module.exports = { getPool, query };