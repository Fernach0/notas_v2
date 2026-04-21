# PLAN DE ACCIÓN — FRONTEND "PROYECTO NOTAS"

> **Stack:** Next.js 15 (App Router) · Tailwind CSS v4 · TanStack Query v5 · Axios · NextAuth.js v5
> **Dominio:** Sistema de gestión académica (Ecuador)
> **Backend:** `http://localhost:3000/api`
> **Objetivo:** Construir el Frontend por fases secuenciales. Sin código completo — solo arquitectura, herramientas y snippets de referencia.

---

## Decisiones Arquitectónicas Clave (justificadas)

| Decisión | Elección | Razón |
|----------|----------|-------|
| Router | **App Router** (Next.js 15) | Layouts anidados nativos → base perfecta para los 3 dashboards por rol. Los Route Groups permiten layouts separados sin afectar las URLs. |
| Estilos | **Tailwind CSS v4** | Sin configuración extra en v4; `@import "tailwindcss"` en el CSS global es todo lo necesario. |
| Data fetching | **TanStack Query v5** | Cache automático, revalidación, estados de loading/error, mutaciones con `onSuccess` para invalidar y refrescar listas tras CRUD. Más potente que SWR para este caso de uso. |
| HTTP client | **Axios** | Interceptores de request para inyectar el JWT de forma global y un interceptor de response para redirigir en 401. |
| Autenticación | **NextAuth.js v5 (Auth.js)** | Manejo del JWT del backend con el proveedor `Credentials`. Guarda `access_token`, `idUsuario` y `roles` en la sesión. Compatible con App Router y Middleware de Next.js para proteger rutas sin código extra en cada página. |
| Estado global | **Contexto de React mínimo** | Solo para el estado de apertura/cierre de modales y notificaciones toast. TanStack Query maneja todo el estado servidor. Evitar Zustand/Redux innecesariamente. |
| Formularios | **React Hook Form + Zod** | Validación de esquemas reutilizables entre frontend y los DTOs del backend. Integración fluida dentro de los modales. |

---

## Estructura de Carpetas (App Router)

