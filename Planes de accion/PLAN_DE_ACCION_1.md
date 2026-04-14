# PLAN DE ACCIÓN — BACKEND "PROYECTO NOTAS"

> **Stack:** Nest.js · Prisma · PostgreSQL
> **Dominio:** Sistema de gestión académica (Ecuador)
> **Objetivo:** Construir Backend + Base de Datos por fases secuenciales, sin lógica TypeScript (solo planeación).

---

## 0. Correcciones y Observaciones al Esquema SQL Original

Antes de mapear a Prisma, se corrigen las siguientes inconsistencias detectadas en el SQL proporcionado. Estas correcciones se aplican en el `schema.prisma` definitivo.

| # | Tabla | Problema detectado | Corrección aplicada |
|---|-------|--------------------|---------------------|
| 1 | `USUARIO.EMAIL` | Permite duplicados; imposibilita la recuperación de contraseña confiable. | Se añade `UNIQUE`. |
| 2 | `USUARIO.ESTADO_USUARIO` / `ANIO_LECTIVO.ESTADO_LECTIVO` / `EVIDENCIAS.ESTADO` | Son `VARCHAR` libres; riesgo de valores inconsistentes (`"Activo"`, `"ACTIVO"`, `"activo"`). | Se convierten a `enum` Prisma (`EstadoUsuario`, `EstadoLectivo`, `EstadoEvidencia`). |
| 3 | `ROL` | Roles fijos pero tabla abierta. | Se mantiene la tabla (por extensibilidad) pero se sembrarán IDs fijos: `1=ADMIN`, `2=PROFESOR`, `3=ESTUDIANTE` vía seed. |
| 4 | `CALIFICACION` | No existe restricción que evite dos notas para el mismo estudiante en la misma actividad. | Se añade `UNIQUE (ID_USUARIO, ID_ACTIVIDAD)`. |
| 5 | `PROMEDIO_MATERIA_ESTUDIANTE` | Puede duplicarse un registro por estudiante/materia/año. | Se añade `UNIQUE (ID_USUARIO, ID_ANIOLECTIVO, ID_CURSO, ID_MATERIA)`. |
| 6 | `PROMEDIOGENERALESTUDIANTE` | Falta `UNIQUE (ID_USUARIO, ID_CURSO)`. También falta `ID_ANIOLECTIVO` (se llega indirectamente vía `CURSO`, está OK). | Se añade `UNIQUE`. |
| 7 | `ACTIVIDAD.VALOR_MAXIMO` | Default 100.0 razonable, pero debería validarse `> 0`. | Se deja el default; validación en DTO. |
| 8 | `PARCIAL.NUMERO_PARCIAL` | No se restringe al rango 1–3 (lógica de negocio). | `CHECK (NUMERO_PARCIAL BETWEEN 1 AND 3)` vía migración SQL complementaria. |
| 9 | `EVIDENCIAS` | Contiene campos redundantes con `ACTIVIDAD` (`NOMBRE_ACTIVIDAD`, `TIPO_ACTIVIDAD`, `CODIGO_ACTIVIDAD UNIQUE`). | Se **mantienen** intencionalmente (son un *snapshot histórico* útil tras la purga anual), pero `CODIGO_ACTIVIDAD UNIQUE` se reemplaza por `UNIQUE (ID_USUARIO, ID_ACTIVIDAD)` para permitir que múltiples estudiantes suban a la misma actividad. El `CODIGO_ACTIVIDAD` sigue siendo `UNIQUE` como identificador externo del archivo. |
| 10 | **Falta tabla** `PROFESOR_MATERIA_CURSO` | Con el esquema original no existe forma de saber **qué profesor dicta qué materia en qué curso**. `USUARIO_CURSO` solo sirve para estudiantes matriculados. | Se añade tabla nueva `PROFESOR_MATERIA_CURSO (ID_USUARIO, ID_CURSO, ID_MATERIA)` con PK compuesta. |
| 11 | `EVIDENCIAS.FECHA_SUBIDA` | Nullable sin default. | Se añade `DEFAULT now()`. |
| 12 | Cédula ecuatoriana | Tipo correcto (`VARCHAR(10)`), pero requiere validación del dígito verificador en DTO. | Validación mediante `class-validator` custom en capa de aplicación. |

---

## 1. Plan de Acción — Fases Secuenciales

