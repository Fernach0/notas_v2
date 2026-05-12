# Investigación: Historias de Usuario y Puntos de Función
### Universidad de las Fuerzas Armadas "ESPE"
**Nombre:** Luis Cueva | **NRC:** 30744 | **Materia:** Construcción y Evolución del Software | **Fecha:** 4 de mayo de 2026

---

## Objetivos

### Objetivo General
Analizar y documentar las técnicas de Historias de Usuario y Puntos de Función (IFPUG) como herramientas complementarias para la especificación de requisitos y la estimación del tamaño funcional en proyectos de software ágiles, aplicadas al sistema web de Gestión de Notas, una plataforma genérica diseñada para cualquier institución educativa de nivel básico y bachillerato.

### Objetivos Específicos
1. Describir el origen, características y componentes de las Historias de Usuario dentro del marco de las metodologías ágiles.
2. Explicar el método IFPUG de Puntos de Función, sus tipos de componentes y su proceso de cálculo.
3. Identificar la relación directa entre los elementos de una Historia de Usuario y los componentes funcionales del método IFPUG.
4. Aplicar ambas técnicas al sistema de Gestión de Notas como caso de estudio práctico.
5. Evaluar las ventajas, limitaciones y errores comunes en el uso de cada técnica.

---

## 1. Marco Teórico: Metodologías Ágiles

### 1.1 El Manifiesto Ágil

En febrero de 2001, un grupo de 17 desarrolladores de software firmaron el **Manifiesto para el Desarrollo Ágil de Software** (Beck et al., 2001), estableciendo 4 valores fundamentales:

| Se valora más... | ...que |
|---|---|
| **Individuos e interacciones** | Procesos y herramientas |
| **Software funcionando** | Documentación exhaustiva |
| **Colaboración con el cliente** | Negociación contractual |
| **Respuesta ante el cambio** | Seguir un plan |

El manifiesto no rechaza los elementos de la derecha, sino que **prioriza** los de la izquierda. Las Historias de Usuario nacen directamente de esta filosofía: son la forma ágil de capturar requisitos de forma simple, colaborativa y orientada al valor.

### 1.2 Scrum como marco de trabajo

**Scrum** es el marco ágil más utilizado en la industria (Schwaber y Sutherland, 2020). Define los siguientes artefactos relacionados con las Historias de Usuario:

| Artefacto | Descripción |
|---|---|
| **Product Backlog** | Lista priorizada de todas las Historias de Usuario del proyecto |
| **Sprint Backlog** | Subconjunto de historias seleccionadas para el sprint actual |
| **Incremento** | El producto funcional entregado al final de cada sprint |

El **Product Owner** es responsable de redactar y priorizar las historias. El **equipo de desarrollo** las estima y ejecuta. El **Scrum Master** facilita el proceso.

---

## 2. Historias de Usuario

### 2.1 Origen e historia

Las Historias de Usuario fueron propuestas por **Kent Beck** como parte de la metodología **Extreme Programming (XP)** a finales de los años 90. Ron Jeffries (2001) formalizó su estructura con el modelo 3C. Posteriormente, Mike Cohn (2004) las popularizó en su libro *User Stories Applied*, convirtiéndolas en el estándar de facto para la captura de requisitos en entornos ágiles.

### 2.2 ¿Qué es una Historia de Usuario?

Una **Historia de Usuario** es una descripción breve y simple de una funcionalidad narrada desde la perspectiva del usuario final. Su propósito es capturar **quién necesita qué y por qué**, favoreciendo la conversación sobre la documentación exhaustiva.

> *"Las historias de usuario son tarjetas de papel con texto escrito a mano que describen lo que el sistema debería hacer desde el punto de vista del usuario."* — Cohn (2004)

**Características fundamentales:**
- Se escriben en lenguaje natural, no técnico.
- Son breves (caben en una tarjeta de índice).
- Representan una unidad de valor para el usuario.
- Son el punto de partida para una conversación, no el fin.
- Deben poder completarse en un sprint (1–4 semanas).

