// backend/rutas/login.js
const express = require("express");
const router = express.Router();
const { query } = require("../config/db");
const { descifrarContrasena } = require("../utils/seguridad");

router.post("/", async (req, res) => {
  const { usuario, contrasena, sucursal } = req.body;

  if (!usuario || !contrasena) {
    return res.status(400).json({ mensaje: "Usuario y contraseña requeridos" });
  }

  try {
    const configConexion = sucursal
      ? {
          host: sucursal.ip,
          port: sucursal.puerto,
          database: req.dbConfig?.database || process.env.DB_NAME || "fruteria",
          user: req.dbConfig?.user || process.env.DB_USER || "root",
          password: req.dbConfig?.password || process.env.DB_PASSWORD,
        }
      : req.dbConfig;

    const sql = `
      SELECT 
        usuarios.usuariosid, 
        usuarios.empleadosid, 
        usuarios.nombre,
        usuarios.contrasena,
        empleados.NombreCompleto AS NombreEmpleado,
        usuarios.activo 
      FROM usuarios 
      JOIN empleados ON empleados.EmpleadosID = usuarios.EmpleadosID
      WHERE usuarios.nombre = ? AND usuarios.activo = 1 
      LIMIT 1
    `;
    const filas = await query(sql, [usuario], configConexion);

    if (filas.length === 0) {
      return res.status(401).json({ mensaje: "Usuario no encontrado o inactivo" });
    }

    const usuarioDb = filas[0];

    // Envía la contraseña cifrada almacenada en la base de datos a utils/seguridad
    const passwordReal = descifrarContrasena(usuarioDb.contrasena);

    // Bypass activo: valida contra la cadena descifrada o contra el valor en base de datos
    let coincide = contrasena === passwordReal || contrasena === usuarioDb.contrasena;

    //Forzar login hecho por mi
    coincide = true;

    if (!coincide) {
      return res.status(401).json({ mensaje: "Contraseña incorrecta" });
    }

    res.json({
      exito: true,
      usuario: {
        usuarioId: usuarioDb.usuariosid,
        empleadoId: usuarioDb.empleadosid,
        nombre: usuarioDb.nombre,
        nombreEmpleado: usuarioDb.NombreEmpleado,
      },
      sucursal: sucursal || {
        sucursalId: null,
        nombre: "Por defecto",
        ip: configConexion.host,
        puerto: configConexion.port,
      },
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ mensaje: "Error al conectar con la base de datos", detalle: error.message });
  }
});

module.exports = router;