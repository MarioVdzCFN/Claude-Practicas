import { useVentanas } from "../context/VentanasContext.jsx";
import { catalogo } from "../config/ventanas.js";
import "./BarraTareas.css";

function BarraTareas() {
  const { ventanas, abrir, minimizar } = useVentanas();

  // la ventana "activa" es la visible que está más al frente
  const visibles = ventanas.filter((v) => !v.minimizada);
  const zFrente = Math.max(0, ...visibles.map((v) => v.z));

  const alPulsar = (v) => {
    if (v.minimizada) abrir(v.clave); // restaurarla y traerla al frente
    else if (v.z === zFrente) minimizar(v.clave); // ya está al frente: minimizar
    else abrir(v.clave); // visible pero detrás: traerla al frente
  };

  const clase = (v) => {
    if (v.minimizada) return "minimizada";
    if (v.z === zFrente) return "activa";
    return "";
  };

  return (
    <footer className="barra-tareas">
      {ventanas.map((v) => (
        <button key={v.clave} className={clase(v)} onClick={() => alPulsar(v)}>
          {catalogo[v.clave]?.titulo}
        </button>
      ))}
    </footer>
  );
}

export default BarraTareas;