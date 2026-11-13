// frontend/src/proyectos/Salas/ReservacionSalas/ReservacionSalas.jsx
import { useState, useEffect } from "react";
import ModificarInvitados from "../Invitados/ModificarInvitados.jsx";
import ModificarSalas from "../ModificarSalas/ModificarSalas.jsx";
import "./ReservacionSalas.css";

const API_URL = `http://${window.location.hostname}:3001`;

const DEFAULT_FILAS = 16;
const DEFAULT_COLS = 20;

const DIAS_CLAVES = ["DOM", "LUN", "MAR", "MIE", "JUE", "VIE", "SAB"];

const NOMBRES_DIAS_COMPLETOS = {
  LUN: "Lunes",
  MAR: "Martes",
  MIE: "Miércoles",
  JUE: "Jueves",
  VIE: "Viernes",
  SAB: "Sábado",
  DOM: "Domingo",
};

const MESES_NOMBRES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const COLORES_DONUT = ["circle-azul", "circle-verde", "circle-naranja"];
const BULLET_DONUT = ["bullet-azul", "bullet-verde", "bullet-naranja"];
const CHIPS_SALAS = ["chip-sala-azul", "chip-sala-verde", "chip-sala-morada"];

// Función para obtener siempre la fecha local YYYY-MM-DD sin desfase UTC
const obtenerFechaLocal = (d = new Date()) => {
  const anio = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
};

