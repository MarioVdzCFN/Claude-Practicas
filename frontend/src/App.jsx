// frontend/src/App.jsx
import { useState, useEffect } from "react";
import Login from "./pages/Login";
import Escritorio from "./components/Escritorio";
import ConfirmarAsistencia from "./pages/ConfirmarAsistencia";
import { VentanasProvider } from "./context/VentanasContext";

function App() {
  const [sesion, setSesion] = useState(null);

  // Comprueba si la URL actual corresponde a la confirmación pública
  const urlActual = typeof window !== "undefined" ? window.location.href.toLowerCase() : "";
  const pathActual = typeof window !== "undefined" ? window.location.pathname.toLowerCase() : "";
  const esConfirmacion = pathActual.includes("confirmar-asistencia") || urlActual.includes("confirmar-asistencia");

  useEffect(() => {
    if (esConfirmacion) return; // Si es confirmación, ignoramos el flujo de sesión
    const sesionGuardada = localStorage.getItem("sesion_pos");
    if (sesionGuardada) {
      try {
        setSesion(JSON.parse(sesionGuardada));
      } catch {
        localStorage.removeItem("sesion_pos");
      }
    }
  }, [esConfirmacion]);

  // 1. Si es la URL del correo, muestra exclusivamente la pantalla de confirmación
  if (esConfirmacion) {
    return <ConfirmarAsistencia />;
  }

  // 2. Si no hay sesión, Login normal
  if (!sesion) {
    return (
      <Login
        onLoginExitoso={(datos) => {
          localStorage.setItem("sesion_pos", JSON.stringify(datos));
          setSesion(datos);
        }}
      />
    );
  }

  // 3. Escritorio institucional de trabajo
  return (
    <VentanasProvider>
      <Escritorio
        sesion={sesion}
        onCerrarSesion={() => {
          localStorage.removeItem("sesion_pos");
          setSesion(null);
        }}
      />
    </VentanasProvider>
  );
}

export default App;