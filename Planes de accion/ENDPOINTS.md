# Endpoints — Proyecto Notas API

> **Base URL:** `http://localhost:3000/api`
> **Swagger UI:** `http://localhost:3000/api/docs`
> **Header para rutas protegidas:** `Authorization: Bearer {JWT_TOKEN}`

---

## Usuarios de prueba (creados por seed)

| Rol | idUsuario | Email | Contraseña |
|-----|-----------|-------|------------|
| ADMIN (1) | `0000000001` | `admin@notas.edu.ec` | `Admin#2026` |
| PROFESOR (2) | `1700000001` | `profesor@notas.edu.ec` | `Profesor#2026` |
| ESTUDIANTE (3) | `1700000019` | `estudiante@notas.edu.ec` | `Estudiante#2026` |

> El login usa **email + contraseña**. La cédula (`idUsuario`) solo se usa como identificador interno.

---

## Auth

### POST `/api/auth/login`
Obtiene el JWT. **No requiere autenticación.**

**Admin:**
```json
{
  "email": "admin@notas.edu.ec",
  "password": "Admin#2026"
}
```

**Profesor:**
```json
{
  "email": "profesor@notas.edu.ec",
  "password": "Profesor#2026"
}
```

**Estudiante:**
```json
{
  "email": "estudiante@notas.edu.ec",
  "password": "Estudiante#2026"
}
```

**Respuesta exitosa:**
```json
{
  "access_token": "eyJhbGci...",
  "idUsuario": "0000000001",
  "nombreCompleto": "Administrador del Sistema",
  "roles": [1]
}
```

---

### POST `/api/auth/forgot-password`
Solicita recuperación de contraseña por email.
```json
{
  "email": "profesor@notas.edu.ec"
}
```

---

### POST `/api/auth/reset-password`
Restablece la contraseña con el token recibido por email.
```json
{
  "token": "f3a9b1c2-...-xyz",
  "newPassword": "NuevaClave#2026"
}
```

---

### POST `/api/auth/change-password` 🔒
Cambia la contraseña del usuario autenticado.
```json
{
  "oldPassword": "Admin#2026",
  "newPassword": "NuevaClave#2026"
}
```

---

## Usuarios 🔒 (solo ADMIN)

### POST `/api/usuarios`
Crea un nuevo usuario.
```json
{
  "idUsuario": "0102030400",
  "nombreCompleto": "María López Pérez",
  "contrasenaUsuario": "Clave#2026",
  "email": "maria.lopez@notas.edu.ec",
  "estadoUsuario": "ACTIVO",
  "roles": [2]
}
```
> `estadoUsuario`: `ACTIVO` | `INACTIVO` | `BLOQUEADO`

---

### GET `/api/usuarios?rol=2&estado=ACTIVO`
Lista usuarios filtrando por rol y/o estado.

---

### GET `/api/usuarios/:idUsuario`
Obtiene un usuario por su cédula.

**Ejemplo:** `GET /api/usuarios/1700000001`

---

### PATCH `/api/usuarios/:idUsuario`
Actualiza datos del usuario.
```json
{
  "nombreCompleto": "María L. Pérez",
  "email": "maria.nueva@notas.edu.ec",
  "estadoUsuario": "INACTIVO"
}
```

---

### DELETE `/api/usuarios/:idUsuario`
Elimina un usuario.

---

### POST `/api/usuarios/:idUsuario/roles`
Asigna un rol al usuario.
```json
{ "idRol": 3 }
```
> Roles disponibles: `1=ADMIN`, `2=PROFESOR`, `3=ESTUDIANTE`

---

### DELETE `/api/usuarios/:idUsuario/roles/:idRol`
Quita un rol al usuario.

**Ejemplo:** `DELETE /api/usuarios/1700000001/roles/2`

---

## Años Lectivos 🔒 (ADMIN)

### POST `/api/anios-lectivos`
```json
{
  "fechaInicio": "2026-09-01",
  "fechaFinal": "2027-06-30",
  "estadoLectivo": "PLANIFICADO"
}
```
> `estadoLectivo`: `ACTIVO` | `FINALIZADO` | `PLANIFICADO`

---

### GET `/api/anios-lectivos?estado=ACTIVO`
Lista años lectivos. El seed inserta automáticamente uno con `id=1, estado=ACTIVO`.

