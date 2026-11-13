import { createContext, useContext, useState } from "react";

const VentanasContext = createContext(null);

export function VentanasProvider({ children }) {
  const [ventanas, setVentanas] = useState([]);

  const zSiguiente = (lista) => Math.max(0, ...lista.map((v) => v.z)) + 1;

  const abrir = (clave) =>
    setVentanas((prev) => {
      const z = zSiguiente(prev);
      if (prev.some((v) => v.clave === clave)) {
        // ya existe: la restauramos (si estaba minimizada) y la traemos al frente
        return prev.map((v) =>
          v.clave === clave ? { ...v, minimizada: false, z } : v
        );
      }
      const desfase = (prev.length % 8) * 30; // para que no se encimen exactas
      return [
        ...prev,
        {
          clave,
          x: 40 + desfase,
          y: 20 + desfase,
          z,
          maximizada: true,
          minimizada: false,
        },
      ];
    });

  const cerrar = (clave) =>
    setVentanas((prev) => prev.filter((v) => v.clave !== clave));

  const minimizar = (clave) =>
    setVentanas((prev) =>
      prev.map((v) => (v.clave === clave ? { ...v, minimizada: true } : v))
    );

  const alternarMaximizar = (clave) =>
    setVentanas((prev) =>
      prev.map((v) =>
        v.clave === clave ? { ...v, maximizada: !v.maximizada } : v
      )
    );

  const enfocar = (clave) =>
    setVentanas((prev) => {
      const z = zSiguiente(prev);
      const ventana = prev.find((v) => v.clave === clave);
      if (!ventana || ventana.z === z - 1) return prev; // ya está al frente
      return prev.map((v) => (v.clave === clave ? { ...v, z } : v));
    });

  const mover = (clave, x, y) =>
    setVentanas((prev) =>
      prev.map((v) => (v.clave === clave ? { ...v, x, y } : v))
    );

  return (
    <VentanasContext.Provider
      value={{ ventanas, abrir, cerrar, minimizar, alternarMaximizar, enfocar, mover }}
    >
      {children}
    </VentanasContext.Provider>
  );
}

export function useVentanas() {
  return useContext(VentanasContext);
}