### **FASE 0 — Bootstrapping del Proyecto**
1. `nest new proyecto-notas-api` (paquete con `npm`).
2. Instalar dependencias base:
   - `@nestjs/config`, `@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`
   - `prisma`, `@prisma/client`
   - `class-validator`, `class-transformer`
   - `bcrypt`
   - `@nestjs/schedule` (Cron Jobs)
   - `multer`, `@types/multer` (subida de archivos)
   - `nodemailer` (recuperación de contraseña)
3. Estructura de carpetas: `src/modules`, `src/common`, `src/prisma`, `src/jobs`, `storage/pdfs`.
4. Configurar `.env` local:
   ```env
   DATABASE_URL="postgresql://postgresql:admin@localhost:5432/notas_escuela?schema=public"
   JWT_SECRET="cambiar_en_produccion"
   JWT_EXPIRES_IN="8h"
   STORAGE_PATH="./storage/pdfs"
   ```

### **FASE 1 — Capa de Datos (Prisma + PostgreSQL)**
1. `npx prisma init`.
2. Definir `schema.prisma` completo (ver sección 2).
3. Ejecutar migración inicial: `npx prisma migrate dev --name init`.
4. Crear `PrismaModule` global + `PrismaService`.
5. Ejecutar script **Seed** (`prisma/seed.ts`) para:
   - Insertar roles fijos (1 ADMIN, 2 PROFESOR, 3 ESTUDIANTE).
   - Crear usuario ADMIN inicial.
   - Crear un `ANIO_LECTIVO` base en estado `ACTIVO`.

### **FASE 2 — Autenticación y Usuarios**
- **Módulos:** `AuthModule`, `UsuariosModule`, `RolesModule`.
- Funcionalidades:
  - Login con cédula + contraseña (JWT).
  - Hash de contraseña con bcrypt.
  - Validador personalizado `@IsCedulaEcuatoriana()`.
  - Recuperación de contraseña (token + email).
  - CRUD usuarios (solo ADMIN).
  - Asignación de roles (`USUARIO_ROL`).
  - Guards: `JwtAuthGuard`, `RolesGuard` + decorador `@Roles()`.

### **FASE 3 — Estructura Académica Base**
- **Módulos:** `AnioLectivoModule`, `CursoModule`, `MateriaModule`.
- Reglas:
  - Solo ADMIN crea/edita/elimina.
  - Al crear un `CURSO` debe asociarse a un `ANIO_LECTIVO`.
  - Filtrado global por año lectivo (listados históricos vs actual).
  - `CURSO_MATERIA` (muchos a muchos) para asignar materias al curso.

### **FASE 4 — Matriculación y Docencia**
- **Módulos:** `MatriculaModule` (gestiona `USUARIO_CURSO`), `DocenciaModule` (gestiona `PROFESOR_MATERIA_CURSO`).
- Reglas:
  - Matricular estudiantes en un curso (rol 3).
  - Asignar profesor a materia dentro de un curso (rol 2).
  - Validar rol antes de insertar en cada tabla.

### **FASE 5 — Parciales y Actividades**
- **Módulos:** `ParcialModule`, `ActividadModule`.
- Reglas:
  - Al crear un `CURSO_MATERIA`, opcionalmente auto-generar los 3 parciales.
  - Actividades solo creables por el profesor asignado a esa materia+curso.
  - `FECHA_FIN_ENTREGA >= FECHA_INICIO_ENTREGA`.

### **FASE 6 — Calificaciones**
- **Módulo:** `CalificacionModule`.
- Reglas:
  - Solo el profesor dueño de la materia puede calificar.
  - `NOTA <= VALOR_MAXIMO` de la actividad.
  - `UNIQUE` por (usuario, actividad) → editar en vez de duplicar.

### **FASE 7 — Evidencias (PDFs)**
- **Módulo:** `EvidenciasModule` (integración con `multer`).
- Reglas:
  - Solo PDFs (`application/pdf`), máx 10 MB (configurable).
  - Path físico: `storage/pdfs/{ANIO}/{CURSO}/{CEDULA}/{CODIGO_ACTIVIDAD}.pdf`.
  - En BD solo se guarda `URL_ARCHIVO` (ruta relativa).
  - El estudiante sube, el profesor descarga.

