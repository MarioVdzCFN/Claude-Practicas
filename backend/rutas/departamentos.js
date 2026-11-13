// backend/rutas/departamentos.js
const express = require("express");
const router = express.Router();
const { query } = require("../config/db");

// 1. Obtener listado de departamentos
router.get("/", async (req, res) => {
  try {
    const { soloActivos } = req.query;
    let sqlFiltro = "";

    if (soloActivos === "true" || soloActivos === "1") {
      sqlFiltro = "WHERE Activo = 1";
    }

    const sql = `
      SELECT 
        DepartamentosID,
        InternalVersion,
        TRIM(Codigo) AS Codigo,
        TRIM(Descripcion) AS Descripcion,
        Activo,
        VerificaSalidaComer,
        MostrarAcomodoArticulos
      FROM departamentos
      ${sqlFiltro}
      ORDER BY Descripcion ASC
    `;

    const filas = await query(sql, [], req.dbConfig);

    const departamentos = filas.map((d) => ({
      id: d.DepartamentosID,
      codigo: d.Codigo || "",
      descripcion: d.Descripcion || "",
      activo: Number(d.Activo) === 1,
      verificaSalidaComer: Number(d.VerificaSalidaComer) === 1,
      mostrarAcomodoArticulos: Number(d.MostrarAcomodoArticulos) === 1,
      internalVersion: d.InternalVersion || 1,
    }));

    res.json(departamentos);
  } catch (error) {
    console.error("Error al obtener departamentos:", error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Alternar estado activo / inactivo (desde los 3 puntos)
router.patch("/:id/alternar-estado", async (req, res) => {
  const { id } = req.params;
  const { nuevoEstado } = req.body;

  try {
    const valorActivo = nuevoEstado ? 1 : 0;
    const sql = `
      UPDATE departamentos 
      SET Activo = ?, InternalVersion = COALESCE(InternalVersion, 0) + 1 
      WHERE DepartamentosID = ?
    `;
    await query(sql, [valorActivo, id], req.dbConfig);

    res.json({
      exito: true,
      mensaje: `Departamento ${nuevoEstado ? "activado" : "desactivado"} correctamente`,
      activo: Boolean(nuevoEstado),
    });
  } catch (error) {
    console.error("Error al cambiar estado de departamento:", error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Guardar Departamento (Crear o Modificar)
router.post("/guardar", async (req, res) => {
  const {
    id,
    codigo,
    descripcion,
    activo = true,
    verificaSalidaComer = false,
    mostrarAcomodoArticulos = false,
  } = req.body;

  try {
    const cod = String(codigo || "").trim().toUpperCase();
    const desc = String(descripcion || "").trim().toUpperCase();
    const act = activo ? 1 : 0;
    const comer = verificaSalidaComer ? 1 : 0;
    const acomodo = mostrarAcomodoArticulos ? 1 : 0;

    if (!desc) {
      return res.status(400).json({ error: "La descripción es requerida" });
    }

    if (id) {
      // Modificación: Incrementa InternalVersion en +1
      const sqlUpdate = `
        UPDATE departamentos SET
          Codigo = ?,
          Descripcion = ?,
          Activo = ?,
          VerificaSalidaComer = ?,
          MostrarAcomodoArticulos = ?,
          InternalVersion = COALESCE(InternalVersion, 0) + 1
        WHERE DepartamentosID = ?
      `;
      await query(sqlUpdate, [cod, desc, act, comer, acomodo, id], req.dbConfig);
      res.json({ exito: true, mensaje: "Departamento modificado con éxito" });
    } else {
      // Nuevo registro: InternalVersion siempre inicia en 1
      const sqlInsert = `
        INSERT INTO departamentos (
          Codigo, 
          Descripcion, 
          Activo, 
          VerificaSalidaComer, 
          MostrarAcomodoArticulos, 
          InternalVersion
        ) VALUES (?, ?, ?, ?, ?, 1)
      `;
      const resultado = await query(sqlInsert, [cod, desc, act, comer, acomodo], req.dbConfig);
      res.json({ exito: true, id: resultado.insertId, mensaje: "Departamento creado con éxito" });
    }
  } catch (error) {
    console.error("Error al guardar departamento:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;