---

### PATCH `/api/anios-lectivos/:id`
```json
{ "estadoLectivo": "FINALIZADO" }
```

---

### DELETE `/api/anios-lectivos/:id`

---

## Cursos 🔒 (ADMIN)

### POST `/api/cursos`
```json
{
  "idAnioLectivo": 1,
  "nombreCurso": "8vo EGB A"
}
```

---

### GET `/api/cursos?idAnioLectivo=1`

---

### PATCH `/api/cursos/:id`
```json
{ "nombreCurso": "8vo EGB B" }
```

---

### DELETE `/api/cursos/:id`

---

### POST `/api/cursos/:id/materias`
Asigna una materia a un curso.
```json
{ "idMateria": 1 }
```

---

### DELETE `/api/cursos/:id/materias/:idMateria`

**Ejemplo:** `DELETE /api/cursos/1/materias/1`

---

## Materias 🔒 (ADMIN)

### POST `/api/materias`
```json
{ "nombreMateria": "Matemáticas" }
```

---

### GET `/api/materias`

---

### PATCH `/api/materias/:id`
```json
{ "nombreMateria": "Matemática Básica" }
```

---

### DELETE `/api/materias/:id`

---

## Matrículas 🔒 (ADMIN)

### POST `/api/matriculas`
Matricula un estudiante en un curso.
```json
{
  "idUsuario": "1700000019",
  "idCurso": 1
}
```

---

### GET `/api/matriculas?idCurso=1`
Lista los estudiantes matriculados en un curso.

---

### DELETE `/api/matriculas`
Desmatricula a un estudiante.
```json
{
  "idUsuario": "1700000019",
  "idCurso": 1
}
```

---

## Docencias 🔒 (ADMIN)

### POST `/api/docencias`
Asigna un profesor a una materia dentro de un curso.
```json
{
  "idUsuario": "1700000001",
  "idCurso": 1,
  "idMateria": 1
}
```

---

### GET `/api/docencias?idUsuario=1700000001`

---

### DELETE `/api/docencias`
```json
{
  "idUsuario": "1700000001",
  "idCurso": 1,
  "idMateria": 1
}
```

---

## Parciales 🔒 (PROFESOR)

### POST `/api/parciales`
```json
{
  "idMateria": 1,
  "idCurso": 1,
  "numeroParcial": 1
}
```
> `numeroParcial`: `1`, `2` o `3`

---

### POST `/api/parciales/bulk`
Crea los 3 parciales de una vez.
```json
{
  "idMateria": 1,
  "idCurso": 1
}
```

---

### GET `/api/parciales?idCurso=1&idMateria=1`

---

### DELETE `/api/parciales/:id`

---

## Actividades 🔒 (PROFESOR)

### POST `/api/actividades`
```json
{
  "idParcial": 1,
  "tipoActividad": "TAREA",
  "tituloActividad": "Tarea 1",
  "descripcion": "Resolver ejercicios 1 al 10 del capítulo 3.",
  "fechaInicioEntrega": "2026-10-01",
  "fechaFinEntrega": "2026-10-08",
  "valorMaximo": 100.0
}
```
> `tipoActividad`: `TAREA` | `EXAMEN` | `PROYECTO` | `LECCION`

---

### GET `/api/actividades?idParcial=1`

---

### GET `/api/actividades/:id`

---

### PATCH `/api/actividades/:id`
```json
{
  "descripcion": "Resolver ejercicios 1 al 12.",
  "fechaFinEntrega": "2026-10-10"
}
```

---

### DELETE `/api/actividades/:id`

---

## Calificaciones 🔒 (PROFESOR)

### POST `/api/calificaciones`
```json
{
  "idUsuario": "1700000019",
  "idActividad": 1,
  "nota": 85.5,
  "comentario": "Buen trabajo, mejorar redacción."
}
```

---

### POST `/api/calificaciones/bulk`
Califica a todo un curso en una sola petición.
```json
{
  "idActividad": 1,
  "calificaciones": [
    { "idUsuario": "1700000019", "nota": 85.5, "comentario": "Excelente" }
  ]
}
```

---

### GET `/api/calificaciones?idActividad=1`

---

### GET `/api/calificaciones/estudiante/:idUsuario?idAnioLectivo=1`