### **FASE 8 — Notificaciones**
- **Módulo:** `NotificacionesModule`.
- Reglas:
  - Evento al crear actividad → notifica a estudiantes del curso.
  - Evento al calificar → notifica al estudiante.
  - Marcar como leída (`LEIDA = true`).

### **FASE 9 — Promedios Automáticos**
- **Módulo:** `PromediosModule`.
- Reglas:
  - Listener que recalcula `PROMEDIO_MATERIA_ESTUDIANTE` cada vez que cambia una `CALIFICACION`.
  - Job bajo demanda para recalcular `PROMEDIOGENERALESTUDIANTE` al cierre del año.
  - `COMPORTAMIENTO` se deriva del promedio (A, B, C, D, E).

### **FASE 10 — Política de Retención (Cron Job)**
- **Módulo:** `JobsModule` usando `@nestjs/schedule`.
- Tarea diaria (00:00):
  1. Detectar `ANIO_LECTIVO` con `ESTADO_LECTIVO = 'FINALIZADO'` cuya fecha de cierre tenga ≥ N días.
  2. Para cada `EVIDENCIA` asociada a actividades de ese año: borrar archivo físico.
  3. Marcar `EVIDENCIAS.ESTADO = 'ELIMINADO'` y `URL_ARCHIVO = NULL`.

### **FASE 11 — Hardening**
- Swagger (`@nestjs/swagger`) en `/api/docs`.
- Rate limiting (`@nestjs/throttler`).
- Logging (`pino` o `winston`).
- Tests e2e mínimos para endpoints críticos.

---

## 2. Estructura Completa de `schema.prisma`

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ========== ENUMS ==========
enum EstadoUsuario {
  ACTIVO
  INACTIVO
  BLOQUEADO
}

enum EstadoLectivo {
  ACTIVO
  FINALIZADO
  PLANIFICADO
}

enum EstadoEvidencia {
  ACTIVO
  ELIMINADO
}

enum TipoActividad {
  TAREA
  EXAMEN
  PROYECTO
  LECCION
}

enum TipoNotificacion {
  NUEVA_ACTIVIDAD
  CALIFICACION
  RECORDATORIO
  SISTEMA
}

// ========== MODELOS ==========
model AnioLectivo {
  idAnioLectivo  Int           @id @default(autoincrement()) @map("id_aniolectivo")
  fechaInicio    DateTime      @map("fecha_inicio") @db.Date
  fechaFinal     DateTime      @map("fecha_final") @db.Date
  estadoLectivo  EstadoLectivo @map("estado_lectivo")

  cursos         Curso[]
  promediosMat   PromedioMateriaEstudiante[]

  @@map("anio_lectivo")
}

model Usuario {
  idUsuario          String         @id @map("id_usuario") @db.VarChar(10)
  nombreCompleto     String         @map("nombre_completo") @db.VarChar(100)
  contrasenaUsuario  String         @map("contrasena_usuario") @db.VarChar(255)
  estadoUsuario      EstadoUsuario  @map("estado_usuario")
  email              String?        @unique @db.VarChar(255)
  tokenRecuperacion  String?        @map("token_recuperacion") @db.VarChar(255)
  expiracionToken    DateTime?      @map("expiracion_token")

  roles              UsuarioRol[]
  cursos             UsuarioCurso[]
  docencias          ProfesorMateriaCurso[]
  calificaciones     Calificacion[]
  evidencias         Evidencia[]
  notificaciones     Notificacion[]
  promediosMateria   PromedioMateriaEstudiante[]
  promediosGenerales PromedioGeneralEstudiante[]

  @@map("usuario")
}

model Rol {
  idRol      Int           @id @default(autoincrement()) @map("id_rol")
  nombreRol  String        @map("nombre_rol") @db.VarChar(20)

  usuarios   UsuarioRol[]

  @@map("rol")
}

model UsuarioRol {
  idUsuario String  @map("id_usuario") @db.VarChar(10)
  idRol     Int     @map("id_rol")

  usuario   Usuario @relation(fields: [idUsuario], references: [idUsuario])
  rol       Rol     @relation(fields: [idRol], references: [idRol])

  @@id([idUsuario, idRol])
  @@map("usuario_rol")
}

