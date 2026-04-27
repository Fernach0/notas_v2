import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateActividadDto } from './dto/create-actividad.dto';

// Tipos que tienen límite de 1 por parcial. TAREA no aparece aquí → ilimitada.
const LIMITE_POR_TIPO: Partial<Record<string, number>> = {
  EXAMEN: 1,
  PRUEBA: 1,
  PROYECTO: 1,
};

@Injectable()
export class ActividadesService {
  constructor(private prisma: PrismaService) {}

  private async validarLimiteTipo(idParcial: number, tipoActividad: string): Promise<void> {
    const limite = LIMITE_POR_TIPO[tipoActividad];
    if (!limite) return;

    const count = await this.prisma.actividad.count({
      where: { idParcial, tipoActividad: tipoActividad as any },
    });

    if (count >= limite) {
      throw new BadRequestException(
        `Ya existe un(a) ${tipoActividad.charAt(0) + tipoActividad.slice(1).toLowerCase()} en este parcial. Solo se permite ${limite} por parcial.`,
      );
    }
  }

  async create(dto: CreateActividadDto) {
    if (new Date(dto.fechaFinEntrega) < new Date(dto.fechaInicioEntrega)) {
      throw new BadRequestException('La fecha fin debe ser mayor o igual a la fecha inicio');
    }

    await this.validarLimiteTipo(dto.idParcial, dto.tipoActividad);

    return this.prisma.actividad.create({
      data: {
        idParcial: dto.idParcial,
        tipoActividad: dto.tipoActividad,
        fechaInicioEntrega: new Date(dto.fechaInicioEntrega),
        fechaFinEntrega: new Date(dto.fechaFinEntrega),
        descripcion: dto.descripcion,
        tituloActividad: dto.tituloActividad,
        valorMaximo: 10.0,
      },
    });
  }

  findAll(idParcial?: number) {
    return this.prisma.actividad.findMany({
      where: idParcial ? { idParcial } : undefined,
      include: { parcial: true },
    });
  }

  async findOne(id: number) {
    const a = await this.prisma.actividad.findUnique({
      where: { idActividad: id },
      include: { parcial: true },
    });
    if (!a) throw new NotFoundException('Actividad no encontrada');
    return a;
  }

  async update(id: number, dto: Partial<CreateActividadDto>) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (dto.fechaInicioEntrega) data.fechaInicioEntrega = new Date(dto.fechaInicioEntrega);
    if (dto.fechaFinEntrega) data.fechaFinEntrega = new Date(dto.fechaFinEntrega);
    // valorMaximo siempre es 10, ignorar si viene en dto
    delete data.valorMaximo;
    return this.prisma.actividad.update({ where: { idActividad: id }, data });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.actividad.delete({ where: { idActividad: id } });
    return { message: 'Actividad eliminada' };
  }
}
