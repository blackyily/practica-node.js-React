# 🏫 Sistema Escolar — Proyecto de Laboratorio

Sistema web integral y seguro para la administración y control escolar de alumnos, maestros, materias y grupos, con arquitectura cliente-servidor desacoplada, autenticación mediante JWT en cookies `httpOnly`, control de acceso basado en roles (RBAC) y reglas de integridad garantizadas a nivel de motor de base de datos con MariaDB.

---

## 🏛️ Arquitectura del Sistema

```
Navegador Web (Cliente)
   │
   ▼ [http://localhost:5173]
 ┌─────────────────────────────────────────────────────────────┐
 │ Frontend: React 19 + Vite + Bootstrap 5                    │
 │  - React Router (Navegación protegida)                      │
 │  - AuthContext (Estado global de sesión en memoria)         │
 │  - CrudPage.jsx (Componente dinámico y reutilizable)        │
 │  - DashboardLayout, Perfil, Login                           │
 └───────────────────────┬─────────────────────────────────────┘
                         │ Peticiones a /api y /uploads
                         ▼
 ┌─────────────────────────────────────────────────────────────┐
 │ Servidor de Desarrollo Vite (Proxy Inverso)                 │
 │  - Redirige /api/*     ──► http://localhost:3000/api/*      │
 │  - Redirige /uploads/* ──► http://localhost:3000/uploads/*  │
 └───────────────────────┬─────────────────────────────────────┘
                         │ Mismo origen (SameSite=Strict permitido)
                         ▼ [http://localhost:3000]
 ┌─────────────────────────────────────────────────────────────┐
 │ Backend: Node.js (v26+) + Express (ES Modules)              │
 │  - Helmet, express-rate-limit, cookie-parser, multer        │
 │  - Validadores Zod (lista blanca de campos)                 │
 │  - Middlewares: verificarToken, requireRole('admin')        │
 │  - Rutas: auth, usuarios, materias, maestros, grupos, alumnos│
 └───────────────────────┬─────────────────────────────────────┘
                         │ mysql2/promise (Consultas preparadas)
                         │ Usuario limitado: 'lab_app'
                         ▼ [Puerto :3306]
 ┌─────────────────────────────────────────────────────────────┐
 │ Base de Datos: MariaDB 11.4                                 │
 │  - Base de datos: lab_escolar (utf8mb4)                     │
 │  - Llaves foráneas (RESTRICT y SET NULL)                    │
 │  - Triggers de integridad:                                  │
 │      • trg_check_admin_insert (Máximo 2 administradores)    │
 │      • trg_check_admin_update (Máximo 2 administradores)    │
 │      • trg_prevent_admin_delete (Prohibido eliminar admin)  │
 └─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tecnologías Utilizadas

- **Backend:** Node.js (v26+), Express 5, `mysql2/promise`, `bcryptjs`, `jsonwebtoken`, `helmet`, `cookie-parser`, `express-rate-limit`, `multer`, `zod`, `dotenv`.
- **Base de Datos:** MariaDB 11.4.
- **Frontend:** React 19, Vite 8, React Router 7, Bootstrap 5.
- **Pruebas:** Ejecutor nativo `node:test` y `node:assert/strict`, archivo `api.http` para la extensión **REST Client** de VS Code.

---

## 📂 Estructura de Directorios

```
lab-escolar/
├── backend/
│   ├── database/
│   │   └── schema.sql              # DDL, DCL (lab_app), llaves foráneas y triggers
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js               # Conexión pool mysql2 con usuario lab_app
│   │   ├── middleware/
│   │   │   ├── auth.js             # Verificación de JWT en cookie y rol RBAC
│   │   │   ├── errorHandler.js     # Manejador centralizado y seguro de errores
│   │   │   ├── rateLimiter.js      # Límites DoS y fuerza bruta
│   │   │   ├── upload.js           # Multer seguro para fotos de perfil
│   │   │   └── validate.js         # Middleware para esquemas Zod
│   │   ├── routes/
│   │   │   ├── auth.routes.js      # /api/auth (login, logout, me, password, foto)
│   │   │   ├── usuarios.routes.js  # /api/usuarios (exclusivo admin)
│   │   │   ├── materias.routes.js  # /api/materias
│   │   │   ├── maestros.routes.js  # /api/maestros
│   │   │   ├── grupos.routes.js    # /api/grupos
│   │   │   └── alumnos.routes.js   # /api/alumnos
│   │   ├── validators/
│   │   │   ├── auth.schema.js      # Validación Zod de login y contraseña
│   │   │   ├── usuarios.schema.js  # Validación Zod de usuarios
│   │   │   └── entidades.schema.js # Validación Zod de catálogos
│   │   ├── scripts/
│   │   │   └── seed.js             # Creación idempotente de Admin y Root
│   │   ├── app.js                  # Configuración de Express
│   │   └── server.js               # Servidor HTTP con graceful shutdown
│   ├── test/
│   │   ├── api.test.js             # Pruebas automatizadas (20 pruebas)
│   │   └── security.test.js        # Pruebas activas de seguridad (4 pruebas)
│   ├── uploads/                    # Almacenamiento de avatares subidos
│   ├── api.http                    # Pruebas manuales con REST Client
│   ├── .env.example                # Plantilla de variables de entorno
│   ├── .env                        # Variables locales
│   └── package.json
│
└── frontend/
    ├── vite.config.js              # Configuración de Vite con proxy /api y /uploads
    ├── index.html                  # Punto de entrada HTML
    ├── package.json
    └── src/
        ├── api.js                  # Cliente HTTP con fetch y credentials: 'include'
        ├── context/
        │   └── AuthContext.jsx     # Contexto global de sesión y rol
        ├── components/
        │   ├── Avatar.jsx          # Componente de imagen de perfil / iniciales
        │   ├── CrudPage.jsx        # Componente CRUD genérico con modal y filtro
        │   └── RutaProtegida.jsx   # Guarda de rutas (autenticación y rol)
        ├── config/
        │   └── entidades.js        # Configuración centralizada de catálogos
        ├── layouts/
        │   └── DashboardLayout.jsx # Menú lateral con info de usuario en sesión
        ├── pages/
        │   ├── Login.jsx           # Formulario de inicio de sesión
        │   ├── Inicio.jsx          # Panel principal con accesos rápidos
        │   └── Perfil.jsx          # Cambio de contraseña y subida de avatar
        ├── App.jsx                 # Configuración de rutas con React Router
        └── main.jsx                # Montaje de React e importación de Bootstrap
