// frontend/src/components/AreaTrabajo.jsx
import { useVentanas } from "../context/VentanasContext.jsx";
import { catalogo } from "../config/ventanas.js";
import Ventana from "./Ventana.jsx";

function AreaTrabajo() {
  const { ventanas } = useVentanas();

  return (
    <div
      className="area-trabajo"
      style={{
        flex: 1,
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {ventanas.map((v) => {
        const config = catalogo[v.id];
        if (!config) return null;
        const Componente = config.componente;

        // NO retornar null aquí; Ventana.jsx maneja internamente su display: none si está minimizada
        return (
          <Ventana key={v.id} ventana={v}>
            <Componente />
          </Ventana>
        );
      })}
    </div>
  );
}

export default AreaTrabajo;