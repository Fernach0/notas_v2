import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RetencionEvidenciasService {
  private readonly logger = new Logger(RetencionEvidenciasService.name);
  private lastRunStatus: { fecha: Date; limpiadas: number } | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron() {
    this.logger.log('Iniciando job de retención de evidencias...');
    await this.ejecutar();
  }

  async ejecutar(idAnioLectivo?: number) {
    const diasRetencion = Number(this.config.get('DIAS_RETENCION', '30'));

    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - diasRetencion);

    const anios = await this.prisma.anioLectivo.findMany({
      where: {
        estadoLectivo: 'FINALIZADO',
        fechaFinal: { lte: fechaLimite },
        ...(idAnioLectivo && { idAnioLectivo }),
      },
    });

    let limpiadas = 0;

    for (const anio of anios) {
      const evidencias = await this.prisma.evidencia.findMany({
        where: {
          estado: 'ACTIVO',
          archivoBytes: { not: null },
          actividad: {
            parcial: {
              curso: { idAnioLectivo: anio.idAnioLectivo },
            },
          },
        },
        select: { idEvidencia: true },
      });

      if (evidencias.length === 0) continue;

      // Vacía los bytes en lote para liberar espacio en BD sin borrar el registro
      await this.prisma.evidencia.updateMany({
        where: {
          idEvidencia: { in: evidencias.map((e) => e.idEvidencia) },
        },
        data: { estado: 'ELIMINADO', archivoBytes: null },
      });

      limpiadas += evidencias.length;
      this.logger.log(
        `Año ${anio.idAnioLectivo}: ${evidencias.length} evidencias limpiadas de la BD`,
      );
    }

    this.lastRunStatus = { fecha: new Date(), limpiadas };
    this.logger.log(`Job completado. Evidencias limpiadas: ${limpiadas}`);
    return { limpiadas };
  }

  getLastRunStatus() {
    return this.lastRunStatus ?? { message: 'El job no ha sido ejecutado aún' };
  }
}
