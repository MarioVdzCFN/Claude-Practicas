// frontend/src/config/ventanas.js
import PuntoVenta from "../proyectos/Ventas/PuntoVenta/Venta.jsx";
import CorteX from "../proyectos/Ventas/Cortes Y/ConsultaCortes.jsx";
import AcercaDe from "../proyectos/Sistema/AcercaDe/AcercaDe.jsx";
import ReservacionSalas from "../proyectos/Salas/ReservacionSalas/ReservacionSalas.jsx";
import CatalogoEmpleados from "../proyectos/RecursosHumanos/Empleados/CatalogoEmpleados";
import CatalogoDepartamentos from "../proyectos/Catalogos/Departamentos/CatalogoDepartamentos.jsx";

export const catalogo = {
  "punto-venta": { titulo: "Punto de Venta", Componente: PuntoVenta, ancho: 900, alto: 600 },
  "corte-x": { titulo: "Corte X", Componente: CorteX, ancho: 1100, alto: 650 },
  "acerca-de": { titulo: "Acerca de (Debug Global)", Componente: AcercaDe, ancho: 800, alto: 540 },
  "reservacion-salas": { titulo: "Reservación de Salas de Juntas", Componente: ReservacionSalas, ancho: 1100, alto: 680 },
  "catalogo-empleados": { titulo: "Catálogo de Empleados", Componente: CatalogoEmpleados, ancho: 1100, alto: 350 },
  "catalogo-departamentos": { titulo: "Catálogo de Departamentos", Componente: CatalogoDepartamentos, ancho: 980, alto: 600 },
};