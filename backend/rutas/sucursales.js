// backend/rutas/sucursales.js
const express = require("express");
const router = express.Router();
const { query } = require("../config/db");

router.get("/", async (req, res) => {
  try {
    // 1. Consultar sucursales de la base de datos
    const sql = `
      SELECT 
        SucursalesID AS sucursalId,
        Nombre AS nombre,
        EmpresasID AS empresaId,
        DireccionIP AS direccionCompleta,
        activo
      FROM sucursales
      WHERE activo = 1
      ORDER BY Nombre ASC
    `;
    const filas = await query(sql);

    // 2. Mapear y separar IP y puerto
    const sucursalesFormateadas = (filas || []).map((suc) => {
      let ip = "127.0.0.1";
      let puerto = 3306;

      if (suc.direccionCompleta) {
        const partes = String(suc.direccionCompleta).trim().split(":");
        ip = partes[0] || "127.0.0.1";
        puerto = partes[1] ? Number(partes[1]) : 3306;
      }

      return {
        sucursalId: suc.sucursalId,
        nombre: suc.nombre,
        empresaId: suc.empresaId,
        direccionCompleta: suc.direccionCompleta,
        ip,
        puerto,
      };
    });

    // 3. Filtrar estrictamente las sucursales con puerto 3306
    const sucursales3306 = sucursalesFormateadas.filter(
      (suc) => Number(suc.puerto) === 3306
    );

    // 4. Agregar la opción local de desarrollo al inicio (si la manejas) y responder
    const listaFinal = [
      {
        sucursalId: 0,
        nombre: "Localhost (Desarrollo)",
        empresaId: 1,
        direccionCompleta: "127.0.0.1:3306",
        ip: "127.0.0.1",
        puerto: 3306,
      },
      ...sucursales3306,
    ];

    res.json(listaFinal);
  } catch (error) {
    console.error("Error al obtener sucursales:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;