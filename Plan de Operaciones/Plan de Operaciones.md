# Plan de Operaciones — Proyecto Notas

> Documento de referencia DevOps para el mantenimiento y operación del sistema en producción.

---

## Arquitectura en producción

| Componente | Tecnología | Plataforma |
|------------|-----------|-----------|
| Backend | NestJS + Prisma ORM | Render (Web Service) |
| Frontend | Next.js + NextAuth | Vercel |
| Base de datos | PostgreSQL | Supabase (producción) / PostgreSQL local (desarrollo) |

---

## 1. Monitoreo

### 1.1 Backend — Dashboard de Render

Desde el dashboard del servicio en Render hay dos secciones de monitoreo:

- **"Metrics"** (pestaña lateral) — muestra CPU, memoria y uso de disco en tiempo real.
- **"Logs"** (pestaña lateral) — muestra la salida del proceso Node.js en tiempo real.

**Métricas de sistema (pestaña "Metrics")**

| Métrica | Umbral de alerta | Acción |
|---------|-----------------|--------|
| CPU Usage | > 80% sostenido por más de 2 min | Revisar endpoints con alta carga; considerar upgrade de instancia |
| Memory Usage | > 85% del límite del plan | Buscar memory leaks en el código; revisar queries de Prisma sin paginación |
| Disk I/O | Picos frecuentes | Evaluar si el almacenamiento de evidencias en BD es adecuado |

**Logs del servicio (pestaña "Logs")**

Las entradas críticas a monitorear son:

- `[NestApplication] Nest application successfully started` — confirma arranque correcto
- `PrismaClientKnownRequestError` — errores de base de datos (constraints, timeouts)
- `Error: Cannot find module` — error de build o archivo faltante en `dist/`
- `Exited with status 1` — el proceso murió; revisar el stack trace inmediatamente arriba

**Disponibilidad**

En el plan gratuito de Render, el servicio entra en estado *sleep* tras 15 minutos de inactividad. La primera petición después del sleep puede tardar entre 30 y 60 segundos. Para proyectos en producción real, se recomienda un **cron job externo** (ej. UptimeRobot, plan gratuito) que haga ping al endpoint `/api` cada 10 minutos para mantener el servicio activo.

---

### 1.2 Frontend — Dashboard de Vercel

El monitoreo en Vercel está distribuido en tres secciones del menú lateral:

---

**Pestaña "Logs"**

Muestra los logs de runtime en tiempo real (peticiones HTTP, errores de Server Components, respuestas de las rutas `/api`). Columnas visibles: `Time`, `Status`, `Host`, `Request`, `Messages`. Es la primera pestaña a revisar ante cualquier error en producción.

---

**Pestaña "Analytics"**

Requiere activación: botón **"Enable"** dentro de la pestaña. Una vez activa, recolecta datos de tráfico desde ese momento (no muestra datos previos a la activación).

| Métrica | Qué indica |
|---------|-----------|
| **Visitors** | Usuarios únicos que visitaron el sitio |
| **Page Views** | Total de páginas cargadas |
| **Bounce Rate** | Porcentaje de usuarios que salieron sin interactuar |

---

**Pestaña "Speed Insights"**

Muestra las métricas de rendimiento real (Core Web Vitals) medidas desde los navegadores de los usuarios.

| Métrica | Umbral aceptable | Qué indica |
|---------|-----------------|-----------|
| **Time to First Byte (TTFB)** | < 800ms | Tiempo de respuesta del servidor Next.js |
| **Largest Contentful Paint (LCP)** | < 2.5s | Velocidad de carga percibida por el usuario |
| **Cumulative Layout Shift (CLS)** | < 0.1 | Estabilidad visual de la página |

---

**Pestaña "Deployments"**

Historial de todos los deploys. Los estados posibles son:

- `Ready` — despliegue exitoso
- `Error` — build falló; hacer clic en el deployment para ver el log completo
- `Canceled` — fue reemplazado por un deploy más reciente