### 2.3 Formato estándar

```
Como [ROL],
quiero [ACCIÓN / FUNCIONALIDAD],
para [BENEFICIO / OBJETIVO].
```

| Elemento | Descripción | Pregunta que responde |
|---|---|---|
| **Rol** | Quién usa la funcionalidad | ¿Para quién? |
| **Acción** | Qué quiere hacer | ¿Qué necesita? |
| **Beneficio** | Por qué lo necesita | ¿Para qué sirve? |

**Ejemplo:**
> *Como **estudiante**, quiero **subir un archivo PDF** como evidencia de una actividad, para **demostrar al profesor que completé la tarea asignada**.*

### 2.4 Componentes: modelo 3C (Jeffries, 2001)

| Componente | Descripción | Propósito |
|---|---|---|
| **Card (Tarjeta)** | Descripción corta en el formato estándar | Recordatorio de la conversación |
| **Conversation (Conversación)** | Diálogo entre equipo y cliente | Aclarar detalles y supuestos |
| **Confirmation (Confirmación)** | Criterios de aceptación medibles | Verificar que está terminada |

### 2.5 Criterios de Aceptación

Los **criterios de aceptación** definen las condiciones que debe cumplir una historia para considerarse completada. Son la base de las **pruebas de aceptación**.

**Buenas prácticas:**
- Deben ser medibles y verificables.
- No deben describir implementación técnica.
- Deben estar acordados entre el Product Owner y el equipo.
- Típicamente entre 3 y 8 criterios por historia.

**Ejemplo completo:**

> **HU-11:** Como estudiante, quiero subir un PDF como evidencia de una actividad.
>
> *Criterios de aceptación:*
> - ✅ Solo se aceptan archivos en formato PDF.
> - ✅ El archivo no debe superar los 10 MB.
> - ✅ El botón de subida solo aparece si el plazo no ha vencido.
> - ✅ Al subir correctamente, el indicador cambia a "Entregada" (punto verde).
> - ✅ Si el archivo supera el límite, el sistema muestra mensaje de error descriptivo.
> - ✅ Si el plazo venció, el botón aparece deshabilitado con el texto "Plazo cerrado".

### 2.6 Criterios INVEST (Cohn, 2004)

| Letra | Criterio | ¿Qué significa? | Señal de problema |
|---|---|---|---|
| **I** | Independent | No depende de otras historias | "Esta historia necesita que primero esté lista la HU-X" |
| **N** | Negotiable | Los detalles son ajustables | "Tiene que ser exactamente así, sin cambios" |
| **V** | Valuable | Genera valor al usuario | "El usuario no nota si esto existe o no" |
| **E** | Estimable | Se puede estimar su esfuerzo | "No tenemos idea de cuánto tomaría" |
| **S** | Small | Cabe en un sprint | "Esto tomaría meses de desarrollo" |
| **T** | Testable | Se puede verificar | "No hay forma de saber si está bien o mal" |

### 2.7 Jerarquía: Temas, Épicos e Historias

```
TEMA (Theme)
  └── ÉPICO (Epic)           ← Varios sprints
        └── HISTORIA (Story) ← Un sprint
              └── TAREA (Task) ← Horas
```

| Nivel | Descripción | Ejemplo en Gestión de Notas |
|---|---|---|
| **Tema** | Área de negocio amplia | "Gestión Académica" |
| **Épico** | Funcionalidad grande (varios sprints) | "Calificaciones y Promedios" |
| **Historia** | Funcionalidad pequeña (un sprint) | "HU-13: Calcular promedio ponderado" |
| **Tarea** | Trabajo técnico (horas) | "Crear endpoint POST /calificaciones" |

### 2.8 Story Points y Planning Poker

Los **Story Points** miden esfuerzo relativo y complejidad, no horas. Se usa la escala Fibonacci:

```
1 → 2 → 3 → 5 → 8 → 13 → 21 → ?
```

