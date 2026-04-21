# fix_3.md — Plan de Acción: 7 Bugs y Requerimientos
**Fecha:** 2026-04-21  
**Proyecto:** Notas Escolar — NestJS + Next.js (App Router) + Prisma + PostgreSQL  
**Estado:** Pendiente de ejecución

---

## Resumen ejecutivo

| # | Requerimiento | Impacto | Tipo |
|---|---|---|---|
| 1 | Restricción de Rol Único | Alto | Bug + Validación |
| 2 | Validación Año Lectivo FINALIZADO al crear Curso | Alto | Bug Backend |
| 3 | Filtro de búsqueda en Años Lectivos | Medio | Feature Frontend |
| 4 | CRUD dinámico de Materias en Edición de Cursos | Alto | Feature |
| 5 | Admin puede ver Calificaciones y Promedios | Alto | Permisos |
| 6 | Bug navegación Profesor: "Mis Cursos" vacío | Crítico | Bug Backend (Guard) |
| 7 | Parciales fijos: eliminar flujo de creación manual | Alto | UX + Bug flujo |

---

## FASE 1 — Bugs críticos de datos y permisos

### Fix 1 — Restricción de Rol Único

**Raíz del problema:**  
- `UsuarioForm.tsx` usa checkboxes → permite marcar Admin + Profesor + Estudiante al mismo tiempo.  
- `CreateUsuarioDto` declara `roles?: number[]` sin restricción de tamaño → el backend acepta arrays de cualquier longitud.

---

#### Backend — `src/modules/usuarios/dto/create-usuario.dto.ts`

Agregar validación `@ArrayMaxSize(1)` y `@ArrayMinSize(1)` (cuando se provee el campo):

```typescript
import {
  IsString, IsEmail, IsOptional, IsArray,
  IsInt, MinLength, IsEnum, ArrayMaxSize, ArrayMinSize,
} from 'class-validator';

// Cambiar:
@IsArray()
@IsInt({ each: true })
@IsOptional()
roles?: number[];

// Por:
@IsArray()
@IsInt({ each: true })
@ArrayMinSize(1, { message: 'Debe asignar exactamente un rol' })
@ArrayMaxSize(1, { message: 'Un usuario solo puede tener un rol' })
@IsOptional()
roles?: number[];
```

#### Backend — `src/modules/usuarios/usuarios.service.ts` — método `create()`

Agregar guard explícito antes de insertar en BD para mayor seguridad:

```typescript
async create(dto: CreateUsuarioDto) {
  if (dto.roles && dto.roles.length > 1) {
    throw new BadRequestException('Un usuario solo puede tener un rol asignado');
  }
  // ... resto del método sin cambios
}
```

**Archivos a tocar:**
- `src/modules/usuarios/dto/create-usuario.dto.ts`
- `src/modules/usuarios/usuarios.service.ts`

---

#### Frontend — `components/forms/UsuarioForm.tsx`

1. Cambiar el schema de Zod de array a número único:

```typescript
// Cambiar:
roles: z.array(z.number()).min(1, 'Asigna al menos un rol'),

// Por:
idRol: z.number({ required_error: 'Selecciona un rol' }).int().min(1),
```

2. Reemplazar los checkboxes por radio buttons:

```tsx
// Eliminar el bloque de checkboxes con toggleRol() y rolesSeleccionados
// Reemplazar por:
<div>
  <label className="block text-sm font-medium text-slate-700 mb-2">Rol</label>
  <div className="flex gap-4">
    {rolesOpciones.map((rol) => (
      <label key={rol.id} className="flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          value={rol.id}
          {...register('idRol', { valueAsNumber: true })}
          className="text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm text-slate-600">{rol.label}</span>
      </label>
    ))}
  </div>
  {errors.idRol && <p className="mt-1 text-xs text-red-500">{errors.idRol.message}</p>}
</div>
```

3. Ajustar `defaultValues` y la lógica de submit en `UsuariosSection.tsx`:

