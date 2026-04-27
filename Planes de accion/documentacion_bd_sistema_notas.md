# Documentación de Base de Datos — Sistema de Notas Escolar

> **Última actualización:** 2026-04-26  
> **Motor:** PostgreSQL  
> **ORM:** Prisma v7  
> **Schema:** `backend/proyecto-notas-api/prisma/schema.prisma`

---

## Enums

| Enum | Valores | Uso |
|---|---|---|
| `EstadoUsuario` | `ACTIVO`, `INACTIVO`, `BLOQUEADO` | Estado de la cuenta de un usuario |
| `EstadoLectivo` | `ACTIVO`, `FINALIZADO`, `PLANIFICADO` | Estado de un año lectivo |
| `EstadoEvidencia` | `ACTIVO`, `ELIMINADO` | Soft-delete lógico de evidencias |
| `TipoActividad` | `TAREA`, `EXAMEN`, `PROYECTO`, `PRUEBA` | Categoría de una actividad académica |
| `TipoNotificacion` | `NUEVA_ACTIVIDAD`, `CALIFICACION`, `RECORDATORIO`, `SISTEMA` | Clasificación de notificaciones |

---

## Tablas

### `anio_lectivo`

Representa un período académico escolar.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id_aniolectivo` | `INT` | PK, autoincrement | Identificador único |
| `fecha_inicio` | `DATE` | NOT NULL | Inicio del año lectivo |
| `fecha_final` | `DATE` | NOT NULL | Fin del año lectivo |
| `estado_lectivo` | `EstadoLectivo` | NOT NULL | Estado actual del período |

**Relaciones:** 1 año lectivo → N cursos, N promedios de materia.

---

### `usuario`

Tabla central de personas del sistema. Un mismo usuario puede tener múltiples roles.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id_usuario` | `VARCHAR(10)` | PK | Cédula ecuatoriana del usuario |
| `nombre_completo` | `VARCHAR(100)` | NOT NULL | Nombre y apellido completo |
| `contrasena_usuario` | `VARCHAR(255)` | NOT NULL | Hash bcrypt de la contraseña |
| `estado_usuario` | `EstadoUsuario` | NOT NULL | Estado de la cuenta |
| `email` | `VARCHAR(255)` | UNIQUE, nullable | Correo electrónico (usado para login) |
| `token_recuperacion` | `VARCHAR(255)` | nullable | Token para recuperación de contraseña |
| `expiracion_token` | `TIMESTAMP` | nullable | Expiración del token de recuperación |

**Notas de negocio:**
- El login se realiza usando `email` + contraseña (no la cédula).
- La cédula (`id_usuario`) es el PK y debe ser una cédula ecuatoriana válida (10 dígitos con dígito verificador correcto).

---

### `rol`

Catálogo de roles del sistema.

| `id_rol` | `nombre_rol` | Descripción |
|---|---|---|
| 1 | ADMIN | Administrador del sistema |
| 2 | PROFESOR | Docente que gestiona actividades y calificaciones |
| 3 | ESTUDIANTE | Alumno que visualiza notas y sube evidencias |

---

### `usuario_rol`

Tabla pivote N:N entre `usuario` y `rol`.

| Columna | Tipo | Restricciones |
|---|---|---|
| `id_usuario` | `VARCHAR(10)` | FK → `usuario.id_usuario` |
| `id_rol` | `INT` | FK → `rol.id_rol` |

PK compuesta: `(id_usuario, id_rol)`.

---

### `curso`

Un curso pertenece a un año lectivo específico (ej: "3° BGU A - 2026").

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id_curso` | `INT` | PK, autoincrement | Identificador único |
| `id_aniolectivo` | `INT` | FK → `anio_lectivo` | Año lectivo al que pertenece |
| `nombre_curso` | `VARCHAR(15)` | NOT NULL | Nombre del curso (ej: "3ro BGU A") |

---

### `usuario_curso`

Matriculación de estudiantes en cursos (N:N).

| Columna | Tipo | Restricciones |
|---|---|---|
| `id_usuario` | `VARCHAR(10)` | FK → `usuario` |
| `id_curso` | `INT` | FK → `curso` |

PK compuesta: `(id_usuario, id_curso)`.

**Regla de negocio (aplicada en la capa de servicio, no en BD):** Un estudiante no puede estar matriculado en dos cursos del **mismo año lectivo**. Sin embargo, sí puede tener múltiples matrículas en cursos de **años lectivos distintos** (historial académico). La validación se hace en `MatriculaService.create()` consultando si ya existe una matrícula en un curso cuyo `idAnioLectivo` coincida con el del curso destino.

---

### `materia`

Catálogo de materias académicas (ej: Matemáticas, Física).

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id_materia` | `INT` | PK, autoincrement | Identificador único |
| `nombre_materia` | `VARCHAR(30)` | NOT NULL | Nombre de la materia |

