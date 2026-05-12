# Análisis de Puntos de Función — Sistema de Gestión de Notas
### Plataforma para Instituciones Educativas

> **Sistema:** Gestión de Notas
> **Stack tecnológico:** Next.js · NestJS · PostgreSQL · Prisma ORM
> **Método aplicado:** IFPUG (International Function Point Users Group) — estimación por tipo de componente funcional.

---

## Referencia de pesos por tipo y complejidad (estándar IFPUG)

| Tipo de Componente | Descripción | Baja | Media | Alta |
|---|---|:---:|:---:|:---:|
| **EI** — Entradas Externas | Datos que ingresan al sistema (formularios, uploads) | 3 | 4 | 6 |
| **EO** — Salidas Externas | Datos que salen del sistema (reportes, PDFs, cálculos derivados) | 4 | 5 | 7 |
| **EQ** — Consultas Externas | Consultas sin transformación de datos (listados, búsquedas) | 3 | 4 | 6 |
| **ILF** — Archivos Lógicos Internos | Entidades persistidas en la base de datos | 7 | 10 | 15 |

---

## Tabla de Puntos de Función por Historia de Usuario

| ID | Historia de Usuario | EI | EO | EQ | ILF | Complejidad | PF Estimados |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **HU-01** | Como usuario quiero iniciar sesión con email y contraseña para acceder al sistema con mi rol correspondiente. | 1 | 1 | 1 | 1 | Baja | **14** |
| **HU-02** | Como usuario quiero cerrar sesión para invalidar mi token y proteger el acceso en equipos compartidos. | 1 | 0 | 1 | 0 | Baja | **6** |
| **HU-03** | Como administrador quiero crear, editar y desactivar cuentas de usuario con rol asignado (Admin, Profesor, Estudiante). | 3 | 1 | 1 | 1 | Media | **24** |
| **HU-04** | Como administrador quiero crear y gestionar años lectivos, marcando uno como activo para el período operativo actual. | 2 | 1 | 1 | 1 | Baja | **20** |
| **HU-05** | Como administrador quiero crear cursos, crear materias y asignar materias a cursos dentro de un año lectivo. | 3 | 1 | 2 | 2 | Media | **36** |
| **HU-06** | Como administrador quiero matricular estudiantes en cursos y trasladarlos entre secciones conservando el historial. | 2 | 1 | 2 | 2 | Media | **31** |
| **HU-07** | Como profesor quiero crear los 3 parciales de un curso-materia para estructurar el período de evaluación. | 1 | 1 | 1 | 1 | Baja | **17** |
| **HU-08** | Como profesor quiero crear actividades (TAREA, PRUEBA, PROYECTO, EXAMEN) con fechas y validaciones de límite por tipo por parcial. | 3 | 1 | 2 | 2 | Alta | **51** |
| **HU-09** | Como profesor quiero revisar el PDF de evidencia de cada estudiante y asignar una nota de 0 a 10 por actividad. | 2 | 2 | 2 | 2 | Alta | **48** |
| **HU-10** | Como estudiante quiero ver las actividades de cada parcial con indicadores visuales de estado de entrega (Entregada / Pendiente / No entregada). | 1 | 2 | 2 | 1 | Media | **27** |
| **HU-11** | Como estudiante quiero subir un archivo PDF como evidencia de una actividad (máximo 10 MB, dentro del plazo). | 2 | 1 | 1 | 2 | Media | **33** |
| **HU-12** | Como estudiante quiero reemplazar mi evidencia entregada mientras el plazo de la actividad esté vigente. | 2 | 1 | 1 | 1 | Baja | **20** |
| **HU-13** | Como sistema quiero calcular automáticamente el promedio ponderado de cada parcial (TAREA 20%, PRUEBA 20%, PROYECTO 25%, EXAMEN 35%) y el promedio final de la materia. | 2 | 3 | 2 | 3 | Alta | **66** |
| **HU-14** | Como sistema quiero aplicar la regla de supletorio cuando el promedio final de una materia sea menor a 7.00, actualizando el estado del estudiante automáticamente. | 2 | 2 | 2 | 2 | Alta | **48** |
| **HU-15** | Como sistema quiero enviar notificaciones automáticas al estudiante cuando se registre una nueva calificación o cambie su estado de aprobación. | 1 | 2 | 1 | 2 | Media | **33** |
| **HU-16** | Como sistema quiero ejecutar un Cron Job periódico que elimine archivos BYTEA de evidencias antiguas para liberar espacio en la base de datos. | 1 | 1 | 1 | 2 | Media | **27** |

---

## Totales por módulo

| Módulo | Historias incluidas | PF Total |
|---|---|:---:|
| Autenticación y Control de Roles | HU-01, HU-02 | **20** |
| CRUD Administrativo | HU-03, HU-04, HU-05, HU-06 | **111** |
| Gestión Transaccional Docente | HU-07, HU-08, HU-09 | **116** |
| Gestión Transaccional Estudiante | HU-10, HU-11, HU-12 | **80** |
| Motor de Automatización (Calificaciones y Promedios) | HU-13, HU-14, HU-15 | **147** |
| Mantenimiento (Cron Job) | HU-16 | **27** |
| **TOTAL DEL SISTEMA** | **16 historias** | **501** |

---

## Justificación académica

El presente análisis de Puntos de Función evidencia que el módulo de **Calificaciones y Promedios** (HU-13 y HU-14) constituye el componente de mayor complejidad funcional del sistema, acumulando un total de **114 Puntos de Función** entre ambas historias. Esta complejidad se origina en la densidad de sus reglas de negocio: el cálculo del promedio parcial requiere una ponderación diferenciada por tipo de actividad (TAREA, PRUEBA, PROYECTO y EXAMEN), mientras que el promedio final de materia integra los resultados de tres parciales independientes y activa, de manera condicional, la regla de supletorio cuando el resultado es inferior a 7.00. La combinación de múltiples Archivos Lógicos Internos (ILF), Salidas Externas (EO) de datos derivados y Consultas Externas (EQ) cruzadas entre los módulos de actividades, calificaciones y promedios sitúa a este componente en el nivel de **complejidad Alta** según el estándar IFPUG, justificando el mayor esfuerzo de diseño, desarrollo y pruebas asignado durante el Sprint 5 del cronograma del proyecto.

---

*Sistema de Gestión de Notas — Plataforma para Instituciones Educativas · Análisis IFPUG v1.0*
