// backend/rutas/empleados.js
const fs = require("fs");
const path = require("path");
const { conectarNAS, construirRutaEmpleado } = require("../servicios/nasServicio");
const express = require("express");
const router = express.Router();
const { query } = require("../config/db");

// 1. Obtener lista completa de empleados
router.get("/", async (req, res) => {
  try {
    const sql = `
      SELECT 
        Empleados.EmpleadosID AS EmpleadosID, 
        Empleados.PuestosID AS PuestosID, 
        Empleados.SucursalesID AS SucursalesID, 
        Empleados.Nombre AS Nombre, 
        Empleados.ApellidoPaterno AS ApellidoPaterno, 
        Empleados.ApellidoMaterno AS ApellidoMaterno, 
        Empleados.NombreCompleto AS NombreCompleto, 
        Empleados.Activo AS Activo, 
        Sucursales.Nombre AS SucursalNombre,  
        Puestos.Nombre AS PuestoNombre, 
        Empleados.EsDrivers AS EsDrivers, 
        Empleados.SuperAdmin AS SuperAdmin, 
        Empleados.Codigo AS Codigo, 
        Empleados.DepartamentosID AS DepartamentosID, 
        MAX(Usuarios.Nombre) AS Usuario, 
        Empleados.NumeroCompaq AS NumeroCompaq, 
        Empleados.JornadasID AS JornadasID, 
        Jornadas.Nombre AS JornadaNombre, 
        Departamentos.Descripcion AS DepartamentoNombre,  
        Empleados.Baja_Temporal AS Baja_Temporal,
        Empleados.Candidato AS Candidato,
        Empleados.Reingreso AS Reingreso,
        Empleados.ExcluirPrenomina AS ExcluirPrenomina,
        Empleados.CorreoNotificacion AS CorreoNotificacion
      FROM 
        usuarios Usuarios
      RIGHT OUTER JOIN
      (
        departamentos Departamentos
        RIGHT OUTER JOIN
        (
          sucursales Sucursales
          INNER JOIN
          (
            puestos Puestos
            INNER JOIN
            (
              jornadas Jornadas
              RIGHT OUTER JOIN
              empleados Empleados
              ON Empleados.JornadasID = Jornadas.JornadasID
            )
            ON Puestos.PuestosID = Empleados.PuestosID
          )
          ON Sucursales.SucursalesID = Empleados.SucursalesID
        )
        ON Departamentos.DepartamentosID = Empleados.DepartamentosID
      )
      ON Empleados.EmpleadosID = Usuarios.EmpleadosID
      GROUP BY 
        Empleados.EmpleadosID
      ORDER BY 
        Empleados.Nombre ASC
    `;

    const empleados = await query(sql, [], req.dbConfig);
    res.json(Array.isArray(empleados) ? empleados : []);
  } catch (error) {
    console.error("Error al obtener catálogo de empleados:", error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Catálogos para dropdowns (Sucursales, Puestos, Departamentos, Jornadas y Contratos)
router.get("/catalogos-filtros", async (req, res) => {
  try {
    const sqlJornadas = `
      SELECT 
        Jornadas.Nombre AS Nombre,  
        Jornadas.Activo AS Activo,  
        Jornadas.JornadasID AS JornadasID,  
        Jornadas.MaximoHorasTrabajo AS MaximoHorasTrabajo
      FROM 
        Jornadas
      WHERE 
        Jornadas.Activo = 1
      ORDER BY 
        Jornadas.Nombre ASC
    `;

    const sqlContratos = `
      SELECT 
        EstatusContratos.EstatusContratosID AS EstatusContratosID,  
        EstatusContratos.Descripcion AS Descripcion,  
        EstatusContratos.InternalVersion AS InternalVersion
      FROM 
        EstatusContratos
      ORDER BY 
        Descripcion ASC
    `;

    const [departamentos, puestos, sucursales, jornadas, contratos] = await Promise.all([
      query(
        "SELECT DepartamentosID AS id, Descripcion AS nombre FROM departamentos ORDER BY Descripcion ASC",
        [],
        req.dbConfig
      ),
      query(
        "SELECT PuestosID AS id, Nombre AS nombre FROM puestos ORDER BY Nombre ASC",
        [],
        req.dbConfig
      ),
      query(
        "SELECT SucursalesID AS id, Nombre AS nombre FROM sucursales WHERE activo = 1 ORDER BY Nombre ASC",
        [],
        req.dbConfig
      ),
      query(sqlJornadas, [], req.dbConfig),
      query(sqlContratos, [], req.dbConfig),
    ]);

    res.json({
      departamentos: Array.isArray(departamentos) ? departamentos : [],
      puestos: Array.isArray(puestos) ? puestos : [],
      sucursales: Array.isArray(sucursales) ? sucursales : [],
      jornadas: Array.isArray(jornadas) ? jornadas : [],
      contratos: Array.isArray(contratos) ? contratos : [],
    });
  } catch (error) {
    console.error("Error al obtener filtros de empleados:", error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Obtener la información completa de un solo empleado
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `SELECT * FROM empleados WHERE EmpleadosID = ? LIMIT 1`;
    const filas = await query(sql, [id], req.dbConfig);

    if (!filas || filas.length === 0) {
      return res.status(404).json({ error: "Empleado no encontrado" });
    }

    res.json(filas[0]);
  } catch (error) {
    console.error("Error al obtener empleado:", error);
    res.status(500).json({ error: error.message });
  }
});

// 4. Actualizar información completa del empleado
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const datos = req.body;

    const nombre = String(datos.nombre || "").trim();
    const paterno = String(datos.apellidoPaterno || "").trim();
    const materno = String(datos.apellidoMaterno || "").trim();
    const nombreCompleto = `${paterno} ${materno} ${nombre}`.replace(/\s+/g, " ").trim();

    const sql = `
      UPDATE empleados SET
        SucursalesID = ?,
        PuestosID = ?,
        DepartamentosID = ?,
        Codigo = ?,
        NumeroCompaq = ?,
        RegistroPatronal = ?,
        Nombre = ?,
        ApellidoPaterno = ?,
        ApellidoMaterno = ?,
        NombreCompleto = ?,
        Activo = ?,
        FechaIngreso = ?,

        BuscadorNuevo = ?,
        EsJefeDepartamento = ?,
        ChecadaLibre = ?,
        ChecarSinHuella = ?,
        PermiteChecarDespuesdeHorario = ?,
        NoRecontratable = ?,
        PermitirCargarEntradasOC = ?,
        Staff = ?,
        NoSolicitaClavePesoPV = ?,
        PvPedirLecturaMobileApp = ?,
        EsVendedor = ?,
        PagoTarjetaBancaria = ?,
        VerTodasLineas = ?,
        ImporteCancelacion = ?,
        TutorAsignado = ?,

        Sexo = ?,
        FechaNacimiento = ?,
        LugarNacimiento = ?,
        Nacionalidad = ?,
        EstadoCivil = ?,
        Hijos = ?,
        NivelEstudio = ?,
        NoIfe = ?,
        CURP = ?,
        RFC = ?,
        Colonia = ?,
        Calle = ?,
        NumeroCasa = ?,
        CodigoPostal = ?,
        Alergias = ?,
        TipoSangre = ?,
        TallaCamisa = ?,
        NoLicencia = ?,
        VencimientoLicencia = ?,
        TelefonoEmergencia = ?,
        ContactoEmergencia = ?,
        CorreoElectronico = ?,
        CorreoNotificacion = ?,
        RecibeNotificaciones = ?,

        NoSeguroSocial = ?,
        SalarioDiarioIMSS = ?,
        SalarioDiario = ?,
        HorasExtrasFijas = ?,
        NoCreditoInfonavit = ?,
        FactorCreditoInfonavit = ?,
        CreditoFonacot = ?,
        TiempoDescanso = ?,
        HorasMinimasSalidaDescanso = ?,
        FechaProximaEvaluacion = ?,
        FechaProximasVacaciones = ?,
        FechaVencimientoContrato = ?,
        JornadasID = ?,
        EstatusContratosID = ?,
        FechaBaja = ?,
        ExcluirPrenomina = ?,
        CalculoLocalPrenomina = ?
      WHERE EmpleadosID = ?
    `;

    const valores = [
      datos.sucursalesId || null,
      datos.puestosId || null,
      datos.departamentosId || null,
      datos.codigo || null,
      datos.numeroCompaq || null,
      datos.registroPatronal || null,
      nombre,
      paterno,
      materno,
      nombreCompleto,
      Number(datos.activo) === 1 ? 1 : 0,
      datos.fechaIngreso || null,

      datos.buscadorNuevo ? 1 : 0,
      datos.esJefeDepartamento ? 1 : 0,
      datos.checadaLibre ? 1 : 0,
      datos.checarSinHuella ? 1 : 0,
      datos.permiteChecarDespuesdeHorario ? 1 : 0,
      datos.noRecontratable ? 1 : 0,
      datos.permitirCargarEntradasOC ? 1 : 0,
      datos.staff ? 1 : 0,
      datos.noSolicitaClavePesoPV ? 1 : 0,
      datos.pvPedirLecturaMobileApp ? 1 : 0,
      datos.esVendedor ? 1 : 0,
      datos.pagoTarjetaBancaria ? 1 : 0,
      datos.verTodasLineas ? 1 : 0,
      parseFloat(datos.importeCancelacion) || 0.0,
      datos.tutorAsignado || null,

      datos.sexo || "MASCULINO",
      datos.fechaNacimiento || null,
      datos.lugarNacimiento || null,
      datos.nacionalidad || null,
      datos.estadoCivil || null,
      datos.hijos || "NO",
      datos.nivelEstudio || null,
      datos.noIfe || null,
      datos.curp || null,
      datos.rfc || null,
      datos.colonia || null,
      datos.calle || null,
      datos.numeroCasa || null,
      datos.codigoPostal || null,
      datos.alergias || null,
      datos.tipoSangre || null,
      datos.tallaCamisa || null,
      datos.noLicencia || null,
      datos.vencimientoLicencia || null,
      datos.telefonoEmergencia || null,
      datos.contactoEmergencia || null,
      datos.correoElectronico || null,
      datos.correoElectronicoNotif || null,
      datos.recibeNotificaciones ? 1 : 0,

      datos.noSeguroSocial || null,
      parseFloat(datos.salarioDiarioImss) || 0.0,
      parseFloat(datos.salarioDiario) || 0.0,
      parseFloat(datos.horasExtrasFijas) || 0.0,
      datos.noCreditoInfonavit || null,
      datos.factorCreditoInfonavit || null,
      datos.creditoFonacot || null,
      datos.tiempoDescanso || null,
      datos.horasMinimasSalidaDescanso || null,
      datos.fechaProximaEvaluacion || null,
      datos.fechaProximasVacaciones || null,
      datos.fechaVencimientoContrato || null,
      datos.jornadaId || null,
      datos.contratoId || null,
      datos.fechaBaja || null,
      datos.excluirPrenomina ? 1 : 0,
      datos.calculoLocalPrenomina ? 1 : 0,

      id,
    ];

    await query(sql, valores, req.dbConfig);
    res.json({ exito: true, mensaje: "Empleado actualizado correctamente" });
  } catch (error) {
    console.error("Error al actualizar empleado:", error);
    res.status(500).json({ error: error.message });
  }
});

// 5. GET /api/empleados/:id/foto
router.get("/:id/foto", async (req, res) => {
  const { id } = req.params;

  try {
    const sql = `
      SELECT 
        e.EmpleadosID,
        e.Nombre,
        e.ApellidoPaterno,
        e.ApellidoMaterno,
        s.EmpresasID AS EmpresaID
      FROM empleados e
      INNER JOIN sucursales s ON s.SucursalesID = e.SucursalesID
      WHERE e.EmpleadosID = ?
      LIMIT 1
    `;
    const filas = await query(sql, [id], req.dbConfig);

    if (!filas || filas.length === 0) {
      return res.status(404).json({ error: "Empleado no encontrado" });
    }

    const emp = filas[0];
    const empleadoId = emp.EmpleadosID;
    const empresaId = emp.EmpresaID || 2000;

    // Formato de nombre: PATERNO_MATERNO_NOMBRE.jpg
    const paterno = String(emp.ApellidoPaterno || "").trim().toUpperCase();
    const materno = String(emp.ApellidoMaterno || "").trim().toUpperCase();
    const nombre = String(emp.Nombre || "").trim().toUpperCase();
    const nombreArchivo = `${paterno}_${materno}_${nombre}.jpg`.replace(/\s+/g, "_");

    // Estructura en NAS: \\IP\Share\EmpleadosID\EmpresasID\Foto\archivo.jpg
    const ip = process.env.NAS_IP || "192.168.9.73";
    const share = process.env.NAS_SHARE_NAME || "EmpleadosArchivosAdjuntos";
    const rutaCarpeta = `\\\\${ip}\\${share}\\${empleadoId}\\${empresaId}\\Foto`;
    const rutaFoto = path.join(rutaCarpeta, nombreArchivo);

    if (!fs.existsSync(rutaFoto)) {
      console.warn(`[NAS] ❌ Archivo no encontrado en la ruta: ${rutaFoto}`);
      return res.status(404).json({
        existe: false,
        mensaje: "Foto no encontrada en el NAS",
        rutaIntentada: rutaFoto,
      });
    }

    res.setHeader("Content-Type", "image/jpeg");
    res.sendFile(path.resolve(rutaFoto));
  } catch (error) {
    console.error(`[NAS] Error al servir foto:`, error);
    res.status(500).json({ error: error.message });
  }
});

// 6. GET /api/empleados/diagnostico/nas
router.get("/diagnostico/nas", async (req, res) => {
  try {
    await conectarNAS();
    const rutaBase = `\\\\${process.env.NAS_IP}\\${process.env.NAS_SHARE_NAME || "EmpleadosArchivosAdjuntos"}`;

    const existe = fs.existsSync(rutaBase);
    const contenido = existe ? fs.readdirSync(rutaBase) : [];

    res.json({
      autenticado: true,
      rutaBase,
      accesible: existe,
      carpetasEncontradas: contenido,
    });
  } catch (err) {
    res.status(500).json({
      autenticado: false,
      error: err.message,
    });
  }
});

module.exports = router;