function ReservacionSalas() {
  const hoyStr = obtenerFechaLocal();

  const [salas, setSalas] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [filtroSucursal, setFiltroSucursal] = useState("todas");
  const [filtroEstado, setFiltroEstado] = useState("todas");
  const [modoCalendarioGlobal, setModoCalendarioGlobal] = useState(false);

  // Dashboard de Métricas Reales
  const [rangoDias, setRangoDias] = useState("30");
  const [metricasDash, setMetricasDash] = useState({
    kpis: {
      totalSalas: 0,
      salasLibres: 0,
      salasOcupadas: 0,
      totalReuniones: 0,
    },
    departamentos: [],
    tendencia: [0, 0, 0, 0, 0, 0, 0],
    proximas: [],
  });

  // Cancelación de reunión
  const [confirmandoCancelacion, setConfirmandoCancelacion] = useState(false);
  const [cancelando, setCancelando] = useState(false);

  // Vistas activas: 'salas' | 'invitados' | 'modificarSalas'
  const [planoActual, setPlanoActual] = useState("salas");

  // Cronograma
  const [salaSeleccionada, setSalaSeleccionada] = useState(null);
  const [fechaConsulta, setFechaConsulta] = useState(obtenerFechaLocal());
  const [horariosSala, setHorariosSala] = useState([]);
  const [bloqueSeleccionado, setBloqueSeleccionado] = useState(null);

  // Modal para Agendar Reunión
  const [modalAgendar, setModalAgendar] = useState(false);
  const [tema, setTema] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [horaInicio, setHoraInicio] = useState("09:00");
  const [horaFin, setHoraFin] = useState("10:00");
  const [enviarCorreoInvitacion, setEnviarCorreoInvitacion] = useState(true);
  const [errorAgendar, setErrorAgendar] = useState("");
  const [guardando, setGuardando] = useState(false);

  // Modal Calendario Mensual Estilo Google Calendar
  const [modalCalendarioMes, setModalCalendarioMes] = useState(false);
  const [calAnio, setCalAnio] = useState(new Date().getFullYear());
  const [calMes, setCalMes] = useState(new Date().getMonth()); // 0 a 11
  const [reunionesDelMes, setReunionesDelMes] = useState([]);
  const [cargandoMes, setCargandoMes] = useState(false);

  // Invitados asignados
  const [invitadosReunion, setInvitadosReunion] = useState([]);
  const [sillaSeleccionadaParaAsignar, setSillaSeleccionadaParaAsignar] =
    useState(null);

  // Modal Secundario: Buscador Participantes
  const [modalBuscarParticipante, setModalBuscarParticipante] = useState(false);
  const [catalogoEmpleados, setCatalogoEmpleados] = useState([]);
  const [catalogoInvitados, setCatalogoInvitados] = useState([]);
  const [cargandoCatalogo, setCargandoCatalogo] = useState(false);
  const [filtroTipoParticipante, setFiltroTipoParticipante] = useState("todos");
  const [busquedaTexto, setBusquedaTexto] = useState("");

  const obtenerHeaders = () => {
    const sesion = JSON.parse(localStorage.getItem("sesion_pos") || "{}");
    return {
      "Content-Type": "application/json",
      "x-sucursal-ip": sesion?.sucursal?.ip || "",
      "x-sucursal-port": sesion?.sucursal?.puerto || 3306,
    };
  };

  const cargarSalas = () => {
    fetch(`${API_URL}/api/salas?sucursalId=${filtroSucursal}`, {
      headers: obtenerHeaders(),
    })
      .then((res) => res.json())
      .then((data) => setSalas(Array.isArray(data) ? data : []))
      .catch((err) => console.error(err));
  };

  const cargarDashboard = (dias) => {
    fetch(`${API_URL}/api/salas/dashboard?dias=${dias}`, {
      headers: obtenerHeaders(),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.kpis) {
          setMetricasDash(data);
        }
      })
      .catch((err) => console.error("Error al cargar dashboard:", err));
  };

  useEffect(() => {
    fetch(`${API_URL}/api/sucursales`, {
      headers: obtenerHeaders(), // <-- Faltaba enviar los headers con la IP local
    })
      .then((res) => res.json())
      .then((data) => {
        const lista = Array.isArray(data) ? data : [];
        const solo3306 = lista.filter((suc) => Number(suc.puerto) === 3306);
        setSucursales(solo3306);
      })
      .catch((err) => console.error(err));

    cargarSalas();
  }, [filtroSucursal]);

  useEffect(() => {
    cargarDashboard(rangoDias);
  }, [rangoDias]);

  // Al hacer clic en una sala, siempre resetea a la fecha de hoy
  const abrirCronograma = (sala) => {
    const fechaHoy = obtenerFechaLocal();
    setSalaSeleccionada(sala);
    setFechaConsulta(fechaHoy);
    cargarCronograma(sala.salasid, fechaHoy);
  };

  const cargarCronograma = (salaId, fecha) => {
    fetch(`${API_URL}/api/salas/${salaId}/horarios?fecha=${fecha}`, {
      headers: obtenerHeaders(),
    })
      .then((res) => res.json())
      .then((data) => setHorariosSala(Array.isArray(data) ? data : []));
  };

  // Carga las reuniones del mes (de una sala o de TODAS las salas)
  const cargarReunionesMes = (salaId, anio, mesIndex, esGlobal = false) => {
    if (!esGlobal && !salaId) return;
    setCargandoMes(true);
    const url = esGlobal
      ? `${API_URL}/api/salas/todas-mes-reuniones?anio=${anio}&mes=${mesIndex + 1}`
      : `${API_URL}/api/salas/${salaId}/mes-reuniones?anio=${anio}&mes=${mesIndex + 1}`;

    fetch(url, {
      headers: obtenerHeaders(),
    })
      .then((res) => res.json())
      .then((data) => setReunionesDelMes(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error al cargar reuniones del mes:", err))
      .finally(() => setCargandoMes(false));
  };

  const abrirModalCalendario = () => {
    const [y, m] = fechaConsulta.split("-").map(Number);
    const nuevoAnio = y || new Date().getFullYear();
    const nuevoMes = m ? m - 1 : new Date().getMonth();
    setModoCalendarioGlobal(false);
    setCalAnio(nuevoAnio);
    setCalMes(nuevoMes);
    if (salaSeleccionada) {
      cargarReunionesMes(salaSeleccionada.salasid, nuevoAnio, nuevoMes, false);
    }
    setModalCalendarioMes(true);
  };

  const abrirCalendarioTodasLasReuniones = () => {
    const hoy = new Date();
    const nuevoAnio = hoy.getFullYear();
    const nuevoMes = hoy.getMonth();
    setModoCalendarioGlobal(true);
    setCalAnio(nuevoAnio);
    setCalMes(nuevoMes);
    cargarReunionesMes(null, nuevoAnio, nuevoMes, true);
    setModalCalendarioMes(true);
  };

  const mesAnterior = () => {
    let nuevoMes = calMes - 1;
    let nuevoAnio = calAnio;
    if (nuevoMes < 0) {
      nuevoMes = 11;
      nuevoAnio -= 1;
    }
    setCalMes(nuevoMes);
    setCalAnio(nuevoAnio);
    cargarReunionesMes(salaSeleccionada?.salasid, nuevoAnio, nuevoMes, modoCalendarioGlobal);
  };

  const mesSiguiente = () => {
    let nuevoMes = calMes + 1;
    let nuevoAnio = calAnio;
    if (nuevoMes > 11) {
      nuevoMes = 0;
      nuevoAnio += 1;
    }
    setCalMes(nuevoMes);
    setCalAnio(nuevoAnio);
    cargarReunionesMes(salaSeleccionada?.salasid, nuevoAnio, nuevoMes, modoCalendarioGlobal);
  };

  const irAHoyCalendario = () => {
    const hoy = new Date();
    const hoyAnio = hoy.getFullYear();
    const hoyMes = hoy.getMonth();
    setCalAnio(hoyAnio);
    setCalMes(hoyMes);
    cargarReunionesMes(salaSeleccionada?.salasid, hoyAnio, hoyMes, modoCalendarioGlobal);
  };

  const seleccionarDiaCalendario = (diaNum, mesIdx, anioNum) => {
    const strMes = String(mesIdx + 1).padStart(2, "0");
    const strDia = String(diaNum).padStart(2, "0");
    const nuevaFecha = `${anioNum}-${strMes}-${strDia}`;

    setFechaConsulta(nuevaFecha);
    setModalCalendarioMes(false);

    if (salaSeleccionada) {
      cargarCronograma(salaSeleccionada.salasid, nuevaFecha);
    }
  };

  const handleCancelarReunion = async () => {
    if (!bloqueSeleccionado?.reunionesid) return;
    setCancelando(true);
    try {
      const res = await fetch(
        `${API_URL}/api/salas/reuniones/${bloqueSeleccionado.reunionesid}/cancelar`,
        {
          method: "POST",
          headers: obtenerHeaders(),
        }
      );

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "No se pudo cancelar la reunión");

      setConfirmandoCancelacion(false);
      setBloqueSeleccionado(null);

      if (salaSeleccionada) {
        cargarCronograma(salaSeleccionada.salasid, fechaConsulta);
      }
      cargarSalas();
      cargarDashboard(rangoDias);
    } catch (err) {
      alert("Error al cancelar reunión: " + err.message);
    } finally {
      setCancelando(false);
    }
  };

  const abrirModalCrearReunion = (
    sala = salaSeleccionada,
    horaSugerida = "09:00"
  ) => {
    if (!sala) return;
    setSalaSeleccionada(sala);
    setTema("");
    setDescripcion("");
    setHoraInicio(horaSugerida);

    const [h, m] = horaSugerida.split(":").map(Number);
    const hFin = (h + 1 < 10 ? "0" : "") + (h + 1);
    setHoraFin(`${hFin}:${m < 10 ? "0" + m : m}`);

    setInvitadosReunion([]);
    setSillaSeleccionadaParaAsignar(null);
    setEnviarCorreoInvitacion(true);
    setErrorAgendar("");
    setModalAgendar(true);
  };

  const abrirModalBuscadorPersonas = () => {
    setCargandoCatalogo(true);
    setBusquedaTexto("");
    setFiltroTipoParticipante("todos");
    fetch(`${API_URL}/api/salas/participantes-catalogo`, {
      headers: obtenerHeaders(),
    })
      .then((res) => res.json())
      .then((data) => {
        setCatalogoEmpleados(
          Array.isArray(data.empleados) ? data.empleados : []
        );
        setCatalogoInvitados(
          Array.isArray(data.invitados) ? data.invitados : []
        );
      })
      .catch((err) => console.error("Error al cargar personas:", err))
      .finally(() => setCargandoCatalogo(false));
    setModalBuscarParticipante(true);
  };

  const mapaSala = (() => {
    if (!salaSeleccionada?.mapa)
      return { filas: DEFAULT_FILAS, columnas: DEFAULT_COLS, elementos: [] };
    try {
      if (typeof salaSeleccionada.mapa === "string")
        return JSON.parse(salaSeleccionada.mapa);
      return salaSeleccionada.mapa;
    } catch {
      return { filas: DEFAULT_FILAS, columnas: DEFAULT_COLS, elementos: [] };
    }
  })();

  const sillasDelMapa = (mapaSala.elementos || [])
    .filter((el) => el.tipo === "silla")
    .sort((a, b) => a.numeroSilla - b.numeroSilla);

  const agregarPersonaAReunion = (persona) => {
    const yaEstaAgregado = invitadosReunion.some(
      (inv) => inv.id === persona.id && inv.esInvitado === persona.esInvitado
    );
    if (yaEstaAgregado) {
      alert("Esta persona ya fue agregada a la reunión.");
      return;
    }

    let sillaAsignar = 0;

    if (sillaSeleccionadaParaAsignar !== null) {
      sillaAsignar = sillaSeleccionadaParaAsignar;
    } else {
      const sillasOcupadas = invitadosReunion
        .map((inv) => inv.numeroSilla)
        .filter((s) => s > 0);
      const sillaLibre = sillasDelMapa.find(
        (s) => !sillasOcupadas.includes(s.numeroSilla)
      );

      if (sillaLibre) {
        sillaAsignar = sillaLibre.numeroSilla;
      } else {
        sillaAsignar = 0;
      }
    }

    setInvitadosReunion((prev) => [
      ...prev,
      {
        id: persona.id,
        nombre: persona.nombre,
        codigo: persona.codigo,
        correo: persona.correo,
        esInvitado: persona.esInvitado,
        numeroSilla: sillaAsignar,
      },
    ]);

    setSillaSeleccionadaParaAsignar(null);
    setModalBuscarParticipante(false);
  };

  const quitarPersonaDeReunion = (id, esInvitado) => {
    setInvitadosReunion((prev) =>
      prev.filter((inv) => !(inv.id === id && inv.esInvitado === esInvitado))
    );
  };

  const handleGuardarReunion = async (e) => {
    e.preventDefault();
    setErrorAgendar("");

    if (!tema.trim()) {
      setErrorAgendar("El tema de la reunión es obligatorio.");
      return;
    }

    if (horaInicio >= horaFin) {
      setErrorAgendar("La hora de inicio debe ser anterior a la hora de fin.");
      return;
    }

    const ap = (salaSeleccionada.horaapertura || "08:00").slice(0, 5);
    const ci = (salaSeleccionada.horacierre || "20:00").slice(0, 5);
    if (horaInicio < ap || horaFin > ci) {
      setErrorAgendar(
        `El horario reservado debe estar dentro del horario de atención de la sala (${ap} - ${ci}).`
      );
      return;
    }

    setGuardando(true);

    const sesion = JSON.parse(localStorage.getItem("sesion_pos") || "{}");
    const creadorEmpleadoId =
      sesion?.usuario?.empleadoId ||
      sesion?.usuario?.empleadosid ||
      sesion?.empleadosid ||
      null;

    const payload = {
      salasid: salaSeleccionada.salasid,
      fechahorainicio: `${fechaConsulta} ${horaInicio}:00`,
      fechahorafin: `${fechaConsulta} ${horaFin}:00`,
      tema: tema.trim(),
      descripcion,
      invitados: invitadosReunion,
      empleadosid: creadorEmpleadoId ? Number(creadorEmpleadoId) : null,
      enviarCorreo: enviarCorreoInvitacion,
      urlFrontend: window.location.origin,
    };

    try {
      const res = await fetch(`${API_URL}/api/salas/reuniones`, {
        method: "POST",
        headers: obtenerHeaders(),
        body: JSON.stringify(payload),
      });

      const datos = await res.json();
      if (!res.ok) {
        throw new Error(datos.mensaje || "Error al registrar la reunión");
      }

      setModalAgendar(false);
      cargarCronograma(salaSeleccionada.salasid, fechaConsulta);
      cargarSalas();
      cargarDashboard(rangoDias);
    } catch (err) {
      setErrorAgendar(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const listaConsolidada = [
    ...(filtroTipoParticipante === "invitados" ? [] : catalogoEmpleados),
    ...(filtroTipoParticipante === "empleados" ? [] : catalogoInvitados),
  ].filter((item) => {
    const texto = busquedaTexto.toLowerCase();
    const coincideNombre = (item.nombre || "").toLowerCase().includes(texto);
    const coincideCodigo = (item.codigo || "").toLowerCase().includes(texto);
    const coincidePuesto = (item.puesto || "").toLowerCase().includes(texto);
    const coincideSucursal = (item.sucursal || "").toLowerCase().includes(texto);
    const coincideCorreo = (item.correo || "").toLowerCase().includes(texto);

    return (
      coincideNombre ||
      coincideCodigo ||
      coincidePuesto ||
      coincideSucursal ||
      coincideCorreo
    );
  });

  if (planoActual === "invitados") {
    return <ModificarInvitados onVolver={() => setPlanoActual("salas")} />;
  }

  if (planoActual === "modificarSalas") {
    return (
      <ModificarSalas
        onVolver={() => {
          setPlanoActual("salas");
          cargarSalas();
        }}
      />
    );
  }

  const salasFiltradas = salas.filter((s) => {
    if (filtroEstado === "todas") return true;
    return s.estado_actual === filtroEstado;
  });

  const diaSemanaConsulta = (() => {
    const [y, m, d] = fechaConsulta.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return DIAS_CLAVES[dt.getDay()];
  })();

  const diasPermitidosSala = (
    salaSeleccionada?.diasdisponible || "LUN;MAR;MIE;JUE;VIE;SAB;DOM"
  ).split(";");
  const salaAbreHoy = diasPermitidosSala.includes(diaSemanaConsulta);

  const horaInicioInt = salaSeleccionada
    ? parseInt((salaSeleccionada.horaapertura || "08:00").slice(0, 2), 10)
    : 8;
  const horaFinInt = salaSeleccionada
    ? parseInt((salaSeleccionada.horacierre || "20:00").slice(0, 2), 10)
    : 20;

  const totalHorasRango = Math.max(1, horaFinInt - horaInicioInt);

  // Donut de Departamentos
  const totalReunionesDeptos = (metricasDash.departamentos || []).reduce(
    (acc, d) => acc + Number(d.cantidad || 0),
    0
  );

  let offsetAcumulado = 0;
  const segmentosDonut = (metricasDash.departamentos || []).map((d, idx) => {
    const pct =
      totalReunionesDeptos > 0
        ? Math.round((Number(d.cantidad) / totalReunionesDeptos) * 100)
        : 0;
    const offset = offsetAcumulado;
    offsetAcumulado += pct;
    return {
      nombre: d.nombre,
      porcentaje: pct,
      offset: -offset,
      claseStroke: COLORES_DONUT[idx] || "circle-azul",
      claseBullet: BULLET_DONUT[idx] || "bullet-azul",
    };
  });

  const porcentajeLider = segmentosDonut[0]?.porcentaje || 0;

  // Tendencia semanal
  const puntosTendencia = metricasDash.tendencia || [0, 0, 0, 0, 0, 0, 0];
  const maxTendencia = Math.max(1, ...puntosTendencia);
  const coordsTendencia = puntosTendencia.map((val, idx) => {
    const x = 20 + idx * 68.3;
    const y = 80 - (val / maxTendencia) * 60;
    return { x, y, val };
  });

  const strPuntosPolyline = coordsTendencia
    .map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`)
    .join(" ");
  const strPuntosPolygon = `20,85 ${strPuntosPolyline} 430,85`;

  // Matriz de días para el modal de calendario estilo Google Calendar (Dom a Sáb)
  const generarMatrizCalendario = () => {
    const primerDiaMes = new Date(calAnio, calMes, 1);
    const ultimoDiaMes = new Date(calAnio, calMes + 1, 0);

    const diasEnMes = ultimoDiaMes.getDate();
    const diaSemanaInicio = primerDiaMes.getDay(); // 0 = Domingo

    const diasMesAnterior = new Date(calAnio, calMes, 0).getDate();

    const celdas = [];

    // Días del mes anterior
    for (let i = diaSemanaInicio - 1; i >= 0; i--) {
      const d = diasMesAnterior - i;
      const mIdx = calMes === 0 ? 11 : calMes - 1;
      const aNum = calMes === 0 ? calAnio - 1 : calAnio;
      celdas.push({
        dia: d,
        mesIdx: mIdx,
        anioNum: aNum,
        esOtroMes: true,
      });
    }

    // Días del mes actual
    for (let d = 1; d <= diasEnMes; d++) {
      celdas.push({
        dia: d,
        mesIdx: calMes,
        anioNum: calAnio,
        esOtroMes: false,
      });
    }

    // Días del mes siguiente para completar la cuadrícula (múltiplo de 7)
    const restante = 7 - (celdas.length % 7);
    if (restante < 7) {
      for (let d = 1; d <= restante; d++) {
        const mIdx = calMes === 11 ? 0 : calMes + 1;
        const aNum = calMes === 11 ? calAnio + 1 : calAnio;
        celdas.push({
          dia: d,
          mesIdx: mIdx,
          anioNum: aNum,
          esOtroMes: true,
        });
      }
    }

    return celdas;
  };

  const formatearFechaLarga = (strFecha) => {
    if (!strFecha) return "";
    const [y, m, d] = strFecha.split("-").map(Number);
    const fechaObj = new Date(y, m - 1, d);
    const diaSemana = NOMBRES_DIAS_COMPLETOS[DIAS_CLAVES[fechaObj.getDay()]] || "";
    const mesNombre = MESES_NOMBRES[m - 1] || "";
    return `${diaSemana} ${d} de ${mesNombre} del ${y}`;
  };

  const matrizDias = generarMatrizCalendario();

  return (
    <div className="reservacion-modulo">
      {/* Barra superior */}
      <header className="reservacion-header">
        <div className="filtros-grupo">
          <div className="control-campo">
            <label>Sucursal:</label>
            <select
              value={filtroSucursal}
              disabled={Boolean(salaSeleccionada)}
              onChange={(e) => setFiltroSucursal(e.target.value)}
            >
              <option value="todas">Todas las Sucursales</option>
              {sucursales.map((suc) => (
                <option key={suc.sucursalId} value={suc.sucursalId}>
                  {suc.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="control-campo">
            <label>Estado:</label>
            <select
              value={filtroEstado}
              disabled={Boolean(salaSeleccionada)}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="todas">Todas</option>
              <option value="Disponible">Disponibles</option>
              <option value="Ocupada">Ocupadas</option>
            </select>
          </div>
        </div>

        <div className="acciones-grupo">
          <button
            type="button"
            className="btn-accion btn-azul"
            disabled={Boolean(salaSeleccionada)}
            onClick={() => setPlanoActual("modificarSalas")}
          >
            Modificar Salas
          </button>
          <button
            type="button"
            className="btn-accion btn-verde"
            disabled={Boolean(salaSeleccionada)}
            onClick={() => setPlanoActual("invitados")}
          >
            Modificar Invitados
          </button>
        </div>
      </header>

      {/* Vista principal: cuadrícula de salas y Dashboard */}
      {!salaSeleccionada ? (
        <div className="reservacion-layout-principal">
          {/* Columna Izquierda: Tarjetas de Salas */}
          <div className="cuadricula-salas">
            {salasFiltradas.map((sala) => {
              const ocupada = sala.estado_actual === "Ocupada";
              const ap = (sala.horaapertura || "08:00").slice(0, 5);
              const ci = (sala.horacierre || "20:00").slice(0, 5);

              return (
                <div
                  key={sala.salasid}
                  className={`tarjeta-sala ${
                    ocupada ? "borde-ocupado" : "borde-disponible"
                  }`}
                  onClick={() => abrirCronograma(sala)}
                >
                  <div className="tarjeta-top">
                    <span
                      className={`badge-estado ${
                        ocupada ? "badge-ocupado" : "badge-disponible"
                      }`}
                    >
                      {ocupada ? "● Ocupada" : "✓ Disponible"}
                    </span>
                  </div>

                  <div className="tarjeta-cuerpo">
                    <h3 className="sala-titulo">{sala.nombre}</h3>
                    <span className="sala-capacidad">
                      👥 {sala.capacidad} sillas (+{sala.sobrecargo} sobrecargo)
                    </span>

                    <div
                      style={{
                        fontSize: "11.5px",
                        color: "#0369a1",
                        marginTop: "4px",
                        fontWeight: "600",
                      }}
                    >
                      ⏰ Horario: {ap} - {ci}
                    </div>

                    <p className="sala-desc">
                      {sala.descripcion || "Sin descripción disponible."}
                    </p>

                    {ocupada && (
                      <p className="reunion-tema-actual">
                        <strong>Tema:</strong> {sala.reunion_tema}
                      </p>
                    )}
                  </div>

                  <div
                    className={`tarjeta-pie ${
                      ocupada ? "pie-ocupado" : "pie-disponible"
                    }`}
                  >
                    {ocupada ? (
                      <span>
                        🕒 Ocupada:{" "}
                        {new Date(sala.fechahorainicio).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        -{" "}
                        {new Date(sala.fechahorafin).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    ) : (
                      <span>✓ Disponible ahora (clic para ver horarios)</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Columna Derecha: Dashboard */}
          <aside className="dashboard-resumen-lateral">
            <div className="dash-cabecera">
              <div className="dash-titulo-box">
                <span className="dash-icono-grafica">📊</span>
                <h3>Resumen General</h3>
              </div>
              <div className="dash-selector-rango">
                <select
                  value={rangoDias}
                  onChange={(e) => setRangoDias(e.target.value)}
                >
                  <option value="7">Últimos 7 días</option>
                  <option value="30">Últimos 30 días</option>
                  <option value="90">Últimos 90 días</option>
                </select>
              </div>
            </div>

            {/* Fila 1: 4 KPIs */}
            <div className="dash-kpis-grid">
              <div className="kpi-card kpi-azul">
                <span className="kpi-icono">🚪</span>
                <span className="kpi-valor">
                  {metricasDash.kpis.totalSalas}
                </span>
                <span className="kpi-etiqueta">Salas Totales</span>
              </div>
              <div className="kpi-card kpi-verde">
                <span className="kpi-icono">✓</span>
                <span className="kpi-valor">
                  {metricasDash.kpis.salasLibres}
                </span>
                <span className="kpi-etiqueta">Salas Libres</span>
              </div>
              <div className="kpi-card kpi-rojo">
                <span className="kpi-icono">📅</span>
                <span className="kpi-valor">
                  {metricasDash.kpis.salasOcupadas}
                </span>
                <span className="kpi-etiqueta">Salas Ocupadas</span>
              </div>
              <div className="kpi-card kpi-morado">
                <span className="kpi-icono">👥</span>
                <span className="kpi-valor">
                  {metricasDash.kpis.totalReuniones}
                </span>
                <span className="kpi-etiqueta">Reuniones</span>
              </div>
            </div>

            {/* Fila 2: Departamento con más reuniones */}
            <div className="dash-bloque-card dash-bloque-ancho-completo">
              <h4>🕒 Departamento con más reuniones</h4>
              <div className="donut-contenedor-flex">
                <div className="donut-grafico-svg">
                  <svg viewBox="0 0 36 36" className="circular-chart">
                    <path
                      className="circle-bg"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    {segmentosDonut.map((s, idx) => (
                      <path
                        key={idx}
                        className={s.claseStroke}
                        strokeDasharray={`${s.porcentaje}, 100`}
                        strokeDashoffset={s.offset}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    ))}
                  </svg>
                  <div className="donut-texto-centro">
                    <strong>{porcentajeLider}%</strong>
                    <span>del total</span>
                  </div>
                </div>
                <div className="donut-leyenda">
                  {segmentosDonut.length === 0 ? (
                    <span className="texto-vacio-dash">
                      Sin reuniones registradas
                    </span>
                  ) : (
                    segmentosDonut.map((s, idx) => (
                      <div key={idx} className="item-leyenda">
                        <span className={`bullet ${s.claseBullet}`} />
                        <div>
                          <strong>{s.nombre}</strong>
                          <span>({s.porcentaje}%)</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Fila 3: Tendencia de Reuniones */}
            <div className="dash-bloque-card dash-bloque-ancho-completo">
              <h4>📈 Tendencia de Reuniones</h4>
              <div className="grafico-tendencia-area">
                <svg
                  viewBox="0 0 450 100"
                  className="svg-tendencia"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient
                      id="areaGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#0284c7"
                        stopOpacity="0.35"
                      />
                      <stop
                        offset="100%"
                        stopColor="#0284c7"
                        stopOpacity="0.02"
                      />
                    </linearGradient>
                  </defs>
                  <line
                    x1="0"
                    y1="20"
                    x2="450"
                    y2="20"
                    stroke="#e2e8f0"
                    strokeDasharray="3"
                  />
                  <line
                    x1="0"
                    y1="50"
                    x2="450"
                    y2="50"
                    stroke="#e2e8f0"
                    strokeDasharray="3"
                  />
                  <line
                    x1="0"
                    y1="80"
                    x2="450"
                    y2="80"
                    stroke="#e2e8f0"
                    strokeDasharray="3"
                  />

                  <polygon
                    fill="url(#areaGradient)"
                    points={strPuntosPolygon}
                  />
                  <polyline
                    fill="none"
                    stroke="#0284c7"
                    strokeWidth="2.5"
                    points={strPuntosPolyline}
                  />

                  {coordsTendencia.map((c, idx) => (
                    <circle
                      key={idx}
                      cx={c.x}
                      cy={c.y}
                      r={c.val === maxTendencia && c.val > 0 ? 5 : 3.5}
                      fill="#0284c7"
                      stroke="#fff"
                      strokeWidth={c.val === maxTendencia && c.val > 0 ? 2 : 0}
                    >
                      <title>{`${c.val} reuniones`}</title>
                    </circle>
                  ))}
                </svg>
                <div className="eje-dias-semana">
                  <span>Lun</span>
                  <span>Mar</span>
                  <span>Mié</span>
                  <span>Jue</span>
                  <span>Vie</span>
                  <span>Sáb</span>
                  <span>Dom</span>
                </div>
              </div>
            </div>

            {/* Fila 4: Próximas Reuniones */}
            <div className="dash-bloque-card dash-bloque-proximas-expandido">
              <div className="card-cabecera-simple">
                <h4>⏰ Próximas Reuniones</h4>
                <span
                  className="link-ver-todas"
                  onClick={abrirCalendarioTodasLasReuniones}
                >
                  Ver todas →
                </span>
              </div>
              <div className="lista-proximas-reuniones">
                {metricasDash.proximas.length === 0 ? (
                  <span className="texto-vacio-dash">
                    No hay próximas reuniones programadas.
                  </span>
                ) : (
                  metricasDash.proximas.map((pr, idx) => {
                    const hora = new Date(
                      pr.FechaHoraInicio
                    ).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    const chipClase = CHIPS_SALAS[idx % CHIPS_SALAS.length];

                    return (
                      <div
                        key={pr.ReunionesID}
                        className="item-proxima-reunion"
                      >
                        <span className="badge-hora-reunion">{hora}</span>
                        <div className="info-texto-proxima">
                          <strong>{pr.Tema}</strong>
                          <span>{pr.depto_nombre}</span>
                        </div>
                        <span className={chipClase}>{pr.sala_nombre}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Botón inferior: Más detalles */}
            <div className="dash-footer-acciones">
              <button
                type="button"
                className="btn-mas-detalles-dashboard"
                onClick={() => {}}
              >
                Más detalles
              </button>
            </div>
          </aside>
        </div>
      ) : (
        /* Vista de cronograma */
        <div className="cronograma-plano">
          <div className="cronograma-header">
            <button
              className="btn-volver"
              onClick={() => {
                setSalaSeleccionada(null);
                setBloqueSeleccionado(null);
              }}
            >
              ← Volver a salas
            </button>
            <div className="cronograma-titulo-sala">
              <h2>{salaSeleccionada.nombre}</h2>
              <span className="cronograma-subcapacidad">
                Capacidad: {salaSeleccionada.capacidad} sillas (+
                {salaSeleccionada.sobrecargo} sobrecargo) | Horario:{" "}
                {(salaSeleccionada.horaapertura || "08:00").slice(0, 5)} -{" "}
                {(salaSeleccionada.horacierre || "20:00").slice(0, 5)}
              </span>
            </div>

            <div className="cronograma-selector-fecha">
              <span className="texto-fecha-seleccionada">
                Fecha seleccionada: <strong>{formatearFechaLarga(fechaConsulta)}</strong>
              </span>
              <button
                type="button"
                className="btn-abrir-calendario-icono"
                onClick={abrirModalCalendario}
                title="Cambiar fecha en vista mensual"
              >
                📅
              </button>
            </div>

            {salaAbreHoy && (
              <button
                type="button"
                className="btn-agendar-directo"
                onClick={() =>
                  abrirModalCrearReunion(
                    salaSeleccionada,
                    (salaSeleccionada.horaapertura || "09:00").slice(0, 5)
                  )
                }
              >
                + Agendar Reunión en esta Sala
              </button>
            )}
          </div>

          {!salaAbreHoy ? (
            <div
              style={{
                textAlign: "center",
                padding: "50px 20px",
                background: "#fff",
                borderRadius: "8px",
                border: "1px dashed #cbd5e1",
                color: "#64748b",
              }}
            >
              <div style={{ fontSize: "36px", marginBottom: "8px" }}>📅 ⛔</div>
              <h3 style={{ margin: "0 0 6px 0", color: "#1e293b" }}>
                Sala no disponible en este día
              </h3>
              <p style={{ margin: 0, fontSize: "14px" }}>
                Esta sala no abre los días{" "}
                <strong>
                  {NOMBRES_DIAS_COMPLETOS[diaSemanaConsulta] ||
                    diaSemanaConsulta}
                </strong>
                . Días activos configurados:{" "}
                {diasPermitidosSala
                  .map((d) => NOMBRES_DIAS_COMPLETOS[d] || d)
                  .join(", ")}
                .
              </p>
            </div>
          ) : (
            <div className="timeline-horas">
              {Array.from(
                { length: totalHorasRango },
                (_, i) => i + horaInicioInt
              ).map((hora) => {
                const strHora = `${hora < 10 ? "0" + hora : hora}:00`;
                
                // EVALUACIÓN DE RANGO COMPLETO
                const reunion = horariosSala.find((r) => {
                  const dInicio = new Date(r.fechahorainicio);
                  const dFin = new Date(r.fechahorafin);
                  const hInicio = dInicio.getHours();
                  const hFin = dFin.getMinutes() > 0 ? dFin.getHours() + 1 : dFin.getHours();
                  return hora >= hInicio && hora < hFin;
                });

                const esBloqueInicio = reunion && new Date(reunion.fechahorainicio).getHours() === hora;

                const fechaHoyActual = obtenerFechaLocal();
                const horaActual = new Date().getHours();
                const esFechaPasada = fechaConsulta < fechaHoyActual;
                const esHoy = fechaConsulta === fechaHoyActual;
                const esHoraPasada =
                  esFechaPasada || (esHoy && hora < horaActual);

                let claseBloque = "bloque-libre";
                if (reunion) {
                  claseBloque = esHoraPasada
                    ? "bloque-ocupado-pasado"
                    : "bloque-ocupado";
                } else if (esHoraPasada) {
                  claseBloque = "bloque-pasado-libre";
                }

                return (
                  <div
                    key={hora}
                    className={`bloque-hora ${claseBloque}`}
                    onClick={() => {
                      if (reunion) {
                        setBloqueSeleccionado(reunion);
                      } else if (!esHoraPasada) {
                        abrirModalCrearReunion(salaSeleccionada, strHora);
                      }
                    }}
                  >
                    <span className="etiqueta-hora">{strHora}</span>
                    <div className="contenido-hora">
                      {reunion ? (
                        <div className="info-reunion-bloque">
                          <strong>
                            📌 {reunion.tema}
                            {!esBloqueInicio && " (Continuación)"}
                          </strong>
                          {esBloqueInicio && Number(reunion.total_invitados) > 0 && (
                            <span className="bloque-invitados-count">
                              ({reunion.total_invitados} participantes)
                            </span>
                          )}
                          {esHoraPasada && (
                            <span className="badge-finalizada">Finalizada</span>
                          )}
                        </div>
                      ) : esHoraPasada ? (
                        <span className="texto-pasado">
                          Horario concluido — No disponible para agendar
                        </span>
                      ) : (
                        <span className="texto-disponible">
                          Libre — Clic para agendar en este horario
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Panel de Detalles de Reunión seleccionado */}
          {bloqueSeleccionado && (
            <div className="panel-detalle-reunion">
              <div className="detalle-header">
                <h3>Detalles de la Reunión</h3>
                <button
                  type="button"
                  className="btn-cerrar-x"
                  onClick={() => setBloqueSeleccionado(null)}
                >
                  ✕
                </button>
              </div>
              <p>
                <strong>Tema:</strong> {bloqueSeleccionado.tema}
              </p>
              <p>
                <strong>Descripción:</strong>{" "}
                {bloqueSeleccionado.descripcion || "Sin descripción adicional."}
              </p>
              <p>
                <strong>Horario:</strong>{" "}
                {new Date(
                  bloqueSeleccionado.fechahorainicio
                ).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                a{" "}
                {new Date(bloqueSeleccionado.fechahorafin).toLocaleTimeString(
                  [],
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                )}
              </p>

              {/* Organizador con salto de línea */}
              <div className="detalle-organizador-bloque">
                <strong>Organizador:</strong>
                <span className="detalle-organizador-nombre">
                  {bloqueSeleccionado.organizador || "No especificado"}
                </span>
              </div>

              {Number(bloqueSeleccionado.total_invitados) > 0 ? (
                <>
                  <p>
                    <strong>Total de Invitados:</strong>{" "}
                    {bloqueSeleccionado.total_invitados}
                  </p>
                  <p>
                    <strong>Total Confirmados:</strong>{" "}
                    {bloqueSeleccionado.total_confirmados || 0}
                  </p>
                </>
              ) : (
                <p>
                  <strong>Capacidad de la Sala:</strong>{" "}
                  {salaSeleccionada.capacidad} sillas (+
                  {salaSeleccionada.sobrecargo} sobrecargo)
                </p>
              )}

              <div
                style={{
                  marginTop: "20px",
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  onClick={() => setConfirmandoCancelacion(true)}
                  style={{
                    backgroundColor: "#dc2626",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    padding: "9px 18px",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>🗑️</span> Cancelar Reunión
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Principal para Agendar Reunión */}
      {modalAgendar && (
        <div className="modal-overlay" onClick={() => setModalAgendar(false)}>
          <div
            className="modal-agendar-reunion"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-cabecera">
              <div>
                <h3>Agendar Reunión — {salaSeleccionada.nombre}</h3>
                <span className="subtitulo-agendar">
                  {fechaConsulta} | {salaSeleccionada.capacidad} sillas (+
                  {salaSeleccionada.sobrecargo} sobrecargo) | Horario:{" "}
                  {(salaSeleccionada.horaapertura || "08:00").slice(0, 5)} -{" "}
                  {(salaSeleccionada.horacierre || "20:00").slice(0, 5)}
                </span>
              </div>
              <button
                type="button"
                className="btn-cerrar-x"
                onClick={() => setModalAgendar(false)}
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleGuardarReunion}
              className="form-agendar-cuerpo"
            >
              {errorAgendar && (
                <div className="error-aviso">{errorAgendar}</div>
              )}

              <div className="agendar-seccion-general">
                <div className="campo-grupo flex-3">
                  <label>Tema Principal *</label>
                  <input
                    type="text"
                    placeholder="Ej. Junta Mensual de Operaciones"
                    value={tema}
                    onChange={(e) => setTema(e.target.value)}
                    required
                  />
                </div>

                {/* Selector con botón de calendario Google */}
                <div className="campo-grupo">
                  <label>Fecha de Reunión:</label>
                  <div className="input-fecha-con-boton">
                    <input
                      type="date"
                      value={fechaConsulta}
                      onChange={(e) => setFechaConsulta(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="btn-abrir-calendario-input"
                      onClick={abrirModalCalendario}
                      title="Abrir vista mensual de reuniones"
                    >
                      📅
                    </button>
                  </div>
                </div>

                <div className="campo-grupo">
                  <label>Hora Inicio:</label>
                  <input
                    type="time"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    required
                  />
                </div>

                <div className="campo-grupo">
                  <label>Hora Fin:</label>
                  <input
                    type="time"
                    value={horaFin}
                    onChange={(e) => setHoraFin(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="campo-grupo">
                <label>Descripción detallada:</label>
                <textarea
                  placeholder="Detalles, objetivos de la reunión o requerimientos técnicos..."
                  rows="2"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </div>

              <div className="agendar-layout-dividido">
                <div className="columna-participantes">
                  <div className="participantes-cabecera">
                    <h4>Participantes ({invitadosReunion.length})</h4>
                  </div>

                  <button
                    type="button"
                    className="btn-abrir-buscador-participante"
                    onClick={abrirModalBuscadorPersonas}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      fill="currentColor"
                    >
                      <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                    <span>clic para añadir participante</span>
                  </button>

                  <div className="lista-invitados-scroll">
                    {invitadosReunion.length === 0 ? (
                      <p className="texto-vacio-invitados">
                        No hay participantes añadidos. Puedes guardar la reunión
                        sin invitados si solo deseas apartar la sala.
                      </p>
                    ) : (
                      invitadosReunion.map((inv) => (
                        <div
                          key={`${inv.esInvitado}-${inv.id}`}
                          className="item-invitado-fila"
                        >
                          <div className="invitado-info-col">
                            <span
                              className="invitado-nombre"
                              title={inv.nombre}
                            >
                              {inv.nombre}
                            </span>
                            <span className="invitado-etiqueta">
                              {inv.esInvitado ? "Invitado Externo" : "Empleado"}{" "}
                              {inv.codigo ? `• ${inv.codigo}` : ""}
                            </span>
                          </div>

                          <div className="invitado-asiento-col">
                            <select
                              value={inv.numeroSilla}
                              onChange={(e) => {
                                const nuevoNum = Number(e.target.value);
                                setInvitadosReunion((prev) =>
                                  prev.map((item) =>
                                    item.id === inv.id &&
                                    item.esInvitado === inv.esInvitado
                                      ? { ...item, numeroSilla: nuevoNum }
                                      : item
                                  )
                                );
                              }}
                            >
                              <option value="0">Sobrecargo (De pie)</option>
                              {sillasDelMapa.map((s) => (
                                <option
                                  key={s.numeroSilla}
                                  value={s.numeroSilla}
                                >
                                  Silla #{s.numeroSilla}
                                </option>
                              ))}
                            </select>

                            <button
                              type="button"
                              className="btn-quitar-invitado"
                              onClick={() =>
                                quitarPersonaDeReunion(inv.id, inv.esInvitado)
                              }
                              title="Remover de la reunión"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="columna-plano-interactivo">
                  <div className="plano-cabecera">
                    <div className="plano-titulo-grupo">
                      <h4>Plano de la Sala (16x20)</h4>
                      <span className="nota-clic-silla-lado">
                        {sillaSeleccionadaParaAsignar !== null
                          ? `Asignando a Silla #${sillaSeleccionadaParaAsignar}`
                          : "Haz clic en una silla para asignar lugar"}
                      </span>
                    </div>
                  </div>

                  <div className="cuadricula-mapa-agendar">
                    <div
                      className="grid-sala-agendar"
                      style={{
                        gridTemplateColumns: `repeat(${
                          mapaSala.columnas || DEFAULT_COLS
                        }, 34px)`,
                        gridTemplateRows: `repeat(${
                          mapaSala.filas || DEFAULT_FILAS
                        }, 34px)`,
                      }}
                    >
                      {Array.from({
                        length: mapaSala.filas || DEFAULT_FILAS,
                      }).map((_, y) =>
                        Array.from({
                          length: mapaSala.columnas || DEFAULT_COLS,
                        }).map((_, x) => {
                          const el = (mapaSala.elementos || []).find(
                            (item) => item.x === x && item.y === y
                          );
                          const personaEnEstaSilla =
                            el?.tipo === "silla"
                              ? invitadosReunion.find(
                                  (inv) => inv.numeroSilla === el.numeroSilla
                                )
                              : null;
                          const esSillaSeleccionada =
                            sillaSeleccionadaParaAsignar === el?.numeroSilla;

                          return (
                            <div
                              key={`${x}-${y}`}
                              className={`celda-agendar ${
                                el ? `celda-${el.tipo}` : ""
                              } ${
                                personaEnEstaSilla ? "silla-con-persona" : ""
                              } ${
                                esSillaSeleccionada
                                  ? "silla-seleccionada-focus"
                                  : ""
                              }`}
                              onClick={() => {
                                if (
                                  el?.tipo === "silla" &&
                                  !personaEnEstaSilla
                                ) {
                                  setSillaSeleccionadaParaAsignar(
                                    sillaSeleccionadaParaAsignar ===
                                      el.numeroSilla
                                      ? null
                                      : el.numeroSilla
                                  );
                                }
                              }}
                            >
                              {el?.tipo === "mesa" && (
                                <span className="mesa-ascii-mini">┬─┬</span>
                              )}
                              {el?.tipo === "tv" && (
                                <span
                                  className="tv-mini-icono"
                                  title="Pantalla / TV"
                                >
                                  📺
                                </span>
                              )}
                              {el?.tipo === "silla" && (
                                <div className="silla-mini-box">
                                  <span>🪑</span>
                                  <span className="num-silla-mini">
                                    {el.numeroSilla}
                                  </span>
                                </div>
                              )}

                              {personaEnEstaSilla && (
                                <div className="tooltip-ocupante">
                                  {personaEnEstaSilla.nombre}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="resumen-plano-pie">
                    <span className="dot-libre">● Silla Libre</span>
                    <span className="dot-ocupado">● Silla Asignada</span>
                    <span className="dot-mesa">■ Mesa (┬─┬)</span>
                    <span className="dot-tv">📺 TV</span>
                  </div>
                </div>
              </div>

              {/* Botones de acción del Modal Principal */}
              <div className="modal-acciones">
                <label className="checkbox-enviar-correo-label">
                  <input
                    type="checkbox"
                    checked={enviarCorreoInvitacion}
                    onChange={(e) =>
                      setEnviarCorreoInvitacion(e.target.checked)
                    }
                  />
                  <span>Enviar correo de invitación</span>
                </label>

                <button
                  type="button"
                  className="btn-cancelar"
                  onClick={() => setModalAgendar(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-guardar"
                  disabled={guardando}
                >
                  {guardando ? "Agendando..." : "Confirmar y Agendar Reunión"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL GRANDE: CALENDARIO MENSUAL ESTILO GOOGLE CALENDAR        */}
      {/* ============================================================== */}
      {modalCalendarioMes && (
        <div
          className="modal-overlay modal-calendario-overlay"
          onClick={() => setModalCalendarioMes(false)}
        >
          <div
            className="modal-calendario-google-caja"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Calendario */}
            <div className="gcal-header">
              <div className="gcal-nav-left">
                <button
                  type="button"
                  className="btn-gcal-hoy"
                  onClick={irAHoyCalendario}
                >
                  Hoy
                </button>
                <div className="gcal-flechas-mes">
                  <button
                    type="button"
                    className="btn-gcal-flecha"
                    onClick={mesAnterior}
                    title="Mes anterior"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className="btn-gcal-flecha"
                    onClick={mesSiguiente}
                    title="Mes siguiente"
                  >
                    ›
                  </button>
                </div>
                <h2 className="gcal-titulo-mes-anio">
                  {MESES_NOMBRES[calMes]} {calAnio}
                </h2>
              </div>

              <div className="gcal-nav-right">
                <span className="gcal-sala-badge">
                  {modoCalendarioGlobal ? "Todas las Salas" : salaSeleccionada?.nombre}
                </span>
                <button
                  type="button"
                  className="btn-cerrar-x"
                  onClick={() => setModalCalendarioMes(false)}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Cabecera de Días de la Semana */}
            <div className="gcal-grid-dias-semana">
              <span>DOM</span>
              <span>LUN</span>
              <span>MAR</span>
              <span>MIÉ</span>
              <span>JUE</span>
              <span>VIE</span>
              <span>SÁB</span>
            </div>

            {/* Cuadrícula de Celdas del Mes */}
            <div className="gcal-grid-cuerpo">
              {matrizDias.map((item, idx) => {
                const strMes = String(item.mesIdx + 1).padStart(2, "0");
                const strDia = String(item.dia).padStart(2, "0");
                const fechaCelda = `${item.anioNum}-${strMes}-${strDia}`;

                const esHoy = fechaCelda === obtenerFechaLocal();
                const esSeleccionado = fechaCelda === fechaConsulta;

                // Filtrar reuniones registradas en esta fecha
                const eventosDia = reunionesDelMes.filter(
                  (r) => r.fecha === fechaCelda
                );

                return (
                  <div
                    key={idx}
                    className={`gcal-celda-dia ${
                      item.esOtroMes ? "gcal-dia-otro-mes" : ""
                    } ${!modoCalendarioGlobal && esSeleccionado ? "gcal-dia-seleccionado" : ""}`}
                    onClick={() => {
                      if (!modoCalendarioGlobal) {
                        seleccionarDiaCalendario(
                          item.dia,
                          item.mesIdx,
                          item.anioNum
                        );
                      }
                    }}
                  >
                    <div className="gcal-numero-dia-fila">
                      <span
                        className={`gcal-numero-dia ${
                          esHoy ? "gcal-badge-hoy" : ""
                        }`}
                      >
                        {item.dia}
                      </span>
                    </div>

                    <div className="gcal-lista-eventos-dia">
                      {eventosDia.map((ev) => {
                        const horaEv = new Date(ev.fechahorainicio).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        });
                        return (
                          <div
                            key={ev.reunionesid}
                            className={`gcal-pastilla-evento ${
                              modoCalendarioGlobal ? "gcal-pastilla-global" : ""
                            }`}
                            title={
                              modoCalendarioGlobal
                                ? `${ev.sala_nombre} (${horaEv}) — ${ev.tema}`
                                : ev.tema
                            }
                            onClick={(e) => {
                              if (modoCalendarioGlobal) {
                                e.stopPropagation();
                                const salaDestino = salas.find(
                                  (s) => Number(s.salasid) === Number(ev.salasid)
                                );
                                if (salaDestino) {
                                  setModalCalendarioMes(false);
                                  setSalaSeleccionada(salaDestino);
                                  setFechaConsulta(ev.fecha);
                                  cargarCronograma(salaDestino.salasid, ev.fecha);
                                }
                              }
                            }}
                          >
                            {modoCalendarioGlobal
                              ? `${ev.sala_nombre}: ${ev.tema}`
                              : ev.tema}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal Buscador de Participantes */}
      {modalBuscarParticipante && (
        <div
          className="modal-overlay modal-buscador-z"
          onClick={() => setModalBuscarParticipante(false)}
        >
          <div
            className="modal-tarjeta-buscador-personas"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-cabecera">
              <div>
                <h3>Añadir Participante a la Reunión</h3>
                <span className="subtitulo-agendar">
                  Mostrando únicamente empleados e invitados con estatus activo
                </span>
              </div>
              <button
                type="button"
                className="btn-cerrar-x"
                onClick={() => setModalBuscarParticipante(false)}
              >
                ✕
              </button>
            </div>

            <div className="buscador-personas-filtros-bar">
              <div className="filtro-campo-tipo">
                <label>Tipo:</label>
                <select
                  value={filtroTipoParticipante}
                  onChange={(e) => setFiltroTipoParticipante(e.target.value)}
                >
                  <option value="todos">Todos (Empleados e Invitados)</option>
                  <option value="empleados">Solo Empleados</option>
                  <option value="invitados">Solo Invitados</option>
                </select>
              </div>

              <div className="filtro-campo-input flex-1">
                <input
                  type="text"
                  placeholder="Filtrar por código, nombre completo, puesto, sucursal o correo..."
                  value={busquedaTexto}
                  onChange={(e) => setBusquedaTexto(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className="tabla-buscador-personas-scroll">
              {cargandoCatalogo ? (
                <div className="mensaje-estado">
                  Consultando participantes activos...
                </div>
              ) : listaConsolidada.length === 0 ? (
                <div className="mensaje-estado">
                  No se encontraron personas con los filtros seleccionados.
                </div>
              ) : (
                <table className="tabla-personas-selector">
                  <thead>
                    <tr>
                      <th style={{ width: "95px" }}>Tipo</th>
                      <th style={{ width: "90px" }}>Código</th>
                      <th>Nombre Completo</th>
                      <th>Puesto</th>
                      <th>Sucursal</th>
                      <th>Correo Electrónico</th>
                      <th style={{ width: "90px", textAlign: "center" }}>
                        Acción
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {listaConsolidada.map((item) => {
                      const yaAgregado = invitadosReunion.some(
                        (inv) =>
                          inv.id === item.id &&
                          inv.esInvitado === item.esInvitado
                      );

                      return (
                        <tr
                          key={`${item.esInvitado}-${item.id}`}
                          className={`fila-selector-persona ${
                            yaAgregado ? "fila-ya-agregada" : ""
                          }`}
                          onClick={() =>
                            !yaAgregado && agregarPersonaAReunion(item)
                          }
                        >
                          <td>
                            <span
                              className={`badge-tipo-persona ${
                                item.esInvitado
                                  ? "badge-invitado"
                                  : "badge-empleado"
                              }`}
                            >
                              {item.esInvitado ? "Invitado" : "Empleado"}
                            </span>
                          </td>
                          <td className="col-codigo-txt">
                            {item.codigo || "—"}
                          </td>
                          <td className="col-nombre-txt">{item.nombre}</td>
                          <td className="col-puesto-txt">
                            {item.puesto || "—"}
                          </td>
                          <td className="col-sucursal-txt">
                            {item.sucursal || "—"}
                          </td>
                          <td className="col-correo-txt">
                            {item.correo || "—"}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            {yaAgregado ? (
                              <span className="txt-ya-asignado">Añadido</span>
                            ) : (
                              <button
                                type="button"
                                className="btn-seleccionar-persona"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  agregarPersonaAReunion(item);
                                }}
                              >
                                Añadir
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div className="modal-acciones">
              <button
                type="button"
                className="btn-cancelar"
                onClick={() => setModalBuscarParticipante(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmación de Cancelación */}
      {confirmandoCancelacion && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 99999,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "10px",
              padding: "24px",
              width: "90%",
              maxWidth: "400px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "40px", marginBottom: "10px" }}>⚠️</div>
            <h3
              style={{
                margin: "0 0 10px 0",
                color: "#1f2937",
                fontSize: "18px",
              }}
            >
              ¿Estás seguro de cancelar esta reunión?
            </h3>
            <p
              style={{
                color: "#6b7280",
                fontSize: "14px",
                margin: "0 0 20px 0",
                lineHeight: "1.5",
              }}
            >
              Esta acción marcará la reunión como inactiva y enviará un correo a
              todos los participantes convocados notificando la cancelación.
            </p>

            <div
              style={{ display: "flex", justifyContent: "center", gap: "12px" }}
            >
              <button
                type="button"
                disabled={cancelando}
                onClick={() => setConfirmandoCancelacion(false)}
                style={{
                  padding: "8px 20px",
                  background: "#e5e7eb",
                  color: "#374151",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                No, regresar
              </button>

              <button
                type="button"
                disabled={cancelando}
                onClick={handleCancelarReunion}
                style={{
                  padding: "8px 20px",
                  background: "#dc2626",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                {cancelando ? "Cancelando..." : "Sí, cancelar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReservacionSalas;