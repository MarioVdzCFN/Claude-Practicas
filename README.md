# Claude Practicas - Sistema Administrativo y Punto de Venta (ERP Web)

Aplicación web integral con interfaz tipo escritorio multi-ventana diseñada para la gestión operativa, recursos humanos, catálogos y administración de salas de juntas con soporte multi-sucursal.

---

## 🚀 Arquitectura y Tecnologías

* **Frontend:** React + Vite + React Router DOM (interfaz MDI tipo escritorio con barra de menú superior, submenús anidados flotantes y barra de tareas inferior).
* **Backend:** Node.js + Express (API REST modularizada por dominio).
* **Base de Datos:** MySQL / MariaDB con conexión dinámica multi-sucursal mediante pools en memoria (`x-sucursal-ip` y `x-sucursal-port`)[cite: 1, 7].
* **Servicios Externos e Infraestructura:**
  * **Correo Electrónico:** Integración con Brevo / Nodemailer para envío de invitaciones y cancelaciones de reuniones[cite: 1, 7].
  * **Almacenamiento en Red (NAS):** Conexión SMB (`net use`) para lectura y despacho dinámico de fotografías y archivos de empleados[cite: 1, 3].

---

## 📁 Estructura del Proyecto

El frontend adopta una arquitectura **colocalizada**, donde cada pantalla (`.jsx`) y sus estilos (`.css`) conviven directamente dentro de la carpeta de su proyecto/módulo bajo `frontend/src/proyectos/`[cite: 1, 14]:

```text
ClaudePracticas/
├── backend/
│   ├── config/
│   │   └── db.js                 # Gestor de pools dinámicos MySQL multi-sucursal
│   ├── rutas/
│   │   ├── login.js              # Autenticación y carga de datos de empleado
│   │   ├── sucursales.js         # Catálogo de sucursales activas (puerto 3306)
│   │   ├── empleados.js          # CRUD de empleados, catálogos y fotos desde NAS
│   │   ├── departamentos.js      # Gestión de departamentos y versionado interno
│   │   ├── salas.js              # Reservación, planos, horarios y dashboard de salas
│   │   └── debug.js              # Endpoints de diagnóstico del sistema
│   ├── servicios/
│   │   ├── emailServicio.js      # Envío de notificaciones de correo
│   │   └── nasServicio.js        # Autenticación SMB con servidor NAS
│   ├── confignon.env             # Variables de entorno (BD, NAS, API Keys)
│   └── index.js                  # Servidor Express principal (Puerto 3001)
│
└── frontend/
    ├── public/
    │   ├── logo.png              # Favicon de la aplicación
    │   └── fondo.jpg             # Fondo del escritorio
    └── src/
        ├── components/           # Marco del escritorio (BarraMenu, BarraTareas, Ventana)
        ├── config/
        │   ├── menu.js           # Árbol de navegación y submenús anidados
        │   └── ventanas.js       # Índice/catálogo centralizado de ventanas
        ├── context/
        │   └── VentanasContext.jsx
        ├── pages/
        │   ├── Login.jsx         # Pantalla de inicio de sesión con selector de sucursal
        │   ├── NoEncontrado.jsx  # Vista 404
        │   └── ConfirmarAsistencia.jsx # Página pública de confirmación de reuniones
        └── proyectos/
            ├── Sistema/
            │   └── AcercaDe/     # Diagnóstico global en vivo (sesión, entorno, ventanas)
            ├── Catalogos/
            │   └── Departamentos/# Catálogo y modal de edición de departamentos
            ├── RecursosHumanos/
            │   └── Empleados/    # Catálogo y ficha integral de empleados
            └── Salas/
                ├── ReservacionSalas/ # Cronograma, dashboard, calendario mensual y plano 16x20
                ├── ModificarSalas/   # CRUD de salas, horarios y editor visual de mapas
                └── Invitados/        # Catálogo de invitados externos