---

### `curso_materia`

Asignación de materias a cursos (N:N).

| Columna | Tipo | Restricciones |
|---|---|---|
| `id_curso` | `INT` | FK → `curso` |
| `id_materia` | `INT` | FK → `materia` |

PK compuesta: `(id_curso, id_materia)`.

---

### `profesor_materia_curso`

Docencia: asignación de un profesor a una materia en un curso específico.

| Columna | Tipo | Restricciones |
|---|---|---|
| `id_usuario` | `VARCHAR(10)` | FK → `usuario` |
| `id_curso` | `INT` | FK → `curso` |
| `id_materia` | `INT` | FK → `materia` |

PK compuesta: `(id_usuario, id_curso, id_materia)`.

---

### `parcial`

Divide el año lectivo en 3 períodos de evaluación por cada combinación curso-materia.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id_parcial` | `INT` | PK, autoincrement | Identificador único |
| `id_materia` | `INT` | FK → `materia` | Materia del parcial |
| `id_curso` | `INT` | FK → `curso` | Curso del parcial |
| `numero_parcial` | `INT` | NOT NULL | Número del parcial (1, 2 o 3) |

**Restricción única:** `UNIQUE(id_materia, id_curso, numero_parcial)` — no puede haber dos parciales con el mismo número para la misma materia/curso.

**Creación automática:** El servicio `parcialesService.createBulk()` crea los 3 parciales de una vez desde el panel del profesor.

---

### `actividad`

Tareas, exámenes, proyectos y pruebas dentro de un parcial.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id_actividad` | `INT` | PK, autoincrement | Identificador único |
| `id_parcial` | `INT` | FK → `parcial` | Parcial al que pertenece |
| `tipo_actividad` | `TipoActividad` | NOT NULL | Tipo: TAREA, EXAMEN, PROYECTO, PRUEBA |
| `fecha_inicio_entrega` | `DATE` | NOT NULL | Inicio del período de entrega |
| `fecha_fin_entrega` | `DATE` | NOT NULL | Cierre del período de entrega |
| `descripcion` | `VARCHAR(200)` | nullable | Instrucciones de la actividad |
| `titulo_actividad` | `VARCHAR(20)` | nullable | Título corto (ej: "Tarea 1") |
| `valor_maximo` | `FLOAT` | DEFAULT 10.0 | Nota máxima posible (siempre 10) |

**Reglas de negocio:**
- `valor_maximo` es siempre `10.0` y no es configurable por el usuario.
- **Límites por parcial:** EXAMEN, PRUEBA y PROYECTO tienen máximo 1 por parcial. TAREA es ilimitada.
- El backend valida estos límites antes de insertar y retorna `400 Bad Request` si se excede.

---

### `calificacion`

Nota de un estudiante en una actividad específica.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id_calificacion` | `INT` | PK, autoincrement | Identificador único |
| `id_usuario` | `VARCHAR(10)` | FK → `usuario` | Estudiante calificado |
| `id_actividad` | `INT` | FK → `actividad` | Actividad calificada |
| `nota` | `FLOAT` | NOT NULL | Nota (0 – 10) |
| `comentario` | `VARCHAR(200)` | nullable | Comentario del profesor |

**Restricción única:** `UNIQUE(id_usuario, id_actividad)` — un estudiante tiene una sola nota por actividad.  
**Upsert:** Si ya existe una calificación para ese par, se actualiza en lugar de crear duplicado.

---

### `evidencias`

Archivos PDF subidos por estudiantes como evidencia de actividades.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id_evidencia` | `INT` | PK, autoincrement | Identificador único |
| `id_usuario` | `VARCHAR(10)` | FK → `usuario` | Estudiante que subió |
| `id_actividad` | `INT` | FK → `actividad` | Actividad relacionada |
| `archivo_bytes` | `BYTEA` | nullable | Contenido binario del PDF |
| `nombre_archivo` | `VARCHAR(255)` | NOT NULL | Nombre original del archivo |
| `fecha_subida` | `TIMESTAMP` | DEFAULT now() | Momento de la subida |
| `tamanio` | `BIGINT` | NOT NULL | Tamaño en bytes |
| `tipo_contenido` | `VARCHAR(255)` | NOT NULL | MIME type (ej: `application/pdf`) |
| `estado` | `EstadoEvidencia` | DEFAULT `ACTIVO` | Soft-delete lógico |
| `nombre_actividad` | `VARCHAR(255)` | NOT NULL | Nombre de la actividad (desnormalizado) |
| `codigo_actividad` | `VARCHAR(255)` | UNIQUE | Código único de la actividad |
| `tipo_actividad` | `VARCHAR(255)` | NOT NULL | Tipo de actividad (texto, no FK) |

**Restricción única:** `UNIQUE(id_usuario, id_actividad)` — un estudiante sube una sola evidencia por actividad.

