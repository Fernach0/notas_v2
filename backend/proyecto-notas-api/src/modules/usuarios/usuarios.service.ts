import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { EstadoUsuario } from '@prisma/client';

const USUARIO_SELECT = {
  idUsuario: true,
  nombreCompleto: true,
  estadoUsuario: true,
  email: true,
  expiracionToken: true,
} as const;

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUsuarioDto) {
    if (dto.roles && dto.roles.length > 1) {
      throw new BadRequestException('Un usuario solo puede tener un rol asignado');
    }

    const existe = await this.prisma.usuario.findUnique({
      where: { idUsuario: dto.idUsuario },
    });
    if (existe) throw new ConflictException('Ya existe un usuario con esa cédula');

    const hash = await bcrypt.hash(dto.contrasenaUsuario, 10);
    await this.prisma.usuario.create({
      data: {
        idUsuario: dto.idUsuario,
        nombreCompleto: dto.nombreCompleto,
        contrasenaUsuario: hash,
        estadoUsuario: dto.estadoUsuario,
        email: dto.email,
        roles: dto.roles
          ? { create: dto.roles.map((idRol) => ({ idRol })) }
          : undefined,
      },
    });

    return this.findOne(dto.idUsuario);
  }

  async findAll(
    rol?: number,
    estado?: EstadoUsuario,
    search?: string,
    page = 1,
    limit = 20,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (estado) where.estadoUsuario = estado;
    if (rol) where.roles = { some: { idRol: rol } };
    if (search?.trim()) {
      where.OR = [
        { nombreCompleto: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { idUsuario: { contains: search } },
      ];
    }

    const userSelect: any = {
      ...USUARIO_SELECT,
      roles: { select: { idRol: true } },
    };

    if (rol === 3) {
      userSelect.cursos = {
        select: {
          idCurso: true,
          curso: { select: { nombreCurso: true } },
        },
      };
    }
    if (rol === 2) {
      userSelect.docencias = {
        select: {
          idCurso: true,
          idMateria: true,
          curso: { select: { nombreCurso: true } },
          materia: { select: { nombreMateria: true } },
        },
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.usuario.findMany({
        where,
        skip,
        take: limit,
        select: userSelect,
      }),
      this.prisma.usuario.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(idUsuario: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { idUsuario },
      select: {
        ...USUARIO_SELECT,
        roles: { select: { idRol: true, rol: true } },
      },
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    return usuario;
  }

  async update(idUsuario: string, dto: UpdateUsuarioDto) {
    await this.findOne(idUsuario);
    return this.prisma.usuario.update({
      where: { idUsuario },
      data: dto,
      select: {
        ...USUARIO_SELECT,
        roles: { select: { idRol: true } },
      },
    });
  }

  async remove(idUsuario: string) {
    await this.findOne(idUsuario);
    await this.prisma.usuario.delete({ where: { idUsuario } });
    return { message: 'Usuario eliminado' };
  }

  async assignRol(idUsuario: string, idRol: number) {
    await this.findOne(idUsuario);
    return this.prisma.usuarioRol.upsert({
      where: { idUsuario_idRol: { idUsuario, idRol } },
      update: {},
      create: { idUsuario, idRol },
    });
  }

  async removeRol(idUsuario: string, idRol: number) {
    await this.findOne(idUsuario);
    await this.prisma.usuarioRol.delete({
      where: { idUsuario_idRol: { idUsuario, idRol } },
    });
    return { message: 'Rol removido' };
  }
}
