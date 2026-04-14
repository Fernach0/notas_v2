import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') as string,
    });
  }

  async validate(payload: { sub: string; roles: number[] }) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { idUsuario: payload.sub },
    });
    if (!usuario || usuario.estadoUsuario !== 'ACTIVO') {
      throw new UnauthorizedException('Usuario inactivo o no encontrado');
    }
    return { idUsuario: payload.sub, roles: payload.roles };
  }
}
