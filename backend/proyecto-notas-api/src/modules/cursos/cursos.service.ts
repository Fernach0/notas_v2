import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCursoDto } from './dto/create-curso.dto';

@Injectable()
export class CursosService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateCursoDto) {
    return this.prisma.curso.create({ data: dto });
  }

  findAll(idAnioLectivo?: number) {
    return this.prisma.curso.findMany({
      where: idAnioLectivo ? { idAnioLectivo } : undefined,
      include: { anioLectivo: true },
    });
  }

  async findOne(id: number) {
    const curso = await this.prisma.curso.findUnique({
      where: { idCurso: id },
      include: { materias: { include: { materia: true } } },
    });
    if (!curso) throw new NotFoundException('Curso no encontrado');
    return curso;
  }

  async update(id: number, dto: Partial<CreateCursoDto>) {
    await this.findOne(id);
    return this.prisma.curso.update({ where: { idCurso: id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.curso.delete({ where: { idCurso: id } });
    return { message: 'Curso eliminado' };
  }

  async assignMateria(idCurso: number, idMateria: number) {
    return this.prisma.cursoMateria.upsert({
      where: { idCurso_idMateria: { idCurso, idMateria } },
      update: {},
      create: { idCurso, idMateria },
    });
  }

  async removeMateria(idCurso: number, idMateria: number) {
    await this.prisma.cursoMateria.delete({
      where: { idCurso_idMateria: { idCurso, idMateria } },
    });
    return { message: 'Materia desasignada del curso' };
  }
}
