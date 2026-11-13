// backend/index.js
require("dotenv").config({ path: "confignon.env" });
const express = require("express");
const cors = require("cors");
const conexionSucursal = require("./middlewares/conexionSucursal");
const { conectarNAS } = require("./servicios/nasServicio");

// Importación de rutas modulares
const rutaLogin = require("./rutas/login");
const rutaSucursales = require("./rutas/sucursales");
const rutaDebug = require("./rutas/debug");
const rutaSalas = require("./rutas/salas");
const departamentosRuta = require("./rutas/departamentos");
const rutaEmpleados = require("./rutas/empleados");

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(conexionSucursal);

// Montaje de endpoints
app.use("/api/login", rutaLogin);
app.use("/api/sucursales", rutaSucursales);
app.use("/api/debug", rutaDebug);
app.use("/api/salas", rutaSalas);
app.use("/api/empleados", rutaEmpleados);
app.use("/api/departamentos", departamentosRuta);

const PORT = process.env.PORT || 3001;

conectarNAS().catch((err) => {
  console.warn("No se pudo autenticar con el NAS de inmediato, se reintentará en demanda:", err.message);
});

// Escuchando en 0.0.0.0 para acceso desde cualquier equipo en la red local
app.listen(PORT, "0.0.0.0", () => {
  console.log(`==============================================`);
  console.log(`| Servidor backend corriendo en puerto ${PORT}  |`);
  console.log(`| Acceso local y red: http://0.0.0.0:${PORT}    |`);
  console.log(`==============================================`);
});