**Planning Poker — proceso:**
1. El Product Owner lee la historia en voz alta.
2. El equipo hace preguntas de aclaración.
3. Cada miembro elige una carta en secreto.
4. Se revelan todas las cartas al mismo tiempo.
5. Si hay diferencias grandes, se discute y se repite.
6. Se llega a un consenso.

**Velocidad del equipo (Velocity):** promedio de Story Points completados por sprint. Permite predecir cuándo terminará el proyecto.

### 2.9 Errores comunes al escribir Historias de Usuario

| Error | Ejemplo incorrecto | Corrección |
|---|---|---|
| **Incluir solución técnica** | "Como usuario, quiero un endpoint REST que..." | "Como usuario, quiero iniciar sesión..." |
| **Historia demasiado grande** | "Como admin, quiero gestionar todo el sistema" | Dividir en múltiples historias específicas |
| **Sin beneficio claro** | "Como usuario, quiero un botón azul" | "Como usuario, quiero ver el botón de acción destacado para identificarlo rápidamente" |
| **Criterios vagos** | "El sistema debe ser rápido" | "La página debe cargar en menos de 2 segundos" |
| **Rol genérico** | "Como usuario, quiero..." (siempre el mismo) | Diferenciar: administrador, profesor, estudiante |
| **Historia negativa** | "Como usuario, no quiero ver errores" | "Como usuario, quiero ver mensajes de error descriptivos cuando algo falla" |

### 2.10 Herramientas para gestionar Historias de Usuario

| Herramienta | Tipo | Características destacadas |
|---|---|---|
| **Jira** | Completa (pago/freemium) | Sprints, épicos, roadmap, Gantt automático |
| **Trello** | Tablero Kanban (freemium) | Simple, visual, fácil de usar |
| **Azure DevOps** | Empresarial | Integración con Git y CI/CD |
| **GitHub Projects** | Integrada con Git | Gratuita, ligada a repositorios |
| **Linear** | Moderna | UI rápida, enfocada en desarrollo |

---

## 3. Puntos de Función (Function Points)

### 3.1 Origen e historia

Los **Puntos de Función** fueron introducidos por **Allan J. Albrecht** en IBM en 1979 como respuesta a la necesidad de medir el tamaño del software de forma independiente a la tecnología (Albrecht, 1979). Antes de los FP, el único indicador de tamaño era las **Líneas de Código (LOC)**, que variaban enormemente entre lenguajes de programación.

**Evolución histórica:**

| Año | Hito |
|---|---|
| 1979 | Albrecht introduce los Function Points en IBM |
| 1984 | Se funda el IFPUG (International Function Point Users Group) |
| 1994 | Se publica la primera versión del estándar ISO |
| 1999 | Aparece COSMIC como método alternativo para sistemas en tiempo real |
| 2009 | ISO/IEC 20926 reconoce el método IFPUG oficialmente |
| 2010 | IFPUG publica la versión 4.3.1 del manual de conteo |

### 3.2 ¿Qué son los Puntos de Función?

Los **Puntos de Función (FP)** miden el **tamaño funcional** de un sistema desde la perspectiva del usuario, independientemente del lenguaje, la arquitectura o la plataforma. Responden a la pregunta: *¿cuánto trabajo funcional tiene este sistema?*

**Características principales:**
- **Independiente de la tecnología:** los FP de un sistema en Java son iguales que si estuviera en Python.
- **Orientado al usuario:** mide lo que el usuario percibe, no lo que el programador escribe.
- **Estable en el tiempo:** no cambia cuando se refactoriza el código.
- **Comparable:** permite comparar proyectos de distintas empresas y años.
- **Estandarizado:** reconocido por ISO/IEC 20926 (ISO, 2009).

### 3.3 Métodos de medición de tamaño funcional

Existen varios métodos reconocidos internacionalmente:

