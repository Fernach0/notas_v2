import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCursoDto } from './dto/create-curso.dto';

@Injectable()
export class CursosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCursoDto) {
    const anio = await this.prisma.anioLectivo.findUnique({
      where: { idAnioLectivo: dto.idAnioLectivo },
    });
    if (!anio) throw new NotFoundException('Año lectivo no encontrado');
    if (anio.estadoLectivo === 'FINALIZADO') {
      throw new BadRequestException(
        'No se puede crear un curso en un año lectivo FINALIZADO',
      );
    }
    return this.prisma.curso.create({ data: dto });
  }

  findAll(idAnioLectivo?: number) {
    return this.prisma.curso.findMany({
      where: idAnioLectivo ? { idAnioLectivo } : undefined,
      include: {
        anioLectivo: true,
        materias: { include: { materia: true } },
      },
    });
  }

  async findOne(id: number) {
    const curso = await this.prisma.curso.findUnique({
      where: { idCurso: id },
      include: {
        materias: { include: { materia: true } },
        estudiantes: {
          select: {
            usuario: {
              select: { idUsuario: true, nombreCompleto: true, estadoUsuario: true, email: true },
            },
          },
        },
        docentes: {
          select: {
            idMateria: true,
            materia: { select: { nombreMateria: true } },
            usuario: {
              select: { idUsuario: true, nombreCompleto: true },
            },
          },
        },
        anioLectivo: true,
      },
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

  async getMisCursos(idUsuario: string) {
    const docencias = await this.prisma.profesorMateriaCurso.findMany({
      where: { idUsuario },
      select: {
        idCurso: true,
        idMateria: true,
        curso: {
          select: {
            idCurso: true,
            nombreCurso: true,
            anioLectivo: {
              select: { fechaInicio: true, fechaFinal: true, estadoLectivo: true },
            },
          },
        },
        materia: { select: { idMateria: true, nombreMateria: true } },
      },
    });

    // Agrupar por curso
    const cursosMap = new Map<number, {
      idCurso: number;
      nombreCurso: string;
      anioLectivo: { fechaInicio: Date; fechaFinal: Date; estadoLectivo: string };
      materias: { idMateria: number; nombreMateria: string }[];
    }>();

    for (const d of docencias) {
      if (!cursosMap.has(d.idCurso)) {
        cursosMap.set(d.idCurso, { ...d.curso, materias: [] });
      }
      cursosMap.get(d.idCurso)!.materias.push(d.materia);
    }

    return Array.from(cursosMap.values());
  }
}
