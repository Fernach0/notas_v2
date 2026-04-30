# Manual de Usuario — Sistema de Notas

## ¿Qué es este sistema?

El **Sistema de Notas** es una plataforma web diseñada para instituciones educativas que permite gestionar cursos, materias, actividades académicas, entregas de evidencias y calificaciones de estudiantes. Centraliza en un solo lugar todo el flujo académico: desde que el administrador crea un año lectivo hasta que el estudiante descarga su boletín de notas.

---

## Roles de usuario

El sistema tiene tres tipos de usuario, cada uno con acceso y permisos distintos:

| Rol | ¿Quién es? |
|---|---|
| **Administrador** | Personal directivo o secretaría. Configura y supervisa todo el sistema. |
| **Profesor** | Docente asignado a uno o más cursos. Gestiona actividades y califica. |
| **Estudiante** | Alumno matriculado en un curso. Consulta actividades y sube evidencias. |

---

## Módulos por rol

---

### 👤 Administrador

El administrador tiene visión y control total del sistema. Es el único que puede configurar la estructura académica.

#### Años Lectivos
- Crear períodos académicos (ej. "2025–2026").
- Marcar un año como **Activo** — solo puede haber uno activo a la vez.
- El año activo es el que usan profesores y estudiantes en su operativa diaria.

#### Usuarios
- Crear cuentas para administradores, profesores y estudiantes.
- Editar datos personales (nombre, cédula, email, contraseña).
- Activar o desactivar cuentas.
- Los estudiantes se identifican por su número de cédula ecuatoriana.

#### Cursos
- Crear cursos dentro de un año lectivo (ej. "1ro BGU", "2do BGU").
- Asignar materias a cada curso.
- Un mismo curso puede tener varias materias; una misma materia puede estar en varios cursos.

#### Materias
- Crear y editar materias (ej. "Matemáticas", "Lengua", "Software").
- Las materias son reutilizables entre cursos y años lectivos.

#### Matrículas
- Inscribir estudiantes en un curso del año lectivo activo.
- Un estudiante puede tener matrículas en cursos de **distintos años lectivos** (historial), pero solo una matrícula por año lectivo activo.
- Trasladar estudiantes de un curso a otro si es necesario.

#### Calificaciones (vista de administrador)
- Seleccionar año lectivo y curso para ver la tabla completa de notas.
- La tabla muestra **todos los estudiantes** del curso con el **promedio final por materia**.
- La columna **Estado** indica:
  - ✅ **Aprobado** — todas las materias tienen promedio ≥ 7.00
  - ❌ **Reprobado** — al menos una materia tiene promedio < 7.00
  - ⏳ **Pendiente** — hay materias sin calificaciones aún.
- Botón **Descargar PDF** para exportar la tabla al navegador e imprimir/guardar.

---

### 🧑‍🏫 Profesor

El profesor gestiona la operativa académica dentro de sus cursos asignados.

#### Dashboard
- Vista de sus cursos con acceso rápido a Actividades, Calificar y Parciales.
- Desde aquí puede crear los tres parciales de un curso con un solo clic.

#### Parciales
Cada curso-materia se divide en **3 parciales**. El profesor debe crearlos antes de poder registrar actividades. Los parciales no tienen fecha fija — el profesor decide cuándo crearlos.

#### Actividades
Las actividades son las tareas evaluables dentro de un parcial. Hay cuatro tipos:

| Tipo | Peso en el promedio del parcial | Límite por parcial |
|---|---|---|
| **TAREA** | 20% | Sin límite |
| **PRUEBA** | 20% | Máximo 1 |
| **PROYECTO** | 25% | Máximo 1 |
| **EXAMEN** | 35% | Máximo 1 |

Cada actividad se califica **sobre 10 puntos**. Al crear una actividad se define:
- Título y descripción.
- Tipo (TAREA, PRUEBA, PROYECTO, EXAMEN).
- Fecha de inicio y fecha límite de entrega.

> **Ejemplo:** Un parcial completo con TAREA + PRUEBA + PROYECTO + EXAMEN da como resultado un promedio ponderado del parcial. Si solo hay TAREA y EXAMEN, el promedio se calcula solo con esos dos pesos.

#### Calificar actividades (flujo en 3 pasos)
1. **Seleccionar parcial** — elegir Parcial 1, 2 o 3.
2. **Seleccionar actividad** — ver todas las actividades de ese parcial (abiertas o cerradas).
3. **Calificar** — tabla con todos los estudiantes, cada uno con su evidencia PDF (botones Ver/Descargar) y campo para ingresar la nota.

#### Calificaciones (vista de profesor)
Vista de solo lectura organizada en tres pestañas:
- **Promedio Final** — una nota por estudiante, calculada sobre todas las materias del parcial.
- **Por Parciales** — desglose Parcial 1, Parcial 2, Parcial 3 y Promedio Final.
- **Por Actividad** — tabla cruzada de estudiantes × actividades con la nota de cada una.
- Botón **Recalcular promedios** — fuerza el recálculo si se modificaron notas.
- Botón **Descargar PDF**.

#### Participantes
- Lista de todos los estudiantes matriculados en el curso seleccionado.
- Muestra nombre completo, cédula, email y estado de la cuenta.

