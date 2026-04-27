# Explicación — Dónde y Cómo Modificar los Porcentajes de Calificación

## ¿Qué son los porcentajes?

El sistema calcula la nota del parcial de cada estudiante usando una **ponderación por tipo de actividad**. En lugar de promediar todas las notas por igual, cada tipo contribuye un porcentaje fijo al total de 10 puntos:

| Tipo | Peso | Aporte máximo al parcial |
|---|---|---|
| TAREA | 20% | 2.0 puntos |
| PRUEBA | 20% | 2.0 puntos |
| PROYECTO | 25% | 2.5 puntos |
| EXAMEN | 35% | 3.5 puntos |
| **Total** | **100%** | **10.0 puntos** |

---

## Dónde están definidos los porcentajes

### Archivo único de referencia

```
backend/proyecto-notas-api/src/modules/promedios/promedios.service.ts
```

Al inicio del archivo, encima de la declaración de la clase `PromediosService`, existe un objeto constante llamado `PESOS`:

```typescript
const PESOS: Record<string, number> = {
  TAREA:    0.20,  // 20%
  PRUEBA:   0.20,  // 20%
  PROYECTO: 0.25,  // 25%
  EXAMEN:   0.35,  // 35%
};
```

Cada valor es un **decimal entre 0 y 1** que representa el porcentaje. Por ejemplo:
- `0.20` = 20%
- `0.35` = 35%

---

## Cómo cambiar un porcentaje

### Regla fundamental
La suma de todos los valores en `PESOS` **debe ser siempre igual a 1.0** (100%).  
Si modificas un valor, ajusta los demás para que la suma siga siendo 1.0.

### Ejemplo — Dar más peso al examen (40%) y reducir tareas (15%)

```typescript
// ANTES
const PESOS: Record<string, number> = {
  TAREA:    0.20,
  PRUEBA:   0.20,
  PROYECTO: 0.25,
  EXAMEN:   0.35,
};

// DESPUÉS (suma = 0.15 + 0.20 + 0.25 + 0.40 = 1.00 ✓)
const PESOS: Record<string, number> = {
  TAREA:    0.15,
  PRUEBA:   0.20,
  PROYECTO: 0.25,
  EXAMEN:   0.40,
};
```

### Verificación rápida

Después de cambiar los valores, ejecuta esta suma mentalmente o en consola:

```javascript
// Debe dar 1.0 exacto
0.15 + 0.20 + 0.25 + 0.40  // = 1.00 ✓
```

---

## Pasos para aplicar el cambio

1. Abrir `backend/proyecto-notas-api/src/modules/promedios/promedios.service.ts`
2. Localizar el objeto `const PESOS` al inicio del archivo
3. Editar los valores decimales asegurando que sumen `1.0`
4. Guardar el archivo — NestJS en modo `start:dev` recarga automáticamente
5. Recalcular los promedios existentes llamando al endpoint:
   ```
   POST /api/promedios/materia/recalcular
   Body: { "idUsuario": "...", "idCurso": N, "idMateria": N, "idAnioLectivo": N }
   ```
   (Repetir para cada estudiante afectado, o construir un endpoint de recálculo masivo)

---

## ¿Qué pasa si faltan tipos en un parcial?

Si en un parcial no existe, por ejemplo, un PROYECTO, el sistema **re-normaliza automáticamente** los pesos de los tipos que sí tienen notas. Esto evita penalizar al estudiante por actividades que el profesor no creó.

**Ejemplo:** Solo EXAMEN (0.35) y TAREA (0.20) tienen notas → pesoAcumulado = 0.55.  
La nota final se calcula como `(aporte_total / 0.55) * 10`, manteniendo la escala 0-10.

Si prefieres **penalizar** la ausencia de un tipo (la nota máxima baja si falta un tipo), hay que eliminar la re-normalización en `calcularPromedioParcial` dentro del mismo archivo. Está documentado con un comentario en el código.

---

## Advertencia sobre promedios históricos

Cambiar `PESOS` afecta todos los recálculos futuros. Los registros actuales en la tabla `promedio_materia_estudiante` **no se actualizan solos** — seguirán mostrando el promedio anterior hasta que se llame al endpoint de recálculo. Planifica el cambio fuera de horario de evaluaciones activas.
