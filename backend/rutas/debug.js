// backend/rutas/debug.js
const express = require("express");
const router = express.Router();
const { query } = require("../config/db");
const { enviarEmailPrueba } = require("../servicios/emailServicio");
const fs = require("fs");
const path = require("path");

// GET /api/debug/test-db
router.get("/test-db", async (req, res) => {
  try {
    const filas = await query("SELECT 1 + 1 AS resultado", [], req.dbConfig);
    res.json({ exito: true, filas });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/debug/ventas-sucursales
router.get("/ventas-sucursales", async (req, res) => {
  try {
    const sql = `
      SELECT count(sucursalesid) AS cantidad_ventas, sucursalesid 
      FROM ventas 
      GROUP BY sucursalesid
    `;
    const filas = await query(sql, [], req.dbConfig);
    res.json(filas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/debug/email-prueba
router.post("/email-prueba", async (req, res) => {
  const { destinatario = "marioalejandro138@gmail.com" } = req.body;
  try {
    const resultado = await enviarEmailPrueba(destinatario);
    res.json({
      exito: true,
      mensaje: `Correo enviado con éxito a ${destinatario}`,
      messageId: resultado.messageId,
    });
  } catch (error) {
    console.error("Error al enviar email de prueba:", error);
    res.status(500).json({
      exito: false,
      error: error.message,
    });
  }
});

// Endpoint de prueba para servir la foto fija del NAS
router.get("/foto-prueba-nas", (req, res) => {
  const rutaFoto = "\\\\192.168.9.73\\EmpleadosArchivosAdjuntos\\2000\\1006\\Foto\\ADMINISTRADOR_PATERNO_ADMIN.jpg";

  if (!fs.existsSync(rutaFoto)) {
    return res.status(404).json({
      error: "La imagen no existe en la ruta especificada",
      ruta: rutaFoto
    });
  }

  res.setHeader("Content-Type", "image/jpeg");
  res.sendFile(path.resolve(rutaFoto));
});

module.exports = router;