---

## 2. Gestión de Incidentes

### 2.1 Protocolo general

Ante cualquier fallo, el flujo de diagnóstico es:

```
1. Identificar síntoma (error 500, timeout, pantalla en blanco)
        ↓
2. Revisar logs del servicio afectado (Render o Vercel)
        ↓
3. Reproducir el error localmente con las mismas variables de entorno
        ↓
4. Aplicar corrección en rama separada → push → deploy automático
        ↓
5. Verificar en producción y documentar el incidente
```

---

### 2.2 Escenario: el backend falla en Render (`Exited with status 1`)

Este error significa que el proceso Node.js terminó de forma inesperada. El protocolo es:

1. **Ir a Render → Logs** y leer las líneas inmediatamente anteriores al `Exited with status 1`. El error real siempre está ahí (ejemplo: `PrismaClientInitializationError`, `Cannot find module`, `SyntaxError`).
2. **Verificar las variables de entorno** en Render → Environment. Los errores más comunes son `DATABASE_URL` mal formada o `JWT_SECRET` vacío.
3. **Verificar que el build produjo `dist/main.js`**: si el log de build no muestra la compilación de NestJS, el problema es en la fase de build, no de runtime.
4. Si el error persiste, usar **Instant Rollback** en Render (botón en la pestaña Deployments) para revertir al último deployment estable mientras se investiga.

---

### 2.3 Escenario: la base de datos se desconecta

Supabase puede rechazar conexiones por límite del plan gratuito (máximo 60 conexiones simultáneas con el pooler de transacciones).

| Síntoma | Causa probable | Acción |
|---------|---------------|--------|
| `Connection pool timeout` en logs | Se agotaron las conexiones del pooler | Verificar que `DATABASE_URL` usa el puerto 6543 (Transaction pooler), no el 5432 directo |
| `ECONNREFUSED` | Supabase pausó el proyecto por inactividad (plan gratuito pausa tras 7 días sin uso) | Ir al dashboard de Supabase → botón **"Restore project"** |
| `P1001: Can't reach database server` | Red intermitente o credenciales cambiadas | Verificar que la contraseña de la BD no fue rotada en Supabase |

> **Importante:** Supabase en plan gratuito pausa los proyectos inactivos automáticamente. Si la app no recibe tráfico por más de 7 días, la base de datos se pausará y todas las peticiones fallarán hasta restaurarla manualmente desde el dashboard de Supabase.

---

### 2.4 Escenario: el frontend no carga o muestra error de CORS

1. Abrir las herramientas de desarrollo del navegador → pestaña **Network** → buscar la petición fallida.
2. Si el error es `CORS: No 'Access-Control-Allow-Origin'`, significa que `FRONTEND_URL` en Render no coincide exactamente con la URL de Vercel (verificar que no haya barra final `/`).
3. Si el error es `401 Unauthorized` en todas las peticiones, `NEXTAUTH_SECRET` o `NEXTAUTH_URL` están mal configurados en Vercel.

---

## 3. Seguridad

### 3.1 Manejo de variables de entorno (secretos)

**Principios base**

- Ningún secreto debe estar en el código fuente ni en el repositorio de Git.
- El archivo `.env.local` está en `.gitignore` — nunca debe eliminarse de esa lista.
- Los secretos en Render y Vercel se almacenan cifrados en reposo por las plataformas.

**Variables críticas y su gestión**

| Variable | Plataforma | Riesgo si se expone | Política de rotación |
|----------|-----------|--------------------|--------------------|
| `DATABASE_URL` | Render | Acceso total a la BD | Rotar si hay sospecha de compromiso |
| `DIRECT_URL` | Render | Acceso directo sin pooler | Rotar junto con `DATABASE_URL` |
| `JWT_SECRET` | Render | Permite forjar tokens de cualquier usuario | Rotar cada 6 meses o ante sospecha |
| `NEXTAUTH_SECRET` | Vercel | Invalida todas las sesiones activas | Rotar junto con `JWT_SECRET` |
| `EMAIL_PASS` | Render | Permite enviar correos desde la cuenta | Usar App Password de Gmail, no la contraseña real |

