# Cronograma de Desarrollo — Sistema de Notas
### Período: 6 de abril de 2026 → 5 de mayo de 2026 (29 días · 6 sprints)

---

## PARTE 1 — Cómo crear el proyecto en Jira (paso a paso)

### Paso 1 — Crear cuenta en Jira

1. Ve a [https://www.atlassian.com/software/jira](https://www.atlassian.com/software/jira)
2. Haz clic en **"Get it free"** (gratuito para equipos de hasta 10 personas).
3. Crea una cuenta con tu correo o inicia sesión con Google.
4. Atlassian te pedirá un nombre para tu **sitio** (es la URL de tu espacio). Ejemplo: `proyecto-notas.atlassian.net`. Este nombre no se puede cambiar después.
5. Selecciona el producto **Jira Software** y haz clic en **"Select"**.
6. Responde las preguntas de configuración inicial y haz clic en **"Get started"**.

---

### Paso 2 — Crear el proyecto xd

1. Haz clic en **"Create project"** (botón azul, arriba a la izquierda).
2. Selecciona la plantilla **"Scrum"** y haz clic en **"Select"**.
3. En el modo de gestión elige **"Team-managed"**.
4. Completa los campos:
   - **Project name:** `Sistema de Notas`
   - **Key:** `SN`
5. Haz clic en **"Create project"**.

---

### Paso 3 — Crear los Épicos (Epics)

**Cómo crear un Épico:**
1. En el menú lateral, haz clic en **"Backlog"**.
2. Busca el panel **"Epics"** en el lateral izquierdo.
3. Haz clic en **"+ Create epic"**, escribe el nombre y presiona Enter.
4. **Importante:** Abre cada Épico y asígnale la **fecha de inicio** y **fecha de fin** de la tabla de abajo. Esto genera el Diagrama de Gantt automáticamente en la pestaña **"Timeline"**.

| # | Nombre del Épico | Fecha inicio | Fecha fin |
|---|---|---|---|
| EP-1 | Autenticación | 06 abr 2026 | 10 abr 2026 |
| EP-2 | Gestión de Usuarios | 06 abr 2026 | 10 abr 2026 |
| EP-3 | Configuración Académica | 11 abr 2026 | 15 abr 2026 |
| EP-4 | Matrículas | 16 abr 2026 | 20 abr 2026 |
| EP-5 | Parciales y Actividades | 21 abr 2026 | 25 abr 2026 |
| EP-6 | Evidencias | 21 abr 2026 | 25 abr 2026 |
| EP-7 | Calificaciones | 26 abr 2026 | 30 abr 2026 |
| EP-8 | Reportes PDF | 01 may 2026 | 05 may 2026 |

---

### Paso 4 — Crear las Historias de Usuario

**Cómo crear una Historia de Usuario:**
1. Haz clic en el botón azul **"Create"** en la barra superior.
2. Tipo: **"Story"**.
3. Completa estos campos:
   - **Summary:** título de la historia
   - **Description:** criterios de aceptación
   - **Epic Link:** el épico al que pertenece (panel derecho)
   - **Story point estimate:** los puntos indicados en la tabla
   - **Start date:** fecha de inicio indicada en el plan diario
   - **Due date:** fecha de fin indicada en el plan diario
4. Haz clic en **"Create"**.

> **Importante:** los campos **Start date** y **Due date** son los que alimentan el Diagrama de Gantt. Sin ellos, las historias no aparecen en la **Timeline**.

---

### Paso 5 — Crear los 6 Sprints

1. En el **Backlog**, desplázate al final y haz clic en **"Create sprint"**.
2. Haz clic en los tres puntos `...` del sprint → **"Edit sprint"** y configura:

| Sprint | Nombre | Inicio | Fin |
|---|---|---|---|
| Sprint 1 | Fundación del sistema | 06 abr 2026 | 10 abr 2026 |
| Sprint 2 | Configuración Académica | 11 abr 2026 | 15 abr 2026 |
| Sprint 3 | Matrículas y Dashboard | 16 abr 2026 | 20 abr 2026 |
| Sprint 4 | Actividades y Evidencias | 21 abr 2026 | 25 abr 2026 |
| Sprint 5 | Calificaciones y Promedios | 26 abr 2026 | 30 abr 2026 |
| Sprint 6 | Reportes y Cierre | 01 may 2026 | 05 may 2026 |

---

### Paso 6 — Mover historias al Sprint

En el **Backlog**, arrastra cada historia al sprint que le corresponde según el plan de abajo, o haz clic derecho → **"Move to sprint"**.

---

### Paso 7 — Iniciar el Sprint y usar el tablero

1. Haz clic en **"Start sprint"** en el Sprint 1.
2. Confirma fechas y haz clic en **"Start"**.
3. Ve a **"Board"** en el menú lateral. Verás 3 columnas: **To Do / In Progress / Done**.
4. Arrastra cada historia según su estado real.
5. Al terminar todas las historias → **"Complete sprint"** → inicia el siguiente.

---

### Paso 8 — Ver el Diagrama de Gantt

1. En el menú lateral haz clic en **"Timeline"**.
2. Jira muestra automáticamente las barras de los Épicos e Historias en un calendario.
3. Puedes expandir cada Épico para ver sus historias dentro.
4. El gráfico se actualiza en tiempo real cuando cambias fechas o completas tareas.

---

## PARTE 2 — Historias de Usuario

---

### EP-1 — Autenticación

**HU-001 — Inicio de sesión**
> Como **usuario**, quiero iniciar sesión con mi correo y contraseña, para acceder a las funciones de mi rol de forma segura.

*Criterios de aceptación:*
- Formulario con email y contraseña.
- Credenciales incorrectas muestran mensaje de error claro.
- Credenciales correctas redirigen al dashboard del rol correspondiente.
- La sesión persiste hasta cerrar sesión manualmente.

*Story Points:* **5** | *Inicio:* 06 abr | *Fin:* 07 abr | *Épico:* EP-1

---

**HU-002 — Cierre de sesión**
> Como **usuario**, quiero cerrar sesión en cualquier momento, para proteger mis datos en equipos compartidos.

*Criterios de aceptación:*
- Botón visible de "Cerrar sesión" en la interfaz.
- Al cerrar sesión, el token se invalida y redirige al login.
- Si el token expira, el sistema redirige automáticamente.

*Story Points:* **2** | *Inicio:* 08 abr | *Fin:* 08 abr | *Épico:* EP-1

---

### EP-2 — Gestión de Usuarios

**HU-003 — Crear usuario**
> Como **administrador**, quiero crear cuentas con nombre, cédula, email, contraseña y rol, para dar acceso al sistema.

*Criterios de aceptación:*
- Formulario con todos los campos requeridos con validaciones.
- No permite cédula ni email duplicados.
- El nuevo usuario aparece en la lista de forma inmediata.

*Story Points:* **5** | *Inicio:* 06 abr | *Fin:* 08 abr | *Épico:* EP-2

---

**HU-004 — Editar usuario**
> Como **administrador**, quiero editar los datos de cualquier usuario, para corregir información.

*Criterios de aceptación:*
- Al hacer clic en editar, el formulario carga los datos actuales.
- Se puede cambiar nombre, email y contraseña.
- Los cambios se reflejan de inmediato en la lista.

*Story Points:* **3** | *Inicio:* 09 abr | *Fin:* 09 abr | *Épico:* EP-2

---

**HU-005 — Activar / desactivar usuario**
> Como **administrador**, quiero desactivar la cuenta de un usuario sin eliminarla, para mantener el historial sin permitir acceso.

*Criterios de aceptación:*
- Toggle de estado en la lista de usuarios.
- Un usuario desactivado no puede iniciar sesión.
- El historial de calificaciones permanece intacto.

*Story Points:* **3** | *Inicio:* 10 abr | *Fin:* 10 abr | *Épico:* EP-2

---

### EP-3 — Configuración Académica

**HU-006 — Crear año lectivo**
> Como **administrador**, quiero crear períodos académicos con fecha de inicio y fin, para organizar cursos y calificaciones por año.

*Criterios de aceptación:*
- Formulario con fecha de inicio, fecha de fin y estado.
- No permite dos años activos simultáneamente.

*Story Points:* **3** | *Inicio:* 11 abr | *Fin:* 11 abr | *Épico:* EP-3

---

**HU-007 — Activar año lectivo**
> Como **administrador**, quiero marcar un año como activo, para que sea el período operativo actual.

*Criterios de aceptación:*
- Solo puede haber un año activo; al activar uno el anterior se desactiva.
- El año activo se usa automáticamente al matricular y crear cursos.

*Story Points:* **2** | *Inicio:* 12 abr | *Fin:* 12 abr | *Épico:* EP-3

---

**HU-008 — Gestionar materias**
> Como **administrador**, quiero crear y editar materias, para asignarlas a los cursos.

*Criterios de aceptación:*
- CRUD completo de materias.
- No se puede eliminar una materia asignada a un curso activo.
- Las materias son reutilizables entre años lectivos.

*Story Points:* **3** | *Inicio:* 12 abr | *Fin:* 13 abr | *Épico:* EP-3

---

**HU-009 — Crear cursos**
> Como **administrador**, quiero crear cursos dentro de un año lectivo, para organizar a los estudiantes en grupos.

*Criterios de aceptación:*
- Formulario con nombre del curso y año lectivo.
- El curso aparece en la lista filtrado por año lectivo.

*Story Points:* **3** | *Inicio:* 13 abr | *Fin:* 14 abr | *Épico:* EP-3

---

**HU-010 — Asignar materias a un curso**
> Como **administrador**, quiero asignar y quitar materias de un curso, para definir qué se evalúa en ese grupo.

*Criterios de aceptación:*
- Desde el detalle del curso se agrega o quita materias.
- Los cambios se reflejan inmediatamente.

*Story Points:* **3** | *Inicio:* 14 abr | *Fin:* 15 abr | *Épico:* EP-3

---

### EP-4 — Matrículas

**HU-011 — Matricular estudiante**
> Como **administrador**, quiero inscribir a un estudiante en un curso, para que acceda a actividades y calificaciones.

*Criterios de aceptación:*
- Selector de curso y estudiante (solo no matriculados ese año).
- Valida que el estudiante no esté en otro curso del mismo año.
- La matrícula aparece en la lista del curso.

*Story Points:* **5** | *Inicio:* 16 abr | *Fin:* 17 abr | *Épico:* EP-4

---

**HU-012 — Trasladar estudiante**
> Como **administrador**, quiero trasladar a un estudiante de un curso a otro, para gestionar cambios de sección.

*Criterios de aceptación:*
- El traslado elimina la matrícula anterior y crea una nueva.
- El historial de calificaciones de años anteriores no se altera.

*Story Points:* **5** | *Inicio:* 18 abr | *Fin:* 19 abr | *Épico:* EP-4

---

**HU-013 — Ver participantes del curso**
> Como **profesor**, quiero ver la lista de estudiantes matriculados en mi curso, para conocer a mis alumnos.

*Criterios de aceptación:*
- Lista con nombre, cédula, email y estado de cuenta.
- Solo muestra estudiantes del año lectivo activo.

*Story Points:* **2** | *Inicio:* 20 abr | *Fin:* 20 abr | *Épico:* EP-4

---

### EP-5 — Parciales y Actividades

**HU-014 — Crear parciales**
> Como **profesor**, quiero crear los 3 parciales de un curso-materia desde mi dashboard, para estructurar el período de evaluación.

*Criterios de aceptación:*
- Botón de creación masiva de los 3 parciales.
- Si ya existen, no los duplica.

*Story Points:* **5** | *Inicio:* 21 abr | *Fin:* 21 abr | *Épico:* EP-5

---

**HU-015 — Crear actividad**
> Como **profesor**, quiero crear actividades evaluables dentro de un parcial, para definir las tareas que los estudiantes deben entregar.

*Criterios de aceptación:*
- Formulario con: título, descripción, tipo, fecha inicio, fecha límite.
- Máximo 1 EXAMEN, 1 PRUEBA y 1 PROYECTO por parcial. TAREAS sin límite.
- Escala de 0 a 10 puntos (fija).

*Story Points:* **8** | *Inicio:* 21 abr | *Fin:* 22 abr | *Épico:* EP-5

---

**HU-016 — Editar y eliminar actividad**
> Como **profesor**, quiero editar o eliminar una actividad, para corregir errores de configuración.

*Criterios de aceptación:*
- Se puede editar título, descripción y fechas.
- Al eliminar se eliminan también sus calificaciones asociadas.

*Story Points:* **3** | *Inicio:* 23 abr | *Fin:* 23 abr | *Épico:* EP-5

---

**HU-017 — Ver actividades como estudiante**
> Como **estudiante**, quiero ver las actividades de cada parcial por materia, para saber qué debo entregar y cuándo.

*Criterios de aceptación:*
- Vista organizada por materia y por parcial.
- Cada actividad muestra tipo, fechas y estado: Entregada (verde) / Pendiente (gris) / No entregada (rojo).

*Story Points:* **5** | *Inicio:* 23 abr | *Fin:* 24 abr | *Épico:* EP-5

---

### EP-6 — Evidencias

**HU-018 — Subir evidencia PDF**
> Como **estudiante**, quiero subir un PDF como evidencia de una actividad, para demostrar que completé la tarea.

*Criterios de aceptación:*
- Solo PDF, máximo 10 MB.
- Solo disponible mientras el plazo no haya vencido.
- Al subir correctamente, el estado cambia a "Entregada".

*Story Points:* **8** | *Inicio:* 22 abr | *Fin:* 24 abr | *Épico:* EP-6

---

**HU-019 — Reemplazar evidencia**
> Como **estudiante**, quiero reemplazar mi evidencia antes del plazo, para corregir una entrega equivocada.

*Criterios de aceptación:*
- Si ya entregué, el botón cambia a "Reemplazar".
- Solo disponible si el plazo no ha vencido.

*Story Points:* **3** | *Inicio:* 25 abr | *Fin:* 25 abr | *Épico:* EP-6

---

**HU-020 — Descargar evidencia propia**
> Como **estudiante**, quiero descargar mi evidencia enviada, para verificar que subí el archivo correcto.

*Criterios de aceptación:*
- Botón "Descargar" junto a cada actividad entregada.
- Disponible incluso si el plazo venció.

*Story Points:* **3** | *Inicio:* 25 abr | *Fin:* 25 abr | *Épico:* EP-6

---

**HU-021 — Ver evidencias de estudiantes (profesor)**
> Como **profesor**, quiero ver y descargar el PDF de cada estudiante al calificar, para revisar el trabajo antes de asignar la nota.

*Criterios de aceptación:*
- En la pantalla de calificación cada estudiante indica si entregó o no.
- Botones "Ver PDF" y "Descargar" por cada entrega.

*Story Points:* **5** | *Inicio:* 24 abr | *Fin:* 25 abr | *Épico:* EP-6

---

### EP-7 — Calificaciones

**HU-022 — Calificar actividad**
> Como **profesor**, quiero asignar una nota (0–10) a cada estudiante en cada actividad, para registrar su desempeño.

*Criterios de aceptación:*
- Nota entre 0 y 10 con decimales. Comentario opcional.
- Al guardar, el promedio del parcial se recalcula automáticamente.
- Se puede editar una nota ya registrada.

*Story Points:* **8** | *Inicio:* 26 abr | *Fin:* 27 abr | *Épico:* EP-7

---

**HU-023 — Ver promedios por parcial (profesor)**
> Como **profesor**, quiero ver el promedio ponderado por parcial y materia de cada estudiante, para hacer seguimiento del rendimiento.

*Criterios de aceptación:*
- Tabla con: Parcial 1, Parcial 2, Parcial 3, Promedio Final.
- Ponderación: TAREA 20%, PRUEBA 20%, PROYECTO 25%, EXAMEN 35%.
- Botón de recálculo manual disponible.

*Story Points:* **8** | *Inicio:* 27 abr | *Fin:* 28 abr | *Épico:* EP-7

---

**HU-024 — Ver calificaciones como estudiante**
> Como **estudiante**, quiero ver mi promedio por parcial y final en cada materia, para conocer mi rendimiento.

*Criterios de aceptación:*
- Tarjetas por materia con barra de progreso por parcial.
- Promedio final visible. Sin notas muestra "Sin calificaciones registradas aún".

*Story Points:* **5** | *Inicio:* 29 abr | *Fin:* 29 abr | *Épico:* EP-7

---

**HU-025 — Ver calificaciones como administrador**
> Como **administrador**, quiero ver el promedio final de todos los estudiantes de un curso, para supervisar el rendimiento general.

*Criterios de aceptación:*
- Filtro: Año Lectivo → Curso. El año activo se pre-selecciona.
- Tabla: Estudiante | Materia 1 | Materia 2 | ... | Estado.
- Estado: Aprobado (todas ≥ 7) / Reprobado / Pendiente.

*Story Points:* **8** | *Inicio:* 28 abr | *Fin:* 30 abr | *Épico:* EP-7

---

### EP-8 — Reportes PDF

**HU-026 — Descargar PDF (profesor)**
> Como **profesor**, quiero descargar en PDF la tabla de calificaciones de mi curso, para tener un respaldo imprimible.

*Story Points:* **3** | *Inicio:* 01 may | *Fin:* 02 may | *Épico:* EP-8

---

**HU-027 — Descargar PDF (administrador)**
> Como **administrador**, quiero descargar en PDF la tabla general de notas del curso, para informes institucionales.

*Story Points:* **2** | *Inicio:* 02 may | *Fin:* 02 may | *Épico:* EP-8

---

**HU-028 — Descargar PDF notas propias (estudiante)**
> Como **estudiante**, quiero descargar en PDF mi boletín de notas, para tener un comprobante de mis calificaciones.

*Story Points:* **2** | *Inicio:* 03 may | *Fin:* 03 may | *Épico:* EP-8

---

## PARTE 3 — Planificación día a día

> Esta es la guía exacta para ingresar en Jira. Cada día indica qué historias estaban **En Progreso** ese día.

---

### Sprint 1 — Fundación del sistema (6 al 10 de abril)

| Día | Fecha | Tareas realizadas | Historias |
|---|---|---|---|
| Día 1 | Lunes 6 abr | Configuración del proyecto: base de datos PostgreSQL + Prisma, estructura NestJS, estructura Next.js. Inicio del backend de autenticación y usuarios. | HU-001, HU-003 |
| Día 2 | Martes 7 abr | Backend login completo con JWT. Frontend: pantalla de login y redirección por rol. CRUD de usuarios en el backend. | HU-001, HU-003 |
| Día 3 | Miércoles 8 abr | Frontend: formulario de creación de usuarios. Cierre de sesión con invalidación de token. | HU-002, HU-003 |
| Día 4 | Jueves 9 abr | Formulario de edición de usuario. Validaciones de cédula y email duplicado. | HU-004 |
| Día 5 | Viernes 10 abr | Toggle de activar/desactivar cuenta. Pruebas del Sprint 1. | HU-005 |

**Al final del Sprint 1 debe estar listo:**
- Login funcional para los 3 roles
- CRUD completo de usuarios desde el panel administrador

---

### Sprint 2 — Configuración Académica (11 al 15 de abril)

| Día | Fecha | Tareas realizadas | Historias |
|---|---|---|---|
| Día 6 | Sábado 11 abr | Módulo años lectivos: crear y listar períodos académicos. Lógica de solo un año activo simultáneo. | HU-006 |
| Día 7 | Domingo 12 abr | Activar/desactivar año lectivo. Inicio del módulo de materias (backend). | HU-007, HU-008 |
| Día 8 | Lunes 13 abr | CRUD completo de materias en frontend. Inicio del módulo cursos. | HU-008, HU-009 |
| Día 9 | Martes 14 abr | Creación de cursos vinculados a un año lectivo. Inicio de asignación de materias a cursos. | HU-009, HU-010 |
| Día 10 | Miércoles 15 abr | Asignación y remoción de materias de un curso. Dashboard del administrador. Pruebas del Sprint 2. | HU-010 |

**Al final del Sprint 2 debe estar listo:**
- Gestión completa de años lectivos, materias y cursos
- Relación curso ↔ materias operativa

---

### Sprint 3 — Matrículas y Dashboard (16 al 20 de abril)

| Día | Fecha | Tareas realizadas | Historias |
|---|---|---|---|
| Día 11 | Jueves 16 abr | Módulo matrículas (backend): validación de un curso por año lectivo activo. | HU-011 |
| Día 12 | Viernes 17 abr | Frontend de matrículas: formulario para inscribir estudiantes. Dashboard del profesor con sus cursos asignados. | HU-011 |
| Día 13 | Sábado 18 abr | Lógica de traslado de estudiante: baja del curso origen + alta en curso destino. | HU-012 |
| Día 14 | Domingo 19 abr | Frontend de traslado. Vista básica "Mis Materias" del estudiante. | HU-012 |
| Día 15 | Lunes 20 abr | Página "Participantes" del profesor con lista de alumnos del curso. Pruebas del Sprint 3. | HU-013 |

**Al final del Sprint 3 debe estar listo:**
- Estudiantes matriculados y asignados a cursos
- Profesor ve sus cursos y lista de alumnos
- Estudiante ve su curso y materias

---

### Sprint 4 — Actividades y Evidencias (21 al 25 de abril)

| Día | Fecha | Tareas realizadas | Historias |
|---|---|---|---|
| Día 16 | Martes 21 abr | Módulo parciales: creación de los 3 parciales desde el dashboard. Inicio del módulo actividades (backend con validaciones de límite por tipo). | HU-014, HU-015 |
| Día 17 | Miércoles 22 abr | Frontend de creación de actividades. Inicio del módulo evidencias: carga de PDF en base de datos (multipart). | HU-015, HU-018 |
| Día 18 | Jueves 23 abr | Editar y eliminar actividad. Vista de actividades del estudiante con indicadores de estado (verde/gris/rojo). | HU-016, HU-017 |
| Día 19 | Viernes 24 abr | Frontend de subida de PDF para el estudiante. Vista del profesor para ver evidencias al calificar. | HU-017, HU-018, HU-021 |
| Día 20 | Sábado 25 abr | Reemplazar evidencia enviada. Descarga de evidencia propia por el estudiante. Pruebas del Sprint 4. | HU-019, HU-020, HU-021 |

**Al final del Sprint 4 debe estar listo:**
- Parciales y actividades gestionables por el profesor
- Estudiante puede subir, reemplazar y descargar su evidencia PDF
- Profesor puede ver y descargar los PDFs de los estudiantes

---

### Sprint 5 — Calificaciones y Promedios (26 al 30 de abril)

| Día | Fecha | Tareas realizadas | Historias |
|---|---|---|---|
| Día 21 | Domingo 26 abr | Módulo calificaciones (backend): registrar nota por actividad y estudiante. Lógica de cálculo ponderado (TAREA 20%, PRUEBA 20%, PROYECTO 25%, EXAMEN 35%). | HU-022 |
| Día 22 | Lunes 27 abr | Frontend de calificación: flujo 3 pasos (Parcial → Actividad → Lista de estudiantes con notas). Módulo promedios (backend). | HU-022, HU-023 |
| Día 23 | Martes 28 abr | Vista de promedios para el profesor (Promedio Final, Por Parciales, Por Actividad). Inicio de la vista del administrador. | HU-023, HU-025 |
| Día 24 | Miércoles 29 abr | Vista "Mis Materias" del estudiante completa con barras de progreso y promedios. | HU-024 |
| Día 25 | Jueves 30 abr | Vista del administrador completa: filtro Año → Curso → tabla con columna Estado (Aprobado/Reprobado/Pendiente). Pruebas del Sprint 5. | HU-025 |

**Al final del Sprint 5 debe estar listo:**
- Profesor califica y ve promedios por parcial y final
- Estudiante ve sus notas y progreso
- Administrador ve el resumen completo del curso

---

### Sprint 6 — Reportes y Cierre (1 al 5 de mayo)

| Día | Fecha | Tareas realizadas | Historias |
|---|---|---|---|
| Día 26 | Viernes 1 may | Botón "Descargar PDF" en la vista de calificaciones del profesor. CSS de impresión (@media print) para ocultar menú lateral y controles. | HU-026 |
| Día 27 | Sábado 2 may | Botón "Descargar PDF" en la vista del administrador con encabezado de curso y año lectivo en el PDF. | HU-027 |
| Día 28 | Domingo 3 may | Botón "Descargar PDF" en "Mis Materias" del estudiante. Pruebas integrales de los 3 flujos de usuario. | HU-028 |
| Día 29 | Lunes 4 may | Corrección de bugs encontrados en pruebas. Revisión de seguridad (permisos por rol en cada endpoint). | — |
| Día 30 | Martes 5 may | Redacción del Manual de Usuario. Revisión final. Entrega del proyecto. ✅ | — |

**Al final del Sprint 6 debe estar listo:**
- PDF descargable desde los 3 roles
- Sistema probado en todos los flujos
- Manual de usuario redactado
- Proyecto entregado

---

## Diagrama de Gantt

```
ÉPICO / HISTORIA         6abr 8abr 10abr 13abr 15abr 17abr 20abr 22abr 25abr 27abr 30abr 2may 5may
                           |    |     |     |     |     |     |     |     |     |     |     |    |
EP-1 Autenticación        ████████████
EP-2 Gestión Usuarios     ████████████
EP-3 Config. Académica              █████████████
EP-4 Matrículas                                 █████████████
EP-5 Parciales/Actividades                                  █████████████
EP-6 Evidencias                                             █████████████
EP-7 Calificaciones                                                     █████████████
EP-8 Reportes PDF                                                                   █████████
                           |    |     |     |     |     |     |     |     |     |     |     |    |
SPRINT 1                  ████████████
SPRINT 2                              █████████████
SPRINT 3                                           █████████████
SPRINT 4                                                        █████████████
SPRINT 5                                                                    █████████████
SPRINT 6                                                                                ████████
```

> En Jira este diagrama se ve de forma interactiva en **"Timeline"** con colores por Épico y barras arrastrables con las fechas exactas.

---

## Resumen ejecutivo

| Métrica | Valor |
|---|---|
| Fecha de inicio | Lunes 6 de abril de 2026 |
| Fecha de entrega | Martes 5 de mayo de 2026 |
| Duración total | 30 días (29 días + entrega) |
| Número de sprints | 6 (5 días cada uno) |
| Historias de usuario | 28 |
| Story points totales | 162 |
| Roles del sistema | 3 (Administrador, Profesor, Estudiante) |
| Épicos desarrollados | 8 |

---

## Glosario Jira

| Término | Significado |
|---|---|
| **Epic** | Agrupación grande de trabajo (ej. "Calificaciones") |
| **Story** | Unidad de funcionalidad desde la perspectiva del usuario |
| **Sprint** | Período de trabajo de 5 días con objetivos definidos |
| **Backlog** | Lista completa de todo el trabajo pendiente |
| **Story Points** | Estimación de esfuerzo: 1=trivial · 3=1 día · 5=2 días · 8=3-4 días |
| **Board** | Tablero To Do / In Progress / Done del sprint activo |
| **Timeline** | Vista de Gantt automática generada por Jira con las fechas de los Épicos e Historias |

---

*Sistema de Notas — Cronograma v3.0 · Período: 06 abr – 05 may 2026*
