// frontend/src/components/Escritorio.jsx
import { useEffect } from "react";
import { useVentanas } from "../context/VentanasContext.jsx";
import { catalogo } from "../config/ventanas.js";
import Ventana from "./Ventana.jsx";
import BarraMenu from "./BarraMenu.jsx";
import BarraTareas from "./BarraTareas.jsx";
import "../App.css";

function Escritorio({ sesion, onCerrarSesion }) {
  const { ventanas } = useVentanas();

  // Advertencia al recargar o cerrar pestaña con ventanas abiertas
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (ventanas && ventanas.length > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [ventanas]);

  return (
    <div className="escritorio-layout">
      {/* 1. Barra de menú superior */}
      <BarraMenu sesion={sesion} onCerrarSesion={onCerrarSesion} />

      {/* 2. Área central del escritorio con fondo estático */}
      <div
        className="escritorio-area"
        style={{
          backgroundImage: 'url("/fondo.jpg")',
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {ventanas &&
          ventanas.map((v) => {
            // Buscamos en el catálogo usando v.clave
            const config = catalogo[v.clave];
            if (!config) return null;

            // Soporta tanto 'Componente' como 'componente' del catálogo
            const ComponenteVista = config.Componente || config.componente;
            if (!ComponenteVista) return null;

            return (
              <Ventana
                key={v.clave}
                clave={v.clave}
                titulo={config.titulo}
                ancho={config.ancho}
                alto={config.alto}
                x={v.x}
                y={v.y}
                z={v.z}
                maximizada={v.maximizada}
                minimizada={v.minimizada}
              >
                <ComponenteVista />
              </Ventana>
            );
          })}
      </div>

      {/* 3. Barra de tareas inferior */}
      <BarraTareas />
    </div>
  );
}

export default Escritorio;