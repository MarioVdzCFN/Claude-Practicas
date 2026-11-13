import { useNavigate } from "react-router-dom";
import estilos from "./NoEncontrado.module.css";

function NoEncontrado() {
  const navigate = useNavigate();

  return (
    <div className={estilos.pagina}>
      <h1 className={estilos.codigo}>404</h1>
      <p className={estilos.mensaje}>Página no encontrada</p>
      <button className={estilos.boton} onClick={() => navigate("/")}>
        Ir a inicio
      </button>
    </div>
  );
}

export default NoEncontrado;