model Curso {
  idCurso         Int         @id @default(autoincrement()) @map("id_curso")
  idAnioLectivo   Int         @map("id_aniolectivo")
  nombreCurso     String      @map("nombre_curso") @db.VarChar(15)

  anioLectivo     AnioLectivo @relation(fields: [idAnioLectivo], references: [idAnioLectivo])
  estudiantes     UsuarioCurso[]
  materias        CursoMateria[]
  docentes        ProfesorMateriaCurso[]
  parciales       Parcial[]
  promediosMat    PromedioMateriaEstudiante[]
  promediosGen    PromedioGeneralEstudiante[]

  @@map("curso")
}

model UsuarioCurso {
  idUsuario String  @map("id_usuario") @db.VarChar(10)
  idCurso   Int     @map("id_curso")

  usuario   Usuario @relation(fields: [idUsuario], references: [idUsuario])
  curso     Curso   @relation(fields: [idCurso], references: [idCurso])

  @@id([idUsuario, idCurso])
  @@map("usuario_curso")
}

model Materia {
  idMateria       Int            @id @default(autoincrement()) @map("id_materia")
  nombreMateria   String         @map("nombre_materia") @db.VarChar(30)

  cursos          CursoMateria[]
  parciales       Parcial[]
  docentes        ProfesorMateriaCurso[]
  promediosMat    PromedioMateriaEstudiante[]

  @@map("materia")
}

model CursoMateria {
  idCurso   Int     @map("id_curso")
  idMateria Int     @map("id_materia")

  curso     Curso   @relation(fields: [idCurso], references: [idCurso])
  materia   Materia @relation(fields: [idMateria], references: [idMateria])

  @@id([idCurso, idMateria])
  @@map("curso_materia")
}

// NUEVA TABLA — vincula profesor ↔ materia ↔ curso
model ProfesorMateriaCurso {
  idUsuario String  @map("id_usuario") @db.VarChar(10)
  idCurso   Int     @map("id_curso")
  idMateria Int     @map("id_materia")

  usuario   Usuario @relation(fields: [idUsuario], references: [idUsuario])
  curso     Curso   @relation(fields: [idCurso], references: [idCurso])
  materia   Materia @relation(fields: [idMateria], references: [idMateria])

  @@id([idUsuario, idCurso, idMateria])
  @@map("profesor_materia_curso")
}

model Parcial {
  idParcial      Int        @id @default(autoincrement()) @map("id_parcial")
  idMateria      Int        @map("id_materia")
  idCurso        Int        @map("id_curso")
  numeroParcial  Int        @map("numero_parcial")

  materia        Materia    @relation(fields: [idMateria], references: [idMateria])
  curso          Curso      @relation(fields: [idCurso], references: [idCurso])
  actividades    Actividad[]

  @@unique([idMateria, idCurso, numeroParcial], map: "uq_parcial_materia_curso_numero")
  @@map("parcial")
}

model Actividad {
  idActividad        Int             @id @default(autoincrement()) @map("id_actividad")
  idParcial          Int             @map("id_parcial")
  tipoActividad      TipoActividad   @map("tipo_actividad")
  fechaInicioEntrega DateTime        @map("fecha_inicio_entrega") @db.Date
  fechaFinEntrega    DateTime        @map("fecha_fin_entrega") @db.Date
  descripcion        String?         @db.VarChar(200)
  tituloActividad    String?         @map("titulo_actividad") @db.VarChar(20)
  valorMaximo        Float           @default(100.0) @map("valor_maximo")

  parcial            Parcial         @relation(fields: [idParcial], references: [idParcial])
  calificaciones     Calificacion[]
  evidencias         Evidencia[]
  notificaciones     Notificacion[]

  @@map("actividad")
}

model Calificacion {
  idCalificacion Int       @id @default(autoincrement()) @map("id_calificacion")
  idUsuario      String    @map("id_usuario") @db.VarChar(10)
  idActividad    Int       @map("id_actividad")
  nota           Float
  comentario     String?   @db.VarChar(200)

  usuario        Usuario   @relation(fields: [idUsuario], references: [idUsuario])
  actividad      Actividad @relation(fields: [idActividad], references: [idActividad])

  @@unique([idUsuario, idActividad])
  @@map("calificacion")
}

