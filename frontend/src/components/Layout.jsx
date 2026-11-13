// frontend/src/components/Layout.jsx
import { VentanasProvider } from "../context/VentanasContext.jsx";
import BarraMenu from "./BarraMenu.jsx";
import Escritorio from "./Escritorio.jsx";
import BarraTareas from "./BarraTareas.jsx";
import "./Layout.css";

function Layout({ cerrarSesion }) {
  return (
    <VentanasProvider>
      <div className="layout">
        <BarraMenu onCerrarSesion={cerrarSesion} />
        <Escritorio />
        <BarraTareas />
      </div>
    </VentanasProvider>
  );
}

export default Layout;