```

---

## 🚀 Guía de Instalación y Puesta en Marcha

### 1. Iniciar la Base de Datos MariaDB
Asegúrate de que el contenedor de MariaDB esté en ejecución:
```bash
docker start mariadb_db
```

### 2. Configurar el Backend
1. Entra a la carpeta `backend`:
   ```bash
   cd backend
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Verifica que exista el archivo `.env` (puedes basarte en `.env.example`).
4. Importa el esquema de la base de datos (si inicias desde cero):
   ```bash
   docker exec -i mariadb_db mariadb -u root -psecret_root_pass < database/schema.sql
   ```
5. Ejecuta el script de Seed para crear los dos administradores iniciales:
   ```bash
   npm run seed
   ```
6. Inicia el servidor backend en modo desarrollo:
   ```bash
   npm run dev
   ```
   *(El backend iniciará en `http://localhost:3000`)*.

### 3. Configurar y Levantar el Frontend
En otra terminal:
1. Entra a la carpeta `frontend`:
   ```bash
   cd frontend
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Inicia el servidor de desarrollo de Vite:
   ```bash
   npm run dev
   ```
   *(El frontend estará disponible en `http://localhost:5173`)*.

---

## 🔑 Credenciales Iniciales del Sistema

| Usuario | Contraseña | Rol | Descripción |
| :--- | :--- | :---: | :--- |
| **`Admin`** | `Admin123!` | `admin` | Administrador Principal |
| **`Root`** | `Root123!` | `admin` | Super Administrador |