| Método | Organización | Mejor para | Complejidad |
|---|---|---|---|
| **IFPUG FPA** | IFPUG | Sistemas de información tradicionales | Media |
| **COSMIC FFP** | COSMIC | Sistemas en tiempo real, embebidos | Alta |
| **NESMA** | NESMA | Estimación rápida en fases tempranas | Baja |
| **FiSMA** | Finnish Software | Sistemas pequeños y medianos | Media |
| **MarkII** | UKSMA | Sistemas de gestión (UK) | Media |

> Para sistemas web como **Gestión de Notas** (Next.js + NestJS + PostgreSQL), el método **IFPUG** es el más apropiado por su orientación a sistemas de información tradicionales con interfaces de usuario, bases de datos y procesos de negocio definidos.

### 3.4 Tipos de componentes funcionales IFPUG

#### 3.4.1 Funciones de datos (qué almacena el sistema)

| Tipo | Sigla | Descripción | Ejemplo en Gestión de Notas |
|---|---|---|---|
| **Archivo Lógico Interno** | ILF | Datos que el sistema mantiene y actualiza | Tablas: Usuarios, Calificaciones, Evidencias, Matrículas |
| **Archivo de Interfaz Externa** | EIF | Datos que usa pero no mantiene (vienen de fuera) | API de autenticación externa, servicios de terceros |

#### 3.4.2 Funciones de transacción (qué procesa el sistema)

| Tipo | Sigla | Descripción | Ejemplo en Gestión de Notas |
|---|---|---|---|
| **Entrada Externa** | EI | Datos que ingresan y modifican ILFs | Formulario login, subida de PDF, registro de nota |
| **Salida Externa** | EO | Datos que salen con lógica de procesamiento | Promedio ponderado, PDF de calificaciones, estado del estudiante |
| **Consulta Externa** | EQ | Datos que salen sin transformación | Listado de estudiantes, vista de actividades, consulta de notas |

### 3.5 Determinación de la complejidad

La complejidad de cada componente se determina por:
- **DET** (Data Element Types): cantidad de campos o atributos únicos.
- **RET** (Record Element Types): subgrupos lógicos dentro de un ILF.
- **FTR** (File Types Referenced): archivos o tablas referenciadas por una transacción.

**Tabla de complejidad para ILF:**

| RET \ DET | 1–19 | 20–50 | 51+ |
|---|---|---|---|
| **1** | Baja | Baja | Media |
| **2–5** | Baja | Media | Alta |
| **6+** | Media | Alta | Alta |

### 3.6 Tabla de pesos estándar IFPUG (IFPUG, 2010)

| Tipo | Baja | Media | Alta |
|---|:---:|:---:|:---:|
| EI — Entradas Externas | 3 | 4 | 6 |
| EO — Salidas Externas | 4 | 5 | 7 |
| EQ — Consultas Externas | 3 | 4 | 6 |
| ILF — Arch. Lógicos Internos | 7 | 10 | 15 |
| EIF — Arch. Interfaz Externa | 5 | 7 | 10 |

### 3.7 Proceso de cálculo paso a paso

#### Paso 1 — Definir el alcance
Determinar qué módulos o funcionalidades se incluyen en la medición.

#### Paso 2 — Identificar los componentes
Para cada historia o módulo, listar todos los EI, EO, EQ e ILF.

#### Paso 3 — Asignar complejidad
Determinar si cada componente es Baja, Media o Alta.

#### Paso 4 — Calcular los PF No Ajustados (UFP)

```
UFP = Σ(EI × peso) + Σ(EO × peso) + Σ(EQ × peso) + Σ(ILF × peso) + Σ(EIF × peso)
```

#### Paso 5 — Aplicar el Factor de Ajuste de Valor (VAF) — opcional

El VAF ajusta el resultado según 14 **Características Generales del Sistema (GSC)**:

