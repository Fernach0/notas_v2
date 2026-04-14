import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class RetencionEvidenciasService {
  private readonly logger = new Logger(RetencionEvidenciasService.name);
  private lastRunStatus: { fecha: Date; eliminadas: number } | null = null;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron() {
    this.logger.log('Iniciando job de retención de evidencias...');
    await this.ejecutar();
  }

  async ejecutar(idAnioLectivo?: number) {
    const storagePath = this.config.get<string>('STORAGE_PATH', './storage/pdfs');
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

    let eliminadas = 0;

    for (const anio of anios) {
      const evidencias = await this.prisma.evidencia.findMany({
        where: {
          estado: 'ACTIVO',
          urlArchivo: { not: null },
          actividad: {
            parcial: {
              curso: { idAnioLectivo: anio.idAnioLectivo },
            },
          },
        },
      });

      for (const ev of evidencias) {
        if (ev.urlArchivo) {
          const fullPath = path.join(storagePath, ev.urlArchivo);
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            this.logger.log(`Archivo eliminado: ${fullPath}`);
          }
        }

        await this.prisma.evidencia.update({
          where: { idEvidencia: ev.idEvidencia },
          data: { estado: 'ELIMINADO', urlArchivo: null },
        });
        eliminadas++;
      }
    }

    this.lastRunStatus = { fecha: new Date(), eliminadas };
    this.logger.log(`Job completado. Evidencias eliminadas: ${eliminadas}`);
    return { eliminadas };
  }

  getLastRunStatus() {
    return this.lastRunStatus ?? { message: 'El job no ha sido ejecutado aún' };
  }
}