model Evidencia {
  idEvidencia      Int             @id @default(autoincrement()) @map("id_evidencia")
  idUsuario        String          @map("id_usuario") @db.VarChar(10)
  idActividad      Int             @map("id_actividad")
  urlArchivo       String?         @map("url_archivo") @db.VarChar(255)
  nombreArchivo    String          @map("nombre_archivo") @db.VarChar(255)
  fechaSubida      DateTime?       @default(now()) @map("fecha_subida")
  tamanio          BigInt
  tipoContenido    String          @map("tipo_contenido") @db.VarChar(255)
  estado           EstadoEvidencia @default(ACTIVO)
  nombreActividad  String          @map("nombre_actividad") @db.VarChar(255)
  codigoActividad  String          @unique @map("codigo_actividad") @db.VarChar(255)
  tipoActividad    String          @map("tipo_actividad") @db.VarChar(255)

  usuario          Usuario         @relation(fields: [idUsuario], references: [idUsuario])
  actividad        Actividad       @relation(fields: [idActividad], references: [idActividad])

  @@unique([idUsuario, idActividad])
  @@map("evidencias")
}

model Notificacion {
  idNotificacion       Int              @id @default(autoincrement()) @map("id_notificacion")
  idUsuario            String           @map("id_usuario") @db.VarChar(10)
  idActividad          Int?             @map("id_actividad")
  tipoNotificacion     TipoNotificacion @map("tipo_notificacion")
  mensajeNotificacion  String           @map("mensaje_notificacion") @db.VarChar(255)
  fechaNotificacion    DateTime         @map("fecha_notificacion")
  leida                Boolean          @default(false)

  usuario              Usuario          @relation(fields: [idUsuario], references: [idUsuario])
  actividad            Actividad?       @relation(fields: [idActividad], references: [idActividad])

  @@map("notificaciones")
}

model PromedioMateriaEstudiante {
  idPromedioMateria     Int         @id @default(autoincrement()) @map("id_promedio_materia")
  idUsuario             String      @map("id_usuario") @db.VarChar(10)
  idAnioLectivo         Int         @map("id_aniolectivo")
  idCurso               Int         @map("id_curso")
  idMateria             Int         @map("id_materia")
  promedioParcial1      Float?      @map("promedio_parcial1")
  promedioParcial2      Float?      @map("promedio_parcial2")
  promedioParcial3      Float?      @map("promedio_parcial3")
  promedioFinalMateria  Float?      @map("promedio_final_materia")
  fechaActualizacion    DateTime?   @map("fecha_actualizacion")

  usuario      Usuario      @relation(fields: [idUsuario], references: [idUsuario])
  anioLectivo  AnioLectivo  @relation(fields: [idAnioLectivo], references: [idAnioLectivo])
  curso        Curso        @relation(fields: [idCurso], references: [idCurso])
  materia      Materia      @relation(fields: [idMateria], references: [idMateria])

  @@unique([idUsuario, idAnioLectivo, idCurso, idMateria])
  @@map("promedio_materia_estudiante")
}

model PromedioGeneralEstudiante {
  idPromedioGeneral  Int     @id @default(autoincrement()) @map("id_promedio_general")
  idUsuario          String  @map("id_usuario") @db.VarChar(10)
  idCurso            Int     @map("id_curso")
  promedioGeneral    Float   @map("promedio_general")
  comportamiento     String  @db.VarChar(1)

  usuario            Usuario @relation(fields: [idUsuario], references: [idUsuario])
  curso              Curso   @relation(fields: [idCurso], references: [idCurso])

  @@unique([idUsuario, idCurso])
  @@map("promediogeneralestudiante")
}
```

> **Migración SQL complementaria** (después de `prisma migrate dev`), añadir `CHECK` para `numero_parcial`:
> ```sql
> ALTER TABLE parcial ADD CONSTRAINT ck_parcial_numero CHECK (numero_parcial BETWEEN 1 AND 3);
> ```

---

## 3. Listado de Peticiones API (Thunder Client)

> **Base URL:** `http://localhost:3000/api/v1`
> **Header común (rutas protegidas):** `Authorization: Bearer {JWT_TOKEN}`

---

### 3.1 Módulo `AuthModule`

#### POST `/auth/login`
```json
{
  "idUsuario": "0102030405",
  "password": "Admin#2026"
}
```

#### POST `/auth/forgot-password`
```json
{
  "email": "docente@notas.edu.ec"
}
```

#### POST `/auth/reset-password`
```json
{
  "token": "f3a9b1c2-...-xyz",
  "newPassword": "NuevaClave#2026"
}
```

