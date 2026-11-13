// frontend/src/components/BarraMenu.jsx
import { useState, useEffect, useRef } from "react";
import { menuPrincipal, menuAcciones } from "../config/menu.js";
import { catalogo } from "../config/ventanas.js";
import { useVentanas } from "../context/VentanasContext.jsx";
import "./BarraMenu.css";

function BarraMenu({ onCerrarSesion }) {
  const [abierto, setAbierto] = useState(null);
  const [subAbierto, setSubAbierto] = useState(null);
  const [posicionSub, setPosicionSub] = useState({ top: 0, left: 0 });
  const { abrir } = useVentanas();
  const menuRef = useRef(null);

  // Leer datos de la sesión actual
  const sesionRaw = localStorage.getItem("sesion_pos");
  let usuarioSesion = null;
  try {
    usuarioSesion = sesionRaw ? JSON.parse(sesionRaw)?.usuario : null;
  } catch {
    usuarioSesion = null;
  }

  useEffect(() => {
    const clickAfuera = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        cerrarTodo();
      }
    };
    document.addEventListener("mousedown", clickAfuera);
    return () => document.removeEventListener("mousedown", clickAfuera);
  }, []);

  const cerrarTodo = () => {
    setAbierto(null);
    setSubAbierto(null);
  };

  const accionarBoton = (clave) => {
    cerrarTodo();

    if (clave === "cerrar-sesion") {
      if (onCerrarSesion) onCerrarSesion();
      return;
    }

    if (catalogo[clave]) {
      abrir(clave);
    }
  };

  const manejarHoverItem = (e, item, indice) => {
    if (item.items && item.items.length > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      setPosicionSub({
        top: rect.top,
        left: rect.right + 2,
      });
      setSubAbierto(indice);
    } else {
      setSubAbierto(null);
    }
  };

  const itemsAreaActual = abierto !== null ? menuPrincipal[abierto]?.items : [];
  const subMenuActual = subAbierto !== null ? itemsAreaActual?.[subAbierto] : null;

  return (
    <nav className="barra-superior" ref={menuRef}>
      {/* Grupo izquierdo: Áreas principales */}
      <div className="barra-principal">
        {menuPrincipal.map((area, i) => {
          const tieneDropdown = Boolean(area.items && area.items.length > 0);
          const esActivo = abierto === i;

          return (
            <div key={area.area} className="area-contenedor">
              <button
                type="button"
                className={`area-tarjeta ${esActivo ? "activo" : ""}`}
                onClick={() => {
                  setAbierto(esActivo ? null : i);
                  setSubAbierto(null);
                }}
                onMouseEnter={() => {
                  if (abierto !== null) {
                    setAbierto(i);
                    setSubAbierto(null);
                  }
                }}
              >
                <span className="area-titulo">{area.area}</span>
                {tieneDropdown && <span className="area-flecha">▾</span>}
              </button>

              {esActivo && tieneDropdown && (
                <ul className="dropdown-moderno" onScroll={() => setSubAbierto(null)}>
                  {area.items.map((item, j) => {
                    if (item.separador) {
                      return <li key={`sep-${j}`} className="dropdown-separador" />;
                    }

                    const tieneSubmenu = Boolean(item.items && item.items.length > 0);
                    const subActivo = subAbierto === j;

                    return (
                      <li key={item.ventana || item.label || j}>
                        <button
                          type="button"
                          className={`dropdown-item ${subActivo ? "sub-activo" : ""}`}
                          disabled={!tieneSubmenu && !catalogo[item.ventana]}
                          onMouseEnter={(e) => manejarHoverItem(e, item, j)}
                          onClick={() => {
                            if (!tieneSubmenu) accionarBoton(item.ventana);
                          }}
                        >
                          <span>{item.label}</span>
                          {tieneSubmenu && <span className="flecha-sub">▸</span>}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {/* Submenú anidado flotante */}
      {subMenuActual && (
        <ul
          className="sub-dropdown-flotante"
          style={{ top: posicionSub.top, left: posicionSub.left }}
          onMouseLeave={() => setSubAbierto(null)}
        >
          {subMenuActual.items.map((sub, k) =>
            sub.separador ? (
              <li key={`sub-sep-${k}`} className="dropdown-separador" />
            ) : (
              <li key={sub.ventana || k}>
                <button
                  type="button"
                  className="dropdown-item"
                  disabled={!catalogo[sub.ventana]}
                  onClick={() => accionarBoton(sub.ventana)}
                >
                  {sub.label}
                </button>
              </li>
            )
          )}
        </ul>
      )}

      {/* Grupo derecho: Información del Usuario y Acciones */}
      <div className="barra-lateral">
        {/* Identificador del usuario logeado */}
        {usuarioSesion && (
          <div className="usuario-badge">
            <span className="usuario-nombre-completo" title={usuarioSesion.nombreEmpleado || usuarioSesion.nombre}>
              {usuarioSesion.nombreEmpleado || "Empleado"}
            </span>
            <span className="usuario-login">
              {usuarioSesion.nombre}
            </span>
          </div>
        )}

        <div className="separador-vertical" />

        {menuAcciones.map((accion) => (
          <button
            type="button"
            key={accion.area}
            className="area-tarjeta tarjeta-accion"
            onClick={() => accionarBoton(accion.ventana)}
          >
            <span className="area-titulo">{accion.area}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

export default BarraMenu;