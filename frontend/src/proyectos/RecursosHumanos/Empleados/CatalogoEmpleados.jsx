// frontend/src/proyectos/RecursosHumanos/Empleados/CatalogoEmpleados.jsx
import { useState, useEffect, useMemo } from "react";
import ModificarEmpleado from "./ModificarEmpleado";
import "./CatalogoEmpleados.css";

const API_URL = `http://${window.location.hostname}:3001`;

function CatalogoEmpleados() {
  // 1. Filtros superiores
  const [sucursal, setSucursal] = useState("todas");
  const [departamento, setDepartamento] = useState("todas");
  const [puesto, setPuesto] = useState("todas");
  const [estatus, setEstatus] = useState("todos");
  const [busqueda, setBusqueda] = useState("");

  // 2. Catálogos para selects
  const [catSucursales, setCatSucursales] = useState([]);
  const [catDepartamentos, setCatDepartamentos] = useState([]);
  const [catPuestos, setCatPuestos] = useState([]);

  // 3. Datos y selección de fila
  const [listaEmpleados, setListaEmpleados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [tabActivo, setTabActivo] = useState("configuracion");
  const [empleadoSeleccionadoId, setEmpleadoSeleccionadoId] = useState(null);

  // 4. Alternar a la pantalla de Modificar Empleado
  const [vistaModificar, setVistaModificar] = useState(false);

  // Carga inicial de datos
  useEffect(() => {
    const sesion = JSON.parse(localStorage.getItem("sesion_pos") || "{}");
    const headers = {
      "x-sucursal-ip": sesion?.sucursal?.ip || "127.0.0.1",
      "x-sucursal-port": String(sesion?.sucursal?.puerto || 3306),
    };

    setCargando(true);

    Promise.all([
      fetch(`${API_URL}/api/empleados`, { headers }).then((res) => res.json()),
      fetch(`${API_URL}/api/empleados/catalogos-filtros`, { headers }).then(
        (res) => res.json()
      ),
    ])
      .then(([dataEmpleados, dataFiltros]) => {
        setListaEmpleados(Array.isArray(dataEmpleados) ? dataEmpleados : []);
        setCatSucursales(dataFiltros.sucursales || []);
        setCatDepartamentos(dataFiltros.departamentos || []);
        setCatPuestos(dataFiltros.puestos || []);
      })
      .catch((err) => console.error("Error al cargar empleados:", err))
      .finally(() => setCargando(false));
  }, []);

  // 4. Filtrado riguroso en memoria local
  const empleadosFiltrados = useMemo(() => {
    return listaEmpleados.filter((emp) => {
      // Filtro Sucursal
      if (sucursal !== "todas") {
        const idSuc = emp.SucursalesID != null ? String(emp.SucursalesID).trim() : "";
        if (idSuc !== String(sucursal).trim()) return false;
      }

      // Filtro Departamento
      if (departamento !== "todas") {
        const idDep = emp.DepartamentosID != null ? String(emp.DepartamentosID).trim() : "";
        if (idDep !== String(departamento).trim()) return false;
      }

      // Filtro Puesto
      if (puesto !== "todas") {
        const idPto = emp.PuestosID != null ? String(emp.PuestosID).trim() : "";
        if (idPto !== String(puesto).trim()) return false;
      }

      // Filtro Estatus
      const esActivo = Number(emp.Activo) === 1;
      if (estatus === "activos" && !esActivo) return false;
      if (estatus === "inactivos" && esActivo) return false;

      // Buscador de texto predictivo
      if (busqueda.trim() !== "") {
        const q = busqueda.toLowerCase().trim();
        const codigo = String(emp.Codigo || "").toLowerCase().trim();
        const contpaq = String(emp.NumeroCompaq || "").toLowerCase().trim();
        const usuario = String(emp.Usuario || emp.Nombre_Us || "").toLowerCase().trim();
        const nombreCompleto = `${emp.Nombre || ""} ${emp.ApellidoPaterno || ""} ${emp.ApellidoMaterno || ""}`
          .toLowerCase()
          .replace(/\s+/g, " ")
          .trim();
        const puestoNom = String(emp.PuestoNombre || emp.Nombre_Puesto || "").toLowerCase().trim();
        const depaNom = String(emp.DepartamentoNombre || emp.Descripcion || "").toLowerCase().trim();

        const coincide =
          codigo.includes(q) ||
          contpaq.includes(q) ||
          usuario.includes(q) ||
          nombreCompleto.includes(q) ||
          puestoNom.includes(q) ||
          depaNom.includes(q);

        if (!coincide) return false;
      }

      return true;
    });
  }, [listaEmpleados, sucursal, departamento, puesto, estatus, busqueda]);

  const handleSeleccionarFila = (id) => {
    setEmpleadoSeleccionadoId((prev) => (prev === id ? null : id));
  };

  const obtenerClaseFila = (emp) => {
    if (empleadoSeleccionadoId === emp.EmpleadosID) return "fila-seleccionada";
    if (Number(emp.Baja_Temporal) === 1) return "fila-baja-temporal";
    if (Number(emp.Activo) === 0) return "fila-inactivo";
    if (!emp.JornadasID || Number(emp.JornadasID) === 0)
      return "fila-sin-jornada";
    return "";
  };

  // Clave dinámica para forzar re-render limpio en cada cambio de filtro
  const tablaClaveRender = `${sucursal}-${departamento}-${puesto}-${estatus}-${busqueda}`;

  // Si está activa la vista modificar, renderiza el formulario de edición
  if (vistaModificar) {
    return (
      <ModificarEmpleado
        empleadoId={empleadoSeleccionadoId}
        onRegresar={() => setVistaModificar(false)}
      />
    );
  }

  return (
    <div className="cat-empleados-contenedor">
      {/* 1. Barra Superior de Filtros */}
      <div className="cat-empleados-filtros-bar">
        <div className="filtro-grupo">
          <label className="filtro-label">
            <span className="filtro-icono">📍</span> Sucursal
          </label>
          <select
            className="filtro-select"
            value={sucursal}
            onChange={(e) => setSucursal(e.target.value)}
          >
            <option value="todas">&lt; Todas &gt;</option>
            {catSucursales.map((suc) => (
              <option key={suc.id} value={suc.id}>
                {suc.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="filtro-grupo">
          <label className="filtro-label">
            <span className="filtro-icono">🏢</span> Departamento
          </label>
          <select
            className="filtro-select"
            value={departamento}
            onChange={(e) => setDepartamento(e.target.value)}
          >
            <option value="todas">&lt; Todas &gt;</option>
            {catDepartamentos.map((dep) => (
              <option key={dep.id} value={dep.id}>
                {dep.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="filtro-grupo">
          <label className="filtro-label">
            <span className="filtro-icono">💼</span> Puesto
          </label>
          <select
            className="filtro-select"
            value={puesto}
            onChange={(e) => setPuesto(e.target.value)}
          >
            <option value="todas">&lt; Todas &gt;</option>
            {catPuestos.map((pto) => (
              <option key={pto.id} value={pto.id}>
                {pto.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="filtro-grupo">
          <label className="filtro-label">
            <span className="filtro-icono">⚡</span> Estatus
          </label>
          <select
            className="filtro-select"
            value={estatus}
            onChange={(e) => setEstatus(e.target.value)}
          >
            <option value="todos">&lt; Todos &gt;</option>
            <option value="activos">Activos</option>
            <option value="inactivos">Inactivos</option>
          </select>
        </div>

        <div className="filtro-busqueda-grupo">
          <span className="busqueda-icono">🔍</span>
          <input
            type="text"
            className="filtro-input-buscar"
            placeholder="Buscar empleado..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      {/* 2. Área Central de Tabla con Key Dinámica */}
      <div className="cat-empleados-tabla-area" key={tablaClaveRender}>
        {cargando ? (
          <div className="cat-empleados-cargando">
            <p>Cargando empleados...</p>
          </div>
        ) : empleadosFiltrados.length > 0 ? (
          <table className="tabla-empleados-limpia">
            <thead>
              <tr>
                <th>No. Empleado</th>
                <th>No. Contpaq</th>
                <th>Usuario</th>
                <th>Nombre</th>
                <th>Paterno</th>
                <th>Materno</th>
                <th>Puesto</th>
                <th>Departamento</th>
                <th>Jornada</th>
              </tr>
            </thead>
            <tbody>
              {empleadosFiltrados.map((emp) => (
                <tr
                  key={emp.EmpleadosID}
                  className={`fila-empleado ${obtenerClaseFila(emp)}`}
                  onClick={() => handleSeleccionarFila(emp.EmpleadosID)}
                  onDoubleClick={() => {
                    setEmpleadoSeleccionadoId(emp.EmpleadosID);
                    setVistaModificar(true);
                  }}
                >
                  <td className="celda-codigo">{emp.Codigo || "—"}</td>
                  <td>{emp.NumeroCompaq || "—"}</td>
                  <td>{emp.Usuario || emp.Nombre_Us || "—"}</td>
                  <td className="celda-destacada">{emp.Nombre || "—"}</td>
                  <td>{emp.ApellidoPaterno || "—"}</td>
                  <td>{emp.ApellidoMaterno || "—"}</td>
                  <td>{emp.PuestoNombre || emp.Nombre_Puesto || "—"}</td>
                  <td>{emp.DepartamentoNombre || emp.Descripcion || "—"}</td>
                  <td>{emp.JornadaNombre || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="cat-empleados-vacio">
            <div className="vacio-ilustracion">
              <svg
                width="80"
                height="80"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#6366f1"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                />
                <circle
                  cx="17.5"
                  cy="17.5"
                  r="4.5"
                  stroke="#4338ca"
                  strokeWidth="1.8"
                />
                <path
                  d="M21 21l-2.2-2.2"
                  stroke="#4338ca"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h3 className="vacio-titulo">No se encontraron empleados</h3>
            <p className="vacio-subtitulo">
              No hay empleados que coincidan con los criterios seleccionados.
            </p>
          </div>
        )}
      </div>

      {/* 3. Barra Inferior con Tabs y Acciones */}
      <div className="cat-empleados-footer-contenedor">
        {/* Fila A: Tabs y Leyendas */}
        <div className="footer-tabs-barra">
          <div className="tabs-botones-grupo">
            <button
              type="button"
              className={`tab-btn ${
                tabActivo === "configuracion" ? "tab-btn-activo" : ""
              }`}
              onClick={() => setTabActivo("configuracion")}
            >
              ⚙ Configuración
            </button>
            <button
              type="button"
              className={`tab-btn ${
                tabActivo === "masOpciones" ? "tab-btn-activo" : ""
              }`}
              onClick={() => setTabActivo("masOpciones")}
            >
              + Más opciones
            </button>
          </div>

          <div className="footer-leyendas">
            <div className="item-leyenda">
              <span className="cuadro-color color-sin-jornada"></span>
              <span>Empleado Sin Jornada</span>
            </div>
            <div className="item-leyenda">
              <span className="cuadro-color color-baja-temporal"></span>
              <span>Baja Temporal, Pendiente de Inactivar</span>
            </div>
            <div className="item-leyenda">
              <span className="cuadro-color color-inactivo"></span>
              <span>Inactivo</span>
            </div>
          </div>
        </div>

        {/* Fila B: Acciones dinámicas */}
        <div className="footer-acciones-barra">
          {tabActivo === "configuracion" && (
            <div className="acciones-grupo-dinamico">
              <button type="button" className="btn-accion btn-activar">
                ▶ Activar
              </button>
              <button type="button" className="btn-accion btn-baja-temporal">
                ■ Baja Temporal
              </button>
              <button type="button" className="btn-accion btn-reactivar">
                ● Reactivar
              </button>
              <button type="button" className="btn-accion btn-huellas">
                🖐 Huellas
              </button>
              <button type="button" className="btn-accion btn-usuario">
                👤 Usuario
              </button>

              <div className="acciones-separador-derecha">
                <button type="button" className="btn-accion btn-agregar-morado">
                  + Agregar
                </button>
                <button
                  type="button"
                  className="btn-accion btn-modificar"
                  onClick={() => {
                    if (!empleadoSeleccionadoId) {
                      alert(
                        "Por favor selecciona un empleado de la lista primero."
                      );
                      return;
                    }
                    setVistaModificar(true);
                  }}
                >
                  ✏ Modificar
                </button>
              </div>
            </div>
          )}

          {tabActivo === "masOpciones" && (
            <div className="acciones-grupo-dinamico">
              <button type="button" className="btn-accion btn-tab-opcion">
                📅 Jornadas
              </button>
              <button type="button" className="btn-accion btn-tab-opcion">
                ✉ Sobres
              </button>
              <button type="button" className="btn-accion btn-tab-opcion">
                🪪 Gafetes
              </button>
              <button type="button" className="btn-accion btn-tab-opcion">
                🔍 Pruebas Huellas
              </button>
              <button type="button" className="btn-accion btn-tab-opcion">
                🎁 Mes del Empleado
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CatalogoEmpleados;