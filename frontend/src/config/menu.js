// frontend/src/config/menu.js
export const menuPrincipal = [
  {
    area: "Ventas",
    items: [
      { label: "Punto Venta", ventana: "punto-venta" },
      { separador: true },
      { label: "Retiros", ventana: "test1" },
      { label: "Ultimo Retiro", ventana: "test1" },
      { label: "Movimientos Cortes", ventana: "test1" },
      { separador: true },
      { label: "Cortes X", ventana: "corte-x" },
      { label: "Cortes Z", ventana: "test1" },
      { label: "Ventas Pendientes", ventana: "test1" },
      { label: "Venta Monedas", ventana: "test1" },
      { label: "Configuración Monedas", ventana: "test1" },
      { separador: true },
      { label: "Abrir Cajón", ventana: "test1" },
    ],
  },
  {
    area: "Reportes",
    items: [
      {
        label: "Ventas Detalles",
        items: [
          { label: "Por Departamento", ventana: "test-v-depto" },
          { label: "Por Cajero", ventana: "test-v-cajero" },
          { label: "Por Hora", ventana: "test-v-hora" },
        ],
      },
      {
        label: "Bitacoras",
        items: [
          { label: "Bitácora de Cancelaciones", ventana: "test-b-canc" },
          { label: "Bitácora de Precios", ventana: "test-b-prec" },
        ],
      },
      {
        label: "Comparativo de Rango",
        items: [
          { label: "Rango Semanal", ventana: "test-comp-sem" },
          { label: "Rango Mensual", ventana: "test-comp-mes" },
        ],
      },
      {
        label: "Comparativo Compras vs Ventas Global",
        items: [
          { label: "General", ventana: "test-cv-gen" },
          { label: "Por Proveedor", ventana: "test-cv-prov" },
        ],
      },
      {
        label: "Gerencial",
        items: [
          { label: "Resumen Ejecutivo", ventana: "test-ger-res" },
          { label: "Indicadores Clave", ventana: "test-ger-kpi" },
        ],
      },
      {
        label: "Graficas",
        items: [
          { label: "Tendencias de Venta", ventana: "test-gr-tend" },
          { label: "Top Productos", ventana: "test-gr-top" },
        ],
      },
      {
        label: "Mermas",
        items: [
          { label: "Detalle de Mermas", ventana: "test-mer-det" },
          { label: "Mermas por Motivo", ventana: "test-mer-mot" },
        ],
      },
      { label: "Global de surtido", ventana: "test1" },
      { label: "Control de gastos", ventana: "test1" },
      { label: "Articulos mas mermados por linea", ventana: "test1" },
      { label: "Servicios y Comisiones", ventana: "test1" },
      { label: "Promociones", ventana: "test1" },
      { separador: true },
      { label: "Articulos con Bajo Desplazamiento", ventana: "test1" },
      { label: "Bitacora Temperatura Proveedor", ventana: "test1" },
      { label: "Comparativo Ofertas", ventana: "test1" },
      { label: "Consumo Interno", ventana: "test1" },
      { label: "Desabasto de proveedores", ventana: "test1" },
      { label: "Historial Cotizacion", ventana: "test1" },
      { label: "Presupuesto Plan de ofertas", ventana: "test1" },
      { label: "Resultados Ciclicos Gerenciales", ventana: "test1" },
      { label: "Revision Transferencias", ventana: "test1" },
      { label: "Unidades Vendidas", ventana: "test1" },
      { label: "Planeacion de horarios", ventana: "test1" },
    ],
  },
  {
    area: "Catálogos", items: [
      { label: "Empleados", ventana: "catalogo-empleados" },
      { label: "Departamentos", ventana: "catalogo-departamentos" },
      { label: "Clientes", ventana: "test1" },
      { label: "Conceptos Cambios Fisicos", ventana: "test1" },
      { label: "Colores de Pedidos", ventana: "test1" },
      { label: "Puestos", ventana: "test1" },
      { label: "Estaciones", ventana: "test1" },
      { label: "Rubros Gastos", ventana: "test1" },
      { label: "Empresas", ventana: "test1" },
      { label: "Sucursales", ventana: "test1" },
      { label: "Bancos Punto Venta", ventana: "test1" },
    ]
  },
  { area: "Inventarios", items: [] },
  { area: "Almacén", items: [] },
  { area: "Seguridad", items: [] },
  { area: "Facturación", items: [] },
  { area: "Recursos Humanos", items: [
    { label: "Planificador Sala de Juntas", ventana: "reservacion-salas" }
  ] },
  { area: "Pedidos App", items: [] },
];

export const menuAcciones = [
  { area: "Acerca de", ventana: "acerca-de" },
  { area: "Cerrar Sesión", ventana: "cerrar-sesion" },
];