```
notas-frontend/
├── app/
│   ├── (auth)/                      # Route Group — sin layout de dashboard
│   │   └── login/
│   │       └── page.tsx             # Página de login
│   │
│   ├── (dashboard)/                 # Route Group — con layout de sidebar + navbar
│   │   ├── layout.tsx               # Layout compartido para los 3 roles
│   │   │
│   │   ├── admin/                   # Solo accesible con rol 1
│   │   │   ├── page.tsx             # Dashboard principal admin
│   │   │   ├── usuarios/
│   │   │   │   └── page.tsx
│   │   │   ├── anios-lectivos/
│   │   │   │   └── page.tsx
│   │   │   ├── cursos/
│   │   │   │   └── page.tsx
│   │   │   └── materias/
│   │   │       └── page.tsx
│   │   │
│   │   ├── profesor/                # Solo accesible con rol 2
│   │   │   ├── page.tsx             # Dashboard principal profesor
│   │   │   ├── mis-cursos/
│   │   │   │   └── page.tsx
│   │   │   ├── actividades/
│   │   │   │   └── page.tsx
│   │   │   └── calificaciones/
│   │   │       └── page.tsx
│   │   │
│   │   └── estudiante/              # Solo accesible con rol 3
│   │       ├── page.tsx             # Dashboard principal estudiante
│   │       ├── mis-materias/
│   │       │   └── page.tsx
│   │       ├── actividades/
│   │       │   └── page.tsx
│   │       └── evidencias/
│   │           └── page.tsx
│   │
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts         # Handler de NextAuth.js
│   │
│   ├── layout.tsx                   # Root layout (Providers, fonts)
│   └── page.tsx                     # Redirige a /login o al dashboard según rol
│
├── components/
│   ├── ui/                          # Componentes reutilizables puros (sin lógica de negocio)
│   │   ├── Modal.tsx                # Componente Modal base ← Ver snippet más abajo
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Badge.tsx                # Para estados: ACTIVO, INACTIVO, etc.
│   │   ├── Table.tsx                # Tabla genérica con columnas configurables
│   │   ├── Spinner.tsx
│   │   ├── Toast.tsx                # Notificaciones de éxito/error
│   │   └── ConfirmDialog.tsx        # Modal de confirmación para DELETE
│   │
│   ├── forms/                       # Formularios específicos que se montan dentro de Modal
│   │   ├── UsuarioForm.tsx
│   │   ├── CursoForm.tsx
│   │   ├── MateriaForm.tsx
│   │   ├── AnioLectivoForm.tsx
│   │   ├── ActividadForm.tsx
│   │   ├── CalificacionForm.tsx
│   │   ├── BulkCalificacionForm.tsx
│   │   └── EvidenciaUploadForm.tsx  # Formulario con input tipo file (PDF)
│   │
│   ├── layout/
│   │   ├── Sidebar.tsx              # Barra lateral (varía según rol)
│   │   ├── Navbar.tsx               # Barra superior con nombre, rol y logout
│   │   └── RoleGuard.tsx            # Componente que verifica rol antes de renderizar
│   │
│   └── modules/                     # Secciones completas = tabla + botones + modales integrados
│       ├── usuarios/
│       │   └── UsuariosSection.tsx
│       ├── cursos/
│       │   └── CursosSection.tsx
│       ├── materias/
│       │   └── MateriasSection.tsx
│       ├── actividades/
│       │   └── ActividadesSection.tsx
│       └── calificaciones/
│           └── CalificacionesSection.tsx
│
├── hooks/                           # Custom hooks
│   ├── useModal.ts                  # Estado open/close + datos del item en edición
│   ├── useToast.ts                  # Disparar notificaciones toast
│   └── useAuth.ts                   # Wrapper de useSession de NextAuth
│
├── lib/
│   ├── axios.ts                     # Instancia de Axios con interceptores JWT
│   ├── auth.ts                      # Configuración de NextAuth (providers, callbacks)
│   └── queryClient.ts               # Instancia global de TanStack QueryClient
│
├── services/                        # Una función por endpoint del backend
│   ├── auth.service.ts
│   ├── usuarios.service.ts
│   ├── anios-lectivos.service.ts
│   ├── cursos.service.ts
│   ├── materias.service.ts
│   ├── matriculas.service.ts
│   ├── docencias.service.ts
│   ├── parciales.service.ts
│   ├── actividades.service.ts
│   ├── calificaciones.service.ts
│   ├── evidencias.service.ts
│   ├── notificaciones.service.ts
│   ├── promedios.service.ts
│   └── jobs.service.ts
│
├── schemas/                         # Esquemas Zod para validación de formularios
│   ├── usuario.schema.ts
│   ├── curso.schema.ts
│   ├── actividad.schema.ts
│   └── calificacion.schema.ts
│
├── types/                           # Tipos TypeScript que reflejan las entidades del backend
│   ├── usuario.types.ts
│   ├── curso.types.ts
│   ├── actividad.types.ts
│   └── index.ts                     # Barrel export
│
├── middleware.ts                    # Middleware de Next.js — protege rutas según rol
├── auth.ts                          # Re-export de NextAuth para usar en Server Components
├── next.config.ts
├── tailwind.config.ts               # Solo en v3; en v4 no se necesita
└── .env.local
```

---

## 1. FASE 0 — Bootstrapping del Proyecto

**Objetivo:** Crear el proyecto con todas las dependencias listas.

### 1.1 Crear el proyecto

```bash
npx create-next-app@latest notas-frontend \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=false \
  --import-alias "@/*"
```

> Responde **No** a "Would you like to use Turbopack?" por compatibilidad estable.

### 1.2 Instalar dependencias

