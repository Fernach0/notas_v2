import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PromediosService {
  constructor(private prisma: PrismaService) {}

  async recalcularMateria(idUsuario: string, idCurso: number, idMateria: number, idAnioLectivo: number) {
    // Obtener parciales del curso-materia
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
      const notas = parcial.actividades
        .flatMap((a) => a.calificaciones)
        .map((c) => c.nota);
      if (notas.length > 0) {
        promediosParciales[parcial.numeroParcial - 1] =
          notas.reduce((s, n) => s + n, 0) / notas.length;
      }
    }

    const notasValidas = promediosParciales.filter((p) => p !== null) as number[];
    const promedioFinal = notasValidas.length > 0
      ? notasValidas.reduce((s, n) => s + n, 0) / notasValidas.length
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
    const promedioGeneral = sum / promediosMat.length;

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
}
