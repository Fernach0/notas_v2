import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const usuario = await this.prisma.usuario.findFirst({
      where: { email: dto.email },
      include: { roles: { select: { idRol: true } } },
    });
    if (!usuario) throw new UnauthorizedException('Credenciales incorrectas');
    if (usuario.estadoUsuario !== 'ACTIVO')
      throw new UnauthorizedException('Usuario inactivo o bloqueado');

    const valid = await bcrypt.compare(dto.password, usuario.contrasenaUsuario);
    if (!valid) throw new UnauthorizedException('Credenciales incorrectas');

    const roles = usuario.roles.map((r) => r.idRol);
    const payload = { sub: usuario.idUsuario, roles };
    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      idUsuario: usuario.idUsuario,
      nombreCompleto: usuario.nombreCompleto,
      roles,
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const usuario = await this.prisma.usuario.findFirst({
      where: { email: dto.email },
    });
    if (!usuario) throw new NotFoundException('No existe usuario con ese email');

    const token = crypto.randomUUID();
    const expiracion = new Date(Date.now() + 1000 * 60 * 60); // 1 hora

    await this.prisma.usuario.update({
      where: { idUsuario: usuario.idUsuario },
      data: { tokenRecuperacion: token, expiracionToken: expiracion },
    });

    // Envío de email (configurar credenciales SMTP en .env para producción)
    const transporter = nodemailer.createTransport({
      host: this.config.get('SMTP_HOST') || 'smtp.ethereal.email',
      port: Number(this.config.get('SMTP_PORT') || 587),
      auth: {
        user: this.config.get('SMTP_USER'),
        pass: this.config.get('SMTP_PASS'),
      },
    });

    await transporter.sendMail({
      from: '"Notas Escuela" <no-reply@notas.edu.ec>',
      to: usuario.email!,
      subject: 'Recuperación de contraseña',
      text: `Tu token de recuperación es: ${token}\nVálido por 1 hora.`,
    });

    return { message: 'Se envió un email con el token de recuperación' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const usuario = await this.prisma.usuario.findFirst({
      where: { tokenRecuperacion: dto.token },
    });
    if (!usuario) throw new BadRequestException('Token inválido');
    if (!usuario.expiracionToken || usuario.expiracionToken < new Date()) {
      throw new BadRequestException('Token expirado');
    }

    const hash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.usuario.update({
      where: { idUsuario: usuario.idUsuario },
      data: {
        contrasenaUsuario: hash,
        tokenRecuperacion: null,
        expiracionToken: null,
      },
    });

    return { message: 'Contraseña actualizada correctamente' };
  }

  async changePassword(idUsuario: string, dto: ChangePasswordDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { idUsuario },
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    const valid = await bcrypt.compare(dto.oldPassword, usuario.contrasenaUsuario);
    if (!valid) throw new UnauthorizedException('Contraseña actual incorrecta');

    const hash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.usuario.update({
      where: { idUsuario },
      data: { contrasenaUsuario: hash },
    });

    return { message: 'Contraseña cambiada correctamente' };
  }

  async getProfile(idUsuario: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { idUsuario },
      select: {
        idUsuario: true,
        nombreCompleto: true,
        estadoUsuario: true,
        email: true,
        roles: { select: { idRol: true, rol: { select: { nombreRol: true } } } },
      },
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    const roleIds = usuario.roles.map((r) => r.idRol);

    const [matricula, docencias] = await Promise.all([
      roleIds.includes(3)
        ? this.prisma.usuarioCurso.findUnique({
            where: { idUsuario },
            select: {
              idCurso: true,
              curso: {
                select: {
                  nombreCurso: true,
                  anioLectivo: {
                    select: { fechaInicio: true, fechaFinal: true, estadoLectivo: true },
                  },
                },
              },
            },
          })
        : Promise.resolve(null),
      roleIds.includes(2)
        ? this.prisma.profesorMateriaCurso.findMany({
            where: { idUsuario },
            select: {
              idCurso: true,
              idMateria: true,
              curso: { select: { nombreCurso: true } },
              materia: { select: { nombreMateria: true } },
            },
          })
        : Promise.resolve(null),
    ]);

    return { ...usuario, matricula, docencias };
  }
}
