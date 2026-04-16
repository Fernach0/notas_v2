import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMatriculaDto } from './dto/create-matricula.dto';

@Injectable()
export class MatriculaService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMatriculaDto) {
    const esEstudiante = await this.prisma.usuarioRol.findFirst({
      where: { idUsuario: dto.idUsuario, idRol: 3 },
    });
    if (!esEstudiante) {
      throw new BadRequestException('El usuario no tiene rol de ESTUDIANTE');
    }

    const yaMatriculado = await this.prisma.usuarioCurso.findUnique({
      where: { idUsuario: dto.idUsuario },
    });
    if (yaMatriculado) {
      throw new ConflictException(
        'El estudiante ya está matriculado en un curso. Use el endpoint de traslado para cambiarlo.',
      );
    }

    const curso = await this.prisma.curso.findUnique({
      where: { idCurso: dto.idCurso },
      include: { anioLectivo: true },
    });
    if (!curso) throw new NotFoundException('Curso no encontrado');
    if (curso.anioLectivo.estadoLectivo === 'FINALIZADO') {
      throw new BadRequestException('No se puede matricular en un año lectivo FINALIZADO');
    }

    return this.prisma.usuarioCurso.create({
      data: { idUsuario: dto.idUsuario, idCurso: dto.idCurso },
    });
  }

  findAll(idCurso?: number) {
    return this.prisma.usuarioCurso.findMany({
      where: idCurso ? { idCurso } : undefined,
      select: {
        idCurso: true,
        usuario: {
          select: {
            idUsuario: true,
            nombreCompleto: true,
            estadoUsuario: true,
            email: true,
          },
        },
      },
    });
  }

  async remove(dto: CreateMatriculaDto) {
    const existe = await this.prisma.usuarioCurso.findUnique({
      where: { idUsuario_idCurso: { idUsuario: dto.idUsuario, idCurso: dto.idCurso } },
    });
    if (!existe) throw new NotFoundException('Matrícula no encontrada');

    await this.prisma.usuarioCurso.delete({
      where: { idUsuario_idCurso: { idUsuario: dto.idUsuario, idCurso: dto.idCurso } },
    });
    return { message: 'Matrícula eliminada' };
  }

  async trasladar(idUsuario: string, idCursoDestino: number) {
    const esEstudiante = await this.prisma.usuarioRol.findFirst({
      where: { idUsuario, idRol: 3 },
    });
    if (!esEstudiante) {
      throw new BadRequestException('El usuario no tiene rol de ESTUDIANTE');
    }

    const matriculaActual = await this.prisma.usuarioCurso.findUnique({
      where: { idUsuario },
    });
    if (!matriculaActual) {
      throw new NotFoundException('El estudiante no está matriculado en ningún curso');
    }

    if (matriculaActual.idCurso === idCursoDestino) {
      throw new BadRequestException('El estudiante ya pertenece a ese curso');
    }

    const cursoDestino = await this.prisma.curso.findUnique({
      where: { idCurso: idCursoDestino },
      include: { anioLectivo: true },
    });
    if (!cursoDestino) throw new NotFoundException('Curso destino no encontrado');
    if (cursoDestino.anioLectivo.estadoLectivo === 'FINALIZADO') {
      throw new BadRequestException('No se puede trasladar a un año lectivo FINALIZADO');
    }

    const [, nuevaMatricula] = await this.prisma.$transaction([
      this.prisma.usuarioCurso.delete({
        where: {
          idUsuario_idCurso: {
            idUsuario,
            idCurso: matriculaActual.idCurso,
          },
        },
      }),
      this.prisma.usuarioCurso.create({
        data: { idUsuario, idCurso: idCursoDestino },
      }),
    ]);

    return {
      message: `Estudiante trasladado del curso ${matriculaActual.idCurso} al curso ${idCursoDestino}`,
      matricula: nuevaMatricula,
    };
  }
}
