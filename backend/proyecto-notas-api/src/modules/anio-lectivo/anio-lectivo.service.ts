import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAnioLectivoDto } from './dto/create-anio-lectivo.dto';
import { EstadoLectivo } from '@prisma/client';

@Injectable()
export class AnioLectivoService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateAnioLectivoDto) {
    return this.prisma.anioLectivo.create({
      data: {
        fechaInicio: new Date(dto.fechaInicio),
        fechaFinal: new Date(dto.fechaFinal),
        estadoLectivo: dto.estadoLectivo,
      },
    });
  }

  findAll(estado?: EstadoLectivo) {
    return this.prisma.anioLectivo.findMany({
      where: estado ? { estadoLectivo: estado } : undefined,
      orderBy: { fechaInicio: 'desc' },
    });
  }

  async findOne(id: number) {
    const anio = await this.prisma.anioLectivo.findUnique({ where: { idAnioLectivo: id } });
    if (!anio) throw new NotFoundException('Año lectivo no encontrado');
    return anio;
  }

  async update(id: number, dto: Partial<CreateAnioLectivoDto>) {
    await this.findOne(id);
    return this.prisma.anioLectivo.update({
      where: { idAnioLectivo: id },
      data: {
        ...(dto.fechaInicio && { fechaInicio: new Date(dto.fechaInicio) }),
        ...(dto.fechaFinal && { fechaFinal: new Date(dto.fechaFinal) }),
        ...(dto.estadoLectivo && { estadoLectivo: dto.estadoLectivo }),
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.anioLectivo.delete({ where: { idAnioLectivo: id } });
    return { message: 'Año lectivo eliminado' };
  }
}