#### POST `/auth/change-password` *(autenticado)*
```json
{
  "oldPassword": "Admin#2026",
  "newPassword": "NuevaClave#2026"
}
```

---

### 3.2 Módulo `UsuariosModule` (ADMIN)

#### POST `/usuarios`
```json
{
  "idUsuario": "0102030405",
  "nombreCompleto": "María López Pérez",
  "contrasenaUsuario": "Clave#2026",
  "email": "maria.lopez@notas.edu.ec",
  "estadoUsuario": "ACTIVO",
  "roles": [2]
}
```

#### GET `/usuarios?rol=2&estado=ACTIVO&page=1&limit=20`

#### GET `/usuarios/:idUsuario`

#### PATCH `/usuarios/:idUsuario`
```json
{
  "nombreCompleto": "María L. Pérez",
  "email": "maria.nueva@notas.edu.ec",
  "estadoUsuario": "INACTIVO"
}
```

#### DELETE `/usuarios/:idUsuario`

#### POST `/usuarios/:idUsuario/roles`
```json
{ "idRol": 3 }
```

#### DELETE `/usuarios/:idUsuario/roles/:idRol`

---

### 3.3 Módulo `AnioLectivoModule` (ADMIN)

#### POST `/anios-lectivos`
```json
{
  "fechaInicio": "2026-09-01",
  "fechaFinal":  "2027-06-30",
  "estadoLectivo": "PLANIFICADO"
}
```

#### GET `/anios-lectivos?estado=ACTIVO`

#### PATCH `/anios-lectivos/:id`
```json
{ "estadoLectivo": "FINALIZADO" }
```

#### DELETE `/anios-lectivos/:id`

---

### 3.4 Módulo `CursoModule` (ADMIN)

#### POST `/cursos`
```json
{
  "idAnioLectivo": 1,
  "nombreCurso": "8vo EGB A"
}
```

#### GET `/cursos?idAnioLectivo=1`

#### PATCH `/cursos/:id`
```json
{ "nombreCurso": "8vo EGB B" }
```

#### DELETE `/cursos/:id`

#### POST `/cursos/:id/materias` *(asignar materia a curso)*
```json
{ "idMateria": 5 }
```

#### DELETE `/cursos/:id/materias/:idMateria`

---

### 3.5 Módulo `MateriaModule` (ADMIN)

#### POST `/materias`
```json
{ "nombreMateria": "Matemáticas" }
```

#### GET `/materias`

#### PATCH `/materias/:id`
```json
{ "nombreMateria": "Matemática Básica" }
```

#### DELETE `/materias/:id`

---

### 3.6 Módulo `MatriculaModule` (ADMIN)

#### POST `/matriculas` *(matricular estudiante en curso)*
```json
{
  "idUsuario": "0910203040",
  "idCurso": 3
}
```

#### GET `/matriculas?idCurso=3`

#### DELETE `/matriculas`
```json
{
  "idUsuario": "0910203040",
  "idCurso": 3
}
```

---

### 3.7 Módulo `DocenciaModule` (ADMIN)

#### POST `/docencias` *(asignar profesor a materia+curso)*
```json
{
  "idUsuario": "1102030405",
  "idCurso": 3,
  "idMateria": 5
}
```

#### GET `/docencias?idUsuario=1102030405`

#### DELETE `/docencias`
```json
{
  "idUsuario": "1102030405",
  "idCurso": 3,
  "idMateria": 5
}
```

---

### 3.8 Módulo `ParcialModule` (PROFESOR)

#### POST `/parciales`
```json
{
  "idMateria": 5,
  "idCurso": 3,
  "numeroParcial": 1
}
```

#### POST `/parciales/bulk` *(crear los 3 parciales a la vez)*
```json
{
  "idMateria": 5,
  "idCurso": 3
}
```

#### GET `/parciales?idCurso=3&idMateria=5`

#### DELETE `/parciales/:id`

---

### 3.9 Módulo `ActividadModule` (PROFESOR)

#### POST `/actividades`
```json
{
  "idParcial": 12,
  "tipoActividad": "TAREA",
  "tituloActividad": "Tarea 1",
  "descripcion": "Resolver ejercicios 1–10 del capítulo 3.",
  "fechaInicioEntrega": "2026-10-01",
  "fechaFinEntrega":    "2026-10-08",
  "valorMaximo": 100.0
}
```

