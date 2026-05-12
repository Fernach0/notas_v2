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
import { Resend } from 'resend';
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
    // Respuesta genérica para no revelar si el email existe
    if (!usuario) return { message: 'Si el correo existe, recibirás un enlace de recuperación.' };

    const token = crypto.randomUUID();
    const expiracion = new Date(Date.now() + 1000 * 60 * 60); // 1 hora

    await this.prisma.usuario.update({
      where: { idUsuario: usuario.idUsuario },
      data: { tokenRecuperacion: token, expiracionToken: expiracion },
    });

    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3001');
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;
    const nombre = usuario.nombreCompleto.split(' ')[0];

    const resend = new Resend(this.config.get<string>('RESEND_API_KEY'));
    await resend.emails.send({
      from: 'Proyecto Notas <onboarding@resend.dev>',
      to: usuario.email!,
      subject: 'Recupera tu contraseña — Proyecto Notas',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:12px;">
          <div style="text-align:center;margin-bottom:24px;">
            <div style="display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;background:#2563eb;border-radius:14px;">
              <span style="font-size:28px;">📋</span>
            </div>
            <h1 style="font-size:22px;font-weight:700;color:#1e293b;margin:12px 0 4px;">Proyecto Notas</h1>
            <p style="color:#64748b;font-size:13px;margin:0;">Sistema de gestión académica</p>
          </div>

          <div style="background:#fff;border-radius:10px;padding:28px;border:1px solid #e2e8f0;">
            <p style="color:#334155;font-size:15px;margin:0 0 8px;">Hola <strong>${nombre}</strong>,</p>
            <p style="color:#334155;font-size:15px;margin:0 0 24px;">
              Recibimos una solicitud para restablecer la contraseña de tu cuenta.
              Haz clic en el botón de abajo para crear una nueva contraseña.
            </p>

            <div style="text-align:center;margin:28px 0;">
              <a href="${resetLink}"
                style="background:#2563eb;color:#fff;text-decoration:none;padding:13px 32px;border-radius:8px;font-size:15px;font-weight:600;display:inline-block;">
                Restablecer contraseña
              </a>
            </div>

            <p style="color:#64748b;font-size:13px;margin:24px 0 0;">
              Este enlace es válido por <strong>1 hora</strong>.
              Si no solicitaste esto, ignora este correo y tu contraseña permanecerá sin cambios.
            </p>
          </div>

          <p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:20px;">
            © ${new Date().getFullYear()} Proyecto Notas — Sistema Académico
          </p>
        </div>
      `,
    });

    return { message: 'Si el correo existe, recibirás un enlace de recuperación.' };
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
        ? this.prisma.usuarioCurso.findFirst({
            where: { idUsuario, curso: { anioLectivo: { estadoLectivo: 'ACTIVO' } } },
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
