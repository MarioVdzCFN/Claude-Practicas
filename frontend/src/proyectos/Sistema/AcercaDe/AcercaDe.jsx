// frontend/src/proyectos/Sistema/AcercaDe/AcercaDe.jsx
import { useState, useEffect } from "react";
import { useVentanas } from "../../../context/VentanasContext";
import "./AcercaDe.css";

const API_URL = `http://${window.location.hostname}:3001`;

function AcercaDe() {
  const { ventanas } = useVentanas();
  const [ventasSucursales, setVentasSucursales] = useState([]);
  const [copiado, setCopiado] = useState(false);

  // Estados para envío de email de prueba
  const [enviandoEmail, setEnviandoEmail] = useState(false);
  const [mensajeEmail, setMensajeEmail] = useState(null); // { tipo: 'exito' | 'error', texto: '' }

  const sesion = JSON.parse(localStorage.getItem("sesion_pos") || "{}");

  const datosEntorno = {
    hostname: window.location.hostname,
    puertoFrontend: window.location.port,
    apiUrl: API_URL,
    userAgent: navigator.userAgent,
    resolucion: `${window.screen.width}x${window.screen.height}`,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    versionApp: "1.0.0 (Desarrollo)",
  };

  useEffect(() => {
    fetch(`${API_URL}/api/debug/ventas-sucursales`, {
      headers: {
        "x-sucursal-ip": sesion?.sucursal?.ip || "",
        "x-sucursal-port": sesion?.sucursal?.puerto || 3306,
      },
    })
      .then((res) => res.json())
      .then((data) => setVentasSucursales(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error al consultar ventas:", err));
  }, []);

  const copiarDiagnostico = () => {
    const diagnostico = {
      sesion,
      entorno: datosEntorno,
      ventasSucursales,
      ventasActivas: ventanas.map((v) => ({
        id: v.id,
        titulo: v.titulo,
        minimizada: v.minimizada,
        maximizada: v.maximizada,
        zIndex: v.zIndex,
      })),
    };
    navigator.clipboard.writeText(JSON.stringify(diagnostico, null, 2));
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const handleEnviarEmailPrueba = async () => {
    setEnviandoEmail(true);
    setMensajeEmail(null);

    try {
      const res = await fetch(`${API_URL}/api/debug/email-prueba`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-sucursal-ip": sesion?.sucursal?.ip || "",
          "x-sucursal-port": sesion?.sucursal?.puerto || 3306,
        },
        body: JSON.stringify({ destinatario: "marioalejandro138@gmail.com" }),
      });

      const data = await res.json();
      if (!res.ok || !data.exito) {
        throw new Error(data.error || "No se pudo enviar el correo de prueba");
      }

      setMensajeEmail({
        tipo: "exito",
        texto: `✓ Correo enviado con éxito a marioalejandro138@gmail.com`,
      });
    } catch (err) {
      setMensajeEmail({
        tipo: "error",
        texto: `✕ Error: ${err.message}`,
      });
    } finally {
      setEnviandoEmail(false);
    }
  };

  return (
    <div className="acerca-de-contenedor">
      {/* Barra superior de herramientas */}
      <div className="acerca-de-toolbar">
        <button
          type="button"
          className="btn-accion-debug btn-copiar"
          onClick={copiarDiagnostico}
        >
          {copiado ? "✓ ¡Copiado al portapapeles!" : "📋 Copiar Diagnóstico Completo"}
        </button>

        <button
          type="button"
          className="btn-accion-debug btn-email-prueba"
          onClick={handleEnviarEmailPrueba}
          disabled={enviandoEmail}
        >
          {enviandoEmail ? "⏳ Enviando..." : "✉️ Email Prueba"}
        </button>
      </div>

      {/* Notificación de envío */}
      {mensajeEmail && (
        <div className={`aviso-email-banner aviso-${mensajeEmail.tipo}`}>
          <span>{mensajeEmail.texto}</span>
          <button
            type="button"
            className="btn-cerrar-aviso"
            onClick={() => setMensajeEmail(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Bloque 1: Datos de Sesión Activa */}
      <div className="acerca-de-seccion">
        <h4 className="seccion-titulo">1. Datos de Sesión Activa</h4>
        <div className="datos-grid">
          <div className="dato-fila">
            <span className="dato-etiqueta">Usuario ID:</span>
            <span className="dato-valor">#{sesion?.usuarioId ?? "—"}</span>
          </div>
          <div className="dato-fila">
            <span className="dato-etiqueta">Usuario:</span>
            <span className="dato-valor">@{sesion?.usuarioNombre || "—"}</span>
          </div>
          <div className="dato-fila">
            <span className="dato-etiqueta">Empleado:</span>
            <span className="dato-valor">{sesion?.nombreEmpleado || "—"}</span>
          </div>
          <div className="dato-fila">
            <span className="dato-etiqueta">Sucursal:</span>
            <span className="dato-valor">{sesion?.sucursal?.nombre || "—"} (ID: {sesion?.sucursal?.id})</span>
          </div>
          <div className="dato-fila">
            <span className="dato-etiqueta">IP Sucursal:</span>
            <span className="dato-valor">{sesion?.sucursal?.ip || "—"}:{sesion?.sucursal?.puerto || 3306}</span>
          </div>
        </div>
      </div>

      {/* Bloque 2: Entorno y Red */}
      <div className="acerca-de-seccion">
        <h4 className="seccion-titulo">2. Entorno y Red</h4>
        <div className="datos-grid">
          <div className="dato-fila">
            <span className="dato-etiqueta">API Backend:</span>
            <span className="dato-valor">{datosEntorno.apiUrl}</span>
          </div>
          <div className="dato-fila">
            <span className="dato-etiqueta">Host Navegador:</span>
            <span className="dato-valor">{datosEntorno.hostname}:{datosEntorno.puertoFrontend}</span>
          </div>
          <div className="dato-fila">
            <span className="dato-etiqueta">Resolución Pantalla:</span>
            <span className="dato-valor">{datosEntorno.resolucion} (Viewport: {datosEntorno.viewport})</span>
          </div>
          <div className="dato-fila">
            <span className="dato-etiqueta">Versión Sistema:</span>
            <span className="dato-valor">{datosEntorno.versionApp}</span>
          </div>
        </div>
      </div>

      {/* Bloque 3: Diagnóstico en Vivo de Ventas por Sucursal */}
      <div className="acerca-de-seccion">
        <h4 className="seccion-titulo">3. Ventas por Sucursal (Conexión Directa SQL)</h4>
        {ventasSucursales.length === 0 ? (
          <p className="texto-vacio">Sin registros o consultando base de datos...</p>
        ) : (
          <table className="tabla-debug-ventas">
            <thead>
              <tr>
                <th>Sucursal ID</th>
                <th>Total de Ventas Registradas</th>
              </tr>
            </thead>
            <tbody>
              {ventasSucursales.map((item, idx) => (
                <tr key={idx}>
                  <td>Sucursal #{item.sucursalesid}</td>
                  <td style={{ fontWeight: 700, color: "#2563eb" }}>{item.cantidad_ventas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Bloque 4: Ventanas en Memoria RAM */}
      <div className="acerca-de-seccion">
        <h4 className="seccion-titulo">4. Ventanas Abiertas en Memoria ({ventanas.length})</h4>
        <div className="lista-ventanas-memoria">
          {ventanas.map((v) => (
            <div key={v.id} className="item-ventana-memoria">
              <span className="item-ventana-titulo">{v.titulo} ({v.id})</span>
              <span className="item-ventana-estado">
                {v.minimizada ? "Minimizada" : v.maximizada ? "Maximizada" : "Visible"} | zIndex: {v.zIndex}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bloque 5: Prueba de Conexión de Imagen en NAS */}
      <div className="acerca-de-seccion">
        <h4 className="seccion-titulo">5. Prueba de Imagen en NAS (192.168.9.73)</h4>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            padding: "12px",
            backgroundColor: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: "4px",
          }}
        >
          <img
            src={`${API_URL}/api/debug/foto-prueba-nas`}
            alt="Foto Empleado NAS"
            style={{
              width: "90px",
              height: "105px",
              objectFit: "cover",
              borderRadius: "4px",
              border: "1px solid #94a3b8",
              backgroundColor: "#e2e8f0",
              flexShrink: 0,
            }}
            onError={(e) => {
              e.currentTarget.style.display = "none";
              const errorSpan = e.currentTarget.nextElementSibling;
              if (errorSpan) errorSpan.style.display = "block";
            }}
          />
          <span style={{ display: "none", color: "#ef4444", fontSize: "11.5px", fontWeight: 600 }}>
            ❌ Error al cargar la imagen desde el NAS (Verifica el endpoint /api/debug/foto-prueba-nas)
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11px", color: "#475569" }}>
            <span style={{ fontWeight: 600, color: "#1e293b" }}>Ruta física en red:</span>
            <code style={{ background: "#f1f5f9", padding: "4px 6px", borderRadius: "3px", wordBreak: "break-all" }}>
              \\192.168.9.73\EmpleadosArchivosAdjuntos\2000\1006\Foto\ADMINISTRADOR_PATERNO_ADMIN.jpg
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AcercaDe;