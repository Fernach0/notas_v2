import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TipoNotificacion } from '@prisma/client';

@Injectable()
export class NotificacionesService {
  constructor(private prisma: PrismaService) {}

  async notificarActividad(idActividad: number) {
    const actividad = await this.prisma.actividad.findUnique({
      where: { idActividad },
      include: { parcial: { include: { curso: { include: { estudiantes: true } } } } },
    });
    if (!actividad) return;

    const estudiantes = actividad.parcial.curso.estudiantes;
    const mensaje = `Nueva actividad: ${actividad.tituloActividad ?? 'Sin título'}`;

    await this.prisma.notificacion.createMany({
      data: estudiantes.map((e) => ({
        idUsuario: e.idUsuario,
        idActividad,
        tipoNotificacion: TipoNotificacion.NUEVA_ACTIVIDAD,
        mensajeNotificacion: mensaje,
        fechaNotificacion: new Date(),
      })),
      skipDuplicates: true,
    });
  }

  async notificarCalificacion(idUsuario: string, idActividad: number, nota: number) {
    await this.prisma.notificacion.create({
      data: {
        idUsuario,
        idActividad,
        tipoNotificacion: TipoNotificacion.CALIFICACION,
        mensajeNotificacion: `Tienes una nueva calificación: ${nota}`,
        fechaNotificacion: new Date(),
      },
    });
  }

  findAll(idUsuario: string, leida?: boolean) {
    return this.prisma.notificacion.findMany({
      where: {
        idUsuario,
        ...(leida !== undefined && { leida }),
      },
      orderBy: { fechaNotificacion: 'desc' },
    });
  }

  async markRead(id: number, idUsuario: string) {
    const n = await this.prisma.notificacion.findFirst({
      where: { idNotificacion: id, idUsuario },
    });
    if (!n) throw new NotFoundException('Notificación no encontrada');
    return this.prisma.notificacion.update({
      where: { idNotificacion: id },
      data: { leida: true },
    });
  }

  async markAllRead(idUsuario: string) {
    await this.prisma.notificacion.updateMany({
      where: { idUsuario, leida: false },
      data: { leida: true },
    });
    return { message: 'Todas las notificaciones marcadas como leídas' };
  }

  async remove(id: number, idUsuario: string) {
    const n = await this.prisma.notificacion.findFirst({
      where: { idNotificacion: id, idUsuario },
    });
    if (!n) throw new NotFoundException('Notificación no encontrada');
    await this.prisma.notificacion.delete({ where: { idNotificacion: id } });
    return { message: 'Notificación eliminada' };
  }
}
