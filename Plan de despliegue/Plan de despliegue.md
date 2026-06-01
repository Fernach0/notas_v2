# Plan de Despliegue — Proyecto Notas

> Documento vivo. Se actualiza conforme avanza el despliegue.

---

## Estado general

| Fase | Descripción | Estado |
|------|-------------|--------|
| 1 | Base de datos en Supabase | ✅ Completado |
| 2 | Backend en Render | ✅ Completado |
| 3 | Frontend en Vercel | ⏳ Pendiente |
| 4 | Variables de entorno y conexión | ⏳ Pendiente |
| 5 | Pruebas en producción | ⏳ Pendiente |

---

## FASE 1 — Base de datos en Supabase

### 1.1 Crear el proyecto en Supabase

1. Abre el navegador y ve a **[https://supabase.com](https://supabase.com)**.

2. Haz clic en el botón **"Start your project"** (esquina superior derecha) o **"Sign in"** si ya tienes cuenta.

3. Inicia sesión con tu cuenta de **GitHub** o con tu correo electrónico.

4. Una vez dentro del dashboard, haz clic en el botón verde **"New project"** (parte superior derecha).

5. Completa el formulario:
   - **Organization:** selecciona tu organización (o la que viene por defecto con tu usuario).
   - **Project name:** `proyecto-notas` (o el nombre que prefieras).
   - **Database Password:** escribe una contraseña segura y **guárdala**, la necesitarás después para conectar el backend. Ejemplo: `ProyectoNotas2026!`.
   - **Region:** selecciona **South America (São Paulo)** — es la más cercana a Ecuador.
   - **Pricing plan:** Free (para despliegue de prueba).

6. Haz clic en **"Create new project"** y espera entre 1 y 2 minutos mientras Supabase aprovisiona la base de datos.

---

### 1.2 Abrir el SQL Editor

1. Una vez creado el proyecto verás el dashboard principal con métricas. En el **menú lateral izquierdo**, busca el ícono de base de datos o haz clic en **"SQL Editor"** (ícono de código `</>`).

2. Haz clic en **"New query"** (botón con `+` en la parte superior del panel izquierdo del editor).

3. Se abrirá un área de texto en blanco donde pegarás el SQL.

---

### 1.3 Ejecutar el SQL de estructura (DDL)

Copia **todo** el contenido del bloque de abajo, pégalo en el editor y haz clic en **"Run"** (botón verde, o `Ctrl + Enter`).

```sql
-- ============================================================
-- PROYECTO NOTAS — DDL completo para Supabase / PostgreSQL
-- Generado desde schema.prisma
-- ============================================================

-- ── ENUMS ────────────────────────────────────────────────────
CREATE TYPE "EstadoUsuario"    AS ENUM ('ACTIVO', 'INACTIVO', 'BLOQUEADO');
CREATE TYPE "EstadoLectivo"    AS ENUM ('ACTIVO', 'FINALIZADO', 'PLANIFICADO');
CREATE TYPE "EstadoEvidencia"  AS ENUM ('ACTIVO', 'ELIMINADO');
CREATE TYPE "TipoActividad"    AS ENUM ('TAREA', 'EXAMEN', 'PROYECTO', 'PRUEBA');
CREATE TYPE "TipoNotificacion" AS ENUM ('NUEVA_ACTIVIDAD', 'CALIFICACION', 'RECORDATORIO', 'SISTEMA');

-- ── TABLAS ───────────────────────────────────────────────────

CREATE TABLE anio_lectivo (
  id_aniolectivo SERIAL        PRIMARY KEY,
  fecha_inicio   DATE          NOT NULL,
  fecha_final    DATE          NOT NULL,
  estado_lectivo "EstadoLectivo" NOT NULL
);

CREATE TABLE usuario (
  id_usuario          VARCHAR(10)     PRIMARY KEY,
  nombre_completo     VARCHAR(100)    NOT NULL,
  contrasena_usuario  VARCHAR(255)    NOT NULL,
  estado_usuario      "EstadoUsuario" NOT NULL,
  email               VARCHAR(255)    UNIQUE,
  token_recuperacion  VARCHAR(255),
  expiracion_token    TIMESTAMP
);

CREATE TABLE rol (
  id_rol     SERIAL      PRIMARY KEY,
  nombre_rol VARCHAR(20) NOT NULL
);

CREATE TABLE usuario_rol (
  id_usuario VARCHAR(10) NOT NULL,
  id_rol     INTEGER     NOT NULL,
  PRIMARY KEY (id_usuario, id_rol),
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  FOREIGN KEY (id_rol)     REFERENCES rol(id_rol)
);

CREATE TABLE curso (
  id_curso       SERIAL      PRIMARY KEY,
  id_aniolectivo INTEGER     NOT NULL,
  nombre_curso   VARCHAR(15) NOT NULL,
  FOREIGN KEY (id_aniolectivo) REFERENCES anio_lectivo(id_aniolectivo)
);

CREATE TABLE usuario_curso (
  id_usuario VARCHAR(10) NOT NULL,
  id_curso   INTEGER     NOT NULL,
  PRIMARY KEY (id_usuario, id_curso),
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  FOREIGN KEY (id_curso)   REFERENCES curso(id_curso)     ON DELETE CASCADE
);

CREATE TABLE materia (
  id_materia     SERIAL      PRIMARY KEY,
  nombre_materia VARCHAR(30) NOT NULL
);

CREATE TABLE curso_materia (
  id_curso   INTEGER NOT NULL,
  id_materia INTEGER NOT NULL,
  PRIMARY KEY (id_curso, id_materia),
  FOREIGN KEY (id_curso)   REFERENCES curso(id_curso)     ON DELETE CASCADE,
  FOREIGN KEY (id_materia) REFERENCES materia(id_materia) ON DELETE CASCADE
);

CREATE TABLE profesor_materia_curso (
  id_usuario VARCHAR(10) NOT NULL,
  id_curso   INTEGER     NOT NULL,
  id_materia INTEGER     NOT NULL,
  PRIMARY KEY (id_usuario, id_curso, id_materia),
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  FOREIGN KEY (id_curso)   REFERENCES curso(id_curso)     ON DELETE CASCADE,
  FOREIGN KEY (id_materia) REFERENCES materia(id_materia) ON DELETE CASCADE
);

CREATE TABLE parcial (
  id_parcial     SERIAL  PRIMARY KEY,
  id_materia     INTEGER NOT NULL,
  id_curso       INTEGER NOT NULL,
  numero_parcial INTEGER NOT NULL,
  FOREIGN KEY (id_materia) REFERENCES materia(id_materia),
  FOREIGN KEY (id_curso)   REFERENCES curso(id_curso),
  CONSTRAINT uq_parcial_materia_curso_numero UNIQUE (id_materia, id_curso, numero_parcial)
);

CREATE TABLE actividad (
  id_actividad         SERIAL           PRIMARY KEY,
  id_parcial           INTEGER          NOT NULL,
  tipo_actividad       "TipoActividad"  NOT NULL,
  fecha_inicio_entrega DATE             NOT NULL,
  fecha_fin_entrega    DATE             NOT NULL,
  descripcion          VARCHAR(200),
  titulo_actividad     VARCHAR(20),
  valor_maximo         DOUBLE PRECISION NOT NULL DEFAULT 10.0,
  FOREIGN KEY (id_parcial) REFERENCES parcial(id_parcial)
);

CREATE TABLE calificacion (
  id_calificacion SERIAL           PRIMARY KEY,
  id_usuario      VARCHAR(10)      NOT NULL,
  id_actividad    INTEGER          NOT NULL,
  nota            DOUBLE PRECISION NOT NULL,
  comentario      VARCHAR(200),
  FOREIGN KEY (id_usuario)   REFERENCES usuario(id_usuario),
  FOREIGN KEY (id_actividad) REFERENCES actividad(id_actividad),
  CONSTRAINT uq_calificacion_usuario_actividad UNIQUE (id_usuario, id_actividad)
);

CREATE TABLE evidencias (
  id_evidencia    SERIAL             PRIMARY KEY,
  id_usuario      VARCHAR(10)        NOT NULL,
  id_actividad    INTEGER            NOT NULL,
  archivo_bytes   BYTEA,
  nombre_archivo  VARCHAR(255)       NOT NULL,
  fecha_subida    TIMESTAMP          DEFAULT NOW(),
  tamanio         BIGINT             NOT NULL,
  tipo_contenido  VARCHAR(255)       NOT NULL,
  estado          "EstadoEvidencia"  NOT NULL DEFAULT 'ACTIVO',
  nombre_actividad VARCHAR(255)      NOT NULL,
  codigo_actividad VARCHAR(255)      NOT NULL UNIQUE,
  tipo_actividad  VARCHAR(255)       NOT NULL,
  FOREIGN KEY (id_usuario)   REFERENCES usuario(id_usuario),
  FOREIGN KEY (id_actividad) REFERENCES actividad(id_actividad),
  CONSTRAINT uq_evidencia_usuario_actividad UNIQUE (id_usuario, id_actividad)
);

CREATE TABLE notificaciones (
  id_notificacion      SERIAL              PRIMARY KEY,
  id_usuario           VARCHAR(10)         NOT NULL,
  id_actividad         INTEGER,
  tipo_notificacion    "TipoNotificacion"  NOT NULL,
  mensaje_notificacion VARCHAR(255)        NOT NULL,
  fecha_notificacion   TIMESTAMP           NOT NULL,
  leida                BOOLEAN             NOT NULL DEFAULT FALSE,
  FOREIGN KEY (id_usuario)   REFERENCES usuario(id_usuario),
  FOREIGN KEY (id_actividad) REFERENCES actividad(id_actividad)
);

CREATE TABLE promedio_materia_estudiante (
  id_promedio_materia    SERIAL           PRIMARY KEY,
  id_usuario             VARCHAR(10)      NOT NULL,
  id_aniolectivo         INTEGER          NOT NULL,
  id_curso               INTEGER          NOT NULL,
  id_materia             INTEGER          NOT NULL,
  promedio_parcial1      DOUBLE PRECISION,
  promedio_parcial2      DOUBLE PRECISION,
  promedio_parcial3      DOUBLE PRECISION,
  promedio_final_materia DOUBLE PRECISION,
  fecha_actualizacion    TIMESTAMP,
  FOREIGN KEY (id_usuario)     REFERENCES usuario(id_usuario),
  FOREIGN KEY (id_aniolectivo) REFERENCES anio_lectivo(id_aniolectivo),
  FOREIGN KEY (id_curso)       REFERENCES curso(id_curso),
  FOREIGN KEY (id_materia)     REFERENCES materia(id_materia),
  CONSTRAINT uq_promedio_materia UNIQUE (id_usuario, id_aniolectivo, id_curso, id_materia)
);

CREATE TABLE promediogeneralestudiante (
  id_promedio_general SERIAL           PRIMARY KEY,
  id_usuario          VARCHAR(10)      NOT NULL,
  id_curso            INTEGER          NOT NULL,
  promedio_general    DOUBLE PRECISION NOT NULL,
  comportamiento      VARCHAR(1)       NOT NULL,
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
  FOREIGN KEY (id_curso)   REFERENCES curso(id_curso),
  CONSTRAINT uq_promedio_general UNIQUE (id_usuario, id_curso)
);
```

Después de ejecutar verás un mensaje `Success. No rows returned` — eso es correcto, significa que las tablas se crearon sin errores.

---

### 1.4 Ejecutar el SQL de datos semilla (SEED)

Abre una **nueva query** (botón `+`) y ejecuta el siguiente SQL:

```sql
-- ============================================================
-- SEED — Datos de prueba
-- Contraseña de todos los usuarios: Notas2026!
-- ============================================================

-- ── ROLES ────────────────────────────────────────────────────
INSERT INTO rol (id_rol, nombre_rol) VALUES
  (1, 'Administrador'),
  (2, 'Profesor'),
  (3, 'Estudiante');

-- ── ADMINISTRADORES (hash bcrypt de "Notas2026!", 10 rondas) ─
INSERT INTO usuario (id_usuario, nombre_completo, contrasena_usuario, estado_usuario, email) VALUES
  ('1700000001', 'Administrador del Sistema',   '$2b$10$0ZmmtAM87Q9nEPlkmIibBuli0uSvWqp32aOuYVmnKMpDUART/C4Bu', 'ACTIVO', 'admin@escuela.ec'),
  ('1700000002', 'Directora Académica Pérez',   '$2b$10$0ZmmtAM87Q9nEPlkmIibBuli0uSvWqp32aOuYVmnKMpDUART/C4Bu', 'ACTIVO', 'directora@escuela.ec'),
  ('1700000003', 'Secretaria General Morales',  '$2b$10$0ZmmtAM87Q9nEPlkmIibBuli0uSvWqp32aOuYVmnKMpDUART/C4Bu', 'ACTIVO', 'secretaria@escuela.ec');

-- ── PROFESORES ───────────────────────────────────────────────
INSERT INTO usuario (id_usuario, nombre_completo, contrasena_usuario, estado_usuario, email) VALUES
  ('1700000100', 'María Elena Salazar Vega',      '$2b$10$2ITDEzh5l.otk4iTCxEFPu4YTtq8wK6./2EuljqOOOG1/LKYIJsaK', 'ACTIVO', 'msalazar@escuela.ec'),
  ('1700000101', 'Roberto Oswaldo Jiménez Cruz',  '$2b$10$2ITDEzh5l.otk4iTCxEFPu4YTtq8wK6./2EuljqOOOG1/LKYIJsaK', 'ACTIVO', 'rjimenez@escuela.ec'),
  ('1700000102', 'Sandra Lorena Morocho Pinto',   '$2b$10$2ITDEzh5l.otk4iTCxEFPu4YTtq8wK6./2EuljqOOOG1/LKYIJsaK', 'ACTIVO', 'smorochop@escuela.ec'),
  ('1700000103', 'Diego Andrés Paredes Luna',     '$2b$10$2ITDEzh5l.otk4iTCxEFPu4YTtq8wK6./2EuljqOOOG1/LKYIJsaK', 'ACTIVO', 'dparedes@escuela.ec'),
  ('1700000104', 'Patricia Susana Ramos Flores',  '$2b$10$2ITDEzh5l.otk4iTCxEFPu4YTtq8wK6./2EuljqOOOG1/LKYIJsaK', 'ACTIVO', 'pramos@escuela.ec'),
  ('1700000105', 'Luis Fernando Castro Mora',     '$2b$10$2ITDEzh5l.otk4iTCxEFPu4YTtq8wK6./2EuljqOOOG1/LKYIJsaK', 'ACTIVO', 'lcastro@escuela.ec'),
  ('1700000106', 'Verónica Isabel Almeida Soto',  '$2b$10$2ITDEzh5l.otk4iTCxEFPu4YTtq8wK6./2EuljqOOOG1/LKYIJsaK', 'ACTIVO', 'valmeida@escuela.ec'),
  ('1700000107', 'Marco Antonio Herrera Brito',   '$2b$10$2ITDEzh5l.otk4iTCxEFPu4YTtq8wK6./2EuljqOOOG1/LKYIJsaK', 'ACTIVO', 'mherrera@escuela.ec'),
  ('1700000108', 'Carmen Estela Gutiérrez Navas', '$2b$10$2ITDEzh5l.otk4iTCxEFPu4YTtq8wK6./2EuljqOOOG1/LKYIJsaK', 'ACTIVO', 'cgutierrez@escuela.ec'),
  ('1700000109', 'Esteban David Villalba Chávez', '$2b$10$2ITDEzh5l.otk4iTCxEFPu4YTtq8wK6./2EuljqOOOG1/LKYIJsaK', 'ACTIVO', 'evillalba@escuela.ec');

-- ── ESTUDIANTES ──────────────────────────────────────────────
INSERT INTO usuario (id_usuario, nombre_completo, contrasena_usuario, estado_usuario, email) VALUES
  ('1700000200', 'Sebastián Mateo Ortega Ruiz',      '$2b$10$2ITDEzh5l.otk4iTCxEFPu4YTtq8wK6./2EuljqOOOG1/LKYIJsaK', 'ACTIVO', 'sortega@escuela.ec'),
  ('1700000201', 'Valeria Camila Montoya Sánchez',   '$2b$10$2ITDEzh5l.otk4iTCxEFPu4YTtq8wK6./2EuljqOOOG1/LKYIJsaK', 'ACTIVO', 'vmontoya@escuela.ec'),
  ('1700000202', 'Andrés Felipe Zambrano Torres',    '$2b$10$2ITDEzh5l.otk4iTCxEFPu4YTtq8wK6./2EuljqOOOG1/LKYIJsaK', 'ACTIVO', 'azambrano@escuela.ec'),
  ('1700000203', 'Gabriela Alejandra Suárez León',   '$2b$10$2ITDEzh5l.otk4iTCxEFPu4YTtq8wK6./2EuljqOOOG1/LKYIJsaK', 'ACTIVO', 'gsuarez@escuela.ec'),
  ('1700000204', 'Nicolás Eduardo Alarcón Paz',      '$2b$10$2ITDEzh5l.otk4iTCxEFPu4YTtq8wK6./2EuljqOOOG1/LKYIJsaK', 'ACTIVO', 'nalarcon@escuela.ec'),
  ('1700000205', 'Isabella Sofía Delgado Reyes',     '$2b$10$2ITDEzh5l.otk4iTCxEFPu4YTtq8wK6./2EuljqOOOG1/LKYIJsaK', 'ACTIVO', 'idelgado@escuela.ec'),
  ('1700000206', 'Emilio Javier Pérez Mejía',        '$2b$10$2ITDEzh5l.otk4iTCxEFPu4YTtq8wK6./2EuljqOOOG1/LKYIJsaK', 'ACTIVO', 'eperez@escuela.ec'),
  ('1700000207', 'Daniela Fernanda Cuesta Mora',     '$2b$10$2ITDEzh5l.otk4iTCxEFPu4YTtq8wK6./2EuljqOOOG1/LKYIJsaK', 'ACTIVO', 'dcuesta@escuela.ec'),
  ('1700000208', 'Matías Renato Acosta Vargas',      '$2b$10$2ITDEzh5l.otk4iTCxEFPu4YTtq8wK6./2EuljqOOOG1/LKYIJsaK', 'ACTIVO', 'macosta@escuela.ec'),
  ('1700000209', 'Lucía Beatriz Molina Aguirre',     '$2b$10$2ITDEzh5l.otk4iTCxEFPu4YTtq8wK6./2EuljqOOOG1/LKYIJsaK', 'ACTIVO', 'lmolina@escuela.ec'),
  ('1700000210', 'Joaquín Alejandro Vera Espinoza',  '$2b$10$2ITDEzh5l.otk4iTCxEFPu4YTtq8wK6./2EuljqOOOG1/LKYIJsaK', 'ACTIVO', 'jvera@escuela.ec'),
  ('1700000211', 'Martina Patricia Ordóñez Ríos',    '$2b$10$2ITDEzh5l.otk4iTCxEFPu4YTtq8wK6./2EuljqOOOG1/LKYIJsaK', 'ACTIVO', 'mordonez@escuela.ec'),
  ('1700000212', 'Santiago Israel Palacios Cruz',    '$2b$10$2ITDEzh5l.otk4iTCxEFPu4YTtq8wK6./2EuljqOOOG1/LKYIJsaK', 'ACTIVO', 'spalacios@escuela.ec'),
  ('1700000213', 'Ariana Michelle Carrillo Bernal',  '$2b$10$2ITDEzh5l.otk4iTCxEFPu4YTtq8wK6./2EuljqOOOG1/LKYIJsaK', 'ACTIVO', 'acarrillo@escuela.ec'),
  ('1700000214', 'Tomás Agustín Noboa Castro',       '$2b$10$2ITDEzh5l.otk4iTCxEFPu4YTtq8wK6./2EuljqOOOG1/LKYIJsaK', 'ACTIVO', 'tnoboa@escuela.ec'),
  ('1700000215', 'Camila Estefanía Tamayo Silva',    '$2b$10$2ITDEzh5l.otk4iTCxEFPu4YTtq8wK6./2EuljqOOOG1/LKYIJsaK', 'ACTIVO', 'ctamayo@escuela.ec'),
  ('1700000216', 'Benjamín Rodrigo Andrade Lema',    '$2b$10$2ITDEzh5l.otk4iTCxEFPu4YTtq8wK6./2EuljqOOOG1/LKYIJsaK', 'ACTIVO', 'bandrade@escuela.ec'),
  ('1700000217', 'Paula Renata Bravo Intriago',      '$2b$10$2ITDEzh5l.otk4iTCxEFPu4YTtq8wK6./2EuljqOOOG1/LKYIJsaK', 'ACTIVO', 'pbravo@escuela.ec'),
  ('1700000218', 'Maximiliano José Quispe Chica',    '$2b$10$2ITDEzh5l.otk4iTCxEFPu4YTtq8wK6./2EuljqOOOG1/LKYIJsaK', 'ACTIVO', 'mquispe@escuela.ec'),
  ('1700000219', 'Natalia Priscila Urgiles Morán',   '$2b$10$2ITDEzh5l.otk4iTCxEFPu4YTtq8wK6./2EuljqOOOG1/LKYIJsaK', 'ACTIVO', 'nurgiles@escuela.ec');

-- ── ASIGNACIÓN DE ROLES ──────────────────────────────────────
INSERT INTO usuario_rol (id_usuario, id_rol) VALUES
  ('1700000001', 1),
  ('1700000002', 1),
  ('1700000003', 1);

INSERT INTO usuario_rol (id_usuario, id_rol) VALUES
  ('1700000100', 2), ('1700000101', 2), ('1700000102', 2), ('1700000103', 2), ('1700000104', 2),
  ('1700000105', 2), ('1700000106', 2), ('1700000107', 2), ('1700000108', 2), ('1700000109', 2);

INSERT INTO usuario_rol (id_usuario, id_rol) VALUES
  ('1700000200', 3), ('1700000201', 3), ('1700000202', 3), ('1700000203', 3), ('1700000204', 3),
  ('1700000205', 3), ('1700000206', 3), ('1700000207', 3), ('1700000208', 3), ('1700000209', 3),
  ('1700000210', 3), ('1700000211', 3), ('1700000212', 3), ('1700000213', 3), ('1700000214', 3),
  ('1700000215', 3), ('1700000216', 3), ('1700000217', 3), ('1700000218', 3), ('1700000219', 3);
```

Verás `33 rows affected` aproximadamente — la operación fue exitosa.

---

### 1.5 Obtener la cadena de conexión (DATABASE_URL)

Esta URL la necesitará el backend para conectarse a Supabase.

1. En el menú lateral izquierdo haz clic en el ícono de engranaje **"Project Settings"** (está al fondo del menú).

2. En el submenú que aparece, selecciona **"Database"**.

3. Baja hasta la sección **"Connection string"**.

4. Asegúrate de que el selector muestre **"URI"** (no "PSQL" ni otro modo).

5. Selecciona el modo **"Transaction pooler"** — es el recomendado para apps en la nube.

6. Verás una URL con este formato:
   ```
   postgresql://postgres.XXXXXXXXXXXX:TU_PASSWORD@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
   ```

7. Reemplaza `[YOUR-PASSWORD]` con la contraseña que pusiste al crear el proyecto.

8. **Guarda esta URL** — se usará como `DATABASE_URL` en el backend.

---

### 1.6 Verificar que los datos se cargaron correctamente

1. En el menú lateral izquierdo haz clic en **"Table Editor"** (ícono de tabla).

2. Selecciona la tabla `usuario` — deberías ver los 33 usuarios (3 admins + 10 profesores + 20 estudiantes).

3. Selecciona la tabla `rol` — deberías ver 3 filas: Administrador, Profesor, Estudiante.

4. Selecciona la tabla `usuario_rol` — deberías ver 33 filas de asignaciones.

Fase 1 completada.

---

## FASE 2 — Backend en Render

### 2.1 Cambios en el código ya aplicados

Antes de desplegar se realizaron los siguientes ajustes:

- **`prisma/schema.prisma`** — Se agregó `directUrl = env("DIRECT_URL")` al datasource. Supabase usa un pooler de conexiones (pgbouncer) en el puerto 6543; Prisma necesita una URL directa separada para funcionar correctamente.
- **`src/main.ts`** — El CORS se restringió a `FRONTEND_URL` en lugar de aceptar cualquier origen.

### 2.2 Subir el código a GitHub

Render despliega desde un repositorio de GitHub. Si el backend no está en GitHub aún:

1. Ve a **[https://github.com](https://github.com)** e inicia sesión.
2. Haz clic en **"New repository"** (botón verde).
3. Ponle nombre: `proyecto-notas-api`, márcalo como **Private**, haz clic en **"Create repository"**.
4. Abre la terminal en la carpeta `backend/proyecto-notas-api` y ejecuta:
   ```bash
   git init
   git add .
   git commit -m "initial commit"
   git remote add origin https://github.com/TU_USUARIO/proyecto-notas-api.git
   git push -u origin main
   ```

### 2.3 Crear el servicio en Render

1. Ve a **[https://render.com](https://render.com)** e inicia sesión (puedes usar tu cuenta de GitHub).

2. En el dashboard haz clic en **"New +"** (botón azul, parte superior derecha).

3. Selecciona **"Web Service"**.

4. En la sección **"Connect a repository"**, selecciona el repositorio `proyecto-notas-api`.
   - Si no aparece, haz clic en **"Configure account"** para dar acceso a Render a tu GitHub.

5. Completa el formulario de configuración:

   | Campo | Valor |
   |-------|-------|
   | **Name** | `proyecto-notas-api` |
   | **Region** | Oregon (US West) |
   | **Branch** | `main` |
   | **Runtime** | `Node` |
   | **Root Directory** | `backend/proyecto-notas-api` |
   | **Build Command** | `npm install && npx prisma generate && npm run build` |
   | **Start Command** | `npm run start:prod` |
   | **Instance Type** | Free |

   > **Importante si subiste un monorepo (backend + frontend en el mismo repo):**
   > El campo **Root Directory** es crítico. Render busca el `package.json` desde esa carpeta.
   > Si se deja en `backend` en lugar de `backend/proyecto-notas-api`, el build fallará porque no encontrará el `package.json` de NestJS.

6. **No hagas clic en "Deploy" todavía** — primero agrega las variables de entorno.

### 2.4 Agregar variables de entorno en Render

En la misma pantalla de creación del servicio, baja hasta la sección **"Environment Variables"** y agrega cada variable haciendo clic en **"Add Environment Variable"**.

> **Importante:** En Render NO se ponen comillas alrededor de los valores. Solo escribe el valor puro en el campo de texto.

| Variable | Valor de ejemplo | Notas |
|----------|-----------------|-------|
| `DATABASE_URL` | `postgresql://postgres.XXXX:PASSWORD@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true` | URL de **Transaction pooler** de Supabase. Reemplaza PASSWORD con tu contraseña real. |
| `DIRECT_URL` | `postgresql://postgres.XXXX:PASSWORD@aws-1-us-east-1.pooler.supabase.com:5432/postgres` | URL de **Session pooler** de Supabase. Misma contraseña. |
| `JWT_SECRET` | `una_cadena_larga_y_aleatoria_aqui` | Usa cualquier string largo y seguro. Ejemplo: `xK9#mP2$vL8nQ5rT1wY4uZ7jA3bC6dE0` |
| `JWT_EXPIRES_IN` | `8h` | Sin comillas. |
| `FRONTEND_URL` | `https://proyecto-notas.vercel.app` | Se actualiza después de desplegar el frontend en Vercel. Por ahora pon `*` temporalmente. |
| `EMAIL_USER` | `tucorreo@gmail.com` | Tu Gmail configurado con App Password. |
| `EMAIL_PASS` | `xxxx xxxx xxxx xxxx` | Contraseña de aplicación de Gmail (16 caracteres con espacios). |
| `PORT` | `3000` | Render lo sobreescribe automáticamente, pero conviene definirlo. |

**Cómo se ve en Render (ejemplo):**
```
Key:   DATABASE_URL
Value: postgresql://postgres.duarpbmfuaxsvpdlsurj:MiPassword2026@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true

Key:   JWT_SECRET
Value: xK9mP2vL8nQ5rT1wY4uZ7jA3bC6dE0fG
```
Los valores van **sin comillas** — Render los trata como strings automáticamente.

### 2.5 Lanzar el despliegue

1. Una vez agregadas todas las variables, haz clic en **"Create Web Service"** (botón azul al fondo).

2. Render comenzará el build. Verás el log en tiempo real. El proceso toma entre 2 y 5 minutos.

3. Busca estas líneas al final del log para confirmar que todo está bien:
   ```
   Build successful 🎉
   🚀 Servidor corriendo en http://localhost:10000/api
   ```

4. Una vez desplegado, Render te asigna una URL pública con este formato:
   ```
   https://proyecto-notas-api.onrender.com
   ```
   **Guarda esta URL** — la necesitarás como `NEXT_PUBLIC_API_URL` en el frontend.

### 2.6 Verificar que el backend responde

Abre el navegador y entra a:
```
https://proyecto-notas-api.onrender.com/api/docs
```
Deberías ver la documentación Swagger del API. Si la ves, el backend está correctamente desplegado.

> **Nota:** En el plan gratuito de Render, el servicio entra en "sleep" después de 15 minutos sin tráfico. La primera petición después del sleep puede tardar 30-60 segundos en responder.

---

## FASE 3 — Frontend en Vercel (pendiente)

> Se documentará en la siguiente etapa del despliegue.

---

## FASE 4 — Variables de entorno (pendiente)

| Variable | Descripción | Servicio |
|----------|-------------|----------|
| `DATABASE_URL` | Transaction pooler de Supabase (puerto 6543, con `?pgbouncer=true`) | Backend (Render) |
| `DIRECT_URL` | Session pooler de Supabase (puerto 5432, sin pgbouncer) | Backend (Render) |
| `JWT_SECRET` | String secreto largo y aleatorio para firmar tokens JWT | Backend (Render) |
| `JWT_EXPIRES_IN` | Duración del token, ejemplo: `8h` | Backend (Render) |
| `FRONTEND_URL` | URL de Vercel donde vive el frontend | Backend (Render) |
| `EMAIL_USER` | Correo Gmail para envío de recuperación de contraseña | Backend (Render) |
| `EMAIL_PASS` | App Password de Gmail (no la contraseña normal) | Backend (Render) |
| `NEXT_PUBLIC_API_URL` | URL del backend en Render | Frontend (Vercel) |

---

## Credenciales de prueba

| Rol | Cédula | Contraseña |
|-----|--------|------------|
| Administrador | `1700000001` | `Notas2026!` |
| Profesor | `1700000100` | `Notas2026!` |
| Estudiante | `1700000200` | `Notas2026!` |

> **Importante:** Estas credenciales son solo para pruebas. Cambiarlas antes de un ambiente de producción real.