---

### 🎓 Estudiante

El estudiante tiene acceso de solo lectura a sus notas y puede subir sus propias evidencias.

#### Actividades
- Ver las actividades de cada parcial, separadas por materia.
- Cada actividad muestra: título, tipo, fechas de entrega y estado de entrega:
  - 🟢 **Entregada** — ya subió el PDF.
  - ⚪ **Pendiente** — el plazo sigue abierto y no ha subido nada.
  - 🔴 **No entregada** — el plazo venció sin entrega.
- **Subir PDF** — el estudiante puede subir un archivo PDF como evidencia de su trabajo (máximo 10 MB).
- **Reemplazar PDF** — puede reemplazar una entrega anterior mientras el plazo siga abierto.
- **Descargar** — puede descargar su propia evidencia enviada.

#### Mis Materias
- Tarjetas con cada materia del curso, mostrando:
  - Promedio de Parcial 1, Parcial 2 y Parcial 3 (con barra de progreso visual).
  - Promedio final de la materia.
  - Si aún no hay calificaciones, se indica "Sin calificaciones registradas aún".
- Botón **Descargar PDF** para imprimir o guardar su boletín de notas.

---

## Cálculo de notas

### Promedio de un parcial (por materia)

El promedio de cada parcial se calcula como un **promedio ponderado** según el tipo de actividad:

```
Promedio Parcial = (Σ notas_TAREA × 0.20) / cantidad_TAREAS
                 + nota_PRUEBA × 0.20       (si existe)
                 + nota_PROYECTO × 0.25     (si existe)
                 + nota_EXAMEN × 0.35       (si existe)
```

Si un tipo de actividad no existe en el parcial, su peso se redistribuye proporcionalmente entre los tipos presentes.

> **Ejemplo:** Si un parcial solo tiene TAREA y EXAMEN, el promedio se calcula solo con esos pesos normalizados.

### Promedio final de la materia

```
Promedio Final = (Parcial 1 + Parcial 2 + Parcial 3) / 3
```

### Escala de aprobación

- **Aprobado:** nota ≥ 7.00
- **Reprobado:** nota < 7.00

---

## Flujo típico de uso

```
Administrador                   Profesor                    Estudiante
      │                             │                             │
      ▼                             │                             │
Crear Año Lectivo                   │                             │
      │                             │                             │
      ▼                             │                             │
Crear Cursos + Materias             │                             │
      │                             │                             │
      ▼                             │                             │
Matricular Estudiantes              │                             │
      │                             │                             │
      │                             ▼                             │
      │                    Crear Parciales (1, 2, 3)              │
      │                             │                             │
      │                             ▼                             │
      │                    Crear Actividades                      │
      │                          (con fechas)                     │
      │                             │                             │
      │                             │                             ▼
      │                             │                   Ver Actividades
      │                             │                   Subir PDF evidencia
      │                             │                             │
      │                             ▼                             │
      │                    Ver PDFs → Calificar                   │
      │                             │                             │
      │                             ▼                             ▼
      ▼                    Ver Calificaciones             Ver Mis Materias
Ver Calificaciones                                        Descargar PDF notas
(todos los cursos)
```

---

## Lo que el sistema NO hace (limitaciones actuales)

| Funcionalidad | Estado |
|---|---|
| Envío de correos electrónicos automáticos | ❌ No disponible |
| Notificaciones push en móvil | ❌ No disponible |
| Gestión de asistencia | ❌ No disponible |
| Acceso para padres de familia | ❌ No disponible |
| Chat o mensajería interna entre usuarios | ❌ No disponible |
| Generación de certificados o diplomas | ❌ No disponible |
| Gestión de pagos o pensiones | ❌ No disponible |
| Múltiples instituciones educativas | ❌ No disponible (una sola institución) |
| Aplicación móvil nativa | ❌ Solo web |
| Adjuntar archivos que no sean PDF | ❌ Solo se aceptan PDF (máx. 10 MB) |
| Calificar con escala distinta a 0–10 | ❌ La escala es fija sobre 10 |

---

## Preguntas frecuentes

**¿Puede un estudiante estar en dos cursos del mismo año?**
No. Un estudiante solo puede estar matriculado en un curso por año lectivo activo. Sí puede tener historial de matrículas en años anteriores.

**¿Qué pasa si el profesor no crea un parcial?**
Los estudiantes verán el mensaje "El profesor aún no ha creado el Parcial X" y no podrán ver actividades de ese parcial.

**¿Se puede calificar una actividad vencida?**
Sí. El profesor puede calificar en cualquier momento, independientemente de la fecha límite de entrega.

**¿Un estudiante puede subir una evidencia después del plazo?**
No. El botón de subida se deshabilita cuando la fecha de entrega ha vencido y el estudiante no entregó.

**¿El promedio se calcula automáticamente?**
El promedio se recalcula cuando el profesor guarda una calificación. También puede forzar el recálculo manualmente con el botón "Recalcular promedios".

**¿Cuántas actividades puede tener un parcial?**
Máximo 1 EXAMEN, 1 PRUEBA y 1 PROYECTO por parcial. Las TAREAS no tienen límite de cantidad.

---

*Sistema de Notas — Documentación v1.0*