| # | Característica | Descripción |
|---|---|---|
| 1 | Comunicación de datos | Uso de protocolos de red |
| 2 | Procesamiento distribuido | Datos procesados en múltiples nodos |
| 3 | Rendimiento | Requisitos de tiempo de respuesta |
| 4 | Configuración muy utilizada | Restricciones de hardware |
| 5 | Tasa de transacciones | Volumen de operaciones por período |
| 6 | Entrada de datos en línea | Datos ingresados interactivamente |
| 7 | Eficiencia del usuario final | Diseño orientado al usuario |
| 8 | Actualización en línea | ILFs actualizados en línea |
| 9 | Procesamiento complejo | Lógica de negocio compleja |
| 10 | Reusabilidad | Diseño para reutilización |
| 11 | Facilidad de instalación | Complejidad del despliegue |
| 12 | Facilidad de operación | Automatización de operaciones |
| 13 | Múltiples sitios | Operación en múltiples ubicaciones |
| 14 | Facilidad de cambios | Diseño para modificaciones futuras |

Cada característica se valora de **0** (sin influencia) a **5** (influencia esencial).

```
VAF = 0.65 + (0.01 × Σ GSC)
PF Ajustados = UFP × VAF
```

**Rango del VAF:** entre 0.65 y 1.35 (±35% de ajuste máximo).

#### Paso 6 — Convertir a esfuerzo y costo

```
Esfuerzo (horas) = PF Total × Factor de productividad
Costo estimado   = Esfuerzo × Tarifa por hora
```

### 3.8 Aplicación al proyecto Gestión de Notas

**Resumen de PF por módulo:**

| Módulo | PF Total |
|---|:---:|
| Autenticación y Control de Roles | 20 |
| CRUD Administrativo | 111 |
| Gestión Transaccional Docente | 116 |
| Gestión Transaccional Estudiante | 80 |
| Motor de Automatización | 147 |
| Mantenimiento (Cron Job) | 27 |
| **TOTAL** | **501** |

**Estimación derivada:**
```
Esfuerzo estimado = 501 PF × 6 h/PF  = 3.006 horas
Costo estimado    = 3.006 h × $20/h   = $60.120 USD
Tiempo real       = 29 días de desarrollo (con stack moderno)
```

### 3.9 Ventajas y limitaciones

**Ventajas:**
- Independiente del lenguaje y la tecnología.
- Permite comparar proyectos de distintas organizaciones y épocas.
- Facilita contratos basados en funcionalidad entregada.
- Reconocido por norma ISO/IEC 20926.
- Sirve como base para modelos de estimación como COCOMO II.

**Limitaciones:**
- La asignación de complejidad tiene cierto grado de subjetividad.
- Requiere entrenamiento certificado para aplicarlo con rigor.
- No mide la calidad interna del código.
- No es adecuado para sistemas de tiempo real o embebidos (para eso existe COSMIC).
- El tiempo de conteo puede ser largo en sistemas grandes.

---

## 4. Relación entre Historias de Usuario y Puntos de Función

Las Historias de Usuario y los Puntos de Función son técnicas complementarias: las primeras capturan **qué** debe hacer el sistema (perspectiva del usuario), mientras que los segundos **cuantifican el tamaño** de lo que debe hacerse (perspectiva de gestión).

| Elemento de la Historia de Usuario | Componente IFPUG correspondiente |
|---|---|
| Formularios de entrada (login, registro, calificar) | → Entradas Externas (EI) |
| Reportes, PDFs, cálculos de promedios | → Salidas Externas (EO) |
| Listados, consultas, vistas de solo lectura | → Consultas Externas (EQ) |
| Tablas de la base de datos (Usuarios, Notas, Cursos) | → Archivos Lógicos Internos (ILF) |
| Complejidad de los criterios de aceptación | → Nivel Baja / Media / Alta |

**Comparación entre Story Points y Puntos de Función:**

