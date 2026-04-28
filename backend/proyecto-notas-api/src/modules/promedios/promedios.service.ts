import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// Pesos de cada tipo de actividad sobre la nota del parcial (deben sumar 1.0)
// Para cambiar los porcentajes consultar: Planes de accion/explicacion_porcentaje_notas.md
const PESOS: Record<string, number> = {
  TAREA:    0.2,
  PRUEBA:   0.2,
  PROYECTO: 0.25,
  EXAMEN:   0.35,
};

type ActividadConCalificaciones = {
  tipoActividad: string;
  calificaciones: { nota: number }[];
};

function calcularPromedioParcial(actividades: ActividadConCalificaciones[]): number | null {
  // Agrupar notas por tipo (solo actividades que tienen calificación)
  const grupos: Record<string, number[]> = {};
  for (const act of actividades) {
    if (act.calificaciones.length === 0) continue;
    if (!grupos[act.tipoActividad]) grupos[act.tipoActividad] = [];
    grupos[act.tipoActividad].push(act.calificaciones[0].nota);
  }

  if (Object.keys(grupos).length === 0) return null;

  let aporteTotal = 0;
  let pesoAcumulado = 0;

  for (const [tipo, notas] of Object.entries(grupos)) {
    const peso = PESOS[tipo] ?? 0;
    // Para TAREA: promedio de todas las tareas. Para otros: la nota única.
    const promGrupo = notas.reduce((s, n) => s + n, 0) / notas.length;
    aporteTotal += promGrupo * peso;
    pesoAcumulado += peso;
  }

  if (pesoAcumulado === 0) return null;

  // Re-normalizar sobre los pesos presentes para no penalizar tipos no creados
  const notaFinal = aporteTotal / pesoAcumulado;
  return Number.parseFloat(notaFinal.toFixed(2));
}

@Injectable()
export class PromediosService {
  constructor(private readonly prisma: PrismaService) {}

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
      promediosParciales[parcial.numeroParcial - 1] = calcularPromedioParcial(parcial.actividades);
    }

    const notasValidas = promediosParciales.filter((p) => p !== null) as number[];
    const promedioFinal = notasValidas.length > 0
      ? Number.parseFloat((notasValidas.reduce((s, n) => s + n, 0) / notasValidas.length).toFixed(2))
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

  async recalcularGeneral(idUsuario: string, idCurso: number) {
    const promediosMat = await this.prisma.promedioMateriaEstudiante.findMany({
      where: { idUsuario, idCurso, promedioFinalMateria: { not: null } },
    });

    if (promediosMat.length === 0) {
      throw new NotFoundException('No hay promedios de materia calculados para este estudiante/curso');
    }

    const sum = promediosMat.reduce((s, p) => s + (p.promedioFinalMateria ?? 0), 0);
    const promedioGeneral = Number.parseFloat((sum / promediosMat.length).toFixed(2));

    let comportamiento = 'E';
    if (promedioGeneral >= 9) comportamiento = 'A';
    else if (promedioGeneral >= 7) comportamiento = 'B';
    else if (promedioGeneral >= 5) comportamiento = 'C';
    else if (promedioGeneral >= 3) comportamiento = 'D';

    return this.prisma.promedioGeneralEstudiante.upsert({
      where: { idUsuario_idCurso: { idUsuario, idCurso } },
      update: { promedioGeneral, comportamiento },
      create: { idUsuario, idCurso, promedioGeneral, comportamiento },
    });
  }

  // Todos los promedios de una materia en un curso (para vista del profesor)
  findByCursoMateria(idCurso: number, idMateria: number) {
    return this.prisma.promedioMateriaEstudiante.findMany({
      where: { idCurso, idMateria },
      include: {
        usuario: { select: { idUsuario: true, nombreCompleto: true } },
      },
      orderBy: { usuario: { nombreCompleto: 'asc' } },
    });
  }

  findByMateria(idUsuario: string, idAnioLectivo?: number) {
    return this.prisma.promedioMateriaEstudiante.findMany({
      where: {
        idUsuario,
        ...(idAnioLectivo && { idAnioLectivo }),
      },
      include: { materia: true, curso: true },
    });
  }

  findGeneral(idUsuario: string, idCurso?: number) {
    return this.prisma.promedioGeneralEstudiante.findMany({
      where: {
        idUsuario,
        ...(idCurso && { idCurso }),
      },
      include: { curso: true },
    });
  }

  getRanking(idCurso: number) {
    return this.prisma.promedioGeneralEstudiante.findMany({
      where: { idCurso },
      orderBy: { promedioGeneral: 'desc' },
      include: { usuario: { omit: { contrasenaUsuario: true, tokenRecuperacion: true } } },
    });
  }

  // Recalcula promedios de TODOS los estudiantes matriculados en un curso+materia.
  // Útil para sincronizar datos históricos o reconstruir la tabla desde cero.
  async recalcularTodo(idCurso: number, idMateria: number) {
    const curso = await this.prisma.curso.findUnique({
      where: { idCurso },
      include: { estudiantes: { select: { idUsuario: true } } },
    });
    if (!curso) throw new NotFoundException('Curso no encontrado');

    const { idAnioLectivo } = curso;
    const estudiantes = curso.estudiantes;

    await Promise.allSettled(
      estudiantes.map((e) =>
        this.recalcularMateria(e.idUsuario, idCurso, idMateria, idAnioLectivo),
      ),
    );

    return { recalculados: estudiantes.length };
  }
}