```bash
# Data fetching y HTTP
npm install @tanstack/react-query axios

# Autenticación
npm install next-auth@beta

# Formularios y validación
npm install react-hook-form zod @hookform/resolvers

# Íconos (Heroicons es el más compatible con Tailwind)
npm install @heroicons/react

# Utilidades de clases CSS
npm install clsx tailwind-merge
```

### 1.3 Crear `.env.local`

```env
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=un_secreto_largo_y_seguro_aqui
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

> `NEXT_PUBLIC_API_URL` es la URL base del backend NestJS.
> El frontend correrá en el puerto **3001** (`npm run dev -- --port 3001`) para no chocar con el backend en 3000.

---

## 2. FASE 1 — Autenticación con NextAuth.js

**Objetivo:** Capturar el JWT del backend, almacenarlo en la sesión de NextAuth y proteger rutas con el Middleware.

### 2.1 Configurar NextAuth (`lib/auth.ts`)

Se usa el proveedor `Credentials`. En el callback `authorize`, se llama al endpoint `POST /api/auth/login` del backend. Si la respuesta es exitosa, se retorna un objeto que incluye `access_token`, `idUsuario` y `roles` — NextAuth lo persiste en la cookie de sesión.

En el callback `jwt` se copia esa info al token, y en el callback `session` se expone al cliente vía `useSession()`.

**Snippet de referencia:**

```typescript
// lib/auth.ts (simplificado)
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
        });
        if (!res.ok) return null;
        const data = await res.json();
        // data = { access_token, idUsuario, nombreCompleto, roles }
        return data;
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as any).access_token;
        token.idUsuario   = (user as any).idUsuario;
        token.roles       = (user as any).roles;
        token.nombreCompleto = (user as any).nombreCompleto;
      }
      return token;
    },
    session({ session, token }) {
      session.user.accessToken    = token.accessToken as string;
      session.user.idUsuario      = token.idUsuario as string;
      session.user.roles          = token.roles as number[];
      session.user.nombreCompleto = token.nombreCompleto as string;
      return session;
    },
  },
  pages: { signIn: '/login' },
});
```

### 2.2 Middleware de protección de rutas (`middleware.ts`)

El Middleware corre en el Edge antes de cada request. Lee el token de la sesión y redirige al usuario si:
- No está autenticado → `/login`
- No tiene el rol adecuado para la ruta solicitada → al dashboard de su rol

```typescript
// middleware.ts (lógica simplificada)
import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  if (!session && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const roles = session?.user?.roles ?? [];

  if (pathname.startsWith('/admin') && !roles.includes(1))
    return NextResponse.redirect(new URL('/login', req.url));

  if (pathname.startsWith('/profesor') && !roles.includes(2))
    return NextResponse.redirect(new URL('/login', req.url));

  if (pathname.startsWith('/estudiante') && !roles.includes(3))
    return NextResponse.redirect(new URL('/login', req.url));
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

### 2.3 Redirección automática según rol (`app/page.tsx`)

La raíz del sitio lee la sesión y redirige al dashboard correspondiente:
- `roles.includes(1)` → `/admin`
- `roles.includes(2)` → `/profesor`
- `roles.includes(3)` → `/estudiante`

---

## 3. FASE 2 — Axios + TanStack Query (Data Fetching Global)

**Objetivo:** Un único punto de configuración para todas las llamadas HTTP.

### 3.1 Instancia de Axios con interceptores (`lib/axios.ts`)

```typescript
// lib/axios.ts
import axios from 'axios';
import { getSession } from 'next-auth/react';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// Inyectar JWT en cada request automáticamente
api.interceptors.request.use(async (config) => {
  const session = await getSession();
  if (session?.user?.accessToken) {
    config.headers.Authorization = `Bearer ${session.user.accessToken}`;
  }
  return config;
});

// Manejar 401: limpiar sesión y redirigir al login
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const { signOut } = await import('next-auth/react');
      await signOut({ callbackUrl: '/login' });
    }
    return Promise.reject(error);
  },
);

export default api;
```

> Esta instancia es la que usan todos los `services/*.service.ts`. Nunca se llama a `fetch` o `axios` directamente desde un componente.

### 3.2 Servicios por módulo (`services/cursos.service.ts` — ejemplo)

```typescript
import api from '@/lib/axios';
import { Curso, CreateCursoDto, UpdateCursoDto } from '@/types';

export const cursosService = {
  getAll: (idAnioLectivo: number) =>
    api.get<Curso[]>('/cursos', { params: { idAnioLectivo } }).then(r => r.data),

  create: (dto: CreateCursoDto) =>
    api.post<Curso>('/cursos', dto).then(r => r.data),

  update: (id: number, dto: UpdateCursoDto) =>
    api.patch<Curso>(`/cursos/${id}`, dto).then(r => r.data),

  remove: (id: number) =>
    api.delete(`/cursos/${id}`).then(r => r.data),

  assignMateria: (idCurso: number, idMateria: number) =>
    api.post(`/cursos/${idCurso}/materias`, { idMateria }).then(r => r.data),

  removeMateria: (idCurso: number, idMateria: number) =>
    api.delete(`/cursos/${idCurso}/materias/${idMateria}`).then(r => r.data),
};
```

### 3.3 TanStack Query Provider (`app/layout.tsx`)

```typescript
// lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';
export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 } }, // 1 minuto
});
```

El `QueryClientProvider` se monta en el Root Layout (`app/layout.tsx`) envolviendo toda la aplicación junto con el `SessionProvider` de NextAuth.

---

## 4. FASE 3 — Layout del Dashboard y Sistema de Modales

**Objetivo:** El esqueleto visual compartido por los 3 roles y el componente Modal reutilizable.

### 4.1 Layout del dashboard (`app/(dashboard)/layout.tsx`)

Estructura visual:
```
┌────────────────────────────────────────────┐
│              Navbar (top)                  │
├──────────┬─────────────────────────────────┤
│          │                                 │
│ Sidebar  │      {children}                 │
│ (left)   │      (contenido de la página)   │
│          │                                 │
└──────────┴─────────────────────────────────┘
```

El `Sidebar` recibe los `roles` del usuario y renderiza solo los links correspondientes.

### 4.2 Componente Modal base (`components/ui/Modal.tsx`)

Esta es la pieza más crítica. Todos los formularios CRUD se montan aquí.

```typescript
// components/ui/Modal.tsx
'use client';
import { useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
};

export default function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  // Cerrar con Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    // Fondo oscuro semitransparente
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      {/* Contenedor del modal */}
      <div className={`relative w-full ${sizeClasses[size]} rounded-xl bg-white shadow-2xl`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100">
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        {/* Body — aquí se monta el formulario */}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
```

### 4.3 Hook `useModal` (`hooks/useModal.ts`)

Centraliza el estado open/close y el item en edición para evitar repetir lógica en cada página.

```typescript
// hooks/useModal.ts
import { useState } from 'react';

export function useModal<T = null>() {
  const [isOpen, setIsOpen]   = useState(false);
  const [item, setItem]       = useState<T | null>(null);

  const open  = (data?: T)  => { setItem(data ?? null); setIsOpen(true); };
  const close = ()          => { setIsOpen(false); setItem(null); };

  return { isOpen, item, open, close };
}
```

**Uso en una página:**

```typescript
// Dentro de CursosSection.tsx
const createModal = useModal();
const editModal   = useModal<Curso>();
const deleteModal = useModal<Curso>();

// Abrir para crear
<Button onClick={() => createModal.open()}>Nuevo Curso</Button>

// Abrir para editar (le pasa el objeto)
<Button onClick={() => editModal.open(curso)}>Editar</Button>

// En el render
<Modal isOpen={createModal.isOpen} onClose={createModal.close} title="Crear Curso">
  <CursoForm onSuccess={createModal.close} />
</Modal>

<Modal isOpen={editModal.isOpen} onClose={editModal.close} title="Editar Curso">
  <CursoForm curso={editModal.item} onSuccess={editModal.close} />
</Modal>
```

### 4.4 `ConfirmDialog` para eliminaciones

Un modal especializado que muestra: "¿Estás seguro de que deseas eliminar *{nombre}*? Esta acción no se puede deshacer." con botones Cancelar y Confirmar. Se implementa una vez y se reutiliza para todos los DELETE del sistema.

---

## 5. FASE 4 — Dashboard del Administrador (Rol 1)

**Objetivo:** Implementar todas las secciones de gestión con CRUD completo en modales.

### Secciones a construir

| Sección | Ruta | Operaciones CRUD |
|---------|------|-----------------|
| Años Lectivos | `/admin/anios-lectivos` | Crear, cambiar estado, eliminar |
| Usuarios | `/admin/usuarios` | Crear, editar, eliminar, asignar/quitar roles |
| Cursos | `/admin/cursos` | Crear, editar, eliminar, asignar/quitar materias |
| Materias | `/admin/materias` | Crear, editar, eliminar |
| Matrículas | `/admin/cursos/[id]` | Agregar/quitar estudiantes al curso |
| Docencias | `/admin/cursos/[id]` | Asignar/quitar profesores a materia+curso |

### Patrón de implementación por sección

Cada sección sigue exactamente este patrón:

1. **Fetch con TanStack Query:** `useQuery({ queryKey: ['cursos', idAnioLectivo], queryFn: () => cursosService.getAll(idAnioLectivo) })`
2. **Mutaciones:** `useMutation({ mutationFn: cursosService.create, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cursos'] }) })`
3. **Tabla:** Componente `Table` genérico con columnas configuradas para la entidad.
4. **3 modales:** Crear, Editar (recibe el item), ConfirmDialog de Delete.
5. **Feedback:** Toast de éxito o error en `onSuccess` / `onError` de las mutaciones.

### Formulario de Usuarios — consideraciones especiales

- El campo `idUsuario` (cédula) tiene validación con Zod usando el algoritmo del dígito verificador ecuatoriano, replicando la lógica del backend.
- El campo `roles` es un `Select` múltiple o checkboxes: 1=Admin, 2=Profesor, 3=Estudiante.
- Al crear usuario, la contraseña se envía en texto plano (el backend la hashea con bcrypt).

---

## 6. FASE 5 — Dashboard del Profesor (Rol 2)

**Objetivo:** Vista centrada en las materias que el profesor imparte.

### Flujo de navegación

```
/profesor
  └─ Listado de cursos y materias asignadas (docencias del usuario)
       └─ /profesor/actividades?idParcial=X
            ├─ [Modal] Crear Actividad
            ├─ [Modal] Editar Actividad
            └─ /profesor/calificaciones?idActividad=X
                 ├─ Tabla de alumnos matriculados con su nota actual
                 ├─ [Modal] Calificar individualmente
                 └─ [Modal] Calificación masiva (bulk)
```

### Componentes específicos del profesor

- **`ParcialTabs`:** Tabs de Parcial 1, Parcial 2, Parcial 3 que filtran las actividades del parcial seleccionado.
- **`CalificacionTable`:** Tabla que muestra alumno + nota + comentario. Si la fila tiene nota → botón "Editar", si no tiene → botón "Calificar".
- **`BulkCalificacionForm`:** Formulario con una fila por estudiante del curso, permitiendo ingresar todas las notas y enviarlas en un solo `POST /api/calificaciones/bulk`.

---

## 7. FASE 6 — Dashboard del Estudiante (Rol 3)

**Objetivo:** Vista de solo lectura + subida de evidencias PDF.

### Flujo de navegación

```
/estudiante
  └─ Listado de materias del curso en el que está matriculado
       └─ /estudiante/actividades?idParcial=X
            ├─ Ver descripción, fechas límite, valor máximo
            ├─ Ver su propia nota (si fue calificado)
            └─ [Modal] Subir Evidencia PDF (si la actividad está en fecha)
```

### Componentes específicos del estudiante

- **`PromedioCard`:** Tarjeta que muestra promedio por materia (parcial 1, 2, 3, final) con una barra de progreso visual en Tailwind.
- **`EstadoActividadBadge`:** Badge que indica si la actividad está Pendiente, Entregada o Vencida, basándose en `fechaFinEntrega` vs la fecha actual.
- **`EvidenciaUploadForm`:** Formulario con `input type="file"` restringido a `accept=".pdf"`. Usa `FormData` para el `multipart/form-data`. Al subir, deshabilita el botón y muestra un spinner.

### Restricciones de UI para el estudiante

- No se muestran botones de Crear, Editar ni Eliminar en ninguna tabla.
- El botón de subir evidencia se desactiva si `new Date() > fechaFinEntrega`.
- Los promedios se muestran como solo lectura.

---

## 8. FASE 7 — Notificaciones en Tiempo Real (opcional pero planificado)

El backend ya tiene el módulo de notificaciones. Para mostrárselas al usuario:

- **Estrategia simple (Polling):** TanStack Query puede hacer polling cada N segundos: `useQuery({ ..., refetchInterval: 30000 })` para `GET /api/notificaciones?leida=false`. Un badge en la `Navbar` muestra el conteo.
- **Estrategia avanzada (Server-Sent Events / WebSockets):** Requiere añadir SSE o `@nestjs/websockets` al backend. Se planifica para una fase posterior.

El ícono de campana en la `Navbar` abre un panel lateral (drawer) con la lista de notificaciones. Desde ahí se puede llamar a `PATCH /api/notificaciones/:id/leer` y `PATCH /api/notificaciones/leer-todas`.

---

## 9. FASE 8 — Pulido, Accesibilidad y Producción

### Checklist antes de considerar el frontend terminado

- [ ] Todos los modales cierran con tecla `Escape` y al hacer click fuera del contenedor.
- [ ] Todos los estados de carga muestran un `Spinner` y deshabilitan los botones de submit.
- [ ] Los errores de API (4xx, 5xx) muestran un Toast de error con el mensaje del backend.
- [ ] Las tablas vacías muestran un estado vacío ilustrado ("No hay cursos creados aún").
- [ ] El formulario de cédula tiene validación del dígito verificador en tiempo real.
- [ ] Las fechas se muestran en formato `dd/MM/yyyy` (formato ecuatoriano).
- [ ] El frontend es responsive: el Sidebar colapsa en mobile con un botón hamburguesa.
- [ ] `next/image` para todas las imágenes y `next/font` para tipografías.
- [ ] Variables de entorno separadas para desarrollo y producción.

---

## 10. Resumen de Fases y Entregables

| Fase | Objetivo | Entregables clave |
|------|----------|-------------------|
| 0 | Bootstrapping | Proyecto creado, deps instaladas, `.env.local` |
| 1 | Autenticación | Login funcional, sesión con JWT, middleware de rutas |
| 2 | Data fetching | Axios con interceptores, servicios por módulo, QueryClient |
| 3 | Layout + Modales | Dashboard shell, Sidebar por rol, Modal base, useModal hook |
| 4 | Dashboard Admin | CRUD completo en modales: usuarios, cursos, materias, años |
| 5 | Dashboard Profesor | Actividades por parcial, calificación individual y bulk |
| 6 | Dashboard Estudiante | Vista de materias, actividades, promedios, subida de PDF |
| 7 | Notificaciones | Polling de notificaciones, badge en navbar, panel de lectura |
| 8 | Pulido | Responsive, accesibilidad, estados vacíos, validaciones UX |

---

**FIN DEL PLAN DE ACCIÓN FRONTEND**
