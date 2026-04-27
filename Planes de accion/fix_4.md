# fix_4 — Reglas de Negocio para Actividades y Cálculo Ponderado de Notas

## Resumen de cambios

| Área | Cambio |
|---|---|
| `schema.prisma` | Renombrar `LECCION` → `PRUEBA` en enum `TipoActividad`; fijar `valorMaximo` a `10.0` |
| Backend — Actividades | Validar límite 1 EXAMEN / 1 PRUEBA / 1 PROYECTO por parcial antes de insertar |
| Backend — Promedios | Reemplazar promedio simple por algoritmo ponderado (TAREAS 20%, PRUEBA 20%, PROYECTO 25%, EXAMEN 35%) |
| Frontend — Formulario | Quitar campo `valorMaximo`; cambiar `LECCION` → `PRUEBA` en el select |
| Frontend — Errores | Mostrar toast descriptivo cuando el backend retorna 400/409 por límite excedido |

---

## Paso 1 — `schema.prisma`

### 1.1 Cambiar el enum `TipoActividad`

```prisma
// ANTES
enum TipoActividad {
  TAREA
  EXAMEN
  PROYECTO
  LECCION   // ← eliminar
}

// DESPUÉS
enum TipoActividad {
  TAREA
  EXAMEN
  PROYECTO
  PRUEBA    // ← nuevo valor
}
```

### 1.2 Cambiar el `@default` de `valorMaximo` en `Actividad`

El campo se conserva en la BD para consistencia histórica, pero su valor será siempre `10.0` y ya no lo elige el usuario.

```prisma
model Actividad {
  ...
  valorMaximo Float @default(10.0) @map("valor_maximo")  // era 100.0
  ...
}
```

### 1.3 Migración necesaria

```bash
# Desde /backend/proyecto-notas-api
npx prisma migrate dev --name "tipo_actividad_prueba_valor_maximo_10"
```

> **Atención:** Si ya hay filas con `tipo_actividad = 'LECCION'` en la BD, la migración fallará. Antes ejecutar:
> ```sql
> UPDATE actividad SET tipo_actividad = 'PRUEBA' WHERE tipo_actividad = 'LECCION';
> ```

---

## Paso 2 — Servicio de Actividades (Nest.js)

**Archivo:** `src/modules/actividades/actividades.service.ts`

### 2.1 Constantes de límite (encima de la clase)

```typescript
const LIMITE_POR_TIPO: Partial<Record<string, number>> = {
  EXAMEN: 1,
  PRUEBA: 1,
  PROYECTO: 1,
  // TAREA: sin límite
};
```

### 2.2 Método privado de validación

Agregar dentro de `ActividadesService`:

```typescript
private async validarLimiteTipo(idParcial: number, tipoActividad: string): Promise<void> {
  const limite = LIMITE_POR_TIPO[tipoActividad];
  if (!limite) return; // TAREA no tiene límite

  const count = await this.prisma.actividad.count({
    where: { idParcial, tipoActividad: tipoActividad as any },
  });

  if (count >= limite) {
    throw new BadRequestException(
      `Ya existe un(a) ${tipoActividad.toLowerCase()} para este parcial. Solo se permite ${limite} por parcial.`,
    );
  }
}
```

### 2.3 Llamar la validación en `create`

```typescript
async create(dto: CreateActividadDto) {
  if (new Date(dto.fechaFinEntrega) < new Date(dto.fechaInicioEntrega)) {
    throw new BadRequestException('La fecha fin debe ser mayor o igual a la fecha inicio');
  }

  // ← NUEVO: validar límite por tipo
  await this.validarLimiteTipo(dto.idParcial, dto.tipoActividad);

  return this.prisma.actividad.create({
    data: {
      idParcial: dto.idParcial,
      tipoActividad: dto.tipoActividad,
      fechaInicioEntrega: new Date(dto.fechaInicioEntrega),
      fechaFinEntrega: new Date(dto.fechaFinEntrega),
      descripcion: dto.descripcion,
      tituloActividad: dto.tituloActividad,
      valorMaximo: 10.0,  // fijo, ya no viene del DTO
    },
  });
}
```

### 2.4 Actualizar el DTO

**Archivo:** `src/modules/actividades/dto/create-actividad.dto.ts`

Eliminar el campo `valorMaximo` del DTO (ya no lo manda el frontend):

```typescript
// Borrar estas líneas:
// @ApiPropertyOptional({ example: 100.0 })
// @IsNumber()
// @Min(0.1)
// @IsOptional()
// valorMaximo?: number;
```

---

## Paso 3 — Algoritmo Ponderado de Promedio del Parcial (Nest.js)

**Archivo:** `src/modules/promedios/promedios.service.ts`

### 3.1 Constantes de ponderación (encima de la clase)

```typescript
const PESOS: Record<string, number> = {
  TAREA:    0.20,  // 20% — se promedia el conjunto de tareas
  PRUEBA:   0.20,  // 20%
  PROYECTO: 0.25,  // 25%
  EXAMEN:   0.35,  // 35%
};
```

### 3.2 Función auxiliar de cálculo para un parcial

```typescript
function calcularPromedioParcial(
  actividades: Array<{
    tipoActividad: string;
    calificaciones: Array<{ nota: number }>;
  }>,
): number | null {
  // Agrupar notas por tipo
  const grupos: Record<string, number[]> = {};
  for (const act of actividades) {
    if (act.calificaciones.length === 0) continue;
    const tipo = act.tipoActividad;
    if (!grupos[tipo]) grupos[tipo] = [];
    grupos[tipo].push(act.calificaciones[0].nota); // 1 calificación por actividad
  }

  if (Object.keys(grupos).length === 0) return null;

  let total = 0;
  let pesoAcumulado = 0;

  for (const [tipo, notas] of Object.entries(grupos)) {
    const peso = PESOS[tipo] ?? 0;
    const promGrupo = notas.reduce((s, n) => s + n, 0) / notas.length;
    // Escala: nota / 10 * peso * 10 = nota * peso
    total += promGrupo * peso;
    pesoAcumulado += peso;
  }

  // Si no están todos los tipos, re-normalizar sobre los pesos existentes
  // para no penalizar al estudiante por actividades inexistentes
  if (pesoAcumulado === 0) return null;
  return parseFloat(((total / pesoAcumulado) * 10).toFixed(2));
}
```

