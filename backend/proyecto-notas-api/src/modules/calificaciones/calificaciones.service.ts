import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PromediosService } from '../promedios/promedios.service';
import { CreateCalificacionDto, BulkCalificacionDto } from './dto/create-calificacion.dto';

@Injectable()
export class CalificacionesService {
  constructor(
    private prisma: PrismaService,
    private promediosService: PromediosService,
  ) {}

  private async validarNota(idActividad: number, nota: number) {
    const actividad = await this.prisma.actividad.findUnique({ where: { idActividad } });
    if (!actividad) throw new NotFoundException('Actividad no encontrada');
    if (nota > actividad.valorMaximo) {
      throw new BadRequestException(
        `La nota ${nota} supera el valor máximo de ${actividad.valorMaximo}`,
      );
    }
  }

  // Recalcula el promedio de materia para un estudiante tras guardar su nota.
  // Falla silenciosamente para no bloquear la operación principal.
  private async recalcular(idUsuario: string, idActividad: number): Promise<void> {
    try {
      const act = await this.prisma.actividad.findUnique({
        where: { idActividad },
        include: {
          parcial: {
            include: { curso: { select: { idAnioLectivo: true } } },
          },
        },
      });
      if (!act) return;
      const { idCurso, idMateria } = act.parcial;
      const { idAnioLectivo } = act.parcial.curso;
      await this.promediosService.recalcularMateria(idUsuario, idCurso, idMateria, idAnioLectivo);
    } catch {
      // best-effort
    }
  }

  async create(dto: CreateCalificacionDto) {
    await this.validarNota(dto.idActividad, dto.nota);
    const result = await this.prisma.calificacion.upsert({
      where: { idUsuario_idActividad: { idUsuario: dto.idUsuario, idActividad: dto.idActividad } },
      update: { nota: dto.nota, comentario: dto.comentario },
      create: dto,
    });
    await this.recalcular(dto.idUsuario, dto.idActividad);
    return result;
  }

  async createBulk(dto: BulkCalificacionDto) {
    const actividad = await this.prisma.actividad.findUnique({
      where: { idActividad: dto.idActividad },
    });
    if (!actividad) throw new NotFoundException('Actividad no encontrada');

    const results = await Promise.all(
      dto.calificaciones.map((c) => {
        if (c.nota > actividad.valorMaximo) {
          throw new BadRequestException(
            `La nota de ${c.idUsuario} supera el valor máximo de ${actividad.valorMaximo}`,
          );
        }
        return this.prisma.calificacion.upsert({
          where: {
            idUsuario_idActividad: { idUsuario: c.idUsuario, idActividad: dto.idActividad },
          },
          update: { nota: c.nota, comentario: c.comentario },
          create: { idUsuario: c.idUsuario, idActividad: dto.idActividad, nota: c.nota, comentario: c.comentario },
        });
      }),
    );

    await Promise.allSettled(
      dto.calificaciones.map((c) => this.recalcular(c.idUsuario, dto.idActividad)),
    );

    return results;
  }

  findByActividad(idActividad: number) {
    return this.prisma.calificacion.findMany({
      where: { idActividad },
      include: { usuario: { omit: { contrasenaUsuario: true, tokenRecuperacion: true } } },
    });
  }

  findByEstudiante(idUsuario: string, idAnioLectivo?: number) {
    return this.prisma.calificacion.findMany({
      where: { idUsuario },
      include: { actividad: { include: { parcial: { include: { materia: true, curso: true } } } } },
    });
  }

  async update(id: number, data: { nota?: number; comentario?: string }) {
    const cal = await this.prisma.calificacion.findUnique({ where: { idCalificacion: id } });
    if (!cal) throw new NotFoundException('Calificación no encontrada');
    if (data.nota !== undefined) await this.validarNota(cal.idActividad, data.nota);
    const result = await this.prisma.calificacion.update({ where: { idCalificacion: id }, data });
    await this.recalcular(cal.idUsuario, cal.idActividad);
    return result;
  }
}