**Ejemplo:** `GET /api/calificaciones/estudiante/1700000019?idAnioLectivo=1`

---

### PATCH `/api/calificaciones/:id`
```json
{ "nota": 88.0, "comentario": "Recalificado tras revisión" }
```

---

## Evidencias 🔒 (ESTUDIANTE sube / PROFESOR descarga)

### POST `/api/evidencias` — `multipart/form-data`
Sube un PDF como evidencia.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `file` | File (PDF) | Archivo PDF, máx 10 MB |
| `idActividad` | number | ID de la actividad |
| `nombreActividad` | string | Nombre de la actividad |
| `tipoActividad` | string | Ej: `"TAREA"` |

---

### GET `/api/evidencias?idActividad=1`

---

### GET `/api/evidencias/:id/descargar`

---

### DELETE `/api/evidencias/:id`
Soft-delete: marca la evidencia como `ELIMINADO`.

---

## Notificaciones 🔒

### GET `/api/notificaciones?leida=false`

---

### PATCH `/api/notificaciones/:id/leer`

---

### PATCH `/api/notificaciones/leer-todas`

---

### DELETE `/api/notificaciones/:id`

---

## Promedios 🔒

### POST `/api/promedios/materia/recalcular`
```json
{
  "idUsuario": "1700000019",
  "idCurso": 1,
  "idMateria": 1,
  "idAnioLectivo": 1
}
```

---

### POST `/api/promedios/general/recalcular`
```json
{
  "idUsuario": "1700000019",
  "idCurso": 1
}
```

---

### GET `/api/promedios/materia?idUsuario=1700000019&idAnioLectivo=1`

---

### GET `/api/promedios/general?idUsuario=1700000019&idCurso=1`

---

### GET `/api/promedios/curso/:idCurso/ranking`

**Ejemplo:** `GET /api/promedios/curso/1/ranking`

---

## Jobs 🔒 (ADMIN)

### POST `/api/jobs/retencion-evidencias/ejecutar`
```json
{
  "idAnioLectivo": 1,
  "confirmacion": "ELIMINAR_PDFS_ANIO_1"
}
```

---

### GET `/api/jobs/retencion-evidencias/ultimo-estado`

---

## Flujo de prueba completo (orden recomendado)

```
1.  POST /api/auth/login                        → JWT del admin
    { "email": "admin@notas.edu.ec", "password": "Admin#2026" }

2.  GET  /api/anios-lectivos                    → confirmar id=1 (ACTIVO, ya insertado por seed)

3.  POST /api/materias                          → crear "Matemáticas" → id=1
    { "nombreMateria": "Matemáticas" }

4.  POST /api/cursos                            → crear curso en año lectivo 1 → id=1
    { "idAnioLectivo": 1, "nombreCurso": "8vo EGB A" }

5.  POST /api/cursos/1/materias                 → asignar materia al curso
    { "idMateria": 1 }

6.  POST /api/matriculas                        → matricular estudiante
    { "idUsuario": "1700000019", "idCurso": 1 }

7.  POST /api/docencias                         → asignar profesor
    { "idUsuario": "1700000001", "idCurso": 1, "idMateria": 1 }

8.  POST /api/parciales/bulk                    → crear parciales 1, 2 y 3
    { "idMateria": 1, "idCurso": 1 }

9.  GET  /api/parciales?idCurso=1&idMateria=1   → anotar idParcial (ej. id=1)

10. POST /api/auth/login                        → JWT del profesor
    { "email": "profesor@notas.edu.ec", "password": "Profesor#2026" }

11. POST /api/actividades                       → crear actividad en parcial 1
    { "idParcial": 1, "tipoActividad": "TAREA", "tituloActividad": "Tarea 1",
      "fechaInicioEntrega": "2026-10-01", "fechaFinEntrega": "2026-10-08" }

12. POST /api/calificaciones                    → calificar al estudiante
    { "idUsuario": "1700000019", "idActividad": 1, "nota": 85.5 }

13. POST /api/promedios/materia/recalcular      → recalcular promedio
    { "idUsuario": "1700000019", "idCurso": 1, "idMateria": 1, "idAnioLectivo": 1 }

14. GET  /api/promedios/curso/1/ranking         → ver ranking del curso
```