```typescript
// En el form defaultValues:
defaultValues: item
  ? { ..., idRol: item.roles[0]?.idRol }
  : { estadoUsuario: 'ACTIVO' },

// En el submit del createMutation (UsuariosSection.tsx):
const { idRol, contrasenaUsuario, ...rest } = data;
return usuariosService.create({ ...rest, contrasenaUsuario, roles: [idRol] });
```

**Archivos a tocar:**
- `components/forms/UsuarioForm.tsx`
- `components/modules/usuarios/UsuariosSection.tsx`

---

### Fix 6 — Bug crítico: "Mis Cursos" del Profesor está vacío (Guard incorrecto)

**Raíz del problema (encontrada en análisis):**  
`DocenciaController` tiene `@Roles(1)` a nivel de clase → **solo los Admins** pueden llamar `GET /docencias`. Cuando el profesor intenta cargar `/profesor/mis-cursos`, la API devuelve 403 y la página aparece vacía. El Dashboard funciona porque usa `GET /cursos/mis-cursos` (que sí permite `@Roles(1,2)`).

---

#### Backend — `src/modules/docencia/docencia.controller.ts`

```typescript
// Cambiar la clase de:
@Roles(1)
@Controller('docencias')
export class DocenciaController {
  @Post()
  create(...)  // solo Admin puede crear/borrar docencias — mantener @Roles(1) individual

  @Get()
  findAll(...)  // Admin Y Profesor pueden consultar

  @Delete()
  remove(...)  // solo Admin
}

// Por:
@Roles(1)   // default clase → solo Admin
@Controller('docencias')
export class DocenciaController {

  @Post()
  create(@Body() dto: CreateDocenciaDto) { ... }

  @Roles(1, 2)   // override: Admin y Profesor pueden leer
  @Get()
  findAll(@Query('idUsuario') idUsuario?: string) { ... }

  @Delete()
  remove(@Body() dto: CreateDocenciaDto) { ... }
}
```

#### Frontend — `app/(dashboard)/profesor/mis-cursos/page.tsx`

La página ya está bien implementada. Con el fix del Guard el endpoint responde correctamente. No requiere cambio de lógica, solo verificar que la query esté habilitada:

```typescript
// Verificar que esté así (ya debería estarlo):
const { data: docencias, isLoading } = useQuery({
  queryKey: ['docencias', user?.idUsuario],
  queryFn: () => docenciasService.getAll(user?.idUsuario),
  enabled: !!user?.idUsuario,   // ← crítico
});
```

**Archivos a tocar:**
- `src/modules/docencia/docencia.controller.ts`

---

## FASE 2 — Validaciones de negocio en Backend

### Fix 2 — Bloquear creación de Cursos en Año Lectivo FINALIZADO

**Raíz del problema:**  
`CursosService.create()` hace `prisma.curso.create({ data: dto })` directamente sin consultar el estado del año lectivo.

---

#### Backend — `src/modules/cursos/cursos.service.ts`

```typescript
// Agregar import:
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

// En el método create():
async create(dto: CreateCursoDto) {
  const anio = await this.prisma.anioLectivo.findUnique({
    where: { idAnioLectivo: dto.idAnioLectivo },
  });
  if (!anio) {
    throw new NotFoundException('Año lectivo no encontrado');
  }
  if (anio.estadoLectivo === 'FINALIZADO') {
    throw new BadRequestException(
      'No se puede crear un curso en un año lectivo FINALIZADO',
    );
  }
  return this.prisma.curso.create({ data: dto });
}
```

No se requiere cambio en el DTO ni en el controlador.

**Archivos a tocar:**
- `src/modules/cursos/cursos.service.ts`

---

#### Frontend — `components/forms/CursoForm.tsx`

1. Filtrar el select de Años Lectivos para no mostrar los FINALIZADOS (prevención en UI):

