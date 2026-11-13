// frontend/src/pages/Login.jsx
import { useState, useEffect } from "react";
import estilos from "./Login.module.css";

const API_URL = `http://${window.location.hostname}:3001`;

function Login({ onLoginExitoso }) {
  const [sucursales, setSucursales] = useState([]);
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState(null);
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [verContrasena, setVerContrasena] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  // Cargar lista de sucursales activas
  useEffect(() => {
    fetch(`${API_URL}/api/sucursales`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setSucursales(data);
          setSucursalSeleccionada(data[0]);
        }
      })
      .catch(() => {
        setError(
          "No se pudo conectar al servidor para obtener las sucursales."
        );
      });
  }, []);

  const handleCambioSucursal = (e) => {
    const suc = sucursales.find((s) => s.sucursalId === Number(e.target.value));
    setSucursalSeleccionada(suc || null);
  };

  const handleEntrar = async (e) => {
    e.preventDefault();
    setError("");

    // 1. Si ambos están en blanco
    if (!usuario.trim() && !contrasena.trim()) {
      setError("Por favor, ingrese su usuario y contraseña.");
      return;
    }

    // 2. Si falta el usuario
    if (!usuario.trim()) {
      setError("El nombre de usuario es requerido.");
      return;
    }

    // 3. Si falta la contraseña (bloquea entrar solo con el usuario)
    if (!contrasena.trim()) {
      setError("La contraseña es requerida.");
      return;
    }

    // 4. Si no se cargó la sucursal
    if (!sucursalSeleccionada) {
      setError("Debe seleccionar una sucursal.");
      return;
    }

    setCargando(true);

    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuario: usuario.trim(),
          contrasena,
          sucursal: sucursalSeleccionada,
        }),
      });

      const datos = await res.json();

      if (!res.ok) {
        throw new Error(datos.mensaje || "Error al iniciar sesión");
      }

      localStorage.setItem("sesion_pos", JSON.stringify(datos));

      if (onLoginExitoso) {
        onLoginExitoso(datos);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className={estilos.fondo}>
      <div className={estilos.tarjeta}>
        {/* Cabecera curva morada */}
        <div className={estilos.cabecera}>
          <h2 className={estilos.titulo}>Claude Practicas</h2>
          <p className={estilos.subtitulo}>
            Bienvenido, ingresa para continuar
          </p>
        </div>

        {/* Cuerpo del formulario */}
        <div className={estilos.cuerpo}>
          <form
            onSubmit={handleEntrar}
            className={estilos.formulario}
            noValidate
          >
            {/* Campo Sucursal (Dropdown) */}
            <div className={estilos.inputGrupo}>
              <div className={estilos.iconoCaja}>
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  width="18"
                  height="18"
                >
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
              </div>
              <select
                className={estilos.select}
                value={sucursalSeleccionada?.sucursalId || ""}
                onChange={handleCambioSucursal}
              >
                {sucursales.map((s) => (
                  <option key={s.sucursalId} value={s.sucursalId}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Campo Usuario */}
            <div className={estilos.inputGrupo}>
              <div className={estilos.iconoCaja}>
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  width="18"
                  height="18"
                >
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Usuario"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
              />
            </div>

            {/* Campo Contraseña */}
            <div className={estilos.inputGrupo}>
              <div className={estilos.iconoCaja}>
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  width="18"
                  height="18"
                >
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                </svg>
              </div>
              <input
                type={verContrasena ? "text" : "password"}
                placeholder="Contraseña"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
              />
              <button
                type="button"
                className={estilos.btnOjo}
                onClick={() => setVerContrasena(!verContrasena)}
                title={verContrasena ? "Ocultar" : "Mostrar"}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  width="20"
                  height="20"
                >
                  {verContrasena ? (
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                  ) : (
                    <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.44-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" />
                  )}
                </svg>
              </button>
            </div>

            {error && <div className={estilos.errorBox}>{error}</div>}

            {/* Botón Entrar */}
            <button
              type="submit"
              className={estilos.btnEntrar}
              disabled={cargando}
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                width="20"
                height="20"
              >
                <path d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5c-1.11 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
              </svg>
              <span>{cargando ? "Iniciando..." : "Entrar"}</span>
            </button>
          </form>

          {/* Pie informativo de sucursal e IP */}
          <div className={estilos.pieInfo}>
            <div className={estilos.divisorLinea}>
              <span className={estilos.nombrePie}>
                {sucursalSeleccionada?.nombre || "SELECCIONE SUCURSAL"}
              </span>
            </div>
            <span className={estilos.ipPie}>
              {sucursalSeleccionada?.direccionCompleta || "0.0.0.0:0000"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