**Procedimiento para rotar un secreto**

1. Generar el nuevo valor (ej. nuevo `JWT_SECRET` con un generador de strings aleatorios).
2. Actualizar la variable en la plataforma correspondiente (Render o Vercel).
3. Hacer Redeploy para que el servicio tome el nuevo valor.
4. Verificar que el servicio arrancó correctamente antes de cerrar la sesión anterior.

---

### 3.2 Actualizaciones de dependencias de Node.js

Las dependencias desactualizadas son la principal fuente de vulnerabilidades en proyectos Node.js.

**Revisión periódica**

Ejecutar mensualmente en ambos proyectos (backend y frontend):

```bash
npm audit
```

Esto lista las vulnerabilidades conocidas con su nivel de severidad (`low`, `moderate`, `high`, `critical`). Las de nivel `high` y `critical` deben resolverse antes de cualquier deploy a producción.

**Actualización controlada**

No usar `npm audit fix --force` directamente en producción — puede introducir cambios que rompan la API. El flujo correcto es:

1. Crear una rama separada: `git checkout -b fix/security-updates`
2. Aplicar las correcciones y ejecutar pruebas locales.
3. Hacer merge a `main` solo después de verificar que el comportamiento es correcto.

**Fijar la versión de Node.js**

Render y Vercel usan la versión de Node.js especificada en el campo `engines` del `package.json`. Si no está definido, usan su versión por defecto. Para fijar la versión y evitar actualizaciones automáticas inesperadas, agregar al `package.json` de cada proyecto:

```json
"engines": {
  "node": ">=20.0.0"
}
```

---

## 4. Respaldo (Backup)

### 4.1 Estrategia para Supabase (producción)

Supabase en plan gratuito **no incluye backups automáticos programados**. La estrategia recomendada para este stack es un respaldo manual periódico usando `pg_dump`.

**Procedimiento de respaldo manual**

1. Obtener la **Direct Connection URL** de Supabase (puerto 5432, no el pooler):
   ```
   postgresql://postgres.XXXX:PASSWORD@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
   ```

2. Ejecutar `pg_dump` desde cualquier máquina con PostgreSQL instalado:
   ```bash
   pg_dump "postgresql://postgres.XXXX:PASSWORD@host:5432/postgres" \
     --no-owner --no-acl \
     -f respaldo_$(date +%Y%m%d).sql
   ```

3. Guardar el archivo `.sql` generado en un almacenamiento externo (Google Drive, repositorio privado, etc.).

**Frecuencia recomendada**

| Tipo de dato | Frecuencia de respaldo |
|-------------|----------------------|
| Estructura de tablas (DDL) | Cada vez que cambie el schema de Prisma |
| Datos de producción | Semanal (o antes de cualquier migración) |
| Datos de prueba / seed | Una sola vez — ya documentado en el Plan de Despliegue |

---

### 4.2 Restauración de un respaldo

Si se necesita restaurar la base de datos desde un archivo `.sql`:

```bash
psql "postgresql://postgres.XXXX:PASSWORD@host:5432/postgres" \
  -f respaldo_YYYYMMDD.sql
```

> **Advertencia:** La restauración sobreescribe los datos existentes. Siempre hacer un respaldo del estado actual antes de restaurar uno anterior.

---

### 4.3 Respaldo del código fuente

El repositorio de GitHub actúa como respaldo del código. Para reforzarlo:

- Mantener al menos dos ramas activas: `main` (producción) y `develop` (desarrollo).
- Los históricos de commits de Git son un respaldo implícito de cada versión del código.
- Vercel guarda el historial completo de deployments con la opción de **Instant Rollback** a cualquier versión anterior sin necesidad de hacer un nuevo push.