```tsx
// En el select de anios, agregar filtro:
{anios
  ?.filter((a) => a.estadoLectivo !== 'FINALIZADO')   // ← ocultar finalizados
  .map((a) => (
    <option key={a.idAnioLectivo} value={a.idAnioLectivo}>
      {a.fechaInicio.split('T')[0]} — {a.fechaFinal.split('T')[0]} ({a.estadoLectivo})
    </option>
  ))}
```

2. En `CursosSection.tsx`, mejorar el mensaje de error de la mutation:

```typescript
const createMutation = useMutation({
  mutationFn: async (data: any) => { ... },
  onSuccess: () => { ... show('Curso creado'); },
  onError: (e: any) =>
    show(e?.response?.data?.message ?? 'Error al crear el curso', 'error'),
  //        ↑ muestra el mensaje del backend ("No se puede crear...FINALIZADO")
});
```

**Archivos a tocar:**
- `src/modules/cursos/cursos.service.ts`
- `components/forms/CursoForm.tsx`
- `components/modules/cursos/CursosSection.tsx`

---

## FASE 3 — Features de Frontend

### Fix 3 — Filtro de búsqueda en la tabla de Años Lectivos

**Análisis:** La lista de años lectivos es siempre pequeña (< 20 registros). El filtrado **client-side** es suficiente; no es necesario modificar el endpoint del backend. El backend ya acepta `?estado=` para filtrar por estado.

---

#### Frontend — `app/(dashboard)/admin/anios-lectivos/page.tsx`

1. Agregar estado de búsqueda y filtrar los datos localmente:

```typescript
// Importar SearchBar y useSearchDebounce:
import SearchBar from '@/components/ui/SearchBar';
import { useSearchDebounce } from '@/hooks/useSearchDebounce';

// Dentro del componente:
const { searchInput, setSearchInput, debouncedSearch } = useSearchDebounce(200);

// Filtrar localmente (no toca el backend):
const aniosFiltrados = (anios ?? []).filter((a) => {
  if (!debouncedSearch) return true;
  const q = debouncedSearch.toLowerCase();
  return (
    a.estadoLectivo.toLowerCase().includes(q) ||
    a.fechaInicio.includes(q) ||
    a.fechaFinal.includes(q) ||
    String(a.idAnioLectivo).includes(q)
  );
});
```

2. Agregar el `<SearchBar>` entre el header y la tabla:

```tsx
// Entre el div del header y el div del bg-white (tabla):
<div className="mb-4 flex items-center justify-between gap-3">
  <SearchBar
    value={searchInput}
    onChange={setSearchInput}
    placeholder="Buscar por estado, fecha o ID..."
    className="w-72"
  />
  {/* Filtro rápido por estado (opcional, ya existente en el servicio) */}
</div>
```

3. Usar `aniosFiltrados` en lugar de `anios` en el render de la tabla.

**Archivos a tocar:**
- `app/(dashboard)/admin/anios-lectivos/page.tsx`

---

### Fix 4 — CRUD dinámico de Materias en Edición de Curso

**Análisis:** El backend ya tiene los endpoints `POST /cursos/:id/materias` y `DELETE /cursos/:id/materias/:idMateria`. El `CursoForm.tsx` solo muestra el multi-select de materias en **modo CREATE**. En **modo EDIT**, el admin no puede agregar ni quitar materias.

La mejor UX: mover la gestión de materias a la página de detalle del curso (`/admin/cursos/[id]`) en una nueva pestaña **"Materias"**, en lugar de sobrecargar el modal de edición.

---

#### Frontend — `app/(dashboard)/admin/cursos/[id]/page.tsx`

Agregar una tercera pestaña "Materias" a la página de detalle de curso ya existente:

**Nueva pestaña — estructura:**
```tsx
type Tab = 'estudiantes' | 'docentes' | 'materias';  // agregar 'materias'

// En el bloque de tabs, agregar:
<button onClick={() => setTab('materias')} ...>
  <BookOpenIcon className="h-4 w-4" />
  Materias
  <span ...>{materiasCurso.length}</span>
</button>

// Tab content — Materias:
{tab === 'materias' && (
  <div>
    {/* Lista de materias actuales con botón Quitar */}
    {/* Select de todas las materias disponibles (filtrado para excluir ya asignadas) */}
    {/* Botón Agregar materia */}
  </div>
)}
```

