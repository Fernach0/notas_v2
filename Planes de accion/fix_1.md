# fix_1.md — Plan de Acción: Corrección y Refactorización

**Proyecto:** PROYECTO NOTAS — Backend NestJS + Prisma + PostgreSQL  
**Fecha de elaboración:** 2026-04-16  
**Alcance:** Este documento NO contiene código fuente de lógica de negocio. Es un plan arquitectónico puro. La única excepción es el bloque `schema.prisma` actualizado al final del documento.

---

## Propósito

Resolver tres puntos críticos detectados tras la primera construcción del sistema:

1. Error al listar usuarios como Administrador.
2. Cambio de regla de negocio en Evidencias: almacenar el PDF directamente en la base de datos (`BYTEA`) en lugar de guardar una ruta al sistema de archivos.
3. Restricción de matrícula única para estudiantes (1 estudiante → 1 curso) y diseño de la función de traslado de curso.

---

## SECCIÓN 1 — Análisis y Diagnóstico del Error en Vista de Usuarios

### Contexto del error

El Administrador (rol ID = 1) inicia sesión correctamente (el flujo de Auth funciona), pero al intentar acceder al endpoint `GET /api/usuarios`, recibe un error.

### Causas Probables (ordenadas por probabilidad)

---

#### BUG #1 — CRÍTICO: Datasource sin `url` en `schema.prisma`

**Archivo:** `prisma/schema.prisma` — bloque `datasource db`

**Situación actual:**
```
datasource db {
  provider = "postgresql"
  ← FALTA: url = env("DATABASE_URL")
}
```

**Impacto:**
- `prisma generate` no puede determinar la cadena de conexión. Si el cliente Prisma fue generado sin esta línea, los tipos TypeScript generados pueden estar incompletos o corruptos.
- `prisma migrate dev` / `prisma migrate deploy` fallarán completamente.
- En tiempo de ejecución, el `PrismaService` usa `@prisma/adapter-pg` (el pool de `pg` se crea con `process.env.DATABASE_URL` en el constructor del servicio), por lo que la conexión de runtime sí puede funcionar aunque falte la URL en el schema. Esto explica por qué el Login funciona pero otras consultas más complejas fallan.

**Diagnóstico:**
1. Ejecutar `npx prisma generate` y observar el output. Si lanza un error sobre `url`, confirmar este bug.
2. Ejecutar `npx prisma migrate status`. Si falla, confirmar.

**Corrección:**
Agregar `url = env("DATABASE_URL")` al bloque `datasource`. Ver schema actualizado en la Sección 4.

---

#### BUG #2 — ALTA PROBABILIDAD: `omit` + `include` en la misma consulta Prisma

**Archivo:** `src/modules/usuarios/usuarios.service.ts` — método `findAll` y `findOne`

**Situación actual:**
```typescript
this.prisma.usuario.findMany({
  include: { roles: { select: { idRol: true } } },
  omit: { contrasenaUsuario: true, tokenRecuperacion: true }, // ← conflicto potencial
})
```

