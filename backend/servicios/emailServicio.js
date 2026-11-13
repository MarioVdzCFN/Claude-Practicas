// backend/servicios/emailServicio.js
const nodemailer = require("nodemailer");

// Configuración del transporter con las variables SMTP de Brevo
const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_HOST || "smtp-relay.brevo.com",
  port: Number(process.env.BREVO_SMTP_PORT) || 587,
  secure: false, // TLS en 587
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASS,
  },
});

/**
 * Enmascara un correo para el debug en consola:
 * marioalejandro138@gmail.com -> m*****8@gmail.com
 */
function ofuscarCorreo(email) {
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return email || "correo_invalido";
  }
  const [usuario, dominio] = email.trim().split("@");
  if (usuario.length <= 2) {
    return `${usuario[0]}*@${dominio}`;
  }
  const primerCaracter = usuario[0];
  const ultimoCaracter = usuario[usuario.length - 1];
  return `${primerCaracter}*****${ultimoCaracter}@${dominio}`;
}

/**
 * Validador básico de email
 */
function esEmailValido(email) {
  return typeof email === "string" && email.includes("@") && email.trim().length > 3;
}

/**
 * 1. Email de Diagnóstico / Prueba (usado por AcercaDe y debug.js)
 */
async function enviarEmailPrueba(destinatario = "marioalejandro138@gmail.com") {
  const correoDebug = ofuscarCorreo(destinatario);

  if (!esEmailValido(destinatario)) {
    console.log(`no se pudo enviar correo a ${correoDebug}`);
    console.log(`razon: direccion de correo electronico invalida o vacia\n`);
    throw new Error("El correo destinatario no es válido.");
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || "Sistema de Salas <notificaciones@tuempresa.com>",
      to: destinatario,
      subject: "Prueba de conectividad Brevo - Sistema POS",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #1b4d3e; margin-top: 0;">✅ Conexión Exitosa</h2>
          <p style="color: #334155;">El servicio de correo mediante <strong>Brevo SMTP</strong> está funcionando correctamente en el sistema POS.</p>
          <p style="color: #64748b; font-size: 13px;">Fecha del test: ${new Date().toLocaleString()}</p>
        </div>
      `,
    });

    console.log(`correo enviado a ${correoDebug}\n`);
    return info;
  } catch (error) {
    console.log(`no se pudo enviar correo a ${correoDebug}`);
    console.log(`razon: ${error.message}\n`);
    throw error;
  }
}

/**
 * 2. Envía la invitación inicial con enlace para confirmar asistencia
 */
async function enviarInvitacionReunion(reunion, destinatario) {
  const correoOriginal = destinatario?.correo || destinatario?.destinatario || "";
  const correoDebug = ofuscarCorreo(correoOriginal);

  if (!esEmailValido(correoOriginal)) {
    console.log(`no se pudo enviar correo a ${correoDebug}`);
    console.log(`razon: el destinatario no cuenta con un correo electronico valido\n`);
    return;
  }

  const hostFrontend = reunion?.urlFrontend || process.env.FRONTEND_URL || "localhost:5173";
  const detalleId = destinatario?.reunionesdetallesid || reunion?.reunionesdetallesid;
  const codigo = destinatario?.codigoinvitacion || reunion?.codigoinvitacion;

  const urlConfirmar = `${hostFrontend.startsWith("http") ? hostFrontend : "http://" + hostFrontend}/confirmar-asistencia?id=${detalleId}&codigo=${codigo}`;

  const numSilla = Number(destinatario?.numeroSilla ?? reunion?.numeroSilla ?? 0);
  const filaSilla =
    numSilla > 0
      ? `<p style="margin: 4px 0; color: #4b5563; font-size: 14px;"><strong>Silla asignada:</strong> #${numSilla}</p>`
      : "";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #1b4d3e; margin: 0;">Invitación a Reunión</h2>
        <p style="color: #64748b; margin: 5px 0 0 0; font-size: 14px;">Has sido convocado a una reunión en nuestras instalaciones</p>
      </div>

      <div style="background-color: #f8fafc; border-left: 4px solid #1b4d3e; padding: 14px 18px; border-radius: 6px; margin: 20px 0;">
        <h3 style="color: #0f172a; margin: 0 0 10px 0; font-size: 16px;">${reunion.tema}</h3>
        <p style="margin: 4px 0; color: #4b5563; font-size: 14px;"><strong>Sala:</strong> ${reunion.nombreSala || reunion.sala || "No especificada"}</p>
        <p style="margin: 4px 0; color: #4b5563; font-size: 14px;"><strong>Fecha:</strong> ${reunion.fecha}</p>
        <p style="margin: 4px 0; color: #4b5563; font-size: 14px;"><strong>Horario:</strong> ${reunion.horaInicio} - ${reunion.horaFin}</p>
        ${filaSilla}
        ${reunion.descripcion ? `<p style="margin: 4px 0; color: #4b5563; font-size: 14px;"><strong>Detalles:</strong> ${reunion.descripcion}</p>` : ""}
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${urlConfirmar}" style="background-color: #1b4d3e; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; display: inline-block;">
          Confirmar Asistencia
        </a>
      </div>

      <p style="color: #94a3b8; font-size: 12px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 15px; margin-top: 25px;">
        Sistema de Reservación de Salas POS. Si tienes inconvenientes con el botón, copia y pega este enlace en tu navegador:<br/>
        <a href="${urlConfirmar}" style="color: #64748b;">${urlConfirmar}</a>
      </p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || "Sistema de Salas <notificaciones@tuempresa.com>",
      to: correoOriginal.trim(),
      subject: `Invitacion a: ${reunion.tema}`,
      html,
    });

    console.log(`correo enviado a ${correoDebug}\n`);
  } catch (error) {
    console.log(`no se pudo enviar correo a ${correoDebug}`);
    console.log(`razon: ${error.message}\n`);
  }
}