**Lógica de estado y mutations:**
```typescript
// Query: todas las materias del sistema
const { data: todasMaterias } = useQuery({
  queryKey: ['materias'],
  queryFn: () => materiasService.getAll(),
  enabled: tab === 'materias',
});

// IDs ya asignados al curso:
const materiasIds = new Set(materiasCurso.map((cm: any) => cm.idMateria));

// Materias disponibles para agregar:
const materiasDisponibles = (todasMaterias ?? []).filter(
  (m) => !materiasIds.has(m.idMateria)
);

// Mutation: agregar materia
const agregarMateriaMutation = useMutation({
  mutationFn: (idMateria: number) =>
    cursosService.assignMateria(idCurso, idMateria),
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ['curso-detail', idCurso] });
    show('Materia agregada al curso');
  },
  onError: () => show('Error al agregar materia', 'error'),
});

// Mutation: quitar materia
const quitarMateriaMutation = useMutation({
  mutationFn: (idMateria: number) =>
    cursosService.removeMateria(idCurso, idMateria),
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ['curso-detail', idCurso] });
    show('Materia removida del curso');
  },
  onError: (e: any) =>
    show(e?.response?.data?.message ?? 'Error al quitar materia', 'error'),
});
```

> **Nota:** `cursosService.assignMateria()` y `cursosService.removeMateria()` ya existen en el service del frontend. No se requieren cambios en el backend.

**Archivos a tocar:**
- `app/(dashboard)/admin/cursos/[id]/page.tsx`

---

## FASE 4 — Permisos y visibilidad

### Fix 5 — Admin puede ver Calificaciones y Promedios

**Análisis:**  
- `CalificacionesController` tiene `@Roles(2)` a nivel de clase → Admin (rol 1) obtiene 403 en TODOS los endpoints.  
- `PromediosController` ya tiene `@Roles(1, 2)` en varios endpoints, pero los endpoints de escritura (`POST /recalcular`) solo permiten rol 1 y 2. Los `GET` ya incluyen al Admin — **promedios no necesita cambio**.  
- En el frontend no existe ninguna vista de calificaciones para el rol Admin.

---

#### Backend — `src/modules/calificaciones/calificaciones.controller.ts`

```typescript
// Cambiar clase de:
@Roles(2)
@Controller('calificaciones')
export class CalificacionesController {

// Por (separar permisos por método):
@Controller('calificaciones')
export class CalificacionesController {

  @Roles(2)           // solo Profesor crea calificaciones
  @Post()
  create(...) { ... }

  @Roles(2)           // solo Profesor crea bulk
  @Post('bulk')
  createBulk(...) { ... }

  @Roles(1, 2)        // Admin y Profesor pueden leer por actividad
  @Get()
  findByActividad(...) { ... }

  @Roles(1, 2, 3)     // todos pueden consultar calificaciones de un estudiante
  @Get('estudiante/:idUsuario')
  findByEstudiante(...) { ... }

  @Roles(2)           // solo Profesor actualiza notas
  @Patch(':id')
  update(...) { ... }
}
```

**Archivos a tocar:**
- `src/modules/calificaciones/calificaciones.controller.ts`

---

#### Frontend — Vista de calificaciones para Admin

Crear la página `/admin/calificaciones/page.tsx` con flujo:
1. Select de Curso → carga parciales de ese curso.
2. Select de Parcial → carga actividades.
3. Select de Actividad → carga calificaciones de todos los estudiantes.

**Estructura de la página:**
```
app/(dashboard)/admin/calificaciones/page.tsx
```