---

## 🔒 Mecanismos de Seguridad Implementados

1. **Principio de Mínimo Privilegio (MariaDB):**
   - El backend se conecta exclusivamente con el usuario `lab_app`.
   - Permisos otorgados: únicamente `SELECT, INSERT, UPDATE, DELETE` sobre `lab_escolar.*`.
   - Se le prohíben permisos DDL (`DROP`, `CREATE`, `ALTER`) y nunca se usa `root` desde Node.js.
2. **Triggers de Integridad en MariaDB:**
   - `trg_check_admin_insert` y `trg_check_admin_update`: Impiden registrar o promover a más de 2 administradores en la base de datos.
   - `trg_prevent_admin_delete`: Impide la eliminación de cualquier cuenta con rol `admin`.
3. **Mitigación de Inyección SQL:**
   - 100% de las consultas se realizan con **consultas parametrizadas** (`?`) a través de `mysql2/promise`.
4. **Protección de Contraseñas:**
   - Cifradas mediante **bcryptjs** con factor de coste 10. Nunca se almacenan ni se transmiten en texto plano.
5. **Autenticación con JWT en Cookie Segura:**
   - Token JWT almacenado en cookie con banderas:
     - `httpOnly: true` (inaccesible desde JavaScript, previene robo por XSS).
     - `sameSite: 'strict'` (protección activa contra CSRF).
     - `secure: true` en producción.
6. **Protección contra Ataques de Fuerza Bruta:**
   - Limitador de tasa con `express-rate-limit` (máximo 10 intentos en 15 minutos en `/api/auth/login`).
   - **Bloqueo a nivel de cuenta:** Tras 5 intentos fallidos consecutivos, la cuenta se bloquea en MariaDB durante 15 minutos (`bloqueado_hasta`).
7. **Prevención de Escalamiento de Privilegios:**
   - Al registrar usuarios vía `POST /api/usuarios`, el servidor fuerza de forma irrestricta el rol a `"usuario"`, ignorando cualquier payload malicioso que intente enviar `"rol": "admin"`.
8. **Seguridad en Subida de Archivos (Fotos de Perfil):**
   - Validación estricta de extensiones (`.jpg`, `.jpeg`, `.png`, `.webp`) y tipos MIME con Multer.
   - Rechazo de archivos ejecutables, scripts y archivos SVG (riesgo de XSS).
   - Nombres aleatorios criptográficos generados en el servidor para evitar colisiones y *path traversal*.
   - Límite de tamaño máximo: 2 MB.
   - Eliminación automática de fotos anteriores al actualizar para evitar archivos huérfanos.
9. **Encabezados HTTP con Helmet:**
   - Ocultamiento de la cabecera `X-Powered-By`.
   - Activación de `Content-Security-Policy`, `X-Content-Type-Options: nosniff` y `X-Frame-Options: SAMEORIGIN`.
10. **Validación y Lista Blanca con Zod:**
    - Se filtran y sanitizan todos los datos entrantes eliminando campos no especificados.
11. **Manejo Centralizado de Errores:**
    - Respuestas genéricas y amigables que impiden la fuga de detalles internos (*stack traces* o sintaxis SQL).

---

## 🧪 Pruebas del Sistema

### 1. Pruebas Automatizadas (`node:test`)
Desde la carpeta `backend`, ejecuta:
```bash
npm test
```
Ejecutará **24 pruebas automatizadas** que validan la salud de la API, login, cookies, RBAC, escalamiento de privilegios, triggers de MariaDB, relaciones foráneas y pruebas activas de seguridad.

### 2. Pruebas Manuales (`api.http`)
Si tienes instalada la extensión **REST Client** (`humao.rest-client`) en VS Code:
1. Abre el archivo `backend/api.http`.
2. Haz clic sobre el enlace `Send Request` que aparece arriba de cada petición para probar endpoints individualmente.