/**
 * 3. Envía notificación de reunión cancelada
 */
async function enviarCancelacionReunion({ tema, descripcion, fecha, horaInicio, horaFin, sala }, destinatario) {
  const correoOriginal = destinatario?.correo || "";
  const correoDebug = ofuscarCorreo(correoOriginal);

  if (!esEmailValido(correoOriginal)) {
    console.log(`no se pudo enviar correo a ${correoDebug}`);
    console.log(`razon: el destinatario no cuenta con un correo electronico valido\n`);
    return;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #fee2e2; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 20px;">
        <span style="font-size: 45px;">❌</span>
        <h2 style="color: #991b1b; margin: 8px 0 0 0;">Reunión Cancelada</h2>
      </div>
      
      <p style="color: #374151; font-size: 15px; line-height: 1.5;">
        Hola <strong>${destinatario.nombre || "Participante"}</strong>, te informamos que la reunión a la que estabas convocado ha sido <strong>cancelada</strong>:
      </p>

      <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 14px 18px; border-radius: 6px; margin: 20px 0;">
        <h3 style="color: #7f1d1d; margin: 0 0 10px 0; font-size: 16px;">${tema}</h3>
        <p style="margin: 4px 0; color: #4b5563; font-size: 14px;"><strong>Sala:</strong> ${sala || "No especificada"}</p>
        <p style="margin: 4px 0; color: #4b5563; font-size: 14px;"><strong>Fecha:</strong> ${fecha}</p>
        <p style="margin: 4px 0; color: #4b5563; font-size: 14px;"><strong>Horario:</strong> ${horaInicio} - ${horaFin}</p>
        ${descripcion ? `<p style="margin: 4px 0; color: #4b5563; font-size: 14px;"><strong>Motivo / Info:</strong> ${descripcion}</p>` : ""}
      </div>

      <p style="color: #6b7280; font-size: 13px; text-align: center; margin-top: 24px; border-top: 1px solid #f3f4f6; padding-top: 14px;">
        Este es un mensaje automático del Sistema de Reservación de Salas POS. No es necesario responder.
      </p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || "Sistema de Salas <notificaciones@tuempresa.com>",
      to: correoOriginal.trim(),
      subject: `Cancelada: ${tema}`,
      html,
    });

    console.log(`correo enviado a ${correoDebug}\n`);
  } catch (error) {
    console.log(`no se pudo enviar correo a ${correoDebug}`);
    console.log(`razon: ${error.message}\n`);
  }
}

module.exports = {
  enviarEmailPrueba,
  enviarInvitacionReunion,
  enviarCancelacionReunion,
  esEmailValido,
};