---

### `notificaciones`

Notificaciones enviadas a los usuarios del sistema.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id_notificacion` | `INT` | PK, autoincrement | Identificador único |
| `id_usuario` | `VARCHAR(10)` | FK → `usuario` | Destinatario |
| `id_actividad` | `INT` | FK → `actividad`, nullable | Actividad relacionada (opcional) |
| `tipo_notificacion` | `TipoNotificacion` | NOT NULL | Tipo de evento |
| `mensaje_notificacion` | `VARCHAR(255)` | NOT NULL | Texto del mensaje |
| `fecha_notificacion` | `TIMESTAMP` | NOT NULL | Momento de creación |
| `leida` | `BOOLEAN` | DEFAULT false | Si el usuario ya la leyó |

---

### `promedio_materia_estudiante`

Promedios calculados por materia, por parcial y final. Se actualiza llamando al endpoint de recálculo.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id_promedio_materia` | `INT` | PK, autoincrement | Identificador único |
| `id_usuario` | `VARCHAR(10)` | FK → `usuario` | Estudiante |
| `id_aniolectivo` | `INT` | FK → `anio_lectivo` | Año lectivo |
| `id_curso` | `INT` | FK → `curso` | Curso |
| `id_materia` | `INT` | FK → `materia` | Materia |
| `promedio_parcial1` | `FLOAT` | nullable | Promedio ponderado del Parcial 1 (0–10) |
| `promedio_parcial2` | `FLOAT` | nullable | Promedio ponderado del Parcial 2 (0–10) |
| `promedio_parcial3` | `FLOAT` | nullable | Promedio ponderado del Parcial 3 (0–10) |
| `promedio_final_materia` | `FLOAT` | nullable | Promedio de los 3 parciales (0–10) |
| `fecha_actualizacion` | `TIMESTAMP` | nullable | Última vez que se recalculó |

**Restricción única:** `UNIQUE(id_usuario, id_aniolectivo, id_curso, id_materia)`.

**Algoritmo de cálculo del parcial (ponderado):**

| Tipo | Peso | Aporte máximo |
|---|---|---|
| TAREA | 20% | 2.0 pts |
| PRUEBA | 20% | 2.0 pts |
| PROYECTO | 25% | 2.5 pts |
| EXAMEN | 35% | 3.5 pts |

Los pesos están definidos en `promedios.service.ts`. Ver `Planes de accion/explicacion_porcentaje_notas.md` para instrucciones de modificación.

---

### `promediogeneralestudiante`

Promedio general del estudiante en un curso (promedio de todas sus materias).

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id_promedio_general` | `INT` | PK, autoincrement | Identificador único |
| `id_usuario` | `VARCHAR(10)` | FK → `usuario` | Estudiante |
| `id_curso` | `INT` | FK → `curso` | Curso |
| `promedio_general` | `FLOAT` | NOT NULL | Promedio de todas las materias (0–10) |
| `comportamiento` | `VARCHAR(1)` | NOT NULL | Letra: A, B, C, D o E |

**Restricción única:** `UNIQUE(id_usuario, id_curso)`.

**Escala de comportamiento:**

| Rango | Letra |
|---|---|
| ≥ 9.0 | A |
| ≥ 7.0 | B |
| ≥ 5.0 | C |
| ≥ 3.0 | D |
| < 3.0 | E |

---

## Diagrama de relaciones (texto)

```
anio_lectivo
  └──< curso
         ├──< usuario_curso >── usuario
         │                        └──< usuario_rol >── rol
         ├──< curso_materia >── materia
         ├──< profesor_materia_curso >── usuario
         └──< parcial
                  └──< actividad
                           ├──< calificacion >── usuario
                           ├──< evidencias >── usuario
                           └──< notificaciones >── usuario

promedio_materia_estudiante ──> usuario, anio_lectivo, curso, materia
promediogeneralestudiante   ──> usuario, curso
```

---

## Historial de cambios

| Fecha | Cambio | Motivo |
|---|---|---|
| 2026-04-26 | Enum `TipoActividad`: `LECCION` → `PRUEBA` | Regla de negocio: categorías correctas (Examen, Prueba, Proyecto, Tarea) |
| 2026-04-26 | `actividad.valor_maximo` default: `100.0` → `10.0` | El sistema trabaja sobre escala de 10; el usuario no configura este valor |
| 2026-04-26 | Algoritmo de promedio: simple → ponderado (TAREA 20%, PRUEBA 20%, PROYECTO 25%, EXAMEN 35%) | Reglas de negocio del sistema educativo |
| 2026-04-26 | `usuario_curso`: eliminado `UNIQUE(id_usuario)` | Permitir historial de matrículas entre años lectivos. La validación "un curso por año" se traslada a la capa de servicio (`MatriculaService.create`) |
