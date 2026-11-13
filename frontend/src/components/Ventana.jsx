import { useRef } from "react";
import { useVentanas } from "../context/VentanasContext.jsx";
import "./Ventana.css";

function Ventana({
  clave, titulo, x, y, z, ancho, alto, maximizada, minimizada, children,
}) {
  const { cerrar, minimizar, alternarMaximizar, enfocar, mover } = useVentanas();
  const arrastre = useRef(null);

  const iniciarArrastre = (e) => {
    if (maximizada || e.target.closest("button")) return;
    arrastre.current = { dx: e.clientX - x, dy: e.clientY - y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const arrastrar = (e) => {
    if (!arrastre.current) return;
    mover(
      clave,
      Math.max(0, e.clientX - arrastre.current.dx),
      Math.max(0, e.clientY - arrastre.current.dy)
    );
  };

  const terminarArrastre = () => {
    arrastre.current = null;
  };

  const estilo = maximizada
    ? { zIndex: z }
    : { left: x, top: y, width: ancho, height: alto, zIndex: z };

  const clases = ["ventana", maximizada && "maximizada", minimizada && "minimizada"]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={clases} style={estilo} onMouseDown={() => enfocar(clave)}>
      <header
        className="ventana-barra"
        onPointerDown={iniciarArrastre}
        onPointerMove={arrastrar}
        onPointerUp={terminarArrastre}
        onDoubleClick={() => alternarMaximizar(clave)}
      >
        <span className="ventana-titulo">{titulo}</span>
        <div className="ventana-botones">
          <button onClick={() => minimizar(clave)} title="Minimizar">–</button>
          <button
            onClick={() => alternarMaximizar(clave)}
            title={maximizada ? "Restaurar" : "Maximizar"}
          >
            {maximizada ? "❐" : "□"}
          </button>
          <button className="cerrar" onClick={() => cerrar(clave)} title="Cerrar">
            ✕
          </button>
        </div>
      </header>
      <div className="ventana-contenido">{children}</div>
    </div>
  );
}

export default Ventana;