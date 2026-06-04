# Manual de Usuario — Sistema de Gestión de Notas

> Versión 1.0 · Proyecto Notas v2

---

## Tabla de Contenidos

1. [Introducción](#1-introducción)
2. [Requisitos de acceso](#2-requisitos-de-acceso)
3. [Inicio de sesión](#3-inicio-de-sesión)
4. [Recuperación de contraseña](#4-recuperación-de-contraseña)
5. [Roles del sistema](#5-roles-del-sistema)
6. [Guía del Administrador](#6-guía-del-administrador)
7. [Guía del Profesor](#7-guía-del-profesor)
8. [Guía del Estudiante](#8-guía-del-estudiante)
9. [Preguntas frecuentes](#9-preguntas-frecuentes)

---

## 1. Introducción

El **Sistema de Gestión de Notas** es una plataforma web diseñada para instituciones educativas de nivel básico y bachillerato. Permite gestionar el ciclo académico completo: desde la creación de cursos y matrículas hasta el registro de calificaciones, cálculo de promedios y subida de evidencias.

El sistema tiene tres tipos de usuarios con accesos diferenciados: **Administrador**, **Profesor** y **Estudiante**.

---

## 2. Requisitos de acceso

- Navegador web actualizado (Google Chrome, Firefox, Edge o Safari — versión de los últimos 2 años)
- Conexión a internet
- Correo electrónico institucional registrado en el sistema
- No se requiere instalar ningún programa adicional

---

## 3. Inicio de sesión

1. Abre el navegador y ve a la dirección del sistema: `https://notas-v2-five.vercel.app`
2. En la pantalla de inicio de sesión ingresa:
   - **Correo electrónico:** tu email institucional (ejemplo: `admin@escuela.ec`)
   - **Contraseña:** la contraseña asignada por el administrador
3. Haz clic en el botón **"Ingresar"**.
4. El sistema te redirigirá automáticamente al dashboard correspondiente a tu rol.

> **Nota:** Si ingresas datos incorrectos tres veces consecutivas, el sistema mostrará un mensaje de error. Contacta al administrador si no recuerdas tu contraseña.

---

## 4. Recuperación de contraseña

Si olvidaste tu contraseña:

1. En la pantalla de inicio de sesión, haz clic en **"¿Olvidaste tu contraseña?"**
2. Ingresa tu correo electrónico institucional y haz clic en **"Enviar"**
3. Revisa tu bandeja de entrada — recibirás un correo con un enlace de recuperación
4. Haz clic en el enlace del correo (válido por tiempo limitado)
5. Ingresa y confirma tu nueva contraseña
6. Vuelve al inicio de sesión con las nuevas credenciales

---

## 5. Roles del sistema

El sistema tiene tres roles. Cada usuario tiene asignado uno solo al momento de ser creado por el administrador.

| Rol | Descripción |
|-----|-------------|
| **Administrador** | Gestiona la estructura académica: usuarios, cursos, materias, matrículas y docencias |
| **Profesor** | Gestiona el contenido académico: parciales, actividades, calificaciones y evidencias |
| **Estudiante** | Consulta sus calificaciones, promedios y sube evidencias de sus actividades |

---

## 6. Guía del Administrador

### Lo que el Administrador PUEDE hacer

| Módulo | Acciones permitidas |
|--------|-------------------|
| **Usuarios** | Crear, ver, editar y eliminar usuarios; cambiar su estado (Activo / Inactivo / Bloqueado); asignar y quitar roles |
| **Años lectivos** | Crear, ver, editar y eliminar años lectivos; cambiar su estado (Planificado / Activo / Finalizado) |
| **Cursos** | Crear, ver, editar y eliminar cursos; asignar y quitar materias de un curso |
| **Materias** | Crear, ver, editar y eliminar materias |
| **Matrículas** | Matricular y desmatricular estudiantes en cursos |
| **Docencias** | Asignar y remover profesores de materias dentro de un curso |
| **Jobs** | Ejecutar el proceso de retención/eliminación de evidencias de un año lectivo finalizado |
| **Contraseña** | Cambiar su propia contraseña |

### Lo que el Administrador NO PUEDE hacer

- Crear actividades académicas (tareas, exámenes, proyectos) — esa es función del Profesor
- Registrar calificaciones de estudiantes — esa es función del Profesor
- Subir evidencias en PDF — esa es función del Estudiante
- Ver el detalle de calificaciones individuales de los estudiantes

---

### 6.1 Gestionar usuarios

1. En el menú lateral selecciona **"Usuarios"**
2. Verás la lista de todos los usuarios registrados con su nombre, correo, rol y estado
3. Para **crear un usuario**: haz clic en **"Nuevo usuario"**, completa el formulario y guarda
   - Cédula (ID único, 10 dígitos)
   - Nombre completo
   - Correo electrónico
   - Contraseña temporal
   - Rol: Administrador, Profesor o Estudiante
   - Estado: Activo
4. Para **editar**: haz clic en el ícono de lápiz junto al usuario
5. Para **cambiar estado** (bloquear, inactivar): edita el usuario y cambia el campo de estado
6. Para **eliminar**: haz clic en el ícono de papelera y confirma la acción

> **Importante:** Eliminar un usuario es una acción irreversible. Considera cambiar el estado a "Inactivo" si solo quieres suspender el acceso temporalmente.

---

### 6.2 Gestionar años lectivos

1. En el menú selecciona **"Años Lectivos"**
2. Para crear uno nuevo, ingresa la fecha de inicio, fecha final y estado inicial (`Planificado`)
3. Solo puede haber un año lectivo en estado `Activo` a la vez
4. Al finalizar el período académico, cambia el estado a `Finalizado`

---

### 6.3 Gestionar cursos y materias

**Crear un curso:**
1. Ve a **"Cursos"** → **"Nuevo curso"**
2. Selecciona el año lectivo activo e ingresa el nombre del curso (ej: `8vo EGB A`)
3. Guarda

**Asignar materias al curso:**
1. Abre el curso creado
2. Haz clic en **"Agregar materia"** y selecciona de la lista
3. Repite para cada materia del curso

---

### 6.4 Gestionar matrículas

1. Ve a **"Matrículas"**
2. Selecciona el curso
3. Haz clic en **"Matricular estudiante"** y busca al estudiante por nombre o cédula
4. Para desmatricular, selecciona al estudiante de la lista y haz clic en **"Desmatricular"**

---

### 6.5 Asignar docencias

1. Ve a **"Docencias"**
2. Haz clic en **"Asignar docencia"**
3. Selecciona el profesor, el curso y la materia que impartirá
4. Guarda

---

## 7. Guía del Profesor

### Lo que el Profesor PUEDE hacer

| Módulo | Acciones permitidas |
|--------|-------------------|
| **Parciales** | Crear los 3 parciales de una materia-curso; ver y eliminar parciales |
| **Actividades** | Crear, ver, editar y eliminar actividades (tareas, exámenes, proyectos, lecciones) |
| **Calificaciones** | Registrar notas individuales o masivas (todo el curso a la vez); editar calificaciones ya registradas |
| **Evidencias** | Ver y descargar las evidencias en PDF subidas por los estudiantes |
| **Promedios** | Ver promedios por materia y general de los estudiantes; ver el ranking del curso |
| **Notificaciones** | Ver, marcar como leídas y eliminar sus notificaciones |
| **Contraseña** | Cambiar su propia contraseña |

### Lo que el Profesor NO PUEDE hacer

- Crear o modificar usuarios, cursos, materias o años lectivos — esa es función del Administrador
- Matricular o desmatricular estudiantes
- Asignar docencias
- Subir evidencias en nombre de un estudiante
- Ver calificaciones de materias que no imparte
- Ejecutar jobs administrativos de retención de evidencias

---

### 7.1 Crear parciales

1. En el menú selecciona **"Parciales"**
2. Selecciona el curso y la materia que impartes
3. Haz clic en **"Crear los 3 parciales"** para generarlos todos a la vez, o **"Nuevo parcial"** para crearlos uno a uno
4. Los parciales numerados (1, 2 y 3) quedarán disponibles para agregar actividades

---

### 7.2 Crear actividades

1. Ve a **"Actividades"** y selecciona el parcial correspondiente
2. Haz clic en **"Nueva actividad"**
3. Completa el formulario:
   - **Tipo:** Tarea / Examen / Proyecto / Lección
   - **Título**
   - **Descripción** (instrucciones para los estudiantes)
   - **Fecha de inicio de entrega**
   - **Fecha límite de entrega**
   - **Valor máximo** (puntos)
4. Guarda — los estudiantes recibirán una notificación automática

---

### 7.3 Registrar calificaciones

**Calificación individual:**
1. Ve a **"Calificaciones"** → selecciona la actividad
2. Busca al estudiante y haz clic en **"Calificar"**
3. Ingresa la nota y un comentario opcional
4. Guarda

**Calificación masiva (todo el curso):**
1. Ve a **"Calificaciones"** → selecciona la actividad
2. Haz clic en **"Calificar curso completo"**
3. Aparecerá la lista de todos los estudiantes — ingresa la nota de cada uno
4. Haz clic en **"Guardar todas"**

---

### 7.4 Ver y descargar evidencias

1. Ve a **"Evidencias"** y selecciona la actividad
2. Verás la lista de estudiantes que subieron su evidencia en PDF
3. Haz clic en **"Descargar"** para obtener el archivo PDF de ese estudiante

---

## 8. Guía del Estudiante

### Lo que el Estudiante PUEDE hacer

| Módulo | Acciones permitidas |
|--------|-------------------|
| **Calificaciones** | Ver sus propias notas por actividad, parcial y materia |
| **Promedios** | Ver su promedio por materia y su promedio general; ver su posición en el ranking del curso |
| **Evidencias** | Subir un archivo PDF como evidencia de una actividad; ver sus evidencias subidas; eliminar sus propias evidencias |
| **Notificaciones** | Ver notificaciones de nuevas actividades y calificaciones; marcarlas como leídas; eliminarlas |
| **Contraseña** | Cambiar su propia contraseña |

### Lo que el Estudiante NO PUEDE hacer

- Ver calificaciones de otros estudiantes
- Crear, editar o eliminar actividades
- Registrar o modificar calificaciones
- Gestionar usuarios, cursos, materias o años lectivos
- Ver las evidencias subidas por otros estudiantes
- Ejecutar jobs administrativos

---

### 8.1 Ver mis calificaciones

1. Inicia sesión — el dashboard mostrará un resumen de tus notas recientes
2. Ve a **"Mis calificaciones"** en el menú lateral
3. Selecciona el año lectivo y la materia para filtrar
4. Verás la lista de actividades con tu nota y el comentario del profesor

---

### 8.2 Ver mis promedios

1. Ve a **"Mis promedios"** en el menú lateral
2. Verás el promedio de cada parcial por materia
3. El **promedio final** de cada materia aparece al final de la fila
4. El **promedio general** consolida todas tus materias del año lectivo

---

### 8.3 Subir una evidencia

1. Ve a **"Mis actividades"** y busca la actividad para la que deseas subir evidencia
2. Haz clic en **"Subir evidencia"**
3. Selecciona el archivo PDF desde tu dispositivo (máximo **10 MB**)
4. Confirma la subida — recibirás una notificación de confirmación

> **Requisitos del archivo:**
> - Formato: PDF únicamente
> - Tamaño máximo: 10 MB
> - Solo se permite una evidencia por actividad

---

### 8.4 Eliminar una evidencia

Si necesitas reemplazar una evidencia subida por error:

1. Ve a **"Mis evidencias"**
2. Localiza la evidencia que deseas eliminar
3. Haz clic en el ícono de papelera y confirma
4. Una vez eliminada, podrás subir el archivo correcto

---

## 9. Preguntas frecuentes

**¿Por qué no puedo iniciar sesión si mi contraseña es correcta?**
Tu cuenta podría estar en estado "Inactivo" o "Bloqueado". Contacta al administrador del sistema para que reactive tu cuenta.

---

**¿Por qué no veo ningún curso ni materia en mi panel?**
El administrador aún no te ha asignado a un curso. Si eres profesor, verifica que tengas una docencia asignada. Si eres estudiante, verifica que estés matriculado.

---

**¿Puedo subir evidencias en formato Word o imagen?**
No. El sistema acepta únicamente archivos en formato **PDF**. Convierte tu documento antes de subirlo.

---

**¿Qué pasa si subo la evidencia equivocada?**
Elimina la evidencia incorrecta desde **"Mis evidencias"** y sube el archivo correcto. Asegúrate de hacerlo antes de la fecha límite de entrega.

---

**¿Por qué mi promedio no se actualiza después de que el profesor me calificó?**
El promedio se recalcula manualmente por el profesor después de registrar todas las calificaciones del parcial. Si el promedio sigue sin aparecer, comunícate con tu profesor.

---

**¿Puedo cambiar mi correo electrónico?**
No. El correo electrónico solo puede ser modificado por el administrador. Contacta al administrador para solicitar el cambio.

---

**¿Qué significa el estado "Bloqueado" en mi cuenta?**
El administrador ha bloqueado temporalmente el acceso a tu cuenta. No podrás iniciar sesión hasta que el administrador cambie el estado a "Activo".

---

*Para soporte técnico, contacta al administrador del sistema de tu institución.*
