// backend/rutas/salas.js
const express = require("express");
const router = express.Router();
const { query } = require("../config/db");
const {
  enviarInvitacionReunion,
  enviarCancelacionReunion,
} = require("../servicios/emailServicio");

// Orden canónico de la semana
const ORDEN_SEMANA = ["LUN", "MAR", "MIE", "JUE", "VIE", "SAB", "DOM"];

function normalizarDias(cadena) {
  if (!cadena || typeof cadena !== "string") return "LUN;MAR;MIE;JUE;VIE;SAB;DOM";
  return cadena
    .split(";")
    .map((d) => d.trim().toUpperCase())
    .filter(Boolean)
    .sort((a, b) => ORDEN_SEMANA.indexOf(a) - ORDEN_SEMANA.indexOf(b))
    .join(";");
}

// 1. Obtener salas con estado de disponibilidad actual, horarios y días
router.get("/", async (req, res) => {
  const { sucursalId, incluirInactivas } = req.query;

  try {
    let filtroSucursal = "";
    const params = [];

    if (sucursalId !== undefined && sucursalId !== "todas") {
      filtroSucursal = "AND (s.SucursalesID = ? OR s.SucursalesID = -1)";
      params.push(Number(sucursalId));
    }

    const filtroActivo = incluirInactivas === "true" ? "" : "AND s.Activo = 1";

    const sql = `
      SELECT 
        s.SalasID AS salasid,
        s.Nombre AS nombre,
        s.Descripcion AS descripcion,
        s.SucursalesID AS sucursalesid,
        s.Activo AS activo,
        s.Capacidad AS capacidad,
        s.Sobrecargo AS sobrecargo,
        s.Mapa AS mapa,
        s.HoraApertura AS horaapertura,
        s.HoraCierre AS horacierre,
        s.DiasDisponible AS diasdisponible,
        r.ReunionesID AS reunion_activa_id,
        r.Tema AS reunion_tema,
        r.FechaHoraInicio AS fechahorainicio,
        r.FechaHoraFin AS fechahorafin,
        CASE 
          WHEN r.ReunionesID IS NOT NULL THEN 'Ocupada'
          ELSE 'Disponible'
        END AS estado_actual
      FROM salas s
      LEFT JOIN reuniones r ON s.SalasID = r.SalasID 
        AND r.Activo = 1 
        AND NOW() BETWEEN r.FechaHoraInicio AND r.FechaHoraFin
      WHERE 1=1 ${filtroActivo} ${filtroSucursal}
      ORDER BY s.SalasID ASC
    `;

    const salas = await query(sql, params, req.dbConfig);
    res.json(salas);
  } catch (error) {
    console.error("Error al obtener salas:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/salas/dashboard - Métricas reales del Dashboard
router.get("/dashboard", async (req, res) => {
  const dias = Math.max(1, parseInt(req.query.dias, 10) || 30);

  try {
    const sqlSalas = `
      SELECT 
        s.SalasID,
        s.Nombre,
        CASE 
          WHEN r.ReunionesID IS NOT NULL THEN 'Ocupada' 
          ELSE 'Disponible' 
        END AS estado_actual
      FROM salas s
      LEFT JOIN reuniones r ON s.SalasID = r.SalasID 
        AND r.Activo = 1 
        AND NOW() BETWEEN r.FechaHoraInicio AND r.FechaHoraFin
      WHERE s.Activo = 1
    `;
    const salas = await query(sqlSalas, [], req.dbConfig);

    const totalSalas = salas.length;
    const salasOcupadas = salas.filter((s) => s.estado_actual === "Ocupada").length;
    const salasLibres = totalSalas - salasOcupadas;

    const sqlTotalReuniones = `
      SELECT COUNT(*) AS total 
      FROM reuniones 
      WHERE Activo = 1 
        AND FechaHoraInicio >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    `;
    const resTotal = await query(sqlTotalReuniones, [dias], req.dbConfig);
    const totalReuniones = Number(resTotal[0]?.total || 0);

    const sqlDeptos = `
      SELECT 
        COALESCE(departamentos.Descripcion, 'Sin Departamento') AS nombre,
        COUNT(reuniones.ReunionesID) AS cantidad
      FROM reuniones
      JOIN empleados ON reuniones.EmpleadosID = empleados.EmpleadosID
      JOIN departamentos ON departamentos.DepartamentosID = empleados.DepartamentosID
      WHERE reuniones.Activo = 1 
        AND reuniones.FechaHoraInicio >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY departamentos.DepartamentosID, departamentos.Descripcion
      ORDER BY cantidad DESC
      LIMIT 3
    `;
    const deptos = await query(sqlDeptos, [dias], req.dbConfig);

    const sqlTendencia = `
      SELECT 
        WEEKDAY(FechaHoraInicio) AS dia_semana,
        COUNT(*) AS total
      FROM reuniones
      WHERE Activo = 1 
        AND FechaHoraInicio >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY WEEKDAY(FechaHoraInicio)
      ORDER BY dia_semana ASC
    `;
    const tendenciaRaw = await query(sqlTendencia, [dias], req.dbConfig);
    const tendencia = [0, 1, 2, 3, 4, 5, 6].map((diaIdx) => {
      const match = tendenciaRaw.find((t) => Number(t.dia_semana) === diaIdx);
      return match ? Number(match.total) : 0;
    });

    const sqlProximas = `
      SELECT 
        r.ReunionesID,
        r.Tema,
        r.FechaHoraInicio,
        s.Nombre AS sala_nombre,
        COALESCE(d.Descripcion, 'General') AS depto_nombre
      FROM reuniones r
      LEFT JOIN salas s ON s.SalasID = r.SalasID
      LEFT JOIN empleados e ON e.EmpleadosID = r.EmpleadosID
      LEFT JOIN departamentos d ON d.DepartamentosID = e.DepartamentosID
      WHERE r.Activo = 1 
        AND r.FechaHoraInicio >= NOW()
      ORDER BY r.FechaHoraInicio ASC
      LIMIT 5
    `;
    const proximas = await query(sqlProximas, [], req.dbConfig);

    res.json({
      kpis: {
        totalSalas,
        salasLibres,
        salasOcupadas,
        totalReuniones,
      },
      departamentos: deptos,
      tendencia,
      proximas,
    });
  } catch (error) {
    console.error("Error al obtener métricas del dashboard:", error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Confirmación pública de asistencia (siempre apunta a localhost)
router.get("/confirmar-asistencia", async (req, res) => {
  const { id, codigo } = req.query;

  if (!id || !codigo) {
    return res.status(400).json({
      exito: false,
      mensaje: "Parámetros incompletos de confirmación.",
    });
  }

  // Conexión forzada a localhost donde residen las tablas del módulo
  const dbLocal = {
    host: "127.0.0.1",
    ip: "127.0.0.1",
    port: 3306,
    puerto: 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : "",
    database: process.env.DB_NAME || "fruteria",
  };

  try {
    const sqlBuscar = `
      SELECT 
        rd.ReunionesDetallesID,
        rd.Confirmado,
        rd.EsInvitado,
        rd.EmpleadosID,
        rd.NumeroSilla,
        r.Tema,
        r.Descripcion,
        r.FechaHoraInicio,
        r.FechaHoraFin,
        s.Nombre AS nombre_sala
      FROM reunionesdetalles rd
      JOIN reuniones r ON r.ReunionesID = rd.ReunionesID
      JOIN salas s ON s.SalasID = r.SalasID
      WHERE rd.ReunionesDetallesID = ? AND rd.CodigoInvitacion = ?
      LIMIT 1
    `;

    const filas = await query(sqlBuscar, [Number(id), String(codigo).trim()], dbLocal);

    if (!filas || filas.length === 0) {
      return res.status(404).json({
        exito: false,
        mensaje: "La invitación no fue encontrada o el código de acceso es incorrecto.",
      });
    }

    const detalle = filas[0];

    // Marcar como confirmado = 1
    await query(
      "UPDATE reunionesdetalles SET Confirmado = 1 WHERE ReunionesDetallesID = ?",
      [detalle.ReunionesDetallesID],
      dbLocal
    );

    // Obtener nombre del participante
    let nombreParticipante = "Participante";
    if (detalle.EsInvitado === 1) {
      const inv = await query(
        "SELECT nombrecompleto FROM invitados WHERE invitadosid = ?",
        [detalle.EmpleadosID],
        dbLocal
      );
      if (inv.length > 0) nombreParticipante = inv[0].nombrecompleto;
    } else {
      const emp = await query(
        "SELECT NombreCompleto FROM empleados WHERE EmpleadosID = ?",
        [detalle.EmpleadosID],
        dbLocal
      );
      if (emp.length > 0) nombreParticipante = emp[0].NombreCompleto;
    }

    const fechaInicioObj = new Date(detalle.FechaHoraInicio);
    const fechaFinObj = new Date(detalle.FechaHoraFin);

    res.json({
      exito: true,
      mensaje: "¡Tu asistencia ha sido confirmada con éxito!",
      reunion: {
        tema: detalle.Tema,
        sala: detalle.nombre_sala,
        fecha: fechaInicioObj.toLocaleDateString(),
        horario: `${fechaInicioObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${fechaFinObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
        silla: detalle.NumeroSilla,
        participante: nombreParticipante,
      },
    });
  } catch (error) {
    console.error("Error al confirmar asistencia en base de datos:", error);
    res.status(500).json({ exito: false, mensaje: error.message });
  }
});

// GET /api/salas/todas-mes-reuniones - Reuniones activas de TODAS las salas en un mes
router.get("/todas-mes-reuniones", async (req, res) => {
  const { anio, mes } = req.query;

  if (!anio || !mes) {
    return res.status(400).json({ error: "Se requieren los parámetros 'anio' y 'mes'" });
  }

  try {
    const sql = `
      SELECT 
        r.ReunionesID AS reunionesid,
        r.SalasID AS salasid,
        r.Tema AS tema,
        r.Descripcion AS descripcion,
        DATE(r.FechaHoraInicio) AS fecha,
        r.FechaHoraInicio AS fechahorainicio,
        r.FechaHoraFin AS fechahorafin,
        s.Nombre AS sala_nombre,
        COALESCE(e.NombreCompleto, 'No especificado') AS organizador
      FROM reuniones r
      LEFT JOIN salas s ON s.SalasID = r.SalasID
      LEFT JOIN empleados e ON e.EmpleadosID = r.EmpleadosID
      WHERE r.Activo = 1 
        AND YEAR(r.FechaHoraInicio) = ? 
        AND MONTH(r.FechaHoraInicio) = ?
      ORDER BY r.FechaHoraInicio ASC
    `;

    const filas = await query(sql, [Number(anio), Number(mes)], req.dbConfig);

    const formateadas = (Array.isArray(filas) ? filas : []).map((r) => {
      const d = new Date(r.fecha);
      const strFecha = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      return {
        ...r,
        fecha: strFecha,
      };
    });

    res.json(formateadas);
  } catch (error) {
    console.error("Error al obtener todas las reuniones del mes:", error);
    res.status(500).json({ error: error.message });
  }
});

// 4. Línea de tiempo diaria con conteo de convocados y confirmados + organizador
router.get("/:id/horarios", async (req, res) => {
  const { id } = req.params;
  const { fecha } = req.query;

  if (!fecha) {
    return res.status(400).json({ error: "Se requiere el parámetro fecha (YYYY-MM-DD)" });
  }

  try {
    const sql = `
      SELECT 
        r.ReunionesID AS reunionesid,
        r.SalasID AS salasid,
        r.Tema AS tema,
        r.Descripcion AS descripcion,
        r.FechaHoraInicio AS fechahorainicio,
        r.FechaHoraFin AS fechahorafin,
        r.EmpleadosID AS empleadosid,
        COALESCE(e.NombreCompleto, 'No especificado') AS organizador,
        COUNT(rd.ReunionesDetallesID) AS total_invitados,
        SUM(CASE WHEN rd.Confirmado = 1 THEN 1 ELSE 0 END) AS total_confirmados
      FROM reuniones r
      LEFT JOIN empleados e ON e.EmpleadosID = r.EmpleadosID
      LEFT JOIN reunionesdetalles rd ON rd.ReunionesID = r.ReunionesID
      WHERE r.SalasID = ? 
        AND r.Activo = 1 
        AND DATE(r.FechaHoraInicio) = ?
      GROUP BY r.ReunionesID, e.NombreCompleto
      ORDER BY r.FechaHoraInicio ASC
    `;

    const rows = await query(sql, [id, fecha], req.dbConfig);
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener cronograma:", error);
    res.status(500).json({ error: error.message });
  }
});

// 5. Catálogo unificado de participantes activos
router.get("/participantes-catalogo", async (req, res) => {
  try {
    const sqlEmpleados = `
      SELECT 
        empleados.EmpleadosID AS id,
        empleados.Codigo AS codigo,
        empleados.NombreCompleto AS nombre,
        empleados.CorreoElectronico AS correo,
        puestos.Nombre AS puesto,
        sucursales.Nombre AS sucursal,
        0 AS esInvitado
      FROM empleados
      LEFT JOIN puestos ON puestos.PuestosID = empleados.PuestosID
      LEFT JOIN sucursales ON sucursales.SucursalesID = empleados.SucursalesID
      WHERE empleados.Activo = 1
      ORDER BY empleados.NombreCompleto ASC
    `;

    const sqlInvitados = `
      SELECT 
        invitados.invitadosid AS id,
        '' AS codigo,
        invitados.nombrecompleto AS nombre,
        invitados.correo AS correo,
        'Invitado Externo' AS puesto,
        'Externo' AS sucursal,
        1 AS esInvitado
      FROM invitados
      WHERE invitados.activo = 1
      ORDER BY invitados.nombrecompleto ASC
    `;

    const [empleados, invitados] = await Promise.all([
      query(sqlEmpleados, [], req.dbConfig),
      query(sqlInvitados, [], req.dbConfig),
    ]);

    res.json({
      empleados: Array.isArray(empleados) ? empleados : [],
      invitados: Array.isArray(invitados) ? invitados : [],
    });
  } catch (error) {
    console.error("Error al consultar catálogo de participantes:", error);
    res.status(500).json({ error: error.message });
  }
});

// 6. Crear o Modificar Sala
router.post("/guardar-sala", async (req, res) => {
  const {
    salasid,
    nombre,
    descripcion,
    sucursalesid,
    capacidad,
    sobrecargo,
    activo,
    mapa,
    horaapertura,
    horacierre,
    diasdisponible,
  } = req.body;

  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ mensaje: "El nombre de la sala es obligatorio." });
  }

  const strMapa = typeof mapa === "object" ? JSON.stringify(mapa) : mapa || null;
  const valActivo = activo === false || activo === 0 ? 0 : 1;
  const valApertura = horaapertura || "08:00:00";
  const valCierre = horacierre || "20:00:00";
  const valDias = normalizarDias(diasdisponible);

  try {
    if (salasid) {
      const sqlUpdate = `
        UPDATE salas 
        SET 
          Nombre = ?,
          Descripcion = ?,
          SucursalesID = ?,
          Capacidad = ?,
          Sobrecargo = ?,
          Activo = ?,
          Mapa = ?,
          HoraApertura = ?,
          HoraCierre = ?,
          DiasDisponible = ?
        WHERE SalasID = ?
      `;
      await query(
        sqlUpdate,
        [
          nombre.trim(),
          descripcion || null,
          Number(sucursalesid),
          Number(capacidad) || 0,
          Number(sobrecargo) || 0,
          valActivo,
          strMapa,
          valApertura,
          valCierre,
          valDias,
          Number(salasid),
        ],
        req.dbConfig
      );
      return res.json({ mensaje: "Sala actualizada con éxito" });
    } else {
      const sqlInsert = `
        INSERT INTO salas 
          (Nombre, Descripcion, SucursalesID, Capacidad, Sobrecargo, Activo, Mapa, HoraApertura, HoraCierre, DiasDisponible)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const result = await query(
        sqlInsert,
        [
          nombre.trim(),
          descripcion || null,
          Number(sucursalesid),
          Number(capacidad) || 0,
          Number(sobrecargo) || 0,
          valActivo,
          strMapa,
          valApertura,
          valCierre,
          valDias,
        ],
        req.dbConfig
      );
      return res.json({ mensaje: "Sala creada con éxito", salasid: result.insertId });
    }
  } catch (error) {
    console.error("Error al guardar sala:", error);
    return res.status(500).json({ mensaje: "Error al guardar sala: " + error.message });
  }
});

// 7. Agendar reunión (guarda EmpleadosID)
router.post("/reuniones", async (req, res) => {
  const {
    salasid,
    fechahorainicio,
    fechahorafin,
    tema,
    descripcion,
    invitados,
    empleadosid,
    EmpleadosID,
    enviarCorreo,
    urlFrontend,
  } = req.body;

  if (!salasid || !fechahorainicio || !fechahorafin || !tema?.trim()) {
    return res.status(400).json({ mensaje: "Faltan datos obligatorios para agendar la reunión." });
  }

  // Capturar empleadosid sin importar mayúsculas/minúsculas
  const idEmpleadoCreador = empleadosid || EmpleadosID || null;

  try {
    const sqlValidar = `
      SELECT ReunionesID FROM reuniones 
      WHERE SalasID = ? AND Activo = 1 
        AND (? < FechaHoraFin AND ? > FechaHoraInicio)
    `;
    const traslapes = await query(sqlValidar, [salasid, fechahorainicio, fechahorafin], req.dbConfig);
    if (traslapes.length > 0) {
      return res.status(400).json({ mensaje: "El horario seleccionado ya está ocupado por otra reunión." });
    }

    // Consulta nombre de sala
    const salaFila = await query("SELECT Nombre FROM salas WHERE SalasID = ?", [salasid], req.dbConfig);
    const nombreSala = salaFila[0]?.Nombre || "Sala de Juntas";

    // Inserción asegurando el campo EmpleadosID
    const sqlReunion = `
      INSERT INTO reuniones (SalasID, EmpleadosID, Activo, FechaHoraInicio, FechaHoraFin, Tema, Descripcion)
      VALUES (?, ?, 1, ?, ?, ?, ?)
    `;
    const resultado = await query(
      sqlReunion,
      [
        Number(salasid),
        idEmpleadoCreador ? Number(idEmpleadoCreador) : null,
        fechahorainicio,
        fechahorafin,
        tema.trim(),
        descripcion || "",
      ],
      req.dbConfig
    );
    const reunionId = resultado.insertId;

    // ... resto del despacho de correos e inserción en reunionesdetalles ...

    if (Array.isArray(invitados) && invitados.length > 0) {
      // Extraer fecha y horas limpias (YYYY-MM-DD y HH:MM)
      const fechaStr = fechahorainicio.split(" ")[0];
      const horaInicioStr = fechahorainicio.split(" ")[1]?.slice(0, 5) || "";
      const horaFinStr = fechahorafin.split(" ")[1]?.slice(0, 5) || "";

      for (const inv of invitados) {
        const codigoInvitacion = Math.random().toString(36).substring(2, 10).toUpperCase();
        const sqlDetalle = `
          INSERT INTO reunionesdetalles 
          (ReunionesID, EmpleadosID, EsInvitado, NumeroSilla, Confirmado, CodigoInvitacion)
          VALUES (?, ?, ?, ?, 0, ?)
        `;
        const resDet = await query(
          sqlDetalle,
          [reunionId, inv.id, inv.esInvitado ? 1 : 0, Number(inv.numeroSilla) || 0, codigoInvitacion],
          req.dbConfig
        );

        const debeEnviar = enviarCorreo !== false;

        if (debeEnviar) {
          let emailDestino = inv.correo;
          let nombreDestino = inv.nombre;

          if (!emailDestino) {
            if (inv.esInvitado) {
              const resInv = await query(
                "SELECT correo, nombrecompleto FROM invitados WHERE invitadosid = ?",
                [inv.id],
                req.dbConfig
              );
              if (resInv.length > 0) {
                emailDestino = resInv[0].correo;
                nombreDestino = resInv[0].nombrecompleto;
              }
            } else {
              const resEmp = await query(
                "SELECT CorreoElectronico, NombreCompleto FROM empleados WHERE EmpleadosID = ?",
                [inv.id],
                req.dbConfig
              );
              if (resEmp.length > 0) {
                emailDestino = resEmp[0].CorreoElectronico;
                nombreDestino = resEmp[0].NombreCompleto;
              }
            }
          }

          if (emailDestino && typeof enviarInvitacionReunion === "function") {
            // Se pasan los campos con nombres exactos para evitar 'undefined' en la plantilla
            enviarInvitacionReunion(
              {
                tema: tema.trim(),
                descripcion: descripcion || "",
                fecha: fechaStr,
                horaInicio: horaInicioStr,
                horaFin: horaFinStr,
                nombreSala,
                urlFrontend: urlFrontend || `http://${req.headers.host}`,
              },
              {
                correo: emailDestino,
                nombre: nombreDestino,
                reunionesdetallesid: resDet.insertId,
                codigoinvitacion: codigoInvitacion,
                numeroSilla: Number(inv.numeroSilla) || 0,
              }
            ).catch((e) => console.warn("Fallo al enviar correo a", emailDestino, e.message));
          }
        }
      }
    }

    res.json({ exito: true, reunionId });
  } catch (error) {
    console.error("Error al agendar reunión:", error);
    res.status(500).json({ mensaje: error.message });
  }
});

// 8. Cancelar reunión y notificar sin datos undefined
router.post("/reuniones/:reunionesid/cancelar", async (req, res) => {
  const { reunionesid } = req.params;

  try {
    const sqlInfo = `
      SELECT r.ReunionesID, r.Tema, r.Descripcion, r.FechaHoraInicio, r.FechaHoraFin, s.Nombre AS sala 
      FROM reuniones r 
      LEFT JOIN salas s ON s.SalasID = r.SalasID 
      WHERE r.ReunionesID = ? AND r.Activo = 1
    `;
    const reuniones = await query(sqlInfo, [reunionesid], req.dbConfig);

    if (!reuniones || reuniones.length === 0) {
      return res.status(404).json({ error: "Reunión no encontrada o ya inactiva." });
    }

    const reunion = reuniones[0];
    await query("UPDATE reuniones SET Activo = 0 WHERE ReunionesID = ?", [reunionesid], req.dbConfig);
    res.json({ exito: true, mensaje: "Reunión cancelada correctamente." });

    (async () => {
      try {
        const detalles = await query(
          "SELECT EmpleadosID, EsInvitado FROM reunionesdetalles WHERE ReunionesID = ?",
          [reunionesid],
          req.dbConfig
        );

        const fechaObj = new Date(reunion.FechaHoraInicio);
        const fechaFinObj = new Date(reunion.FechaHoraFin);

        const infoCancelacion = {
          tema: reunion.Tema,
          descripcion: reunion.Descripcion || "",
          fecha: fechaObj.toISOString().split("T")[0],
          horaInicio: fechaObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          horaFin: fechaFinObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          sala: reunion.sala || "Sala de Juntas",
        };

        for (const part of detalles) {
          let destinatario = null;
          if (part.EsInvitado === 0) {
            const emps = await query(
              "SELECT CorreoElectronico AS correo, NombreCompleto AS nombre FROM empleados WHERE EmpleadosID = ?",
              [part.EmpleadosID],
              req.dbConfig
            );
            if (emps.length > 0) destinatario = emps[0];
          } else {
            const invs = await query(
              "SELECT correo, nombrecompleto AS nombre FROM invitados WHERE invitadosid = ?",
              [part.EmpleadosID],
              req.dbConfig
            );
            if (invs.length > 0) destinatario = invs[0];
          }

          if (destinatario?.correo && typeof enviarCancelacionReunion === "function") {
            await enviarCancelacionReunion(infoCancelacion, destinatario);
          }
        }
      } catch (err) {
        console.warn("Error al notificar cancelación:", err.message);
      }
    })();
  } catch (error) {
    console.error("Error al cancelar reunión:", error);
    res.status(500).json({ error: error.message });
  }
});

// 9. Catálogo de Invitados
router.get("/invitados", async (req, res) => {
  const { estado } = req.query;
  try {
    let filtroSql = "";
    if (estado === "activos") filtroSql = "WHERE activo = 1";
    else if (estado === "inactivos") filtroSql = "WHERE activo = 0";

    const sql = `
      SELECT invitadosid, activo, correo, nombrecompleto, descripcion 
      FROM invitados 
      ${filtroSql}
      ORDER BY nombrecompleto ASC
    `;
    const filas = await query(sql, [], req.dbConfig);
    res.json(filas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/invitados", async (req, res) => {
  const { nombrecompleto, correo, descripcion } = req.body;
  if (!nombrecompleto?.trim()) {
    return res.status(400).json({ mensaje: "El nombre completo es requerido" });
  }
  try {
    const sql = `INSERT INTO invitados (activo, correo, nombrecompleto, descripcion) VALUES (1, ?, ?, ?)`;
    const resultado = await query(sql, [correo || "", nombrecompleto.trim(), descripcion || ""], req.dbConfig);
    res.json({ exito: true, invitadosid: resultado.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/invitados/:id", async (req, res) => {
  const { id } = req.params;
  const { nombrecompleto, correo, descripcion, activo } = req.body;
  try {
    const sql = `
      UPDATE invitados 
      SET nombrecompleto = ?, correo = ?, descripcion = ?, activo = ? 
      WHERE invitadosid = ?
    `;
    await query(sql, [nombrecompleto.trim(), correo || "", descripcion || "", activo ? 1 : 0, id], req.dbConfig);
    res.json({ exito: true, mensaje: "Invitado actualizado correctamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para obtener todas las reuniones de una sala en un mes específico (para el calendario mensual)
router.get("/:id/mes-reuniones", async (req, res) => {
  const { id } = req.params;
  const { anio, mes } = req.query; // mes en formato 1 a 12

  if (!anio || !mes) {
    return res.status(400).json({ error: "Se requieren los parámetros 'anio' y 'mes'" });
  }

  try {
    const sql = `
      SELECT 
        ReunionesID AS reunionesid,
        Tema AS tema,
        DATE(FechaHoraInicio) AS fecha,
        FechaHoraInicio AS fechahorainicio,
        FechaHoraFin AS fechahorafin
      FROM reuniones
      WHERE SalasID = ? 
        AND Activo = 1 
        AND YEAR(FechaHoraInicio) = ? 
        AND MONTH(FechaHoraInicio) = ?
      ORDER BY FechaHoraInicio ASC
    `;

    const filas = await query(sql, [Number(id), Number(anio), Number(mes)], req.dbConfig);

    // Formatear fechas a YYYY-MM-DD para evitar desfases de zona horaria
    const formateadas = (Array.isArray(filas) ? filas : []).map((r) => {
      const d = new Date(r.fecha);
      const strFecha = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      return {
        ...r,
        fecha: strFecha,
      };
    });

    res.json(formateadas);
  } catch (error) {
    console.error("Error al obtener reuniones del mes:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;