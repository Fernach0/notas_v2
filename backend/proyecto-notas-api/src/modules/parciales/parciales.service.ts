import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateParcialDto, CreateBulkParcialDto } from './dto/create-parcial.dto';

@Injectable()
export class ParcialesService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateParcialDto) {
    return this.prisma.parcial.create({ data: dto });
  }

  async createBulk(dto: CreateBulkParcialDto) {
    const parciales = await Promise.all(
      [1, 2, 3].map((num) =>
        this.prisma.parcial.upsert({
          where: {
            idMateria_idCurso_numeroParcial: {
              idMateria: dto.idMateria,
              idCurso: dto.idCurso,
              numeroParcial: num,
            },
          },
          update: {},
          create: { idMateria: dto.idMateria, idCurso: dto.idCurso, numeroParcial: num },
        }),
      ),
    );
    return parciales;
  }

  findAll(idCurso?: number, idMateria?: number) {
    return this.prisma.parcial.findMany({
      where: {
        ...(idCurso && { idCurso }),
        ...(idMateria && { idMateria }),
      },
      include: { materia: true, curso: true },
    });
  }

  async remove(id: number) {
    const p = await this.prisma.parcial.findUnique({ where: { idParcial: id } });
    if (!p) throw new NotFoundException('Parcial no encontrado');
    await this.prisma.parcial.delete({ where: { idParcial: id } });
    return { message: 'Parcial eliminado' };
  }
}
