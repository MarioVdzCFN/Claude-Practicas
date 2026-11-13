// frontend/src/proyectos/Salas/Invitados/ModificarInvitados.jsx
import { useState, useEffect } from "react";
import "./ModificarInvitados.css";

const API_URL = `http://${window.location.hostname}:3001`;

function ModificarInvitados({ onVolver }) {
  const [invitados, setInvitados] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState("activos"); // 'activos' | 'inactivos' | 'todos'
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  // Estado del Modal (Crear / Modificar)
  const [modalAbierto, setModalAbierto] = useState(false);
  const [invitadoEdicion, setInvitadoEdicion] = useState(null); // null = nuevo
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [correo, setCorreo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [activo, setActivo] = useState(true);
  const [errorForm, setErrorForm] = useState("");

  const obtenerHeaders = () => {
    const sesion = JSON.parse(localStorage.getItem("sesion_pos") || "{}");
    return {
      "Content-Type": "application/json",
      "x-sucursal-ip": sesion?.sucursal?.ip || "",
      "x-sucursal-port": sesion?.sucursal?.puerto || 3306,
    };
  };

  const cargarInvitados = () => {
    setCargando(true);
    fetch(`${API_URL}/api/salas/invitados?estado=${filtroEstado}`, {
      headers: obtenerHeaders(),
    })
      .then((res) => res.json())
      .then((data) => setInvitados(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error al cargar invitados:", err))
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    cargarInvitados();
  }, [filtroEstado]);

  const abrirModalNuevo = () => {
    setInvitadoEdicion(null);
    setNombreCompleto("");
    setCorreo("");
    setDescripcion("");
    setActivo(true);
    setErrorForm("");
    setModalAbierto(true);
  };

  const abrirModalEditar = (inv) => {
    setInvitadoEdicion(inv);
    setNombreCompleto(inv.nombrecompleto || "");
    setCorreo(inv.correo || "");
    setDescripcion(inv.descripcion || "");
    setActivo(Boolean(inv.activo));
    setErrorForm("");
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setInvitadoEdicion(null);
    setErrorForm("");
  };

  const guardarInvitado = async (e) => {
    e.preventDefault();
    if (!nombreCompleto.trim()) {
      setErrorForm("El nombre completo es obligatorio.");
      return;
    }

    try {
      if (invitadoEdicion) {
        // UPDATE
        const res = await fetch(`${API_URL}/api/salas/invitados/${invitadoEdicion.invitadosid}`, {
          method: "PUT",
          headers: obtenerHeaders(),
          body: JSON.stringify({
            nombrecompleto: nombreCompleto,
            correo,
            descripcion,
            activo: activo ? 1 : 0,
          }),
        });
        if (!res.ok) throw new Error("Error al actualizar");
      } else {
        // INSERT INTO
        const res = await fetch(`${API_URL}/api/salas/invitados`, {
          method: "POST",
          headers: obtenerHeaders(),
          body: JSON.stringify({
            nombrecompleto: nombreCompleto,
            correo,
            descripcion,
          }),
        });
        if (!res.ok) throw new Error("Error al registrar");
      }

      cerrarModal();
      cargarInvitados();
    } catch (err) {
      setErrorForm(err.message || "No se pudo guardar la información.");
    }
  };

  const invitadosFiltrados = invitados.filter((inv) =>
    (inv.nombrecompleto || "").toLowerCase().includes(busqueda.toLowerCase()) ||
    (inv.correo || "").toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="invitados-plano">
      {/* Barra de Controles Superior */}
      <header className="invitados-header">
        <div className="header-izq">
          {onVolver && (
            <button type="button" className="btn-volver" onClick={onVolver} title="Volver a Salas">
              ← Volver
            </button>
          )}
          <h2 className="header-titulo">Catálogo de Invitados</h2>
        </div>

        <div className="header-acciones">
          <input
            type="text"
            className="input-buscar"
            placeholder="Buscar por nombre o correo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />

          <div className="filtro-estado-caja">
            <label>Estado:</label>
            <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
              <option value="activos">Activos</option>
              <option value="inactivos">Inactivos</option>
              <option value="todos">Todos</option>
            </select>
          </div>

          <button type="button" className="btn-nuevo" onClick={abrirModalNuevo}>
            + Agregar Nuevo
          </button>
        </div>
      </header>

      {/* Tabla / Listado de Invitados */}
      <div className="tabla-contenedor">
        {cargando ? (
          <div className="mensaje-estado">Cargando invitados...</div>
        ) : invitadosFiltrados.length === 0 ? (
          <div className="mensaje-estado">No se encontraron invitados registrados.</div>
        ) : (
          <table className="tabla-invitados">
            <thead>
              <tr>
                <th style={{ width: "120px" }}>Estado</th>
                <th>Nombre Completo</th>
                <th>Correo Electrónico</th>
                <th>Descripción</th>
                <th style={{ width: "80px", textAlign: "center" }}>Editar</th>
              </tr>
            </thead>
            <tbody>
              {invitadosFiltrados.map((inv) => (
                <tr
                  key={inv.invitadosid}
                  className={`fila-invitado ${!inv.activo ? "fila-inactivo" : ""}`}
                  onClick={() => abrirModalEditar(inv)}
                >
                  <td>
                    <span className={`badge-status ${inv.activo ? "badge-activo" : "badge-inactivo"}`}>
                      {inv.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="col-nombre">{inv.nombrecompleto}</td>
                  <td className="col-correo">{inv.correo || "—"}</td>
                  <td className="col-desc">{inv.descripcion || "—"}</td>
                  <td style={{ textAlign: "center" }}>
                    <button
                      type="button"
                      className="btn-editar-fila"
                      title="Editar invitado"
                      onClick={(e) => {
                        e.stopPropagation();
                        abrirModalEditar(inv);
                      }}
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Agregar / Modificar Invitado */}
      {modalAbierto && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-tarjeta" onClick={(e) => e.stopPropagation()}>
            <div className="modal-cabecera">
              <h3>{invitadoEdicion ? `Editar Invitado #${invitadoEdicion.invitadosid}` : "Nuevo Invitado"}</h3>
              <button type="button" className="btn-cerrar-x" onClick={cerrarModal}>✕</button>
            </div>

            <form onSubmit={guardarInvitado} className="modal-formulario">
              {errorForm && <div className="error-aviso">{errorForm}</div>}

              <div className="campo-grupo">
                <label>Nombre Completo *</label>
                <input
                  type="text"
                  placeholder="Ej. Juan Pérez"
                  value={nombreCompleto}
                  onChange={(e) => setNombreCompleto(e.target.value)}
                  required
                />
              </div>

              <div className="campo-grupo">
                <label>Correo Electrónico</label>
                <input
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                />
              </div>

              <div className="campo-grupo">
                <label>Descripción / Cargo / Empresa</label>
                <textarea
                  placeholder="Información adicional del invitado..."
                  rows="3"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </div>

              {/* Si estamos editando, permitimos activar/inactivar */}
              {invitadoEdicion && (
                <div className="campo-switch">
                  <label>Estado del Invitado:</label>
                  <button
                    type="button"
                    className={`btn-toggle-estado ${activo ? "toggle-activo" : "toggle-inactivo"}`}
                    onClick={() => setActivo(!activo)}
                  >
                    {activo ? "✓ Activo" : "✕ Inactivo"}
                  </button>
                </div>
              )}

              <div className="modal-acciones">
                <button type="button" className="btn-cancelar" onClick={cerrarModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn-guardar">
                  {invitadoEdicion ? "Guardar Cambios" : "Registrar Invitado"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ModificarInvitados;