import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDocenciaDto } from './dto/create-docencia.dto';

@Injectable()
export class DocenciaService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateDocenciaDto) {
    const esProfesor = await this.prisma.usuarioRol.findFirst({
      where: { idUsuario: dto.idUsuario, idRol: 2 },
    });
    if (!esProfesor) throw new BadRequestException('El usuario no tiene rol de PROFESOR');

    return this.prisma.profesorMateriaCurso.upsert({
      where: {
        idUsuario_idCurso_idMateria: {
          idUsuario: dto.idUsuario,
          idCurso: dto.idCurso,
          idMateria: dto.idMateria,
        },
      },
      update: {},
      create: dto,
    });
  }

  findAll(idUsuario?: string) {
    return this.prisma.profesorMateriaCurso.findMany({
      where: idUsuario ? { idUsuario } : undefined,
      include: { curso: true, materia: true, usuario: { omit: { contrasenaUsuario: true, tokenRecuperacion: true } } },
    });
  }

  async remove(dto: CreateDocenciaDto) {
    await this.prisma.profesorMateriaCurso.delete({
      where: {
        idUsuario_idCurso_idMateria: {
          idUsuario: dto.idUsuario,
          idCurso: dto.idCurso,
          idMateria: dto.idMateria,
        },
      },
    });
    return { message: 'Asignación de docencia eliminada' };
  }
}
