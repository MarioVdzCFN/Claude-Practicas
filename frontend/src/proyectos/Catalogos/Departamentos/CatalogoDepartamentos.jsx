import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import "./CatalogoDepartamentos.css";

function CatalogoDepartamentos() {
  const [departamentos, setDepartamentos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [soloActivos, setSoloActivos] = useState(true);
  const [seleccionadoId, setSeleccionadoId] = useState(null);

  // Control de menú flotante de los 3 puntos
  const [menuAbiertoId, setMenuAbiertoId] = useState(null);
  const [posicionMenu, setPosicionMenu] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);

  // Control del modal Agregar / Modificar
  const [modalAbierto, setModalAbierto] = useState(false);
  const [deptoEdicion, setDeptoEdicion] = useState(null); // null = nuevo
  const [descripcion, setDescripcion] = useState("");
  const [codigo, setCodigo] = useState("");
  const [verificaSalidaComer, setVerificaSalidaComer] = useState(false);
  const [mostrarAcomodoArticulos, setMostrarAcomodoArticulos] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorModal, setErrorModal] = useState("");

  const obtenerHeadersSucursal = () => {
    try {
      const sesionRaw = localStorage.getItem("sesion_pos");
      if (sesionRaw) {
        const sesion = JSON.parse(sesionRaw);
        return {
          "x-sucursal-ip": sesion.sucursalIp || sesion.sucursal?.ip || "127.0.0.1",
          "x-sucursal-port": String(sesion.sucursalPuerto || sesion.sucursal?.puerto || 3306),
          "Content-Type": "application/json",
        };
      }
    } catch (e) {
      console.error("Error al leer sesión:", e);
    }
    return {
      "x-sucursal-ip": "127.0.0.1",
      "x-sucursal-port": "3306",
      "Content-Type": "application/json",
    };
  };

  const cargarDepartamentos = useCallback(async () => {
    setCargando(true);
    try {
      const host = window.location.hostname || "localhost";
      const resp = await fetch(`http://${host}:3001/api/departamentos`, {
        headers: obtenerHeadersSucursal(),
      });
      if (!resp.ok) throw new Error("Error al consultar departamentos");
      const data = await resp.json();
      setDepartamentos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDepartamentos();
  }, [cargarDepartamentos]);

  // Cerrar menú de 3 puntos al hacer clic fuera
  useEffect(() => {
    const handleClickFuera = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuAbiertoId(null);
      }
    };
    document.addEventListener("mousedown", handleClickFuera);
    return () => document.removeEventListener("mousedown", handleClickFuera);
  }, []);

  const handleToggleMenu = (e, deptoId) => {
    e.stopPropagation();
    if (menuAbiertoId === deptoId) {
      setMenuAbiertoId(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setPosicionMenu({
      top: rect.bottom + 4,
      left: rect.right - 140,
    });
    setMenuAbiertoId(deptoId);
  };

  const alternarEstadoActivo = async (id, estadoActual) => {
    const nuevoEstado = !estadoActual;
    try {
      const host = window.location.hostname || "localhost";
      const resp = await fetch(`http://${host}:3001/api/departamentos/${id}/alternar-estado`, {
        method: "PATCH",
        headers: obtenerHeadersSucursal(),
        body: JSON.stringify({ nuevoEstado }),
      });

      if (!resp.ok) throw new Error("No se pudo actualizar el estado");

      setDepartamentos((prev) =>
        prev.map((d) => (d.id === id ? { ...d, activo: nuevoEstado } : d))
      );
    } catch (err) {
      alert("Error al cambiar estado: " + err.message);
    } finally {
      setMenuAbiertoId(null);
    }
  };

  // Apertura de modales
  const abrirModalNuevo = () => {
    setDeptoEdicion(null);
    setDescripcion("");
    setCodigo("");
    setVerificaSalidaComer(false);
    setMostrarAcomodoArticulos(false);
    setErrorModal("");
    setModalAbierto(true);
  };

  const abrirModalModificar = () => {
    const depto = departamentos.find((d) => d.id === seleccionadoId);
    if (!depto) return;
    setDeptoEdicion(depto);
    setDescripcion(depto.descripcion || "");
    setCodigo(depto.codigo || "");
    setVerificaSalidaComer(Boolean(depto.verificaSalidaComer));
    setMostrarAcomodoArticulos(Boolean(depto.mostrarAcomodoArticulos));
    setErrorModal("");
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setDeptoEdicion(null);
    setErrorModal("");
  };

  // Guardar creación o edición
  const handleGuardarDepartamento = async (e) => {
    e.preventDefault();
    if (!descripcion.trim()) {
      setErrorModal("La descripción es obligatoria.");
      return;
    }

    setGuardando(true);
    setErrorModal("");

    const payload = {
      id: deptoEdicion ? deptoEdicion.id : undefined,
      descripcion: descripcion.trim(),
      codigo: codigo.trim(),
      verificaSalidaComer,
      mostrarAcomodoArticulos,
      activo: deptoEdicion ? deptoEdicion.activo : true,
    };

    try {
      const host = window.location.hostname || "localhost";
      const resp = await fetch(`http://${host}:3001/api/departamentos/guardar`, {
        method: "POST",
        headers: obtenerHeadersSucursal(),
        body: JSON.stringify(payload),
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Error al guardar departamento");

      cerrarModal();
      await cargarDepartamentos();
      if (!deptoEdicion && data.id) {
        setSeleccionadoId(data.id);
      }
    } catch (err) {
      setErrorModal(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const departamentosFiltrados = useMemo(() => {
    return departamentos.filter((d) => {
      const coincideBusqueda =
        d.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
        d.descripcion.toLowerCase().includes(busqueda.toLowerCase());
      const coincideActivo = soloActivos ? d.activo : true;
      return coincideBusqueda && coincideActivo;
    });
  }, [departamentos, busqueda, soloActivos]);

  const deptoActivoContextual = departamentos.find((d) => d.id === menuAbiertoId);

  return (
    <div className="cat-deptos-contenedor">
      {/* 1. Barra de Filtros */}
      <section className="cat-deptos-filtros">
        <div className="input-busqueda-caja">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#64748b" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Buscar departamento..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="filtros-derecha">
          <span className="total-registros-texto">
            Total: {departamentosFiltrados.length} departamentos
          </span>

          <label className="toggle-switch-etiqueta">
            <div className="switch-input-wrapper">
              <input
                type="checkbox"
                checked={soloActivos}
                onChange={(e) => setSoloActivos(e.target.checked)}
              />
              <span className="switch-slider" />
            </div>
            <span className="switch-texto">Solo activos</span>
          </label>
        </div>
      </section>

      {/* 2. Tabla principal */}
      <div className="tabla-contenedor">
        <table className="tabla-invitados">
          <thead>
            <tr>
              <th style={{ width: "110px" }}>Estado</th>
              <th style={{ width: "220px" }}>Código</th>
              <th>Descripción</th>
              <th style={{ width: "70px", textAlign: "center" }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr>
                <td colSpan="4" className="mensaje-estado">
                  Cargando departamentos...
                </td>
              </tr>
            ) : departamentosFiltrados.length === 0 ? (
              <tr>
                <td colSpan="4" className="mensaje-estado">
                  No se encontraron departamentos registrados.
                </td>
              </tr>
            ) : (
              departamentosFiltrados.map((item) => {
                const esSeleccionado = seleccionadoId === item.id;
                return (
                  <tr
                    key={item.id}
                    className={`fila-invitado ${!item.activo ? "fila-inactivo" : ""} ${
                      esSeleccionado ? "fila-seleccionada" : ""
                    }`}
                    onClick={() => setSeleccionadoId(item.id)}
                    onDoubleClick={abrirModalModificar}
                  >
                    <td>
                      <span className={`badge-status ${item.activo ? "badge-activo" : "badge-inactivo"}`}>
                        {item.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="col-codigo-txt">{item.codigo || "—"}</td>
                    <td className="col-desc-txt">{item.descripcion}</td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        type="button"
                        className="btn-puntos-fila"
                        title="Opciones"
                        onClick={(e) => handleToggleMenu(e, item.id)}
                      >
                        ⋮
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Menú Contextual flotante de los 3 puntos */}
      {menuAbiertoId && deptoActivoContextual && (
        <ul
          ref={menuRef}
          className="menu-opciones-flotante"
          style={{ top: posicionMenu.top, left: posicionMenu.left }}
        >
          <li>
            <button
              type="button"
              className="opcion-menu-item"
              onClick={() => alternarEstadoActivo(deptoActivoContextual.id, deptoActivoContextual.activo)}
            >
              {deptoActivoContextual.activo ? "Desactivar" : "Reactivar / Activar"}
            </button>
          </li>
        </ul>
      )}

      {/* 3. Footer de Acciones */}
      <footer className="cat-deptos-footer">
        <div className="footer-derecha">
          <button
            type="button"
            className="btn-footer-accion btn-agregar-morado"
            onClick={abrirModalNuevo}
          >
            <span>+</span> Agregar
          </button>
          <button
            type="button"
            className="btn-footer-accion btn-modificar-borde"
            disabled={!seleccionadoId}
            onClick={abrirModalModificar}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
            </svg>
            Modificar
          </button>
        </div>
      </footer>

      {/* 4. Modal Agregar / Modificar Departamento */}
      {modalAbierto && (
        <div className="modal-depto-overlay" onClick={cerrarModal}>
          <div className="modal-depto-tarjeta" onClick={(e) => e.stopPropagation()}>
            <div className="modal-depto-cabecera">
              <h3>{deptoEdicion ? `Modificar Departamento: ${deptoEdicion.descripcion}` : "Nuevo Departamento"}</h3>
              <button type="button" className="btn-modal-cerrar" onClick={cerrarModal}>✕</button>
            </div>

            <form onSubmit={handleGuardarDepartamento} className="modal-depto-formulario">
              {errorModal && <div className="modal-depto-error">{errorModal}</div>}

              {/* Campo Descripción */}
              <div className="modal-depto-campo-fila">
                <label className="modal-depto-label">Descripción:</label>
                <input
                  type="text"
                  className="modal-depto-input"
                  placeholder="Nombre del departamento"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  maxLength={50}
                  autoFocus
                  required
                />
              </div>

              {/* Campo Código */}
              <div className="modal-depto-campo-fila">
                <label className="modal-depto-label">Código:</label>
                <input
                  type="text"
                  className="modal-depto-input"
                  placeholder="Código identificador"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  maxLength={25}
                />
              </div>

              {/* Checkboxes de opciones */}
              <div className="modal-depto-opciones-grupo">
                <label className="modal-depto-checkbox-item">
                  <input
                    type="checkbox"
                    checked={verificaSalidaComer}
                    onChange={(e) => setVerificaSalidaComer(e.target.checked)}
                  />
                  <span>Verifica Salida Comer</span>
                </label>

                <label className="modal-depto-checkbox-item">
                  <input
                    type="checkbox"
                    checked={mostrarAcomodoArticulos}
                    onChange={(e) => setMostrarAcomodoArticulos(e.target.checked)}
                  />
                  <span>Mostrar Acomodo Articulos</span>
                </label>
              </div>

              {/* Botón inerte para la configuración posterior */}
              <div className="bloque-configurar-lineas">
                <button
                  type="button"
                  className="btn-configurar-lineas"
                  onClick={() => {}}
                >
                  Configurar Lineas
                </button>
              </div>

              {/* Acciones del Modal */}
              <div className="modal-depto-acciones">
                <button
                  type="button"
                  className="btn-modal-accion btn-modal-cancelar"
                  onClick={cerrarModal}
                  disabled={guardando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-modal-accion btn-modal-guardar"
                  disabled={guardando}
                >
                  {guardando ? "Guardando..." : deptoEdicion ? "Guardar Cambios" : "Crear Departamento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CatalogoDepartamentos;