#### GET `/actividades?idParcial=12`

#### GET `/actividades/:id`

#### PATCH `/actividades/:id`
```json
{
  "descripcion": "Resolver ejercicios 1–12 (se añaden 2).",
  "fechaFinEntrega": "2026-10-10"
}
```

#### DELETE `/actividades/:id`

---

### 3.10 Módulo `CalificacionModule` (PROFESOR)

#### POST `/calificaciones`
```json
{
  "idUsuario": "0910203040",
  "idActividad": 27,
  "nota": 85.5,
  "comentario": "Buen trabajo, mejorar redacción."
}
```

#### POST `/calificaciones/bulk` *(calificar curso completo)*
```json
{
  "idActividad": 27,
  "calificaciones": [
    { "idUsuario": "0910203040", "nota": 85.5, "comentario": "Excelente" },
    { "idUsuario": "0910203041", "nota": 70.0, "comentario": "Regular"   },
    { "idUsuario": "0910203042", "nota": 92.0 }
  ]
}
```

#### GET `/calificaciones?idActividad=27`

#### GET `/calificaciones/estudiante/:idUsuario?idAnioLectivo=1`

#### PATCH `/calificaciones/:id`
```json
{ "nota": 88.0, "comentario": "Recalificado tras revisión" }
```

---

### 3.11 Módulo `EvidenciasModule` (ESTUDIANTE sube / PROFESOR descarga)

#### POST `/evidencias` *(multipart/form-data)*
Campos del form-data:
- `file`: archivo PDF
- `payload`:
```json
{
  "idActividad": 27,
  "nombreActividad": "Tarea 1",
  "tipoActividad": "TAREA"
}
```

#### GET `/evidencias?idActividad=27`

#### GET `/evidencias/:id/descargar`

#### DELETE `/evidencias/:id` *(soft-delete → estado ELIMINADO)*

---

### 3.12 Módulo `NotificacionesModule`

#### GET `/notificaciones?leida=false`

#### PATCH `/notificaciones/:id/leer`
*(sin body)*

#### PATCH `/notificaciones/leer-todas`
*(sin body)*

#### DELETE `/notificaciones/:id`

---

### 3.13 Módulo `PromediosModule`

#### POST `/promedios/materia/recalcular`
```json
{
  "idUsuario": "0910203040",
  "idCurso": 3,
  "idMateria": 5,
  "idAnioLectivo": 1
}
```

#### POST `/promedios/general/recalcular`
```json
{
  "idUsuario": "0910203040",
  "idCurso": 3
}
```

#### GET `/promedios/materia?idUsuario=0910203040&idAnioLectivo=1`

#### GET `/promedios/general?idUsuario=0910203040&idCurso=3`

#### GET `/promedios/curso/:idCurso/ranking`

---

### 3.14 Módulo `JobsModule` (ADMIN — disparo manual de Cron)

#### POST `/jobs/retencion-evidencias/ejecutar`
```json
{
  "idAnioLectivo": 1,
  "confirmacion": "ELIMINAR_PDFS_ANIO_1"
}
```

#### GET `/jobs/retencion-evidencias/ultimo-estado`

---

## 4. Resumen de Entregables por Fase

| Fase | Módulos Nest.js | Endpoints clave |
|------|-----------------|-----------------|
| 0 | — | — |
| 1 | `PrismaModule` | — |
| 2 | `AuthModule`, `UsuariosModule`, `RolesModule` | `/auth/login`, `/usuarios` |
| 3 | `AnioLectivoModule`, `CursoModule`, `MateriaModule` | `/anios-lectivos`, `/cursos`, `/materias` |
| 4 | `MatriculaModule`, `DocenciaModule` | `/matriculas`, `/docencias` |
| 5 | `ParcialModule`, `ActividadModule` | `/parciales`, `/actividades` |
| 6 | `CalificacionModule` | `/calificaciones` |
| 7 | `EvidenciasModule` | `/evidencias` |
| 8 | `NotificacionesModule` | `/notificaciones` |
| 9 | `PromediosModule` | `/promedios/*` |
| 10 | `JobsModule` | `/jobs/retencion-evidencias` |
| 11 | Swagger, Throttler, Logger | — |

---

**FIN DEL PLAN DE ACCIÓN**
