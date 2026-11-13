// frontend/src/proyectos/Salas/ModificarSalas/ModificarSalas.jsx
import { useState, useEffect } from "react";
import "./ModificarSalas.css";

const API_URL = `http://${window.location.hostname}:3001`;

// Cuadrícula unificada: 16 filas x 20 columnas
const FILAS_GRID = 16;
const COLS_GRID = 20;

const DIAS_SEMANA = [
  { clave: "LUN", etiqueta: "Lun" },
  { clave: "MAR", etiqueta: "Mar" },
  { clave: "MIE", etiqueta: "Mié" },
  { clave: "JUE", etiqueta: "Jue" },
  { clave: "VIE", etiqueta: "Vie" },
  { clave: "SAB", etiqueta: "Sáb" },
  { clave: "DOM", etiqueta: "Dom" },
];

function ModificarSalas({ onVolver }) {
  const [salas, setSalas] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos"); // 'activos' | 'inactivos' | 'todos'

  // Modal Principal: Datos de la sala
  const [modalAbierto, setModalAbierto] = useState(false);
  const [salaEdicion, setSalaEdicion] = useState(null);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [sucursalid, setSucursalid] = useState("-1");
  const [capacidad, setCapacidad] = useState(6);
  const [sobrecargo, setSobrecargo] = useState(2);
  const [activo, setActivo] = useState(true);

  // Nuevos campos: Horarios y Días disponibles
  const [horaApertura, setHoraApertura] = useState("08:00");
  const [horaCierre, setHoraCierre] = useState("20:00");
  const [diasSeleccionados, setDiasSeleccionados] = useState([
    "LUN", "MAR", "MIE", "JUE", "VIE", "SAB", "DOM"
  ]);

  const [errorForm, setErrorForm] = useState("");

  // Editor Interactivo de Plano (Mapa)
  const [modalMapaAbierto, setModalMapaAbierto] = useState(false);
  const [herramienta, setHerramienta] = useState("silla"); // 'silla' | 'mesa' | 'tv' | 'borrar'
  const [elementosMapa, setElementosMapa] = useState([]); // [{ x, y, tipo: 'mesa'|'silla'|'tv', numeroSilla }]
  
  // Estado para el tooltip de aviso cuando se excede la capacidad
  const [avisoExceso, setAvisoExceso] = useState(null); // { x, y }

  const obtenerHeaders = () => {
    const sesion = JSON.parse(localStorage.getItem("sesion_pos") || "{}");
    return {
      "Content-Type": "application/json",
      "x-sucursal-ip": sesion?.sucursal?.ip || "",
      "x-sucursal-port": sesion?.sucursal?.puerto || 3306,
    };
  };

  const cargarDatos = () => {
    setCargando(true);
    Promise.all([
      fetch(`${API_URL}/api/salas?sucursalId=todas&incluirInactivas=true`, { headers: obtenerHeaders() }).then((r) => r.json()),
      fetch(`${API_URL}/api/sucursales`).then((r) => r.json()),
    ])
      .then(([dataSalas, dataSuc]) => {
        setSalas(Array.isArray(dataSalas) ? dataSalas : []);
        setSucursales(Array.isArray(dataSuc) ? dataSuc : []);
      })
      .catch((err) => console.error("Error al cargar datos:", err))
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const abrirModalNueva = () => {
    setSalaEdicion(null);
    setNombre("");
    setDescripcion("");
    setSucursalid("-1");
    setCapacidad(6);
    setSobrecargo(0);
    setActivo(true);
    setHoraApertura("08:00");
    setHoraCierre("20:00");
    setDiasSeleccionados(["LUN", "MAR", "MIE", "JUE", "VIE", "SAB", "DOM"]);
    setElementosMapa([]);
    setErrorForm("");
    setAvisoExceso(null);
    setModalAbierto(true);
  };

  const abrirModalEditar = (sala) => {
    setSalaEdicion(sala);
    setNombre(sala.nombre || "");
    setDescripcion(sala.descripcion || "");
    setSucursalid(String(sala.sucursalesid ?? -1));
    setCapacidad(Number(sala.capacidad) || 0);
    setSobrecargo(Number(sala.sobrecargo) || 0);
    setActivo(sala.activo === 1 || sala.activo === true);

    // Formatear horas a HH:mm si vienen como HH:mm:ss
    const formatHora = (h, def) => (h ? h.slice(0, 5) : def);
    setHoraApertura(formatHora(sala.horaapertura || sala.HoraApertura, "08:00"));
    setHoraCierre(formatHora(sala.horacierre || sala.HoraCierre, "20:00"));

    // Parsear días disponibles
    const rawDias = sala.diasdisponible || sala.DiasDisponible || "LUN;MAR;MIE;JUE;VIE;SAB;DOM";
    const listaDias = typeof rawDias === "string" ? rawDias.split(";").filter(Boolean) : ["LUN", "MAR", "MIE", "JUE", "VIE", "SAB", "DOM"];
    setDiasSeleccionados(listaDias);

    let parsedMapa = [];
    try {
      if (typeof sala.mapa === "string" && sala.mapa.trim()) {
        const obj = JSON.parse(sala.mapa);
        parsedMapa = obj.elementos || [];
      } else if (typeof sala.mapa === "object" && sala.mapa) {
        parsedMapa = sala.mapa.elementos || [];
      }
    } catch {
      parsedMapa = [];
    }
    setElementosMapa(parsedMapa);
    setErrorForm("");
    setAvisoExceso(null);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setSalaEdicion(null);
    setErrorForm("");
    setAvisoExceso(null);
  };

  const toggleDia = (clave) => {
    setDiasSeleccionados((prev) =>
      prev.includes(clave) ? prev.filter((d) => d !== clave) : [...prev, clave]
    );
  };

  const handleGuardarSala = async (e) => {
    e.preventDefault();
    setErrorForm("");

    if (!nombre.trim()) {
      setErrorForm("El nombre de la sala es obligatorio.");
      return;
    }

    if (!horaApertura || !horaCierre) {
      setErrorForm("Debes especificar la hora de apertura y de cierre.");
      return;
    }

    // Validación: Hora de apertura debe ser menor a la hora de cierre
    if (horaApertura >= horaCierre) {
      setErrorForm("La hora de apertura no puede ser mayor o igual a la hora de cierre.");
      return;
    }

    // Validación: Al menos un día activo
    if (diasSeleccionados.length === 0) {
      setErrorForm("Debes seleccionar al menos un día disponible para la sala.");
      return;
    }

    const sillasEnMapa = elementosMapa.filter((el) => el.tipo === "silla").length;
    const capacidadNumerica = Number(capacidad) || 0;

    if (sillasEnMapa !== capacidadNumerica) {
      setErrorForm(
        `Debes asignar exactamente todas las sillas en el mapa antes de guardar. ` +
        `Capacidad requerida: ${capacidadNumerica} sillas | Sillas asignadas actualmente: ${sillasEnMapa}.`
      );
      return;
    }

    const payload = {
      salasid: salaEdicion ? salaEdicion.salasid : undefined,
      nombre: nombre.trim(),
      descripcion,
      sucursalesid: Number(sucursalid),
      capacidad: capacidadNumerica,
      sobrecargo: Number(sobrecargo) || 0,
      activo,
      horaapertura: `${horaApertura}:00`,
      horacierre: `${horaCierre}:00`,
      diasdisponible: diasSeleccionados.join(";"),
      mapa: {
        filas: FILAS_GRID,
        columnas: COLS_GRID,
        elementos: elementosMapa,
      },
    };

    try {
      const res = await fetch(`${API_URL}/api/salas/guardar-sala`, {
        method: "POST",
        headers: obtenerHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.mensaje || "Error al guardar");
      }

      cerrarModal();
      cargarDatos();
    } catch (err) {
      setErrorForm(err.message);
    }
  };

  const sillasActuales = elementosMapa.filter((el) => el.tipo === "silla");
  const sillasActualesEnMapa = sillasActuales.length;

  const handleClicCelda = (x, y) => {
    if (avisoExceso) setAvisoExceso(null);

    const elementoExistente = elementosMapa.find((el) => el.x === x && el.y === y);

    if (herramienta === "borrar") {
      if (elementoExistente) {
        const nuevos = elementosMapa.filter((el) => !(el.x === x && el.y === y));
        let contador = 1;
        const renumerados = nuevos.map((item) => {
          if (item.tipo === "silla") {
            return { ...item, numeroSilla: contador++ };
          }
          return item;
        });
        setElementosMapa(renumerados);
      }
      return;
    }

    if (herramienta === "mesa") {
      const nuevos = elementosMapa.filter((el) => !(el.x === x && el.y === y));
      setElementosMapa([...nuevos, { x, y, tipo: "mesa" }]);
      return;
    }

    if (herramienta === "tv") {
      const nuevos = elementosMapa.filter((el) => !(el.x === x && el.y === y));
      setElementosMapa([...nuevos, { x, y, tipo: "tv" }]);
      return;
    }

    if (herramienta === "silla") {
      if (elementoExistente?.tipo === "silla") return;

      if (sillasActualesEnMapa >= Number(capacidad)) {
        setAvisoExceso({ x, y });
        setTimeout(() => {
          setAvisoExceso((actual) => (actual?.x === x && actual?.y === y ? null : actual));
        }, 2200);
        return;
      }

      const siguienteNumeroSilla = sillasActualesEnMapa + 1;
      const filtrados = elementosMapa.filter((el) => !(el.x === x && el.y === y));
      setElementosMapa([
        ...filtrados,
        { x, y, tipo: "silla", numeroSilla: siguienteNumeroSilla },
      ]);
    }
  };

  const salasFiltradas = salas.filter((s) => {
    if (filtroEstado === "activos" && !s.activo) return false;
    if (filtroEstado === "inactivos" && s.activo) return false;
    return (
      (s.nombre || "").toLowerCase().includes(busqueda.toLowerCase()) ||
      (s.descripcion || "").toLowerCase().includes(busqueda.toLowerCase())
    );
  });

  return (
    <div className="modificar-salas-plano">
      <header className="salas-header">
        <div className="header-izq">
          {onVolver && (
            <button type="button" className="btn-volver" onClick={onVolver} title="Volver a Reservaciones">
              ← Volver
            </button>
          )}
          <h2 className="header-titulo">Administración de Salas de Juntas</h2>
        </div>

        <div className="header-acciones">
          <input
            type="text"
            className="input-buscar"
            placeholder="Buscar sala..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />

          <div className="filtro-estado-caja">
            <label>Estado:</label>
            <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
              <option value="todos">Todas</option>
              <option value="activos">Activas</option>
              <option value="inactivos">Inactivas</option>
            </select>
          </div>

          <button type="button" className="btn-nuevo" onClick={abrirModalNueva}>
            + Nueva Sala
          </button>
        </div>
      </header>

      <div className="tabla-contenedor">
        {cargando ? (
          <div className="mensaje-estado">Cargando salas...</div>
        ) : salasFiltradas.length === 0 ? (
          <div className="mensaje-estado">No hay salas registradas.</div>
        ) : (
          <table className="tabla-salas">
            <thead>
              <tr>
                <th style={{ width: "90px" }}>Estado</th>
                <th>Nombre de la Sala</th>
                <th>Sucursal</th>
                <th style={{ textAlign: "center" }}>Horario de Atención</th>
                <th style={{ textAlign: "center" }}>Días</th>
                <th style={{ textAlign: "center" }}>Capacidad Sillas</th>
                <th style={{ textAlign: "center" }}>Sobrecargo (+pie)</th>
                <th>Descripción</th>
                <th style={{ width: "70px", textAlign: "center" }}>Editar</th>
              </tr>
            </thead>
            <tbody>
              {salasFiltradas.map((sala) => {
                const suc = sucursales.find((sc) => sc.sucursalId === sala.sucursalesid);
                const nombreSucursal =
                  sala.sucursalesid === -1 ? "Todas (Global)" : suc?.nombre || `Sucursal #${sala.sucursalesid}`;

                const ap = (sala.horaapertura || sala.HoraApertura || "08:00").slice(0, 5);
                const ci = (sala.horacierre || sala.HoraCierre || "20:00").slice(0, 5);
                const dias = (sala.diasdisponible || sala.DiasDisponible || "LUN;MAR;MIE;JUE;VIE;SAB;DOM")
                  .split(";")
                  .filter(Boolean)
                  .join(", ");

                return (
                  <tr
                    key={sala.salasid}
                    className={`fila-sala ${!sala.activo ? "fila-inactivo" : ""}`}
                    onClick={() => abrirModalEditar(sala)}
                  >
                    <td>
                      <span className={`badge-status ${sala.activo ? "badge-activo" : "badge-inactivo"}`}>
                        {sala.activo ? "Activa" : "Inactiva"}
                      </span>
                    </td>
                    <td className="col-nombre">{sala.nombre}</td>
                    <td className="col-sucursal">
                      <span className="chip-sucursal">{nombreSucursal}</span>
                    </td>
                    <td style={{ textAlign: "center", fontWeight: 600, color: "#334155" }}>
                      ⏰ {ap} - {ci}
                    </td>
                    <td style={{ textAlign: "center", fontSize: "11.5px", color: "#64748b" }}>
                      {dias}
                    </td>
                    <td style={{ textAlign: "center", fontWeight: 700, color: "#0284c7" }}>
                      🪑 {sala.capacidad}
                    </td>
                    <td style={{ textAlign: "center", fontWeight: 600, color: "#64748b" }}>
                      +{sala.sobrecargo}
                    </td>
                    <td className="col-desc">{sala.descripcion || "—"}</td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        type="button"
                        className="btn-editar-fila"
                        title="Editar sala"
                        onClick={(e) => {
                          e.stopPropagation();
                          abrirModalEditar(sala);
                        }}
                      >
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modalAbierto && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-tarjeta-sala" onClick={(e) => e.stopPropagation()}>
            <div className="modal-cabecera">
              <h3>{salaEdicion ? `Modificar Sala: ${salaEdicion.nombre}` : "Nueva Sala de Juntas"}</h3>
              <button type="button" className="btn-cerrar-x" onClick={cerrarModal}>✕</button>
            </div>

            <form onSubmit={handleGuardarSala} className="modal-formulario">
              {errorForm && <div className="error-aviso">{errorForm}</div>}

              <div className="fila-dos-campos">
                <div className="campo-grupo flex-2">
                  <label>Nombre de la Sala *</label>
                  <input
                    type="text"
                    placeholder="Ej. Sala Roble"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                  />
                </div>

                <div className="campo-grupo flex-2">
                  <label>Sucursal:</label>
                  <select value={sucursalid} onChange={(e) => setSucursalid(e.target.value)}>
                    <option value="-1">🌐 Disponible en todas las sucursales (-1)</option>
                    {sucursales.map((suc) => (
                      <option key={suc.sucursalId} value={suc.sucursalId}>
                        {suc.nombre} ({suc.ip})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Nuevos campos: Horario de Apertura y Cierre */}
              <div className="fila-dos-campos">
                <div className="campo-grupo">
                  <label>Hora Apertura *</label>
                  <input
                    type="time"
                    value={horaApertura}
                    onChange={(e) => setHoraApertura(e.target.value)}
                    required
                  />
                </div>

                <div className="campo-grupo">
                  <label>Hora Cierre *</label>
                  <input
                    type="time"
                    value={horaCierre}
                    onChange={(e) => setHoraCierre(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Días Disponibles */}
              <div className="campo-grupo">
                <label>Días Disponibles * (Selecciona al menos uno):</label>
                <div className="contenedor-dias-selector">
                  {DIAS_SEMANA.map((dia) => {
                    const seleccionado = diasSeleccionados.includes(dia.clave);
                    return (
                      <button
                        type="button"
                        key={dia.clave}
                        className={`btn-dia-chip ${seleccionado ? "dia-activo" : ""}`}
                        onClick={() => toggleDia(dia.clave)}
                      >
                        {dia.etiqueta}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="campo-grupo">
                <label>Descripción y Equipamiento:</label>
                <textarea
                  placeholder="Ej. Sala ejecutiva con pantalla 4K, pizarra y videoconferencia..."
                  rows="2"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </div>

              <div className="fila-dos-campos">
                <div className="campo-grupo">
                  <label>Capacidad Sillas (Mesas):</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={capacidad}
                    onChange={(e) => setCapacidad(Number(e.target.value))}
                    required
                  />
                </div>

                <div className="campo-grupo">
                  <label>Sobrecargo (Personas de pie / sin silla):</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={sobrecargo}
                    onChange={(e) => setSobrecargo(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="bloque-mapa-acceso">
                <div>
                  <strong>Plano de la Sala (16x20):</strong>
                  <p className="subtexto-mapa">
                    {sillasActualesEnMapa} de {capacidad} sillas asignadas | {elementosMapa.filter((e) => e.tipo === "mesa").length} mesas | {elementosMapa.filter((e) => e.tipo === "tv").length} TV.
                  </p>
                  {sillasActualesEnMapa !== Number(capacidad) && (
                    <span className="aviso-sillas-incompletas">
                      ⚠️ Faltan {Number(capacidad) - sillasActualesEnMapa} sillas por colocar en el plano.
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="btn-abrir-mapa"
                  onClick={() => setModalMapaAbierto(true)}
                >
                  🗺️ Diseñar Mapa / Asignar Sillas
                </button>
              </div>

              {salaEdicion && (
                <div className="campo-switch">
                  <label>Estado de la Sala:</label>
                  <button
                    type="button"
                    className={`btn-toggle-estado ${activo ? "toggle-activo" : "toggle-inactivo"}`}
                    onClick={() => setActivo(!activo)}
                  >
                    {activo ? "✓ Activa" : "✕ Inactiva"}
                  </button>
                </div>
              )}

              <div className="modal-acciones">
                <button type="button" className="btn-cancelar" onClick={cerrarModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn-guardar">
                  {salaEdicion ? "Guardar Cambios" : "Crear Sala"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Diseñador Interactivo de Mapa 16x20 */}
      {modalMapaAbierto && (
        <div className="modal-overlay" onClick={() => setModalMapaAbierto(false)}>
          <div className="modal-tarjeta-mapa" onClick={(e) => e.stopPropagation()}>
            <div className="modal-cabecera">
              <div>
                <h3>Diseñador del Plano (16x20) — {nombre || "Sala"}</h3>
                <span className={`contador-sillas-badge ${sillasActualesEnMapa === Number(capacidad) ? "badge-completo" : "badge-pendiente"}`}>
                  Sillas en el mapa: {sillasActualesEnMapa} / {capacidad}
                </span>
              </div>
              <button type="button" className="btn-cerrar-x" onClick={() => setModalMapaAbierto(false)}>✕</button>
            </div>

            <div className="mapa-toolbar">
              <span className="toolbar-label">Herramienta:</span>
              <button
                type="button"
                className={`tool-btn ${herramienta === "silla" ? "tool-activo" : ""}`}
                onClick={() => {
                  setHerramienta("silla");
                  setAvisoExceso(null);
                }}
              >
                🪑 Colocar Silla
              </button>
              <button
                type="button"
                className={`tool-btn ${herramienta === "mesa" ? "tool-activo-mesa" : ""}`}
                onClick={() => {
                  setHerramienta("mesa");
                  setAvisoExceso(null);
                }}
              >
                <span className="icono-btn-mesa">┬─┬</span> Colocar Mesa
              </button>
              <button
                type="button"
                className={`tool-btn ${herramienta === "tv" ? "tool-activo-tv" : ""}`}
                onClick={() => {
                  setHerramienta("tv");
                  setAvisoExceso(null);
                }}
              >
                📺 Colocar TV
              </button>
              <button
                type="button"
                className={`tool-btn ${herramienta === "borrar" ? "tool-activo-borrar" : ""}`}
                onClick={() => {
                  setHerramienta("borrar");
                  setAvisoExceso(null);
                }}
              >
                🧹 Borrar
              </button>
              <button
                type="button"
                className="tool-btn btn-limpiar-todo"
                onClick={() => {
                  if (confirm("¿Deseas limpiar todos los elementos del mapa?")) {
                    setElementosMapa([]);
                    setAvisoExceso(null);
                  }
                }}
              >
                Limpiar Todo
              </button>
            </div>

            <div className="mapa-grid-contenedor">
              <div
                className="grid-sala"
                style={{
                  gridTemplateColumns: `repeat(${COLS_GRID}, 42px)`,
                  gridTemplateRows: `repeat(${FILAS_GRID}, 42px)`,
                }}
              >
                {Array.from({ length: FILAS_GRID }).map((_, y) =>
                  Array.from({ length: COLS_GRID }).map((_, x) => {
                    const el = elementosMapa.find((item) => item.x === x && item.y === y);
                    const tieneAvisoExceso = avisoExceso?.x === x && avisoExceso?.y === y;

                    return (
                      <div
                        key={`${x}-${y}`}
                        className={`celda-grid ${el ? `celda-${el.tipo}` : ""}`}
                        onClick={() => handleClicCelda(x, y)}
                        title={`Posición [${x}, ${y}]${el ? `: ${el.tipo.toUpperCase()}` : " (Vacío)"}`}
                      >
                        {el?.tipo === "mesa" && (
                          <span className="texto-mesa-ascii">┬─┬</span>
                        )}
                        {el?.tipo === "tv" && (
                          <span className="texto-tv-icono" title="Pantalla / Televisión">📺</span>
                        )}
                        {el?.tipo === "silla" && (
                          <div className="icono-silla-caja">
                            <span className="icono-silla-emoji">🪑</span>
                            <span className="numero-silla">{el.numeroSilla}</span>
                          </div>
                        )}

                        {tieneAvisoExceso && (
                          <div className="tooltip-exceso-sillas">
                            Has excedido el número de sillas (Máximo: {capacidad})
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="mapa-pie">
              <p className="nota-pie-mapa">
                * Para guardar la sala debes colocar exactamente <strong>{capacidad}</strong> sillas (actualmente: {sillasActualesEnMapa}). Las mesas y la TV no son obligatorias.
              </p>
              <button
                type="button"
                className="btn-guardar"
                onClick={() => setModalMapaAbierto(false)}
              >
                Aceptar Plano
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ModificarSalas;