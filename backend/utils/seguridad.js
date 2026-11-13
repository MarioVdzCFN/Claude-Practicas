// backend/utils/seguridad.js

/**
 * Recibe la contraseña cifrada almacenada en la base de datos
 * y devuelve un placeholder temporal mientras se integra la desencriptación definitiva.
 * 
 * @param {string} textoCifrado - Contraseña cifrada proveniente de la BD (ej. "+tRirHmnR4w")
 * @returns {string} Placeholder descriptivo
 */
function descifrarContrasena(textoCifrado) {
  if (!textoCifrado) return "";
  return textoCifrado;
  //return "Esperando desencriptacion";
}

module.exports = { descifrarContrasena };