| Aspecto | Story Points | Puntos de Función |
|---|---|---|
| **Creado por** | Equipo ágil (consenso) | Analista certificado (IFPUG) |
| **Base de medición** | Esfuerzo relativo y percibido | Tamaño funcional objetivo |
| **Independiente del equipo** | No (varía según el equipo) | Sí |
| **Uso principal** | Planificación de sprints | Estimación de contratos y costos |
| **Estandarización** | No (escala propia) | Sí (ISO/IEC 20926) |
| **Velocidad de cálculo** | Rápida (Planning Poker) | Lenta (requiere análisis detallado) |

---

## 5. Aplicación Práctica: Caso de Estudio

### Sistema: Gestión de Notas — Plataforma para Instituciones Educativas
**Stack:** Next.js · NestJS · PostgreSQL · Prisma ORM

**Período de desarrollo:** 6 de abril al 5 de mayo de 2026 (29 días)

#### Flujo de trabajo aplicado

```
PASO 1: Se redactan las Historias de Usuario
        → 28 historias organizadas en 8 Épicos

PASO 2: El equipo estima con Story Points (Planning Poker)
        → Total: 162 Story Points

PASO 3: Se planifican 6 Sprints de 5 días cada uno
        → ~27 SP por sprint (velocidad del equipo)

PASO 4: Se aplica el análisis IFPUG sobre las historias
        → 16 historias analizadas = 501 Puntos de Función

PASO 5: Se deriva la estimación de esfuerzo
        → 3.006 horas teóricas vs. 29 días reales
```

#### Hallazgo principal

El análisis IFPUG confirmó que el módulo de **Calificaciones y Promedios** (HU-13 y HU-14) es el de mayor complejidad con **114 PF**, debido a la ponderación diferenciada por tipo de actividad y la lógica condicional del supletorio. Esto coincidió con la asignación de mayor tiempo en el Sprint 5.

---

## 6. Conclusiones

1. Las **Historias de Usuario** son una herramienta fundamental en el desarrollo ágil porque centran el diseño en el valor para el usuario, facilitan la comunicación entre técnicos y clientes, y permiten estimar y planificar el trabajo en sprints de forma incremental.

2. Los **Puntos de Función** complementan a las historias aportando una medida objetiva, estandarizada e independiente de la tecnología del tamaño funcional del sistema, lo que permite derivar estimaciones de esfuerzo, costo y tiempo comparables entre proyectos.

3. La **relación entre ambas técnicas** es directa: los elementos de una Historia de Usuario (entradas, salidas, consultas y datos almacenados) se corresponden uno a uno con los componentes funcionales del método IFPUG, lo que facilita la transición de la captura de requisitos a la estimación formal.

4. En el proyecto **Gestión de Notas**, la combinación de ambas técnicas permitió planificar 6 sprints de forma ordenada, identificar el módulo más complejo del sistema y derivar una estimación de esfuerzo coherente con el tiempo real de desarrollo.

5. Se recomienda el uso conjunto de Story Points (para la planificación ágil interna del equipo) y Puntos de Función (para la comunicación formal con clientes y la gestión de contratos).

---

## 7. Referencias

- Albrecht, A. J. (1979). *Measuring Application Development Productivity*. IBM.
- Beck, K., et al. (2001). *Manifesto for Agile Software Development*. https://agilemanifesto.org
- Cohn, M. (2004). *User Stories Applied: For Agile Software Development*. Addison-Wesley.
- IFPUG. (2010). *Function Point Counting Practices Manual* (4.3.1). International Function Point Users Group.
- ISO/IEC 20926:2009. *Software and Systems Engineering — IFPUG Functional Size Measurement Method*.
- Jeffries, R. (2001). *Essential XP: Card, Conversation, and Confirmation*. XP Magazine.
- Schwaber, K. y Sutherland, J. (2020). *The Scrum Guide*. Scrum.org.
- Sommerville, I. (2016). *Software Engineering* (10.ª ed.). Pearson Education.
- Wiegers, K. y Beatty, J. (2013). *Software Requirements* (3.ª ed.). Microsoft Press.

---

*Construcción y Evolución del Software — ESPE · NRC 30744 · Luis Cueva · 2026*
