// backend/servicios/nasServicio.js
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

let autenticado = false;

/**
 * Establece la sesión de red contra el NAS usando net use de Windows.
 */
function conectarNAS() {
  return new Promise((resolve, reject) => {
    const ip = process.env.NAS_IP;
    const share = process.env.NAS_SHARE_NAME || "EmpleadosArchivosAdjuntos";
    const user = process.env.NAS_USER;
    const password = process.env.NAS_PASSWORD;

    if (!ip || !user || !password) {
      console.warn("⚠️ Credenciales de NAS incompletas en variables de entorno.");
      return resolve(false);
    }

    const recursoUNC = `\\\\${ip}\\${share}`;

    // Comando para conectar con credenciales en Windows
    // Si ya existe una sesión previa, no rompe
    const comando = `net use "${recursoUNC}" "${password}" /user:"${user}" /persistent:no`;

    exec(comando, (error, stdout, stderr) => {
      // Código de salida 0 o 2 (ya conectado/nombre duplicado en sesión) son válidos
      if (error && !stderr.includes("1219") && !stderr.includes("existente")) {
        console.error("❌ Error al autenticar contra el NAS:", stderr || error.message);
        autenticado = false;
        return reject(error);
      }

      console.log(`✅ Conexión establecida con el NAS (${recursoUNC})`);
      autenticado = true;
      resolve(true);
    });
  });
}

/**
 * Obtiene la ruta física UNC para un archivo de empleado:
 * \\IP\EmpleadosArchivosAdjuntos\EmpresaID\EmpleadoID\Foto\NOMBRE_PATERNO_MATERNO.jpg
 */
function construirRutaEmpleado({ empresaId, empleadoId, subcarpeta = "Foto", archivo = "" }) {
  const ip = process.env.NAS_IP;
  const share = process.env.NAS_SHARE_NAME || "EmpleadosArchivosAdjuntos";
  const baseUNC = `\\\\${ip}\\${share}`;

  if (archivo) {
    return path.join(baseUNC, String(empresaId), String(empleadoId), subcarpeta, archivo);
  }
  return path.join(baseUNC, String(empresaId), String(empleadoId), subcarpeta);
}

module.exports = {
  conectarNAS,
  construirRutaEmpleado,
  estaAutenticado: () => autenticado,
};