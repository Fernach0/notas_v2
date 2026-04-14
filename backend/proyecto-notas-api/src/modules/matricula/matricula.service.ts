import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMatriculaDto } from './dto/create-matricula.dto';

@Injectable()
export class MatriculaService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateMatriculaDto) {
    // Validar que el usuario tenga rol ESTUDIANTE (3)
    const esEstudiante = await this.prisma.usuarioRol.findFirst({
      where: { idUsuario: dto.idUsuario, idRol: 3 },
    });
    if (!esEstudiante) throw new BadRequestException('El usuario no tiene rol de ESTUDIANTE');

    return this.prisma.usuarioCurso.upsert({
      where: { idUsuario_idCurso: { idUsuario: dto.idUsuario, idCurso: dto.idCurso } },
      update: {},
      create: { idUsuario: dto.idUsuario, idCurso: dto.idCurso },
    });
  }

  findAll(idCurso?: number) {
    return this.prisma.usuarioCurso.findMany({
      where: idCurso ? { idCurso } : undefined,
      include: { usuario: { omit: { contrasenaUsuario: true, tokenRecuperacion: true } } },
    });
  }

  async remove(dto: CreateMatriculaDto) {
    await this.prisma.usuarioCurso.delete({
      where: { idUsuario_idCurso: { idUsuario: dto.idUsuario, idCurso: dto.idCurso } },
    });
    return { message: 'Matrícula eliminada' };
  }
}