**Análisis:**
Aunque Prisma 7.x soporta `omit` de manera general, su uso **simultáneo con `include`** en el nivel raíz de la consulta tiene comportamiento variable según la versión de tipos generados. En algunos escenarios de compilación TypeScript, el compilador rechaza esta combinación porque los tipos de retorno resultan ambiguos: el tipo inferido por `include` asume todos los campos del modelo base, mientras que `omit` intenta excluirlos a posteriori. Si `prisma generate` produjo tipos desactualizados (ver BUG #1), esta incompatibilidad genera un error de runtime en Prisma Client.

**Diagnóstico:**
1. Revisar el log de errores del servidor NestJS al hacer `GET /api/usuarios`.
2. Buscar mensajes del tipo: `PrismaClientValidationError`, `Unknown argument 'omit'`, o errores de tipado en el output de `tsc`.
3. Probar temporalmente eliminando el `omit` y verificar si el endpoint responde (aunque devuelva el hash).

**Corrección:**
Reemplazar `omit` + `include` por la combinación `select` explícito que liste solo los campos deseados. La regla es: **nunca usar `omit` e `include` juntos en el mismo nivel de query**; en su lugar, usar `select` con sub-selects para relaciones. Ver la Sección 4 de correcciones del service.

---

#### BUG #3 — MEDIA PROBABILIDAD: Mismatch en el formato del payload de roles entre `JwtStrategy` y `RolesGuard`

**Archivos:** `src/modules/auth/strategies/jwt.strategy.ts`, `src/common/guards/roles.guard.ts`

**Análisis:**
El guard lee `user.roles` (proveniente del payload JWT) y verifica si alguno de los roles del usuario coincide con el rol requerido por el decorador `@Roles(1)`. Si la strategy almacena los roles en el JWT como objetos `[{ idRol: 1 }]` pero el guard espera un array simple de números `[1]`, la comparación falla silenciosamente con un 403 Forbidden.

**Diagnóstico:**
1. Inspeccionar el token JWT del Administrador usando jwt.io y ver la propiedad `roles` en el payload.
2. Agregar un `console.log('user en guard:', user)` temporalmente en el `RolesGuard` para ver la estructura real.
3. Si el resultado es `[{ idRol: 1 }]` pero el guard hace `user.roles.includes(requiredRole)`, el check fallará porque `{ idRol: 1 } !== 1`.

**Corrección:**
Unificar el formato: el payload JWT debe guardar los roles como `number[]` y el guard debe comparar `user.roles.some((r: number) => r === requiredRole)`. Alternativamente, si se guardan como objetos, el guard debe hacer `user.roles.some((r: { idRol: number }) => r.idRol === requiredRole)`. Verificar la consistencia entre ambos archivos.

---

#### BUG #4 — LATENTE (no bloquea usuarios pero bloqueará evidencias): Serialización de `BigInt`

**Archivo:** `src/modules/evidencias/evidencias.service.ts`

**Análisis:**
El campo `tamanio` del modelo `Evidencia` es de tipo `BigInt` en Prisma (mapeado a `BIGINT` en PostgreSQL). JavaScript nativo no puede serializar `BigInt` con `JSON.stringify()`, lo que provoca:

```
TypeError: Do not know how to serialize a BigInt
```

Este error ocurre en cualquier endpoint que retorne registros de `Evidencia` directamente, incluyendo `findAll`. Con el cambio a `Bytes` (BYTEA) en la Sección 2, este campo `tamanio` seguirá existiendo como metadato, por lo que el bug persiste y debe corregirse.

**Corrección global en `main.ts`:**
```
// En src/main.ts, antes de app.listen():
// Parche global para serialización de BigInt
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};
```
O bien, configurar un interceptor global de NestJS que transforme los valores `BigInt` a `string` antes de serializar la respuesta.

---

#### BUG #5 — SEGURIDAD: `create()` expone el hash de contraseña en la respuesta

**Archivo:** `src/modules/usuarios/usuarios.service.ts` — método `create`

**Situación actual:**
El método `create()` usa `include: { roles: true }` pero **no aplica `omit`**. Por lo tanto, la respuesta al crear un usuario incluye `contrasenaUsuario` (el hash bcrypt) y `tokenRecuperacion`. Esto expone datos sensibles innecesariamente.

**Corrección:**
Aplicar una selección explícita de campos en el resultado del `create`, o ejecutar un `findOne` post-creación que ya aplica el omit correcto.

---

### Paso a Paso: Diagnóstico General del Sistema

Seguir este orden al depurar cualquier error desconocido en el proyecto:

```
1. Verificar que el servidor arranca sin errores de compilación (tsc --noEmit)
2. Ejecutar: npx prisma generate (debe completarse sin errores)
3. Ejecutar: npx prisma migrate status (verificar migraciones pendientes)
4. Revisar logs del servidor en la consola al hacer la petición HTTP problemática
5. Verificar en Postman/Insomnia con token JWT válido y Bearer correcto
6. Inspeccionar el payload del JWT en jwt.io para confirmar la estructura de roles
7. Activar logging de Prisma temporalmente: new PrismaClient({ log: ['query', 'error'] })
8. Verificar que DATABASE_URL en .env tiene el formato correcto:
   postgresql://user:password@host:5432/dbname
```

---

## SECCIÓN 2 — Refactorización de Evidencias: PDF en Base de Datos (BYTEA)

### Justificación del Cambio

El sistema actual guarda el PDF en el sistema de archivos local (`./storage/pdfs/`) y almacena la ruta relativa en `urlArchivo`. Esto genera dependencia del filesystem del servidor. El nuevo requerimiento es guardar el archivo directamente en PostgreSQL usando el tipo `BYTEA` (mapeado a `Bytes` en Prisma).

### Cambios en el Schema (ver Sección 4)

| Campo anterior | Acción | Campo nuevo |
|---|---|---|
| `urlArchivo String?` | **ELIMINAR** | — |
| *(no existía)* | **AGREGAR** | `archivoBytes Bytes? @map("archivo_bytes")` |
| `tamanio BigInt` | **MANTENER** | `tamanio BigInt` (metadato de tamaño en bytes) |
| `nombreArchivo String` | **MANTENER** | `nombreArchivo String` (nombre original del PDF) |
| `tipoContenido String` | **MANTENER** | `tipoContenido String` (siempre `application/pdf`) |

### Pasos Arquitectónicos para la Refactorización del Service de Evidencias

**Paso 1 — Modificar el schema.prisma**
Eliminar el campo `urlArchivo` y agregar `archivoBytes Bytes?` al modelo `Evidencia`. Ver Sección 4.

**Paso 2 — Generar y ejecutar la migración**
```
npx prisma migrate dev --name evidencias_pdf_en_bd
```
La migración debe: 
- Eliminar la columna `url_archivo` de la tabla `evidencias`.
- Agregar la columna `archivo_bytes BYTEA NULL` a la tabla `evidencias`.

**Paso 3 — Eliminar la dependencia del filesystem en `EvidenciasService`**

El service actual (`src/modules/evidencias/evidencias.service.ts`) realiza estas operaciones que deben eliminarse completamente:
- `fs.mkdirSync(...)` — crear directorio de almacenamiento
- `fs.writeFileSync(...)` — escribir el archivo al disco
- `path.join(...)` — construir rutas de archivo
- `ConfigService` para `STORAGE_PATH` — ya no se necesita
- `import * as fs from 'fs'` y `import * as path from 'path'` — eliminar imports

Lo que debe hacer el nuevo service:
- Recibir `file.buffer` (el Buffer del PDF que Multer ya tiene en memoria)
- Pasarlo directamente al campo `archivoBytes` de Prisma (Prisma acepta `Buffer` de Node.js nativamente para el tipo `Bytes`)
- No hacer ninguna operación de I/O de filesystem

**Paso 4 — Modificar el endpoint de descarga**

El endpoint `GET /api/evidencias/:id/descargar` actualmente lee el archivo del disco con `fs.readFileSync`. Debe cambiar a:
- Recuperar el registro de la BD incluyendo `archivoBytes`
- Si `archivoBytes` es null (evidencia de año FINALIZADO limpiada por el Cron), responder con `404 Not Found` o `410 Gone`
- Si tiene bytes, devolver la respuesta con:
  - `Content-Type: application/pdf`
  - `Content-Disposition: attachment; filename="nombreArchivo"`
  - El buffer de bytes como body de la respuesta (usar `res.send(buffer)`)

**Paso 5 — Modificar el `softDelete`**

El `softDelete` actual también elimina el archivo del disco con `fs.unlinkSync`. En el nuevo sistema:
- No hay filesystem que limpiar
- Solo marcar `estado: 'ELIMINADO'` y `archivoBytes: null` en la BD

**Paso 6 — Actualizar el `CreateEvidenciaDto`**

El DTO no necesita cambios. El archivo llega por `multipart/form-data` y Multer lo intercepta antes del DTO.

---

### Refactorización del Cron Job de Retención

**Archivo:** `src/jobs/retencion-evidencias.service.ts`

#### Lógica Actual (filesystem)
El Cron Job actualmente:
1. Busca años lectivos con `estadoLectivo: 'FINALIZADO'` que cumplan `diasRetencion` días
2. Encuentra evidencias activas de esos años
3. **Elimina los archivos del disco** con `fs.unlinkSync`
4. Actualiza el registro: `{ estado: 'ELIMINADO', urlArchivo: null }`

#### Nueva Lógica (base de datos)
Con el cambio a `BYTEA`, el Cron Job debe:

**Paso 1:** Buscar años lectivos FINALIZADOS (igual que antes, sin cambios en esa query)

**Paso 2:** Buscar evidencias activas de esos años **que tengan bytes almacenados** (`archivoBytes: { not: null }`)

**Paso 3:** En lugar de eliminar archivos del disco, ejecutar `prisma.evidencia.update()` con:
```
data: {
  archivoBytes: null,   // libera el peso en BD vaciando el BYTEA
  estado: 'ELIMINADO',  // marca la evidencia como procesada
}
```

**Paso 4:** Eliminar completamente los imports de `fs` y `path` del archivo, y la referencia a `ConfigService` para `STORAGE_PATH`.

#### Resultado del Cron Job refactorizado

| Aspecto | Antes | Después |
|---|---|---|
| Almacenamiento liberado | Sistema de archivos del servidor | Columna BYTEA de PostgreSQL |
| Operación | `fs.unlinkSync(fullPath)` | `prisma.evidencia.update({ data: { archivoBytes: null } })` |
| Registro borrado | No (soft delete) | No (soft delete, mismo comportamiento) |
| ConfigService necesario | Sí (`STORAGE_PATH`) | No |
| Imports fs/path | Sí | No |

> **Regla de negocio que se mantiene intacta:** El Cron Job NO borra el registro de la calificación ni el registro de la evidencia. Solo vacía los bytes (libera espacio) y cambia el estado a ELIMINADO. El historial académico permanece completo.

---

## SECCIÓN 3 — Reglas de Negocio: Matrícula Única y Traslados de Curso

### Análisis de la Estructura Actual

**Tabla:** `usuario_curso` con clave primaria compuesta `(id_usuario, id_curso)`

```
UsuarioCurso {
  idUsuario String  ← parte del PK compuesto
  idCurso   Int     ← parte del PK compuesto
  @@id([idUsuario, idCurso])
}
```

**Problema:** La clave compuesta `(idUsuario, idCurso)` previene que un mismo estudiante esté en el **mismo curso dos veces**, pero **NO impide** que esté en dos cursos distintos simultáneamente. Por ejemplo, estos dos registros son actualmente válidos:
```
{ idUsuario: "0123456789", idCurso: 1 }  ← Curso A
{ idUsuario: "0123456789", idCurso: 2 }  ← Curso B — permitido actualmente
```

### Solución Recomendada: `@@unique([idUsuario])` en `UsuarioCurso`

Agregar una restricción `UNIQUE` sobre solo el campo `idUsuario` en la tabla `usuario_curso`. Esto garantiza que cada estudiante pueda aparecer como máximo una vez en la tabla, independientemente del curso.

**Ventajas de esta solución frente a alternativas:**
- No desnormaliza el modelo (vs. poner `idCursoActual` directamente en `Usuario`)
- Mantiene la tabla `UsuarioCurso` como punto de control de matrícula
- El traslado es atómico: actualizar el único registro en lugar de borrar e insertar

### Cambios en el Schema (ver Sección 4)

```
model UsuarioCurso {
  idUsuario String
  idCurso   Int

  usuario Usuario
  curso   Curso

  @@id([idUsuario, idCurso])
  @@unique([idUsuario])           ← NUEVO: garantiza 1 estudiante = 1 curso
  @@map("usuario_curso")
}
```

> **Nota de migración:** Al ejecutar `prisma migrate dev`, PostgreSQL creará un índice único sobre `id_usuario` en la tabla `usuario_curso`. Si ya existen registros duplicados (un estudiante en varios cursos), la migración fallará. Depurar con: `SELECT id_usuario, COUNT(*) FROM usuario_curso GROUP BY id_usuario HAVING COUNT(*) > 1;`

### Pasos Arquitectónicos: Asignación de Estudiante a Curso

El endpoint existente `POST /api/matriculas` (MatriculaController) recibe `{ idUsuario, idCurso }` y crea el registro en `UsuarioCurso`. Con la nueva restricción UNIQUE, el flujo debe ser:

**Paso 1:** Verificar que `idUsuario` pertenece a un usuario con rol 3 (ESTUDIANTE). Si no tiene ese rol, responder `400 Bad Request` con mensaje: "El usuario no tiene rol de Estudiante".

**Paso 2:** Verificar que el estudiante **no esté ya matriculado** en ningún curso. Query:
```
prisma.usuarioCurso.findUnique({ where: { idUsuario: dto.idUsuario } })
```
Si existe un registro, responder `409 Conflict` con mensaje: "El estudiante ya está matriculado. Use el endpoint de traslado para cambiar de curso."

**Paso 3:** Verificar que el `idCurso` existe y pertenece a un año lectivo `ACTIVO` o `PLANIFICADO`.

**Paso 4:** Crear el registro con `prisma.usuarioCurso.create(...)`.

### Pasos Arquitectónicos: Traslado de Curso (Nueva Función)

El traslado consiste en cambiar el `idCurso` del único registro de matrícula del estudiante. Esta es la operación más segura porque:
- El historial (calificaciones, evidencias) está ligado a `idActividad`, no a `UsuarioCurso`.
- Las calificaciones y evidencias anteriores permanecen intactas aunque el estudiante cambie de curso.
- Los promedios del curso anterior (`PromedioMateriaEstudiante`, `PromedioGeneralEstudiante`) también permanecen, ya que están vinculados a `(idUsuario, idCurso, idMateria)`.

**Nuevo Endpoint propuesto:** `PATCH /api/matriculas/:idUsuario/traslado`

**Body:** `{ idCursoDestino: number }`

**Roles permitidos:** `[1]` (Administrador) o `[2]` (Profesor con autorización explícita, si se decide incluir)

**Flujo del endpoint de traslado:**

**Paso 1 — Verificar que el estudiante existe y tiene rol 3.**

**Paso 2 — Verificar que el estudiante está matriculado actualmente.**
```
prisma.usuarioCurso.findUnique({ where: { idUsuario } })
```
Si no hay registro, responder `404 Not Found`: "El estudiante no está matriculado en ningún curso."

**Paso 3 — Guardar el `idCursoOrigen`** para el log/historial del traslado (opcional, para auditoría futura).

**Paso 4 — Verificar que el `idCursoDestino` existe y está ACTIVO.**

**Paso 5 — Verificar que el `idCursoDestino` es distinto al curso actual.** Si son iguales, responder `400 Bad Request`.

**Paso 6 — Ejecutar el traslado en una transacción Prisma:**

```
prisma.$transaction([
  prisma.usuarioCurso.delete({
    where: { idUsuario_idCurso: { idUsuario, idCurso: idCursoOrigen } }
  }),
  prisma.usuarioCurso.create({
    data: { idUsuario, idCurso: idCursoDestino }
  }),
])
```

> **Por qué transacción:** Si el `create` falla (por ejemplo, el curso destino no existe), el `delete` se revierte automáticamente y el estudiante queda en su curso original. Sin transacción, un fallo a mitad del proceso dejaría al estudiante sin matrícula.

**Paso 7 — Responder con el nuevo registro de matrícula** y el mensaje de traslado exitoso.

### Resumen de Reglas de Negocio Validadas por el Sistema

| Regla | Tabla/Campo | Mecanismo de control |
|---|---|---|
| 1 estudiante = 1 curso | `usuario_curso.@@unique([idUsuario])` | Restricción UNIQUE en BD |
| Solo usuarios con rol 3 se matriculan | Validación en service | Verificación de `UsuarioRol` |
| El traslado no borra el historial | `calificacion`, `evidencias`, `promedio_*` | FK a `actividad`, no a `usuario_curso` |
| El traslado es atómico | `prisma.$transaction` | Transacción ACID |
| Nuevo curso debe estar activo | Verificación en service | Query a `anio_lectivo.estadoLectivo` |

---

## SECCIÓN 4 — `schema.prisma` Actualizado

Los cambios aplicados respecto al schema original son:

1. **`datasource db`:** Se agrega `url = env("DATABASE_URL")`.
2. **`model Evidencia`:** Se elimina `urlArchivo` y se agrega `archivoBytes Bytes?`.
3. **`model UsuarioCurso`:** Se agrega `@@unique([idUsuario])`.

```prisma
// prisma/schema.prisma — VERSION ACTUALIZADA fix_1
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")        // ← FIX: era inexistente
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
  idAnioLectivo Int           @id @default(autoincrement()) @map("id_aniolectivo")
  fechaInicio   DateTime      @map("fecha_inicio") @db.Date
  fechaFinal    DateTime      @map("fecha_final") @db.Date
  estadoLectivo EstadoLectivo @map("estado_lectivo")

  cursos       Curso[]
  promediosMat PromedioMateriaEstudiante[]

  @@map("anio_lectivo")
}

model Usuario {
  idUsuario         String        @id @map("id_usuario") @db.VarChar(10)
  nombreCompleto    String        @map("nombre_completo") @db.VarChar(100)
  contrasenaUsuario String        @map("contrasena_usuario") @db.VarChar(255)
  estadoUsuario     EstadoUsuario @map("estado_usuario")
  email             String?       @unique @db.VarChar(255)
  tokenRecuperacion String?       @map("token_recuperacion") @db.VarChar(255)
  expiracionToken   DateTime?     @map("expiracion_token")

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
  idRol     Int    @id @default(autoincrement()) @map("id_rol")
  nombreRol String @map("nombre_rol") @db.VarChar(20)

  usuarios UsuarioRol[]

  @@map("rol")
}

model UsuarioRol {
  idUsuario String @map("id_usuario") @db.VarChar(10)
  idRol     Int    @map("id_rol")

  usuario Usuario @relation(fields: [idUsuario], references: [idUsuario], onDelete: Cascade)
  rol     Rol     @relation(fields: [idRol], references: [idRol])

  @@id([idUsuario, idRol])
  @@map("usuario_rol")
}

model Curso {
  idCurso       Int    @id @default(autoincrement()) @map("id_curso")
  idAnioLectivo Int    @map("id_aniolectivo")
  nombreCurso   String @map("nombre_curso") @db.VarChar(15)

  anioLectivo  AnioLectivo            @relation(fields: [idAnioLectivo], references: [idAnioLectivo])
  estudiantes  UsuarioCurso[]
  materias     CursoMateria[]
  docentes     ProfesorMateriaCurso[]
  parciales    Parcial[]
  promediosMat PromedioMateriaEstudiante[]
  promediosGen PromedioGeneralEstudiante[]

  @@map("curso")
}

model UsuarioCurso {
  idUsuario String @map("id_usuario") @db.VarChar(10)
  idCurso   Int    @map("id_curso")

  usuario Usuario @relation(fields: [idUsuario], references: [idUsuario], onDelete: Cascade)
  curso   Curso   @relation(fields: [idCurso], references: [idCurso], onDelete: Cascade)

  @@id([idUsuario, idCurso])
  @@unique([idUsuario])                  // ← FIX: restricción 1 estudiante = 1 curso
  @@map("usuario_curso")
}

model Materia {
  idMateria     Int    @id @default(autoincrement()) @map("id_materia")
  nombreMateria String @map("nombre_materia") @db.VarChar(30)

  cursos       CursoMateria[]
  parciales    Parcial[]
  docentes     ProfesorMateriaCurso[]
  promediosMat PromedioMateriaEstudiante[]

  @@map("materia")
}

model CursoMateria {
  idCurso   Int @map("id_curso")
  idMateria Int @map("id_materia")

  curso   Curso   @relation(fields: [idCurso], references: [idCurso], onDelete: Cascade)
  materia Materia @relation(fields: [idMateria], references: [idMateria], onDelete: Cascade)

  @@id([idCurso, idMateria])
  @@map("curso_materia")
}

model ProfesorMateriaCurso {
  idUsuario String @map("id_usuario") @db.VarChar(10)
  idCurso   Int    @map("id_curso")
  idMateria Int    @map("id_materia")

  usuario Usuario @relation(fields: [idUsuario], references: [idUsuario], onDelete: Cascade)
  curso   Curso   @relation(fields: [idCurso], references: [idCurso], onDelete: Cascade)
  materia Materia @relation(fields: [idMateria], references: [idMateria], onDelete: Cascade)

  @@id([idUsuario, idCurso, idMateria])
  @@map("profesor_materia_curso")
}

model Parcial {
  idParcial     Int @id @default(autoincrement()) @map("id_parcial")
  idMateria     Int @map("id_materia")
  idCurso       Int @map("id_curso")
  numeroParcial Int @map("numero_parcial")

  materia     Materia     @relation(fields: [idMateria], references: [idMateria])
  curso       Curso       @relation(fields: [idCurso], references: [idCurso])
  actividades Actividad[]

  @@unique([idMateria, idCurso, numeroParcial], map: "uq_parcial_materia_curso_numero")
  @@map("parcial")
}

model Actividad {
  idActividad        Int           @id @default(autoincrement()) @map("id_actividad")
  idParcial          Int           @map("id_parcial")
  tipoActividad      TipoActividad @map("tipo_actividad")
  fechaInicioEntrega DateTime      @map("fecha_inicio_entrega") @db.Date
  fechaFinEntrega    DateTime      @map("fecha_fin_entrega") @db.Date
  descripcion        String?       @db.VarChar(200)
  tituloActividad    String?       @map("titulo_actividad") @db.VarChar(20)
  valorMaximo        Float         @default(100.0) @map("valor_maximo")

  parcial        Parcial        @relation(fields: [idParcial], references: [idParcial])
  calificaciones Calificacion[]
  evidencias     Evidencia[]
  notificaciones Notificacion[]

  @@map("actividad")
}

model Calificacion {
  idCalificacion Int     @id @default(autoincrement()) @map("id_calificacion")
  idUsuario      String  @map("id_usuario") @db.VarChar(10)
  idActividad    Int     @map("id_actividad")
  nota           Float
  comentario     String? @db.VarChar(200)

  usuario   Usuario   @relation(fields: [idUsuario], references: [idUsuario])
  actividad Actividad @relation(fields: [idActividad], references: [idActividad])

  @@unique([idUsuario, idActividad])
  @@map("calificacion")
}

model Evidencia {
  idEvidencia     Int             @id @default(autoincrement()) @map("id_evidencia")
  idUsuario       String          @map("id_usuario") @db.VarChar(10)
  idActividad     Int             @map("id_actividad")
  // urlArchivo eliminado — el PDF se guarda en la BD   // ← FIX: eliminado
  archivoBytes    Bytes?          @map("archivo_bytes")  // ← FIX: nuevo campo BYTEA
  nombreArchivo   String          @map("nombre_archivo") @db.VarChar(255)
  fechaSubida     DateTime?       @default(now()) @map("fecha_subida")
  tamanio         BigInt          @map("tamanio")
  tipoContenido   String          @map("tipo_contenido") @db.VarChar(255)
  estado          EstadoEvidencia @default(ACTIVO)
  nombreActividad String          @map("nombre_actividad") @db.VarChar(255)
  codigoActividad String          @unique @map("codigo_actividad") @db.VarChar(255)
  tipoActividad   String          @map("tipo_actividad") @db.VarChar(255)

  usuario   Usuario   @relation(fields: [idUsuario], references: [idUsuario])
  actividad Actividad @relation(fields: [idActividad], references: [idActividad])

  @@unique([idUsuario, idActividad])
  @@map("evidencias")
}

model Notificacion {
  idNotificacion      Int              @id @default(autoincrement()) @map("id_notificacion")
  idUsuario           String           @map("id_usuario") @db.VarChar(10)
  idActividad         Int?             @map("id_actividad")
  tipoNotificacion    TipoNotificacion @map("tipo_notificacion")
  mensajeNotificacion String           @map("mensaje_notificacion") @db.VarChar(255)
  fechaNotificacion   DateTime         @map("fecha_notificacion")
  leida               Boolean          @default(false)

  usuario   Usuario    @relation(fields: [idUsuario], references: [idUsuario])
  actividad Actividad? @relation(fields: [idActividad], references: [idActividad])

  @@map("notificaciones")
}

model PromedioMateriaEstudiante {
  idPromedioMateria    Int       @id @default(autoincrement()) @map("id_promedio_materia")
  idUsuario            String    @map("id_usuario") @db.VarChar(10)
  idAnioLectivo        Int       @map("id_aniolectivo")
  idCurso              Int       @map("id_curso")
  idMateria            Int       @map("id_materia")
  promedioParcial1     Float?    @map("promedio_parcial1")
  promedioParcial2     Float?    @map("promedio_parcial2")
  promedioParcial3     Float?    @map("promedio_parcial3")
  promedioFinalMateria Float?    @map("promedio_final_materia")
  fechaActualizacion   DateTime? @map("fecha_actualizacion")

  usuario     Usuario     @relation(fields: [idUsuario], references: [idUsuario])
  anioLectivo AnioLectivo @relation(fields: [idAnioLectivo], references: [idAnioLectivo])
  curso       Curso       @relation(fields: [idCurso], references: [idCurso])
  materia     Materia     @relation(fields: [idMateria], references: [idMateria])

  @@unique([idUsuario, idAnioLectivo, idCurso, idMateria])
  @@map("promedio_materia_estudiante")
}

model PromedioGeneralEstudiante {
  idPromedioGeneral Int    @id @default(autoincrement()) @map("id_promedio_general")
  idUsuario         String @map("id_usuario") @db.VarChar(10)
  idCurso           Int    @map("id_curso")
  promedioGeneral   Float  @map("promedio_general")
  comportamiento    String @db.VarChar(1)

  usuario Usuario @relation(fields: [idUsuario], references: [idUsuario])
  curso   Curso   @relation(fields: [idCurso], references: [idCurso])

  @@unique([idUsuario, idCurso])
  @@map("promediogeneralestudiante")
}
```

---

## Resumen Ejecutivo de Cambios

| # | Tipo | Archivo | Cambio |
|---|---|---|---|
| 1 | **BUG FIX** | `prisma/schema.prisma` | Agregar `url = env("DATABASE_URL")` en datasource |
| 2 | **BUG FIX** | `usuarios.service.ts` | Reemplazar `omit` + `include` por `select` explícito |
| 3 | **SECURITY FIX** | `usuarios.service.ts` | Ocultar hash en respuesta del método `create()` |
| 4 | **BUG FIX** | `main.ts` | Parche global de serialización de `BigInt` |
| 5 | **SCHEMA CHANGE** | `prisma/schema.prisma` | Eliminar `urlArchivo`, agregar `archivoBytes Bytes?` |
| 6 | **REFACTOR** | `evidencias.service.ts` | Eliminar lógica de filesystem, escribir en BD |
| 7 | **REFACTOR** | `retencion-evidencias.service.ts` | Eliminar `fs.unlinkSync`, usar `update archivoBytes: null` |
| 8 | **SCHEMA CHANGE** | `prisma/schema.prisma` | Agregar `@@unique([idUsuario])` en `UsuarioCurso` |
| 9 | **FEATURE** | `matricula.service.ts` | Validar rol 3 y unicidad antes de crear matrícula |
| 10 | **NEW ENDPOINT** | `matricula.controller.ts` | `PATCH /matriculas/:idUsuario/traslado` |

### Orden de Ejecución Recomendado

```
1. Corregir schema.prisma (cambios 1, 5, 8)
2. npx prisma generate
3. npx prisma migrate dev --name fix_1_refactorizacion
4. Corregir main.ts (cambio 4)
5. Corregir usuarios.service.ts (cambios 2 y 3)
6. Refactorizar evidencias.service.ts (cambio 6)
7. Refactorizar retencion-evidencias.service.ts (cambio 7)
8. Implementar validaciones en matricula.service.ts (cambio 9)
9. Agregar endpoint de traslado (cambio 10)
10. Pruebas de regresión en todos los endpoints afectados
```