**Flujo de datos (usando servicios ya existentes):**
```typescript
// 1. Cargar cursos
const { data: cursos } = useQuery({
  queryKey: ['cursos'],
  queryFn: () => cursosService.getAll(),
});

// 2. Cuando seleccionan un curso: cargar materias del curso (desde cursosService.getOne)
const { data: curso } = useQuery({
  queryKey: ['curso-detail', idCursoSelected],
  queryFn: () => cursosService.getOne(idCursoSelected!),
  enabled: !!idCursoSelected,
});

// 3. Con curso + materia seleccionados: cargar parciales
const { data: parciales } = useQuery({
  queryKey: ['parciales', idCursoSelected, idMateriaSelected],
  queryFn: () => parcialesService.getAll(idCursoSelected!, idMateriaSelected!),
  enabled: !!idCursoSelected && !!idMateriaSelected,
});

// 4. Con parcial seleccionado: cargar actividades
const { data: actividades } = useQuery({
  queryKey: ['actividades', idParcialSelected],
  queryFn: () => actividadesService.getAll(idParcialSelected!),
  enabled: !!idParcialSelected,
});

// 5. Con actividad seleccionada: cargar calificaciones
const { data: calificaciones } = useQuery({
  queryKey: ['calificaciones', idActividadSelected],
  queryFn: () => calificacionesService.getByActividad(idActividadSelected!),
  enabled: !!idActividadSelected,
});
```

**Agregar al sidebar de Admin** en `components/layout/Sidebar.tsx`:
```typescript
const adminNav: NavItem[] = [
  { label: 'Dashboard',      href: '/admin',                  Icon: HomeIcon },
  { label: 'Usuarios',       href: '/admin/usuarios',         Icon: UsersIcon },
  { label: 'Años Lectivos',  href: '/admin/anios-lectivos',   Icon: CalendarDaysIcon },
  { label: 'Cursos',         href: '/admin/cursos',           Icon: AcademicCapIcon },
  { label: 'Materias',       href: '/admin/materias',         Icon: BookOpenIcon },
  { label: 'Calificaciones', href: '/admin/calificaciones',   Icon: ChartBarIcon },  // ← NUEVO
];
```

**Archivos a tocar:**
- `src/modules/calificaciones/calificaciones.controller.ts`
- `app/(dashboard)/admin/calificaciones/page.tsx` ← CREAR
- `components/layout/Sidebar.tsx`

---

## FASE 5 — UX y flujo de actividades

### Fix 7 — Parciales fijos: eliminar flujo de creación manual

**Análisis del flujo actual (roto):**
1. Profesor va a Actividades → selecciona Parcial 1.
2. Si no existen parciales, aparece: *"No existe el Parcial 1. → Crear parciales"* con link a `/profesor/mis-cursos`.
3. El profesor debe navegar a otra página, hacer clic en "Crear parciales 1, 2 y 3", volver a Actividades.

**Flujo correcto:**  
Los 3 parciales deben **auto-crearse** la primera vez que el profesor accede a la página de Actividades de una materia+curso, de forma silenciosa y transparente.

---

#### Backend — sin cambio necesario

`POST /parciales/bulk` ya usa `upsert` → es idempotente, se puede llamar múltiples veces sin duplicar datos. El endpoint ya admite roles 1 y 2.

---

#### Frontend — `app/(dashboard)/profesor/actividades/page.tsx`

**Estrategia:** Cuando `parciales` se carga y está vacío para la combinación `idCurso+idMateria`, auto-disparar `createBulk` y refrescar.

```typescript
// Agregar mutation de auto-init:
const autoInitParciales = useMutation({
  mutationFn: () => parcialesService.createBulk({ idCurso, idMateria }),
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ['parciales', idCurso, idMateria] });
  },
  // silencioso — sin toast
});

// useEffect que se dispara cuando parciales carga vacío:
useEffect(() => {
  if (
    parciales !== undefined &&   // ya terminó de cargar
    parciales.length === 0 &&    // no existen parciales
    idCurso && idMateria &&       // parámetros válidos
    !autoInitParciales.isPending  // no está corriendo ya
  ) {
    autoInitParciales.mutate();
  }
}, [parciales, idCurso, idMateria]);
```