> **Nota sobre la normalización:** Si en un parcial solo existe EXAMEN (peso 0.35) y TAREA (peso 0.20),
> el pesoAcumulado es 0.55. El resultado se re-escala a 10 dividiéndolo por 0.55 y multiplicando
> por 10 para mantener el rango 0-10. Si prefieres **penalizar** la ausencia de tipos, elimina
> la re-normalización y simplemente usa `total` sin dividir por `pesoAcumulado`.

### 3.3 Reemplazar el cálculo en `recalcularMateria`

```typescript
async recalcularMateria(idUsuario: string, idCurso: number, idMateria: number, idAnioLectivo: number) {
  const parciales = await this.prisma.parcial.findMany({
    where: { idCurso, idMateria },
    orderBy: { numeroParcial: 'asc' },
    include: {
      actividades: {
        include: {
          calificaciones: { where: { idUsuario } },
        },
      },
    },
  });

  const promediosParciales: (number | null)[] = [null, null, null];

  for (const parcial of parciales) {
    // ← NUEVO: usar el algoritmo ponderado
    promediosParciales[parcial.numeroParcial - 1] = calcularPromedioParcial(parcial.actividades);
  }

  const notasValidas = promediosParciales.filter((p) => p !== null) as number[];
  const promedioFinal = notasValidas.length > 0
    ? parseFloat((notasValidas.reduce((s, n) => s + n, 0) / notasValidas.length).toFixed(2))
    : null;

  return this.prisma.promedioMateriaEstudiante.upsert({
    where: { idUsuario_idAnioLectivo_idCurso_idMateria: { idUsuario, idAnioLectivo, idCurso, idMateria } },
    update: {
      promedioParcial1: promediosParciales[0],
      promedioParcial2: promediosParciales[1],
      promedioParcial3: promediosParciales[2],
      promedioFinalMateria: promedioFinal,
      fechaActualizacion: new Date(),
    },
    create: {
      idUsuario, idAnioLectivo, idCurso, idMateria,
      promedioParcial1: promediosParciales[0],
      promedioParcial2: promediosParciales[1],
      promedioParcial3: promediosParciales[2],
      promedioFinalMateria: promedioFinal,
      fechaActualizacion: new Date(),
    },
  });
}
```

---

## Paso 4 — Frontend (Next.js)

### 4.1 Actualizar `ActividadForm.tsx`

**Archivo:** `components/forms/ActividadForm.tsx`

**Cambios en el schema Zod:**
```typescript
// ANTES
const schema = z.object({
  tipoActividad: z.enum(['TAREA', 'EXAMEN', 'PROYECTO', 'LECCION']),
  ...
  valorMaximo: z.coerce.number().min(1).max(100).default(100),
});

// DESPUÉS
const schema = z.object({
  tipoActividad: z.enum(['TAREA', 'EXAMEN', 'PROYECTO', 'PRUEBA']),
  // ← Eliminar campo valorMaximo
  tituloActividad: z.string().max(20).optional(),
  descripcion: z.string().max(200).optional(),
  fechaInicioEntrega: z.string().min(1, 'Requerido'),
  fechaFinEntrega: z.string().min(1, 'Requerido'),
}).refine(...);
```

**Cambios en el JSX:**
- Cambiar `<option value="LECCION">Lección</option>` → `<option value="PRUEBA">Prueba</option>`
- Eliminar el bloque JSX completo del campo "Valor máximo"
- Cambiar `defaultValues`: eliminar `valorMaximo: 100`

### 4.2 Manejo de error de límite en la página de actividades

**Archivo:** `app/(dashboard)/profesor/actividades/page.tsx`

En el `createMutation`, capturar el mensaje del backend:

```typescript
const createMutation = useMutation({
  mutationFn: actividadesService.create,
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ['actividades'] });
    createModal.close();
    show('Actividad creada');
  },
  onError: (error: any) => {
    // Mostrar el mensaje exacto del backend si existe
    const msg = error?.response?.data?.message ?? 'Error al crear la actividad';
    show(msg, 'error');
  },
});
```

> El backend retorna `{ statusCode: 400, message: "Ya existe un(a) examen para este parcial..." }`.
> `error.response.data.message` captura ese texto y lo muestra en el toast.

### 4.3 Actualizar el tipo `TipoActividad` en el frontend

**Archivo:** `types/index.ts`

```typescript
// ANTES
export type TipoActividad = 'TAREA' | 'EXAMEN' | 'PROYECTO' | 'LECCION';

// DESPUÉS
export type TipoActividad = 'TAREA' | 'EXAMEN' | 'PROYECTO' | 'PRUEBA';
```

---

## Orden de ejecución recomendado

1. Actualizar BD (SQL + migración Prisma)
2. Modificar `schema.prisma`
3. Modificar DTO + Servicio de Actividades (backend)
4. Modificar Servicio de Promedios (backend)
5. Reiniciar servidor NestJS (`npm run start:dev`)
6. Actualizar `types/index.ts` (frontend)
7. Actualizar `ActividadForm.tsx` (frontend)
8. Actualizar `actividades/page.tsx` — manejo de error en mutation (frontend)
