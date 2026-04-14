import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateActividadDto } from './dto/create-actividad.dto';

@Injectable()
export class ActividadesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateActividadDto) {
    if (new Date(dto.fechaFinEntrega) < new Date(dto.fechaInicioEntrega)) {
      throw new BadRequestException('La fecha fin debe ser mayor o igual a la fecha inicio');
    }
    return this.prisma.actividad.create({
      data: {
        idParcial: dto.idParcial,
        tipoActividad: dto.tipoActividad,
        fechaInicioEntrega: new Date(dto.fechaInicioEntrega),
        fechaFinEntrega: new Date(dto.fechaFinEntrega),
        descripcion: dto.descripcion,
        tituloActividad: dto.tituloActividad,
        valorMaximo: dto.valorMaximo ?? 100.0,
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
    return this.prisma.actividad.update({ where: { idActividad: id }, data });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.actividad.delete({ where: { idActividad: id } });
    return { message: 'Actividad eliminada' };
  }
}
