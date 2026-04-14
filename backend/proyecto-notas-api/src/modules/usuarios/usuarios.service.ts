import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { EstadoUsuario } from '@prisma/client';

@Injectable()
export class UsuariosService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUsuarioDto) {
    const existe = await this.prisma.usuario.findUnique({
      where: { idUsuario: dto.idUsuario },
    });
    if (existe) throw new ConflictException('Ya existe un usuario con esa cédula');

    const hash = await bcrypt.hash(dto.contrasenaUsuario, 10);
    const usuario = await this.prisma.usuario.create({
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
      include: { roles: true },
    });
    return usuario;
  }

  async findAll(rol?: number, estado?: EstadoUsuario, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (estado) where.estadoUsuario = estado;
    if (rol) where.roles = { some: { idRol: rol } };

    const [data, total] = await Promise.all([
      this.prisma.usuario.findMany({
        where,
        skip,
        take: limit,
        include: { roles: { select: { idRol: true } } },
        omit: { contrasenaUsuario: true, tokenRecuperacion: true },
      }),
      this.prisma.usuario.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findOne(idUsuario: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { idUsuario },
      include: { roles: { select: { idRol: true, rol: true } } },
      omit: { contrasenaUsuario: true, tokenRecuperacion: true },
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    return usuario;
  }

  async update(idUsuario: string, dto: UpdateUsuarioDto) {
    await this.findOne(idUsuario);
    return this.prisma.usuario.update({
      where: { idUsuario },
      data: dto,
      omit: { contrasenaUsuario: true, tokenRecuperacion: true },
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
