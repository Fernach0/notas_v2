import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCalificacionDto, BulkCalificacionDto } from './dto/create-calificacion.dto';

@Injectable()
export class CalificacionesService {
  constructor(private prisma: PrismaService) {}

  private async validarNota(idActividad: number, nota: number) {
    const actividad = await this.prisma.actividad.findUnique({ where: { idActividad } });
    if (!actividad) throw new NotFoundException('Actividad no encontrada');
    if (nota > actividad.valorMaximo) {
      throw new BadRequestException(
        `La nota ${nota} supera el valor máximo de ${actividad.valorMaximo}`,
      );
    }
  }

  async create(dto: CreateCalificacionDto) {
    await this.validarNota(dto.idActividad, dto.nota);
    return this.prisma.calificacion.upsert({
      where: { idUsuario_idActividad: { idUsuario: dto.idUsuario, idActividad: dto.idActividad } },
      update: { nota: dto.nota, comentario: dto.comentario },
      create: dto,
    });
  }

  async createBulk(dto: BulkCalificacionDto) {
    const actividad = await this.prisma.actividad.findUnique({
      where: { idActividad: dto.idActividad },
    });
    if (!actividad) throw new NotFoundException('Actividad no encontrada');

    return Promise.all(
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
    return this.prisma.calificacion.update({ where: { idCalificacion: id }, data });
  }
}
