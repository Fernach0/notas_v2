# fix_2.md — Plan de Acción: Nuevas Funcionalidades y UX

**Proyecto:** PROYECTO NOTAS — Backend NestJS + Prisma + PostgreSQL / Frontend Next.js 16 + Tailwind  
**Fecha de elaboración:** 2026-04-16  
**Alcance:** Documento de planificación arquitectónica pura. Sin código fuente de lógica de negocio.  
**Prerrequisito:** fix_1.md ya ejecutado (schema con `@@unique([idUsuario])` en `UsuarioCurso`, `archivoBytes`, etc.).

---

## Índice

1. [Lógica de Asignación a Cursos (Estudiantes vs. Profesores)](#1)
2. [Asignación de Materias al Crear un Curso](#2)
3. [Botón y Vista de Perfil de Usuario](#3)
4. [Dashboard del Profesor — Tarjetas de Cursos](#4)
5. [Filtros de Búsqueda Globales en CRUDs](#5)
6. [Refactorización del Módulo de Usuarios](#6)
7. [Orden de Ejecución Recomendado](#orden)

---

## 1. Lógica de Asignación a Cursos (Estudiantes vs. Profesores) {#1}

### Estado actual del sistema

El sistema ya tiene **dos tablas y dos módulos completamente separados** para manejar esta distinción:

| Relación | Tabla BD | Módulo Backend | Regla |
|---|---|---|---|
| Estudiante → Curso | `usuario_curso` | `MatriculaModule` | 1 a 1 (enforced con `@@unique([idUsuario])`) |
| Profesor → Curso + Materia | `profesor_materia_curso` | `DocenciaModule` | Muchos a muchos (PK compuesta triple) |

**Conclusión de arquitectura:** El schema ya soporta correctamente la distinción. No se requieren cambios en `schema.prisma`. Las validaciones de rol ya existen en ambos services (`MatriculaService` valida `idRol: 3`, `DocenciaService` valida `idRol: 2`). El trabajo pendiente es **puramente de UI** en el frontend.

### Problema actual en el frontend

El frontend actualmente no tiene pantallas dedicadas para gestionar estas asignaciones desde el punto de vista del Administrador. Las pantallas de "Cursos" solo muestran el CRUD de cursos, no quién está adentro.

### Plan de implementación

#### Backend — Sin cambios requeridos en lógica

Los endpoints ya existen y están correctamente validados:
- `POST /api/matriculas` — inscribir estudiante (valida rol 3, valida unicidad)
- `PATCH /api/matriculas/:idUsuario/traslado` — trasladar estudiante
- `DELETE /api/matriculas` — dar de baja
- `POST /api/docencias` — asignar profesor a curso+materia (valida rol 2)
- `DELETE /api/docencias` — remover asignación de docencia

**Único ajuste de backend recomendado:** Agregar `GET /api/cursos/:id` (actualmente no está expuesto como endpoint aunque el service `findOne` existe). Este endpoint retornaría el curso con sus materias y listas de estudiantes/profesores asignados. Es necesario para la pantalla de detalle de curso.

#### Frontend — Nueva pantalla de gestión dentro de cada Curso

**Ubicación:** `app/(dashboard)/admin/cursos/[id]/page.tsx` (nueva página dinámica)

**Estructura de la pantalla "Detalle de Curso":**

```
┌─────────────────────────────────────────┐
│  ← Volver    Curso: 8vo EGB A — 2026   │
├──────────────┬──────────────────────────┤
│  ESTUDIANTES │  DOCENTES                │
│  (Pestaña)   │  (Pestaña)              │
├──────────────┴──────────────────────────┤
│ [Estudiantes]                           │
│  Búsqueda: [___________]               │
│  Tabla: Cédula | Nombre | Estado        │
│  [+ Matricular Estudiante]  [Trasladar] │
├─────────────────────────────────────────┤
│ [Docentes]                              │
│  Tabla: Profesor | Materia | Acciones   │
│  [+ Asignar Profesor]                   │
└─────────────────────────────────────────┘
```

**Componentes nuevos a crear:**

- `components/modules/cursos/CursoDetalle.tsx` — contenedor principal con pestañas
- `components/modules/cursos/EstudiantesCursoTab.tsx` — lista de estudiantes matriculados, botón de matricular, botón de traslado
- `components/modules/cursos/DocentesCursoTab.tsx` — lista de docentes con su materia asignada, botón de asignar docente

**Flujo UI para matricular un estudiante:**
1. Admin abre pestaña "Estudiantes" en el Detalle de Curso
2. Hace click en "Matricular Estudiante"
3. Se abre un modal con un campo de búsqueda (busca por cédula o nombre)
4. El modal muestra solo usuarios con rol 3 (`GET /api/usuarios?rol=3`)
5. Si el usuario seleccionado ya tiene matrícula → mostrar botón "Trasladar" en lugar de "Matricular", con alerta explicando que ya está en otro curso
6. Si no tiene matrícula → confirmar y llamar `POST /api/matriculas`

**Flujo UI para asignar docente:**
1. Admin abre pestaña "Docentes"
2. Click en "Asignar Profesor"
3. Modal con dos selects: Profesor (usuarios con rol 2) y Materia (materias del curso)
4. Llama `POST /api/docencias` con `{ idUsuario, idCurso, idMateria }`
5. Prisma `upsert` previene duplicados en el backend

---

## 2. Asignación de Materias al Crear un Curso {#2}

### Estado actual

- `POST /api/cursos` solo acepta `{ idAnioLectivo, nombreCurso }` — no incluye materias
- `POST /api/cursos/:id/materias` permite asignar materias individualmente, post-creación
- `CreateCursoDto` solo tiene los dos campos mencionados
- La tabla `CURSO_MATERIA` ya existe y tiene los endpoints necesarios

### Estrategia arquitectónica: flujo "2 pasos en 1 transacción frontend"

En lugar de modificar el backend, el frontend orquesta dos operaciones de forma secuencial dentro de la misma mutación:

**Paso 1:** `POST /api/cursos` → crea el curso, recibe el `idCurso` nuevo  
**Paso 2:** Para cada materia seleccionada, llamar `POST /api/cursos/:idCurso/materias` en paralelo con `Promise.all`

Esta estrategia no requiere cambios en el backend ni en el schema. Es limpia y aprovecha los endpoints ya existentes.

> **Alternativa (backend unificado):** Si se prefiere atomicidad total, se puede extender `CreateCursoDto` con un campo opcional `idMaterias?: number[]` y dentro del `CursosService.create()` usar `prisma.$transaction` para crear el curso y los registros `CursoMateria` juntos. Esto es más robusto frente a fallos parciales pero requiere modificar el DTO y el service.

### Plan de implementación frontend

#### Modificaciones en `components/forms/CursoForm.tsx`

El formulario actual tiene campos para `idAnioLectivo` y `nombreCurso`. Se debe agregar:

1. **Campo multi-select de materias:**
   - Al cargar el formulario, hacer `GET /api/materias` para obtener la lista
   - Renderizar un selector con checkboxes o un `<select multiple>` estilizado con Tailwind
   - Almacenar los `idMateria` seleccionados en el estado del formulario

2. **Validación:** Al menos 1 materia seleccionada (opcional, según regla de negocio)

3. **Schema Zod del formulario** (en `schemas/`): agregar campo `idMaterias: z.array(z.number()).optional()`

#### Modificaciones en `components/modules/cursos/CursosSection.tsx`

En la mutación `createMutation`, reemplazar la llamada simple a `cursosService.create(dto)` por:

```
1. Extraer { idMaterias, ...cursoData } del dto del formulario
2. Llamar cursosService.create(cursoData) → obtener { idCurso }
3. Si idMaterias?.length > 0:
   await Promise.all(idMaterias.map(id => cursosService.assignMateria(idCurso, id)))
4. Invalidar queryKey ['cursos'] y ['cursos', idCurso]
```

#### Vista del Curso con materias asignadas

En la tabla de cursos del admin, agregar una columna "Materias" que muestre los nombres de las materias asignadas (chips/badges). Esto requiere que `GET /api/cursos` incluya las materias en el response.

**Ajuste de backend:** En `CursosService.findAll()`, agregar:
```
include: {
  anioLectivo: true,
  materias: { include: { materia: true } }   ← agregar esta línea
}
```

Esto no requiere cambios en el schema, solo en la query de Prisma.

---

## 3. Botón y Vista de Perfil de Usuario {#3}

### Estado actual

- El `Navbar.tsx` ya tiene acceso al usuario autenticado vía `useAuth()` (que expone `user.nombreCompleto`, `user.roles`, `user.idUsuario`)
- No existe un endpoint `GET /me` ni una pantalla de perfil
- El `Sidebar.tsx` muestra un badge de rol pero no información de curso/año lectivo

### Plan de backend — Nuevo endpoint `GET /api/auth/me`

**Ubicación:** `AuthController` — agregar un nuevo endpoint protegido por `JwtAuthGuard` (cualquier rol)

**Lógica del service (`AuthService.getProfile`):**

La respuesta debe variar según el rol del usuario que hace la petición:

**Para cualquier rol (base):**
```
{
  idUsuario, nombreCompleto, email, estadoUsuario,
  roles: [{ idRol, rol: { nombreRol } }]
}
```

**Para Estudiante (idRol 3) — include adicional:**
```
{
  ...base,
  matricula: {
    idCurso,
    curso: {
      nombreCurso,
      anioLectivo: { fechaInicio, fechaFinal, estadoLectivo }
    }
  } | null
}
```

**Para Profesor (idRol 2) — include adicional:**
```
{
  ...base,
  docencias: [
    { idCurso, idMateria, curso: { nombreCurso }, materia: { nombreMateria } }
  ]
}
```

**Construcción de la query Prisma en el service:**

```
Paso 1: findUnique el usuario con sus roles
Paso 2: Si el usuario tiene rol 3 en sus roles → buscar usuarioCurso con include de curso+anioLectivo
Paso 3: Si el usuario tiene rol 2 → buscar profesorMateriaCurso con include de curso+materia
Paso 4: Construir y retornar el objeto de respuesta compuesto
```

**Ruta:** `GET /api/auth/me`  
**Guard:** `JwtAuthGuard` (sin `RolesGuard`, cualquier usuario autenticado puede ver su propio perfil)  
**Decorador:** Usar `@CurrentUser()` para extraer el `idUsuario` del JWT

### Plan de frontend — Panel de Perfil

#### Componente nuevo: `components/ui/ProfilePanel.tsx`

Tipo: modal lateral (slide-over) o modal centrado con `size="lg"`.

**Botón de acceso:** En `Navbar.tsx`, agregar un botón tipo avatar al lado del ícono de notificaciones. Puede mostrar las iniciales del nombre del usuario en un círculo de color. Al hacer click, abre el `ProfilePanel`.

**Contenido del panel:**

```
┌────────────────────────────────────────┐
│  👤 Mi Perfil              [✕ Cerrar]  │
├────────────────────────────────────────┤
│  [Avatar con iniciales]                │
│  Nombre: Juan Pérez                    │
│  Rol: Estudiante                       │
│  Email: juan@escuela.ec                │
├── (Solo si es Estudiante) ─────────────┤
│  📚 Año Lectivo                        │
│  2025-2026 — Estado: ACTIVO            │
│                                        │
│  🏫 Curso actual                       │
│  8vo EGB A                             │
│  (Si no está matriculado → aviso)      │
├── (Solo si es Profesor) ───────────────┤
│  📋 Cursos asignados                   │
│  • 8vo EGB A — Matemáticas             │
│  • 9no EGB B — Ciencias Naturales      │
└────────────────────────────────────────┘
```

**Data fetching:** Usar React Query con `queryKey: ['perfil']` y `queryFn: () => authService.getMe()`. Llamar el endpoint solo cuando el panel se abre (usar `enabled: panelIsOpen`).

**Nuevo servicio:** `services/auth.service.ts` — agregar método `getMe()` que llama `GET /api/auth/me`.

---

## 4. Dashboard del Profesor — Tarjetas de Cursos {#4}

### Estado actual

- `app/(dashboard)/profesor/page.tsx` existe pero presumiblemente está vacío o con contenido básico
- `app/(dashboard)/profesor/mis-cursos/page.tsx` existe como página separada
- `GET /api/docencias?idUsuario=X` retorna las docencias de un profesor pero requiere pasar el ID explícitamente

### Plan de backend — Nuevo endpoint `GET /api/docencias/mis-cursos`

**Alternativa más limpia:** En lugar de crear un nuevo endpoint, el frontend puede llamar `GET /api/docencias?idUsuario=:myId` usando el `idUsuario` que ya está disponible en la sesión NextAuth. Esto no requiere cambios en el backend.

**Sin embargo, por buenas prácticas de seguridad**, se recomienda agregar un endpoint `GET /api/cursos/mis-cursos` en `CursosController`:
- Guard: `JwtAuthGuard` sin `RolesGuard` (o con `@Roles(2)`)
- Usa `@CurrentUser()` para obtener el `idUsuario` del JWT
- Llama `profesorMateriaCurso.findMany({ where: { idUsuario }, include: { curso: { include: { anioLectivo: true } }, materia: true } })`
- Agrupa los resultados por `idCurso` para evitar cursos duplicados (un profesor puede enseñar múltiples materias en el mismo curso)
- Retorna: `[{ idCurso, nombreCurso, anioLectivo, materias: [{ idMateria, nombreMateria }] }]`

### Plan de frontend — Cuadrícula de Cards

**Página:** `app/(dashboard)/profesor/page.tsx` — este es el dashboard principal del profesor

**Componente:** `components/modules/profesor/MisCursosGrid.tsx`

**Paleta de colores para las cards (Tailwind):** Asignar colores de forma determinista basándose en el `idCurso % 8` para garantizar variedad visual y consistencia entre sesiones:

| Índice | Color de fondo | Color de acento |
|---|---|---|
| 0 | `bg-indigo-500` | `text-indigo-100` |
| 1 | `bg-violet-500` | `text-violet-100` |
| 2 | `bg-blue-500` | `text-blue-100` |
| 3 | `bg-emerald-500` | `text-emerald-100` |
| 4 | `bg-amber-500` | `text-amber-100` |
| 5 | `bg-rose-500` | `text-rose-100` |
| 6 | `bg-cyan-500` | `text-cyan-100` |
| 7 | `bg-teal-500` | `text-teal-100` |

**Estructura de cada Card:**

```
┌───────────────────────────────┐
│  [Ícono académico]            │  ← fondo de color
│                               │
│  8vo EGB A                    │  ← nombre del curso (bold, text-white)
│  Año 2025-2026                │  ← año lectivo (text-white/70)
│                               │
│  ─────────────────────────── │
│  📘 Matemáticas               │  ← chip por cada materia que imparte
│  📘 Física                    │
│                               │
│  [Ver actividades →]          │  ← link a /actividades?idCurso=X
└───────────────────────────────┘
```

**Layout del grid:** `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5`

**Estado vacío:** Si el profesor no tiene cursos asignados, mostrar un `EmptyState` con mensaje: "El administrador aún no te ha asignado ningún curso."

**Data fetching:**
```
useQuery({
  queryKey: ['mis-cursos'],
  queryFn: () => cursosService.getMisCursos(),  // llama GET /api/cursos/mis-cursos
})
```

---

## 5. Filtros de Búsqueda Globales en CRUDs {#5}

### Estrategia general

Implementar búsqueda en dos capas:

**Capa 1 — Búsqueda local (instant, sin request):** Para tablas con pocos registros (materias, años lectivos), filtrar el array ya cargado en memoria con `Array.filter()` + `String.toLowerCase().includes()`. No requiere cambios en el backend.

**Capa 2 — Búsqueda server-side (con debounce):** Para tablas grandes (usuarios, cursos con muchos registros), enviar el parámetro `?search=valor` al backend y usar Prisma `contains` + `mode: 'insensitive'`. Requiere cambios en backend y frontend.

### Plan de backend — Parámetro `?search=`

Los endpoints que deben soportar búsqueda server-side son:

| Endpoint | Campos de búsqueda en BD | Prisma `where` a agregar |
|---|---|---|
| `GET /api/usuarios` | `nombreCompleto`, `email`, `idUsuario` | `OR: [{ nombreCompleto: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }, { idUsuario: { contains: search } }]` |
| `GET /api/cursos` | `nombreCurso` | `nombreCurso: { contains: search, mode: 'insensitive' }` |
| `GET /api/materias` | `nombreMateria` | `nombreMateria: { contains: search, mode: 'insensitive' }` |
| `GET /api/anios-lectivos` | — | Filtrado local (pocos registros) |

**Patrón en el service (`findAll`):**
```
Parámetros de entrada actuales + nuevo parámetro opcional: search?: string

En el objeto where:
  Si search existe y no está vacío:
    Agregar la cláusula OR/contains al where de Prisma
  Si search está vacío o undefined:
    No agregar nada (comportamiento actual)
```

**Parámetros de entrada en los controllers:** Agregar `@Query('search') search?: string` y pasarlo al service.

### Plan de frontend — Componente de búsqueda reutilizable

#### Nuevo componente: `components/ui/SearchBar.tsx`

Props:
- `value: string`
- `onChange: (v: string) => void`
- `placeholder?: string`
- `className?: string`

Renderiza un `<input>` con ícono de lupa (HeroIcon `MagnifyingGlassIcon`), botón de limpiar (✕) cuando hay texto, y estilos Tailwind consistentes con el sistema.

#### Hook: `useSearchDebounce.ts` (nuevo hook)

Encapsula un `useState` para el valor inmediato (lo que escribe el usuario) y un `useEffect` con `setTimeout(300ms)` para el valor "debounced" (el que se envía al backend). Retorna `{ searchInput, setSearchInput, debouncedSearch }`.

- `searchInput` → se usa como `value` del `SearchBar` (reactividad inmediata al teclear)
- `debouncedSearch` → se usa en `queryKey` y `queryFn` (solo dispara el request al backend después de 300ms sin cambios)

#### Integración en las secciones CRUD

En cada sección (UsuariosSection, CursosSection, MateriasSection):

1. Agregar el hook: `const { searchInput, setSearchInput, debouncedSearch } = useSearchDebounce()`
2. Renderizar `<SearchBar value={searchInput} onChange={setSearchInput} />` encima de la tabla
3. Incluir `debouncedSearch` en el `queryKey`: `['usuarios', { search: debouncedSearch }]`
4. Pasarlo en `queryFn`: `usuariosService.getAll({ search: debouncedSearch })`

**Para filtrado local** (anios-lectivos, materias):
```
const filteredData = (data ?? []).filter(item =>
  item.nombreCampo.toLowerCase().includes(searchInput.toLowerCase())
)
```
No hay request adicional, el filtrado es instantáneo.

#### Layout de cada sección con búsqueda

```
┌─────────────────────────────────────────────┐
│  Título                [+ Nuevo botón]       │
├─────────────────────────────────────────────┤
│  [🔍 Buscar por nombre...] [Filtros extras]  │
├─────────────────────────────────────────────┤
│  Tabla de resultados                         │
│  (X resultados encontrados)                 │
└─────────────────────────────────────────────┘
```

**Filtros adicionales por sección:**
- **Usuarios:** `SearchBar` + `select` de rol (Todos / Admin / Profesor / Estudiante) + `select` de estado (Todos / ACTIVO / INACTIVO / BLOQUEADO)
- **Cursos:** `SearchBar` + `select` de año lectivo (ya existe)
- **Materias:** Solo `SearchBar` (filtrado local)

---

## 6. Refactorización del Módulo de Usuarios (Dashboard Administrador) {#6}

### Estado actual

`UsuariosSection.tsx` ya tiene estadísticas por rol (tarjetas en la parte superior) pero muestra todos los usuarios en una sola tabla flat. No hay pestañas ni agrupación. No se muestra el curso del estudiante ni los cursos del profesor.

### Plan de backend — Optimizar la consulta de usuarios con datos de asignación

El endpoint `GET /api/usuarios` actualmente retorna los usuarios con sus roles (`select: { roles: { select: { idRol: true } } }`). Necesita incluir opcionalmente la información de curso.

**Ajuste en `UsuariosService.findAll()`:** Agregar includes condicionales según el rol filtrado:

```
Si ?rol=3 (estudiantes):
  include adicional:
    cursos: { select: { idCurso: true, curso: { select: { nombreCurso: true } } } }

Si ?rol=2 (profesores):
  include adicional:
    docencias: {
      select: {
        idCurso: true, idMateria: true,
        curso: { select: { nombreCurso: true } },
        materia: { select: { nombreMateria: true } }
      }
    }

Si rol no especificado (todos):
  No incluir datos de asignación (para mantener performance)
```

Esto significa que el response shape varía según el filtro de rol aplicado. El frontend debe manejar esto con tipos TypeScript adecuados (tipo discriminado o campos opcionales).

### Plan de frontend — Pestañas con vistas específicas por rol

#### Reestructura de `UsuariosSection.tsx`

**Añadir estado de pestaña activa:**
```
const [activeTab, setActiveTab] = useState<'todos' | 'admins' | 'profesores' | 'estudiantes'>('todos')
```

**Mapeo de pestaña → parámetro `?rol`:**
- `'todos'` → sin filtro (retorna todos)
- `'admins'` → `?rol=1`
- `'profesores'` → `?rol=2`
- `'estudiantes'` → `?rol=3`

**Incluir `activeTab` en el `queryKey`:** `['usuarios', { rol: tabToRol[activeTab], search: debouncedSearch }]`

Esto hace que React Query haga un nuevo fetch automáticamente al cambiar de pestaña.

#### Componente de Pestañas

```
┌────────────────────────────────────────────────────────┐
│  [Todos (45)]  [Admins (3)]  [Profesores (12)]  [Estudiantes (30)]  │
└────────────────────────────────────────────────────────┘
```

Cada pestaña muestra el conteo en tiempo real usando las estadísticas calculadas del response completo (obtenido en la carga inicial sin filtro de rol).

**Estilos de las pestañas:**
- Activa: `border-b-2 border-indigo-600 text-indigo-600 font-semibold`
- Inactiva: `text-slate-500 hover:text-slate-700`

#### Columnas de tabla adaptativas por pestaña

| Pestaña | Columnas de la tabla |
|---|---|
| Todos | Avatar + Nombre, Email, Roles (badges), Estado, Acciones |
| Admins | Avatar + Nombre, Email, Estado, Acciones |
| Profesores | Avatar + Nombre, Email, **Cursos Asignados** (chips), Estado, Acciones |
| Estudiantes | Avatar + Nombre, Email, **Curso Actual**, **Año Lectivo**, Estado, Acciones |

#### Vista "Cursos Asignados" para Profesores (en tabla)

Cuando la pestaña activa es "Profesores", la columna de cursos muestra:
```
[8vo EGB A — Matemáticas]  [9no EGB B — Física]
```
Como chips horizontales. Si tiene más de 3, mostrar `+N más`.

Si el profesor no tiene cursos asignados: mostrar `— Sin cursos` en gris itálico.

#### Vista "Curso Actual" para Estudiantes (en tabla)

Cuando la pestaña activa es "Estudiantes", la columna de curso muestra:
- Si está matriculado: nombre del curso en un badge verde (`bg-emerald-100 text-emerald-700`)
- Si no está matriculado: badge gris `Sin curso`

#### Acciones contextuales por pestaña

En la columna "Acciones", además de Editar y Eliminar, agregar:

- **Pestaña Estudiantes:** botón "Matricular" (abre modal) o "Trasladar" si ya tiene curso
- **Pestaña Profesores:** botón "Ver Cursos" (navega al detalle del profesor o abre modal con sus asignaciones)

#### Performance: evitar over-fetching

La pestaña "Todos" NO incluye datos de cursos (solo roles). Las pestañas "Profesores" y "Estudiantes" sí los incluyen. Esto garantiza que la carga inicial (pestaña "Todos", el más común) sea lo más ligera posible.

Si el número de usuarios es grande, el paginado (`page` y `limit`) ya está implementado en el backend. El frontend debe agregar controles de paginación:
```
← Anterior  Página 1 de 5  Siguiente →
```

---

## Orden de Ejecución Recomendado {#orden}

| Prioridad | Feature | Impacto | Esfuerzo | Razón |
|---|---|---|---|---|
| 1 | **Filtros de búsqueda globales** (#5) | Alto | Bajo | Mejora inmediata de UX, el hook `useSearchDebounce` es reutilizable por todos los demás features |
| 2 | **Asignación de materias al crear curso** (#2) | Alto | Bajo | Flujo crítico para el admin; solo requiere modificar el formulario existente |
| 3 | **Dashboard del Profesor — Cards** (#4) | Alto | Medio | Un endpoint nuevo + componente de cards |
| 4 | **Refactorización módulo usuarios** (#6) | Alto | Medio | Requiere el SearchBar del punto 1; las pestañas aprovechan los filtros ya planificados |
| 5 | **Vista detalle de Curso con asignaciones** (#1) | Medio | Alto | Requiere nueva ruta dinámica `[id]` y dos componentes de tabs |
| 6 | **Perfil de usuario** (#3) | Medio | Medio | Nuevo endpoint + modal; no bloquea ningún otro flujo |

### Resumen de archivos nuevos a crear

**Backend (NestJS):**
- `GET /api/cursos/mis-cursos` — nuevo endpoint en `CursosController` + lógica en `CursosService`
- `GET /api/auth/me` — nuevo endpoint en `AuthController` + lógica en `AuthService`
- `GET /api/cursos/:id` — exponer endpoint ya existente en `CursosController`

**Frontend (Next.js):**

| Archivo | Propósito |
|---|---|
| `app/(dashboard)/admin/cursos/[id]/page.tsx` | Página de detalle de curso con pestañas |
| `components/modules/cursos/CursoDetalle.tsx` | Contenedor de detalle |
| `components/modules/cursos/EstudiantesCursoTab.tsx` | Tab de estudiantes del curso |
| `components/modules/cursos/DocentesCursoTab.tsx` | Tab de docentes del curso |
| `components/modules/profesor/MisCursosGrid.tsx` | Grid de cards para profesor |
| `components/ui/SearchBar.tsx` | Barra de búsqueda reutilizable |
| `components/ui/ProfilePanel.tsx` | Panel lateral de perfil |
| `hooks/useSearchDebounce.ts` | Hook de búsqueda con debounce |

**Frontend (servicios a modificar):**

| Archivo | Cambio |
|---|---|
| `services/cursos.service.ts` | Agregar `getMisCursos()` |
| `services/auth.service.ts` | Agregar `getMe()` |
| `services/usuarios.service.ts` | Pasar `search?` en `getAll()` |
| `services/materias.service.ts` | Pasar `search?` en `getAll()` |
| `components/modules/cursos/CursosSection.tsx` | Integrar SearchBar, modificar mutación `create` |
| `components/modules/usuarios/UsuariosSection.tsx` | Integrar pestañas, SearchBar, columnas adaptativas |
| `components/layout/Navbar.tsx` | Agregar botón de perfil |

### Cambios en `schema.prisma`

**Ninguno.** Todas las funcionalidades planificadas se soportan con el schema actual (resultado del fix_1). Las únicas modificaciones son en queries de Prisma (agregar `include` y `where` en servicios existentes) y en la adición de nuevos endpoints, no en la estructura de la base de datos.
