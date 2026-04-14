import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMateriaDto } from './dto/create-materia.dto';

@Injectable()
export class MateriasService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateMateriaDto) {
    return this.prisma.materia.create({ data: dto });
  }

  findAll() {
    return this.prisma.materia.findMany({ orderBy: { nombreMateria: 'asc' } });
  }

  async findOne(id: number) {
    const m = await this.prisma.materia.findUnique({ where: { idMateria: id } });
    if (!m) throw new NotFoundException('Materia no encontrada');
    return m;
  }

  async update(id: number, dto: Partial<CreateMateriaDto>) {
    await this.findOne(id);
    return this.prisma.materia.update({ where: { idMateria: id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.materia.delete({ where: { idMateria: id } });
    return { message: 'Materia eliminada' };
  }
}