**Eliminar el bloque de warning** que dice "No existe el Parcial X. Crear parciales" (ya no es necesario):
```tsx
// Eliminar este bloque:
{!parcialId ? (
  <div className="bg-amber-50 border border-amber-200 ...">
    No existe el Parcial {parcialActivo}...
    <a href="/profesor/mis-cursos">Crear parciales</a>
  </div>
) : ( ... )}

// Reemplazar por un spinner mientras se auto-crean:
{!parcialId ? (
  <Spinner />   // se muestra brevemente durante el auto-init
) : ( ... )}
```

#### Frontend — `app/(dashboard)/profesor/mis-cursos/page.tsx`

Eliminar el botón "Crear parciales 1, 2 y 3" de las tarjetas (ya no tiene sentido en el flujo). Simplificar la página para que solo muestre la lista de materias/cursos asignados como punto de navegación:

```tsx
// Eliminar: bulkParcialMutation y el botón "Crear parciales"
// Conservar: la tarjeta con links a Actividades y Calificaciones
<div className="mt-4 flex gap-2">
  <Link href={`/profesor/actividades?idCurso=${d.idCurso}&idMateria=${d.idMateria}`} ...>
    Actividades
  </Link>
  <Link href={`/profesor/calificaciones?idCurso=${d.idCurso}&idMateria=${d.idMateria}`} ...>
    Calificaciones
  </Link>
</div>
```

**Archivos a tocar:**
- `app/(dashboard)/profesor/actividades/page.tsx`
- `app/(dashboard)/profesor/mis-cursos/page.tsx`

---

## Resumen de archivos a modificar

### Backend (NestJS)

| Archivo | Cambio |
|---|---|
| `src/modules/usuarios/dto/create-usuario.dto.ts` | `@ArrayMaxSize(1)` en roles |
| `src/modules/usuarios/usuarios.service.ts` | Guard extra en `create()` |
| `src/modules/cursos/cursos.service.ts` | Validar año no FINALIZADO en `create()` |
| `src/modules/docencia/docencia.controller.ts` | `@Roles(1,2)` en `GET` |
| `src/modules/calificaciones/calificaciones.controller.ts` | Separar `@Roles` por método |

### Frontend (Next.js)

| Archivo | Cambio |
|---|---|
| `components/forms/UsuarioForm.tsx` | Radio buttons, schema idRol único |
| `components/modules/usuarios/UsuariosSection.tsx` | Adaptar submit para `roles: [idRol]` |
| `components/forms/CursoForm.tsx` | Filtrar años FINALIZADOS del select |
| `components/modules/cursos/CursosSection.tsx` | `onError` con mensaje del backend |
| `app/(dashboard)/admin/anios-lectivos/page.tsx` | SearchBar + filtro local |
| `app/(dashboard)/admin/cursos/[id]/page.tsx` | Pestaña "Materias" con assign/remove |
| `app/(dashboard)/admin/calificaciones/page.tsx` | CREAR — vista lectura de notas |
| `components/layout/Sidebar.tsx` | Link "Calificaciones" en nav Admin |
| `app/(dashboard)/profesor/actividades/page.tsx` | Auto-init parciales con useEffect |
| `app/(dashboard)/profesor/mis-cursos/page.tsx` | Quitar botón "Crear parciales" |

---

## Orden de ejecución recomendado

```
1. Fix 6  → Desbloquea al Profesor en la app (bug crítico, 1 línea de código)
2. Fix 1  → Integridad de datos (backend + form)
3. Fix 2  → Validación negocio cursos (backend + form)
4. Fix 7  → UX flujo actividades (frontend)
5. Fix 3  → Búsqueda años lectivos (frontend)
6. Fix 4  → Materias en detalle de curso (frontend)
7. Fix 5  → Admin lee calificaciones (backend + nueva página)
```
