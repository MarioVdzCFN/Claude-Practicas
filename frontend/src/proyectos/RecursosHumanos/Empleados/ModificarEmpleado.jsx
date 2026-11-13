// frontend/src/proyectos/RecursosHumanos/Empleados/ModificarEmpleado.jsx
import { useState, useEffect } from "react";
import "./ModificarEmpleado.css";

const API_URL = `http://${window.location.hostname}:3001`;

function ModificarEmpleado({ empleadoId, onRegresar }) {
  const [tabActivo, setTabActivo] = useState("general");
  const [cargando, setCargando] = useState(true);

  // Catálogos dinámicos
  const [catSucursales, setCatSucursales] = useState([]);
  const [catPuestos, setCatPuestos] = useState([]);
  const [catDepartamentos, setCatDepartamentos] = useState([]);
  const [catJornadas, setCatJornadas] = useState([]);
  const [catContratos, setCatContratos] = useState([]);

  // Estado unificado del formulario
  const [formData, setFormData] = useState({
    // Cabecera superior fija
    fotoUrl: "",
    sucursalesId: "",
    puestosId: "",
    departamentosId: "",
    codigo: "",
    numeroCompaq: "",
    registroPatronal: "",
    nombre: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    activo: 1,
    fechaIngreso: "",

    // Tab 1: Información General
    buscadorNuevo: false,
    esJefeDepartamento: false,
    checadaLibre: false,
    checarSinHuella: false,
    permiteChecarDespuesdeHorario: false,
    noRecontratable: false,
    permitirCargarEntradasOC: false,
    staff: false,
    noSolicitaClavePesoPV: false,
    pvPedirLecturaMobileApp: false,
    esVendedor: false,
    pagoTarjetaBancaria: false,
    verTodasLineas: false,
    importeCancelacion: "0.00",
    tutorAsignado: "",

    // Tab 2: Información Personal
    sexo: "MASCULINO",
    fechaNacimiento: "",
    lugarNacimiento: "",
    nacionalidad: "",
    estadoCivil: "",
    hijos: "NO",
    nivelEstudio: "",
    noIfe: "",
    curp: "",
    rfc: "0",
    colonia: "",
    calle: "",
    numeroCasa: "0",
    codigoPostal: "0",
    alergias: "",
    tipoSangre: "O-",
    tallaCamisa: "",
    noLicencia: "",
    vencimientoLicencia: "",
    telefonoEmergencia: "",
    contactoEmergencia: "",
    correoElectronico: "",
    correoElectronicoNotif: "",
    recibeNotificaciones: false,

    // Tab 3: Nómina
    noSeguroSocial: "",
    salarioDiarioImss: "0.00",
    salarioDiario: "0.00",
    horasExtrasFijas: "0.0",
    noCreditoInfonavit: "",
    factorCreditoInfonavit: "",
    creditoFonacot: "",
    tiempoDescanso: "",
    horasMinimasSalidaDescanso: "",
    fechaProximaEvaluacion: "",
    fechaProximasVacaciones: "",
    fechaVencimientoContrato: "",
    jornadaId: "",
    contratoId: "",
    fechaBaja: "2000-01-01",
    excluirPrenomina: false,
    calculoLocalPrenomina: false,
  });

  // Carga de catálogos y datos del empleado
  useEffect(() => {
    if (!empleadoId) return;

    const sesion = JSON.parse(localStorage.getItem("sesion_pos") || "{}");
    const headers = {
      "x-sucursal-ip": sesion?.sucursal?.ip || "127.0.0.1",
      "x-sucursal-port": String(sesion?.sucursal?.puerto || 3306),
    };

    setCargando(true);

    Promise.all([
      fetch(`${API_URL}/api/empleados/catalogos-filtros`, { headers }).then((res) => res.json()),
      fetch(`${API_URL}/api/empleados/${empleadoId}`, { headers }).then((res) => res.json()),
    ])
      .then(([filtros, emp]) => {
        // Guardar catálogos
        setCatSucursales(filtros.sucursales || []);
        setCatPuestos(filtros.puestos || []);
        setCatDepartamentos(filtros.departamentos || []);
        setCatJornadas(filtros.jornadas || []);
        setCatContratos(filtros.contratos || []);

        const formatearFecha = (f) => {
          if (!f) return "";
          return String(f).split("T")[0];
        };

        // Mapeo seguro con datos de la BD y foto NAS
        setFormData((prev) => ({
          ...prev,
          fotoUrl: `${API_URL}/api/empleados/${empleadoId}/foto?t=${Date.now()}`,
          sucursalesId: emp.SucursalesID != null ? String(emp.SucursalesID) : "",
          puestosId: emp.PuestosID != null ? String(emp.PuestosID) : "",
          departamentosId: emp.DepartamentosID != null ? String(emp.DepartamentosID) : "",
          codigo: emp.Codigo || "",
          numeroCompaq: emp.NumeroCompaq || "",
          registroPatronal: emp.RegistroPatronal || emp.Registro_Patronal || "",
          nombre: String(emp.Nombre || "").trim(),
          apellidoPaterno: String(emp.ApellidoPaterno || "").trim(),
          apellidoMaterno: String(emp.ApellidoMaterno || "").trim(),
          activo: Number(emp.Activo) === 1 ? 1 : 0,
          fechaIngreso: formatearFecha(emp.FechaIngreso || emp.Fecha_Ingreso),

          // Tab 1: General
          buscadorNuevo: Number(emp.BuscadorNuevo) === 1,
          esJefeDepartamento: Number(emp.EsJefeDepartamento) === 1,
          checadaLibre: Number(emp.ChecadaLibre) === 1,
          checarSinHuella: Number(emp.ChecarSinHuella) === 1,
          permiteChecarDespuesdeHorario: Number(emp.PermiteChecarDespuesdeHorario) === 1,
          noRecontratable: Number(emp.NoRecontratable) === 1,
          permitirCargarEntradasOC: Number(emp.PermitirCargarEntradasOC) === 1,
          staff: Number(emp.Staff) === 1,
          noSolicitaClavePesoPV: Number(emp.NoSolicitaClavePesoPV) === 1,
          pvPedirLecturaMobileApp: Number(emp.PvPedirLecturaMobileApp) === 1,
          esVendedor: Number(emp.EsVendedor) === 1,
          pagoTarjetaBancaria: Number(emp.PagoTarjetaBancaria) === 1,
          verTodasLineas: Number(emp.VerTodasLineas) === 1,
          importeCancelacion: emp.ImporteCancelacion != null ? String(emp.ImporteCancelacion) : "0.00",
          tutorAsignado: emp.TutorAsignado || "",

          // Tab 2: Personal
          sexo: emp.Sexo || "MASCULINO",
          fechaNacimiento: formatearFecha(emp.FechaNacimiento || emp.Fecha_Nacimiento),
          lugarNacimiento: emp.LugarNacimiento || "",
          nacionalidad: emp.Nacionalidad || "",
          estadoCivil: emp.EstadoCivil || "",
          hijos: emp.Hijos || "NO",
          nivelEstudio: emp.NivelEstudio || "",
          noIfe: emp.NoIfe || emp.IFE || "",
          curp: emp.CURP || emp.Curp || "",
          rfc: emp.RFC || emp.Rfc || "0",
          colonia: emp.Colonia || "",
          calle: emp.Calle || "",
          numeroCasa: emp.NumeroCasa || "0",
          codigoPostal: emp.CodigoPostal || "0",
          alergias: emp.Alergias || "",
          tipoSangre: emp.TipoSangre || "O-",
          tallaCamisa: emp.TallaCamisa || "",
          noLicencia: emp.NoLicencia || "",
          vencimientoLicencia: formatearFecha(emp.VencimientoLicencia),
          telefonoEmergencia: emp.TelefonoEmergencia || "",
          contactoEmergencia: emp.ContactoEmergencia || "",
          correoElectronico: emp.CorreoElectronico || "",
          correoElectronicoNotif: emp.CorreoNotificacion || emp.CorreoElectronicoNotif || "",
          recibeNotificaciones: Number(emp.RecibeNotificaciones) === 1,

          // Tab 3: Nómina
          noSeguroSocial: emp.NoSeguroSocial || emp.NumeroSeguroSocial || "",
          salarioDiarioImss: emp.SalarioDiarioIMSS != null ? String(emp.SalarioDiarioIMSS) : "0.00",
          salarioDiario: emp.SalarioDiario != null ? String(emp.SalarioDiario) : "0.00",
          horasExtrasFijas: emp.HorasExtrasFijas != null ? String(emp.HorasExtrasFijas) : "0.0",
          noCreditoInfonavit: emp.NoCreditoInfonavit || "",
          factorCreditoInfonavit: emp.FactorCreditoInfonavit != null ? String(emp.FactorCreditoInfonavit) : "",
          creditoFonacot: emp.CreditoFonacot || "",
          tiempoDescanso: emp.TiempoDescanso || "",
          horasMinimasSalidaDescanso: emp.HorasMinimasSalidaDescanso || "",
          fechaProximaEvaluacion: formatearFecha(emp.FechaProximaEvaluacion),
          fechaProximasVacaciones: formatearFecha(emp.FechaProximasVacaciones),
          fechaVencimientoContrato: formatearFecha(emp.FechaVencimientoContrato),
          jornadaId: emp.JornadasID != null ? String(emp.JornadasID) : "",
          contratoId: emp.EstatusContratosID != null ? String(emp.EstatusContratosID) : (emp.ContratoTipo || ""),
          fechaBaja: formatearFecha(emp.FechaBaja || emp.Fecha_Baja) || "2000-01-01",
          excluirPrenomina: Number(emp.ExcluirPrenomina) === 1,
          calculoLocalPrenomina: Number(emp.CalculoLocalPrenomina) === 1,
        }));
      })
      .catch((err) => console.error("Error al cargar datos del empleado:", err))
      .finally(() => setCargando(false));
  }, [empleadoId]);

  const handleChange = (campo, valor) => {
    setFormData((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  const handleCargarFoto = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleChange("fotoUrl", URL.createObjectURL(file));
    }
  };

  const handleGuardar = async () => {
    try {
      const sesion = JSON.parse(localStorage.getItem("sesion_pos") || "{}");
      const headers = {
        "Content-Type": "application/json",
        "x-sucursal-ip": sesion?.sucursal?.ip || "127.0.0.1",
        "x-sucursal-port": String(sesion?.sucursal?.puerto || 3306),
      };

      const res = await fetch(`${API_URL}/api/empleados/${empleadoId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al actualizar");
      }

      alert("Empleado guardado correctamente");
      onRegresar();
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Ocurrió un error al guardar: " + error.message);
    }
  };

  return (
    <div className="mod-empleado-contenedor">
      {/* 1. SECCIÓN SUPERIOR: FOTO, SELECTORES Y DATOS GENERALES */}
      <div className="mod-empleado-cabecera">
        {/* Foto y Botones de Imagen */}
        <div className="mod-empleado-foto-bloque">
          <div className="mod-empleado-foto-caja">
            {formData.fotoUrl ? (
              <img
                src={formData.fotoUrl}
                alt="Empleado"
                className="mod-empleado-foto-img"
                onError={() => handleChange("fotoUrl", "")}
              />
            ) : (
              <div className="mod-empleado-foto-placeholder">
                <span className="mod-empleado-foto-simbolo">👤</span>
              </div>
            )}
          </div>
          <div className="mod-empleado-foto-acciones">
            <label className="btn-foto-accion" title="Cargar Imagen de Perfil">
              📁
              <input type="file" accept="image/*" onChange={handleCargarFoto} style={{ display: "none" }} />
            </label>
            <button
              type="button"
              className="btn-foto-accion"
              title="Tomar Foto con Cámara"
              onClick={() => alert("Función para activar cámara...")}
            >
              📷
            </button>
            <button
              type="button"
              className="btn-foto-accion"
              title="Descargar Foto"
              onClick={() => {
                if (formData.fotoUrl) {
                  window.open(formData.fotoUrl, "_blank");
                } else {
                  alert("No hay foto disponible para descargar.");
                }
              }}
            >
              💾
            </button>
          </div>
        </div>

        {/* Datos Principales */}
        <div className="mod-empleado-datos-bloque">
          {/* Fila 1: Sucursal, Puesto, Departamento dinámicos */}
          <div className="grid-cabecera-fila fila-selectores">
            <div className="control-grupo">
              <select
                className="input-select-clasico"
                value={formData.sucursalesId}
                onChange={(e) => handleChange("sucursalesId", e.target.value)}
              >
                <option value="">&lt; Seleccionar Sucursal &gt;</option>
                {catSucursales.map((suc) => (
                  <option key={suc.id} value={suc.id}>
                    {suc.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="control-grupo">
              <select
                className="input-select-clasico"
                value={formData.puestosId}
                onChange={(e) => handleChange("puestosId", e.target.value)}
              >
                <option value="">&lt; Seleccionar Puesto &gt;</option>
                {catPuestos.map((pto) => (
                  <option key={pto.id} value={pto.id}>
                    {pto.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="control-grupo">
              <select
                className="input-select-clasico"
                value={formData.departamentosId}
                onChange={(e) => handleChange("departamentosId", e.target.value)}
              >
                <option value="">&lt; Seleccionar Departamento &gt;</option>
                {catDepartamentos.map((dep) => (
                  <option key={dep.id} value={dep.id}>
                    {dep.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Fila 2: No. Empleado, No. Contpaq, Registro Patronal */}
          <div className="grid-cabecera-fila">
            <div className="control-grupo flex-2">
              <label className="control-label">No. Empleado</label>
              <input
                type="text"
                className="input-texto-clasico"
                value={formData.codigo}
                onChange={(e) => handleChange("codigo", e.target.value)}
              />
            </div>
            <div className="control-grupo flex-2">
              <label className="control-label">No. Contpaq</label>
              <input
                type="text"
                className="input-texto-clasico"
                value={formData.numeroCompaq}
                onChange={(e) => handleChange("numeroCompaq", e.target.value)}
              />
            </div>
            <div className="control-grupo flex-2">
              <label className="control-label">Registro Patronal</label>
              <input
                type="text"
                className="input-texto-clasico"
                value={formData.registroPatronal}
                onChange={(e) => handleChange("registroPatronal", e.target.value)}
              />
            </div>
          </div>

          {/* Fila 3: Nombre, Apellido Paterno, Apellido Materno */}
          <div className="grid-cabecera-fila">
            <div className="control-grupo flex-3">
              <label className="control-label">Nombre</label>
              <input
                type="text"
                className="input-texto-clasico"
                value={formData.nombre}
                onChange={(e) => handleChange("nombre", e.target.value)}
              />
            </div>
            <div className="control-grupo flex-2">
              <label className="control-label">Apellido Paterno</label>
              <input
                type="text"
                className="input-texto-clasico"
                value={formData.apellidoPaterno}
                onChange={(e) => handleChange("apellidoPaterno", e.target.value)}
              />
            </div>
            <div className="control-grupo flex-2">
              <label className="control-label">Apellido Materno</label>
              <input
                type="text"
                className="input-texto-clasico"
                value={formData.apellidoMaterno}
                onChange={(e) => handleChange("apellidoMaterno", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Estatus Foquito y Fecha de Ingreso */}
        <div className="mod-empleado-estatus-bloque">
          <div className="control-grupo">
            <label className="control-label">Estatus</label>
            <div className={`badge-estatus-foquito ${formData.activo === 1 ? "estatus-activo" : "estatus-inactivo"}`}>
              {formData.activo === 1 ? "ACTIVO" : "INACTIVO"}
            </div>
          </div>
          <div className="control-grupo mt-campo-fecha">
            <label className="control-label">Fecha Ingreso</label>
            <input
              type="date"
              className="input-texto-clasico input-fecha-icono"
              value={formData.fechaIngreso}
              onChange={(e) => handleChange("fechaIngreso", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 2. BARRA DE PESTAÑAS (TABS) */}
      <div className="mod-empleado-tabs-barra">
        <button
          type="button"
          className={`tab-btn-clasico ${tabActivo === "general" ? "tab-btn-clasico-activo" : ""}`}
          onClick={() => setTabActivo("general")}
        >
          📁 Información General
        </button>
        <button
          type="button"
          className={`tab-btn-clasico ${tabActivo === "personal" ? "tab-btn-clasico-activo" : ""}`}
          onClick={() => setTabActivo("personal")}
        >
          👤 Información Personal
        </button>
        <button
          type="button"
          className={`tab-btn-clasico ${tabActivo === "nomina" ? "tab-btn-clasico-activo" : ""}`}
          onClick={() => setTabActivo("nomina")}
        >
          💳 Nómina
        </button>
        <button
          type="button"
          className={`tab-btn-clasico ${tabActivo === "documentos" ? "tab-btn-clasico-activo" : ""}`}
          onClick={() => setTabActivo("documentos")}
        >
          📂 Documentos
        </button>
        <button
          type="button"
          className={`tab-btn-clasico ${tabActivo === "formatos" ? "tab-btn-clasico-activo" : ""}`}
          onClick={() => setTabActivo("formatos")}
        >
          📄 Formatos
        </button>
      </div>

      {/* 3. CONTENIDO DE LAS PESTAÑAS */}
      <div className="mod-empleado-tab-contenido">
        {cargando ? (
          <div className="tab-cuerpo-vacio">
            <p>Cargando información del empleado...</p>
          </div>
        ) : (
          <>
            {/* TAB 1: INFORMACIÓN GENERAL */}
            {tabActivo === "general" && (
              <div className="tab-cuerpo-general">
                <div className="grid-checkboxes-columnas">
                  <div className="columna-checkboxes">
                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={formData.buscadorNuevo}
                        onChange={(e) => handleChange("buscadorNuevo", e.target.checked)}
                      />
                      <span>Buscador de Artículos Nuevo</span>
                    </label>
                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={formData.esJefeDepartamento}
                        onChange={(e) => handleChange("esJefeDepartamento", e.target.checked)}
                      />
                      <span>Es Jefe de Departamento, realiza evaluaciones SICAD</span>
                    </label>
                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={formData.checadaLibre}
                        onChange={(e) => handleChange("checadaLibre", e.target.checked)}
                      />
                      <span>Checada Libre Sin Horario</span>
                    </label>
                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={formData.checarSinHuella}
                        onChange={(e) => handleChange("checarSinHuella", e.target.checked)}
                      />
                      <span>Checada Sin Huella Digital</span>
                    </label>
                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={formData.permiteChecarDespuesdeHorario}
                        onChange={(e) => handleChange("permiteChecarDespuesdeHorario", e.target.checked)}
                      />
                      <span>Permite Checar Salida Después del Horario</span>
                    </label>
                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={formData.noRecontratable}
                        onChange={(e) => handleChange("noRecontratable", e.target.checked)}
                      />
                      <span>No recontratable</span>
                    </label>
                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={formData.permitirCargarEntradasOC}
                        onChange={(e) => handleChange("permitirCargarEntradasOC", e.target.checked)}
                      />
                      <span>Permitir Cargar Entradas en Órdenes de Compra</span>
                    </label>
                  </div>

                  <div className="columna-checkboxes">
                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={formData.staff}
                        onChange={(e) => handleChange("staff", e.target.checked)}
                      />
                      <span>Staff</span>
                    </label>
                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={formData.noSolicitaClavePesoPV}
                        onChange={(e) => handleChange("noSolicitaClavePesoPV", e.target.checked)}
                      />
                      <span>PV No solicitar clave (No clave, no peso báscula)</span>
                    </label>
                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={formData.pvPedirLecturaMobileApp}
                        onChange={(e) => handleChange("pvPedirLecturaMobileApp", e.target.checked)}
                      />
                      <span>Pedir lectura de Mobile App (punto de Venta)</span>
                    </label>
                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={formData.esVendedor}
                        onChange={(e) => handleChange("esVendedor", e.target.checked)}
                      />
                      <span>Es Vendedor</span>
                    </label>
                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={formData.pagoTarjetaBancaria}
                        onChange={(e) => handleChange("pagoTarjetaBancaria", e.target.checked)}
                      />
                      <span>Pago con tarjeta bancaria</span>
                    </label>
                  </div>

                  <div className="columna-checkboxes">
                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={formData.verTodasLineas}
                        onChange={(e) => handleChange("verTodasLineas", e.target.checked)}
                      />
                      <span>Permitir Ver Todas las Líneas</span>
                    </label>
                  </div>
                </div>

                <div className="fila-controles-inferiores">
                  <div className="control-linea">
                    <label className="control-label-fijo">Importe Cancelación:</label>
                    <input
                      type="text"
                      className="input-texto-clasico input-monto-azul"
                      value={formData.importeCancelacion}
                      onChange={(e) => handleChange("importeCancelacion", e.target.value)}
                    />
                  </div>

                  <div className="control-linea">
                    <label className="control-label-fijo">Tutor Asignado:</label>
                    <div className="grupo-input-buscar">
                      <input
                        type="text"
                        className="input-texto-clasico"
                        value={formData.tutorAsignado}
                        onChange={(e) => handleChange("tutorAsignado", e.target.value)}
                      />
                      <button type="button" className="btn-buscar-lupa" title="Buscar Tutor">
                        🔍
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: INFORMACIÓN PERSONAL */}
            {tabActivo === "personal" && (
              <div className="tab-cuerpo-personal">
                <div className="personal-grid-columnas">
                  {/* Columna 1 */}
                  <div className="personal-columna">
                    <div className="personal-campo-fila">
                      <label className="etiqueta-personal">Sexo</label>
                      <select
                        className="input-select-clasico control-flex"
                        value={formData.sexo}
                        onChange={(e) => handleChange("sexo", e.target.value)}
                      >
                        <option value="MASCULINO">MASCULINO</option>
                        <option value="FEMENINO">FEMENINO</option>
                      </select>
                    </div>

                    <div className="personal-campo-fila">
                      <label className="etiqueta-personal">Fecha de Nacimiento</label>
                      <input
                        type="date"
                        className="input-texto-clasico control-flex"
                        value={formData.fechaNacimiento}
                        onChange={(e) => handleChange("fechaNacimiento", e.target.value)}
                      />
                    </div>

                    <div className="personal-campo-fila">
                      <label className="etiqueta-personal">Lugar de Nacimiento</label>
                      <input
                        type="text"
                        className="input-texto-clasico control-flex"
                        value={formData.lugarNacimiento}
                        onChange={(e) => handleChange("lugarNacimiento", e.target.value)}
                      />
                    </div>

                    <div className="personal-campo-fila">
                      <label className="etiqueta-personal">Nacionalidad</label>
                      <select
                        className="input-select-clasico control-flex"
                        value={formData.nacionalidad}
                        onChange={(e) => handleChange("nacionalidad", e.target.value)}
                      >
                        <option value="">Seleccionar</option>
                        <option value="MEXICANA">MEXICANA</option>
                        <option value="EXTRANJERA">EXTRANJERA</option>
                      </select>
                    </div>

                    <div className="personal-campo-fila">
                      <label className="etiqueta-personal">Estado Civil</label>
                      <select
                        className="input-select-clasico control-flex"
                        value={formData.estadoCivil}
                        onChange={(e) => handleChange("estadoCivil", e.target.value)}
                      >
                        <option value="">Seleccionar</option>
                        <option value="SOLTERO">SOLTERO(A)</option>
                        <option value="CASADO">CASADO(A)</option>
                        <option value="UNION_LIBRE">UNIÓN LIBRE</option>
                        <option value="DIVORCIADO">DIVORCIADO(A)</option>
                        <option value="VIUDO">VIUDO(A)</option>
                      </select>
                    </div>

                    <div className="personal-campo-fila">
                      <label className="etiqueta-personal">Hijos</label>
                      <select
                        className="input-select-clasico control-flex"
                        value={formData.hijos}
                        onChange={(e) => handleChange("hijos", e.target.value)}
                      >
                        <option value="NO">NO</option>
                        <option value="SI">SI</option>
                      </select>
                    </div>

                    <div className="personal-campo-fila">
                      <label className="etiqueta-personal">Nivel de Estudio</label>
                      <select
                        className="input-select-clasico control-flex"
                        value={formData.nivelEstudio}
                        onChange={(e) => handleChange("nivelEstudio", e.target.value)}
                      >
                        <option value="">Seleccionar</option>
                        <option value="PRIMARIA">PRIMARIA</option>
                        <option value="SECUNDARIA">SECUNDARIA</option>
                        <option value="PREPARATORIA">PREPARATORIA</option>
                        <option value="UNIVERSIDAD">UNIVERSIDAD</option>
                        <option value="POSGRADO">POSGRADO</option>
                      </select>
                    </div>
                  </div>

                  {/* Columna 2 */}
                  <div className="personal-columna">
                    <div className="personal-campo-fila">
                      <label className="etiqueta-personal">No. IFE</label>
                      <input
                        type="text"
                        className="input-texto-clasico control-flex"
                        value={formData.noIfe}
                        onChange={(e) => handleChange("noIfe", e.target.value)}
                      />
                    </div>

                    <div className="personal-campo-fila">
                      <label className="etiqueta-personal">CURP</label>
                      <input
                        type="text"
                        className="input-texto-clasico control-flex"
                        value={formData.curp}
                        onChange={(e) => handleChange("curp", e.target.value)}
                      />
                    </div>

                    <div className="personal-campo-fila">
                      <label className="etiqueta-personal">RFC</label>
                      <input
                        type="text"
                        className="input-texto-clasico control-flex"
                        value={formData.rfc}
                        onChange={(e) => handleChange("rfc", e.target.value)}
                      />
                    </div>

                    <div className="personal-campo-fila">
                      <label className="etiqueta-personal">Colonia</label>
                      <input
                        type="text"
                        className="input-texto-clasico control-flex"
                        value={formData.colonia}
                        onChange={(e) => handleChange("colonia", e.target.value)}
                      />
                    </div>

                    <div className="personal-campo-fila">
                      <label className="etiqueta-personal">Calle</label>
                      <input
                        type="text"
                        className="input-texto-clasico control-flex"
                        value={formData.calle}
                        onChange={(e) => handleChange("calle", e.target.value)}
                      />
                    </div>

                    <div className="personal-campo-fila">
                      <label className="etiqueta-personal">Número Casa</label>
                      <input
                        type="text"
                        className="input-texto-clasico control-flex"
                        value={formData.numeroCasa}
                        onChange={(e) => handleChange("numeroCasa", e.target.value)}
                      />
                    </div>

                    <div className="personal-campo-fila">
                      <label className="etiqueta-personal">Código Postal</label>
                      <input
                        type="text"
                        className="input-texto-clasico control-flex"
                        value={formData.codigoPostal}
                        onChange={(e) => handleChange("codigoPostal", e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Columna 3 */}
                  <div className="personal-columna">
                    <div className="personal-campo-fila">
                      <label className="etiqueta-personal">Alergias</label>
                      <input
                        type="text"
                        className="input-texto-clasico control-flex"
                        value={formData.alergias}
                        onChange={(e) => handleChange("alergias", e.target.value)}
                      />
                    </div>

                    <div className="personal-campo-fila">
                      <label className="etiqueta-personal">Tipo Sangre</label>
                      <select
                        className="input-select-clasico control-flex"
                        value={formData.tipoSangre}
                        onChange={(e) => handleChange("tipoSangre", e.target.value)}
                      >
                        <option value="O-">O-</option>
                        <option value="O+">O+</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                      </select>
                    </div>

                    <div className="personal-campo-fila">
                      <label className="etiqueta-personal">Talla de Camisa</label>
                      <input
                        type="text"
                        className="input-texto-clasico control-flex"
                        value={formData.tallaCamisa}
                        onChange={(e) => handleChange("tallaCamisa", e.target.value)}
                      />
                    </div>

                    <div className="personal-campo-fila">
                      <label className="etiqueta-personal">No. Licencia</label>
                      <input
                        type="text"
                        className="input-texto-clasico control-flex"
                        value={formData.noLicencia}
                        onChange={(e) => handleChange("noLicencia", e.target.value)}
                      />
                    </div>

                    <div className="personal-campo-fila">
                      <label className="etiqueta-personal">Vencimiento de Licencia</label>
                      <input
                        type="date"
                        className="input-texto-clasico control-flex"
                        value={formData.vencimientoLicencia}
                        onChange={(e) => handleChange("vencimientoLicencia", e.target.value)}
                      />
                    </div>

                    <div className="personal-campo-fila">
                      <label className="etiqueta-personal">Teléfono Emergencia</label>
                      <input
                        type="text"
                        className="input-texto-clasico control-flex"
                        value={formData.telefonoEmergencia}
                        onChange={(e) => handleChange("telefonoEmergencia", e.target.value)}
                      />
                    </div>

                    <div className="personal-campo-fila">
                      <label className="etiqueta-personal">Contacto Emergencia</label>
                      <input
                        type="text"
                        className="input-texto-clasico control-flex"
                        value={formData.contactoEmergencia}
                        onChange={(e) => handleChange("contactoEmergencia", e.target.value)}
                      />
                    </div>

                    <div className="personal-campo-fila">
                      <label className="etiqueta-personal">Correo Electrónico</label>
                      <input
                        type="email"
                        className="input-texto-clasico control-flex"
                        value={formData.correoElectronico}
                        onChange={(e) => handleChange("correoElectronico", e.target.value)}
                      />
                    </div>

                    <div className="personal-campo-fila">
                      <label className="etiqueta-personal">Correo Electrónico Notif.</label>
                      <input
                        type="email"
                        className="input-texto-clasico control-flex"
                        value={formData.correoElectronicoNotif}
                        onChange={(e) => handleChange("correoElectronicoNotif", e.target.value)}
                      />
                    </div>

                    <div className="personal-campo-fila mt-recibe-notif">
                      <label className="checkbox-item">
                        <input
                          type="checkbox"
                          checked={formData.recibeNotificaciones}
                          onChange={(e) => handleChange("recibeNotificaciones", e.target.checked)}
                        />
                        <span>Recibe Notificaciones</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: NÓMINA */}
            {tabActivo === "nomina" && (
              <div className="tab-cuerpo-nomina">
                <div className="nomina-grid-columnas">
                  {/* Columna 1 */}
                  <div className="nomina-columna">
                    <div className="nomina-campo-fila">
                      <label className="etiqueta-nomina">No. Seguro Social</label>
                      <input
                        type="text"
                        className="input-texto-clasico control-flex"
                        value={formData.noSeguroSocial}
                        onChange={(e) => handleChange("noSeguroSocial", e.target.value)}
                      />
                    </div>

                    <div className="nomina-campo-fila">
                      <label className="etiqueta-nomina">Salario Diario IMSS</label>
                      <div className="input-prefijo-contenedor control-flex">
                        <span className="prefijo-moneda">$</span>
                        <input
                          type="text"
                          className="input-texto-clasico input-moneda"
                          value={formData.salarioDiarioImss}
                          onChange={(e) => handleChange("salarioDiarioImss", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="nomina-campo-fila">
                      <label className="etiqueta-nomina">Salario Diario:</label>
                      <div className="input-prefijo-contenedor control-flex">
                        <span className="prefijo-moneda">$</span>
                        <input
                          type="text"
                          className="input-texto-clasico input-moneda"
                          value={formData.salarioDiario}
                          onChange={(e) => handleChange("salarioDiario", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="nomina-campo-fila">
                      <label className="etiqueta-nomina">Horas Extras Fijas</label>
                      <input
                        type="text"
                        className="input-texto-clasico control-flex input-alineado-derecha"
                        value={formData.horasExtrasFijas}
                        onChange={(e) => handleChange("horasExtrasFijas", e.target.value)}
                      />
                    </div>

                    <div className="nomina-campo-fila">
                      <label className="etiqueta-nomina">No. Crédito de Infonavit</label>
                      <input
                        type="text"
                        className="input-texto-clasico control-flex"
                        value={formData.noCreditoInfonavit}
                        onChange={(e) => handleChange("noCreditoInfonavit", e.target.value)}
                      />
                    </div>

                    <div className="nomina-campo-fila">
                      <label className="etiqueta-nomina">Factor Crédito Infonavit</label>
                      <input
                        type="text"
                        className="input-texto-clasico control-flex"
                        value={formData.factorCreditoInfonavit}
                        onChange={(e) => handleChange("factorCreditoInfonavit", e.target.value)}
                      />
                    </div>

                    <div className="nomina-campo-fila">
                      <label className="etiqueta-nomina">Crédito Fonacot</label>
                      <input
                        type="text"
                        className="input-texto-clasico control-flex"
                        value={formData.creditoFonacot}
                        onChange={(e) => handleChange("creditoFonacot", e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Columna 2 */}
                  <div className="nomina-columna">
                    <div className="nomina-campo-fila">
                      <label className="etiqueta-nomina">Tiempo descanso</label>
                      <input
                        type="text"
                        className="input-texto-clasico control-flex"
                        value={formData.tiempoDescanso}
                        onChange={(e) => handleChange("tiempoDescanso", e.target.value)}
                      />
                    </div>

                    <div className="nomina-campo-fila">
                      <label className="etiqueta-nomina">Horas minimas salida descanso</label>
                      <input
                        type="text"
                        className="input-texto-clasico control-flex"
                        value={formData.horasMinimasSalidaDescanso}
                        onChange={(e) => handleChange("horasMinimasSalidaDescanso", e.target.value)}
                      />
                    </div>

                    <div className="nomina-campo-fila">
                      <label className="etiqueta-nomina">Fecha Próxima Evaluación</label>
                      <input
                        type="date"
                        className="input-texto-clasico control-flex"
                        value={formData.fechaProximaEvaluacion}
                        onChange={(e) => handleChange("fechaProximaEvaluacion", e.target.value)}
                      />
                    </div>

                    <div className="nomina-campo-fila">
                      <label className="etiqueta-nomina">Fecha Próximas Vacaciones</label>
                      <input
                        type="date"
                        className="input-texto-clasico control-flex"
                        value={formData.fechaProximasVacaciones}
                        onChange={(e) => handleChange("fechaProximasVacaciones", e.target.value)}
                      />
                    </div>

                    <div className="nomina-campo-fila">
                      <label className="etiqueta-nomina">Fecha Vencimiento Contrato</label>
                      <input
                        type="date"
                        className="input-texto-clasico control-flex"
                        value={formData.fechaVencimientoContrato}
                        onChange={(e) => handleChange("fechaVencimientoContrato", e.target.value)}
                      />
                    </div>

                    {/* SELECTOR DE JORNADAS */}
                    <div className="nomina-campo-fila">
                      <label className="etiqueta-nomina">Jornada</label>
                      <select
                        className="input-select-clasico control-flex"
                        value={formData.jornadaId}
                        onChange={(e) => handleChange("jornadaId", e.target.value)}
                      >
                        <option value="">&lt; Seleccionar Jornada &gt;</option>
                        {catJornadas.map((jornada) => (
                          <option 
                            key={jornada.JornadasID || jornada.id} 
                            value={jornada.JornadasID || jornada.id}
                          >
                            {jornada.Nombre || jornada.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* SELECTOR DE CONTRATOS DINÁMICO */}
                    <div className="nomina-campo-fila">
                      <label className="etiqueta-nomina">Contrato</label>
                      <select
                        className="input-select-clasico control-flex"
                        value={formData.contratoId}
                        onChange={(e) => handleChange("contratoId", e.target.value)}
                      >
                        <option value="">&lt; Seleccionar Contrato &gt;</option>
                        {catContratos.map((cont) => (
                          <option
                            key={cont.EstatusContratosID || cont.id}
                            value={cont.EstatusContratosID || cont.id}
                          >
                            {cont.Descripcion || cont.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Columna 3 */}
                  <div className="nomina-columna">
                    <div className="nomina-campo-fila">
                      <label className="etiqueta-nomina etiqueta-baja">Fecha Baja</label>
                      <input
                        type="date"
                        className="input-texto-clasico control-flex"
                        value={formData.fechaBaja}
                        onChange={(e) => handleChange("fechaBaja", e.target.value)}
                      />
                    </div>

                    <div className="nomina-campo-fila mt-checks-prenomina">
                      <label className="checkbox-item">
                        <input
                          type="checkbox"
                          checked={formData.excluirPrenomina}
                          onChange={(e) => handleChange("excluirPrenomina", e.target.checked)}
                        />
                        <span>Excluir en Prenómina</span>
                      </label>
                    </div>

                    <div className="nomina-campo-fila">
                      <label className="checkbox-item">
                        <input
                          type="checkbox"
                          checked={formData.calculoLocalPrenomina}
                          onChange={(e) => handleChange("calculoLocalPrenomina", e.target.checked)}
                        />
                        <span>Calculo Local Prenomina</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TABS RESTANTES */}
            {tabActivo !== "general" && tabActivo !== "personal" && tabActivo !== "nomina" && (
              <div className="tab-cuerpo-vacio">
                <p>Contenido para pestaña <strong>{tabActivo}</strong> listo para configurar.</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* 4. BARRA INFERIOR DE ACCIONES */}
      <div className="mod-empleado-footer">
        <button type="button" className="btn-barra-footer btn-regresar" onClick={onRegresar}>
          ↩ Regresar
        </button>
        <button
          type="button"
          className="btn-barra-footer btn-guardar"
          onClick={handleGuardar}
        >
          💾 Guardar
        </button>
      </div>
    </div>
  );
}

export default ModificarEmpleado;