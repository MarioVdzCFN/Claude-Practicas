// frontend/src/pages/ConfirmarAsistencia.jsx
import { useEffect, useState } from "react";
import "./ConfirmarAsistencia.css";

function ConfirmarAsistencia() {
  const [estado, setEstado] = useState("cargando"); // cargando | exito | error
  const [mensaje, setMensaje] = useState("");
  const [datosReunion, setDatosReunion] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const codigo = params.get("codigo");

    if (!id || !codigo) {
      setEstado("error");
      setMensaje("Enlace de confirmación incompleto o inválido.");
      return;
    }

    // Apunta al backend en el puerto 3001
    const hostBackend = `http://${window.location.hostname}:3001`;

    fetch(`${hostBackend}/api/salas/confirmar-asistencia?id=${encodeURIComponent(id)}&codigo=${encodeURIComponent(codigo)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.mensaje || data.error || "No se pudo registrar la confirmación.");
        }
        return data;
      })
      .then((data) => {
        setEstado("exito");
        setMensaje(data.mensaje || "¡Tu asistencia ha sido confirmada con éxito!");
        setDatosReunion(data.reunion || data.datos || null);
      })
      .catch((err) => {
        setEstado("error");
        setMensaje(err.message || "Error al conectar con el servidor.");
      });
  }, []);

  return (
    <div className="confirmar-contenedor">
      <div className="confirmar-tarjeta">
        <div className="confirmar-icono">
          {estado === "cargando" && "⏳"}
          {estado === "exito" && "✅"}
          {estado === "error" && "⚠️"}
        </div>

        <h1 className="confirmar-titulo">
          {estado === "cargando" && "Procesando confirmación..."}
          {estado === "exito" && "¡Asistencia Confirmada!"}
          {estado === "error" && "Aviso"}
        </h1>

        <p className="confirmar-mensaje">{mensaje}</p>

        {datosReunion && (
          <div className="confirmar-detalles">
            <h3>{datosReunion.tema}</h3>
            {datosReunion.participante && <p><strong>Participante:</strong> {datosReunion.participante}</p>}
            {datosReunion.sala && <p><strong>Sala:</strong> {datosReunion.sala}</p>}
            {datosReunion.fecha && <p><strong>Fecha:</strong> {datosReunion.fecha}</p>}
            {datosReunion.horario && <p><strong>Horario:</strong> {datosReunion.horario}</p>}
            {Number(datosReunion.silla || datosReunion.numeroSilla) > 0 && (
              <p><strong>Silla Asignada:</strong> #{datosReunion.silla || datosReunion.numeroSilla}</p>
            )}
          </div>
        )}

        <div className="confirmar-pie">
          <small>Sistema de Reservación de Salas POS</small>
        </div>
      </div>
    </div>
  );
}

export default ConfirmarAsistencia;