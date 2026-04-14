import { IsString, IsEmail, IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoUsuario } from '@prisma/client';

export class UpdateUsuarioDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  nombreCompleto?: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ enum: EstadoUsuario })
  @IsEnum(EstadoUsuario)
  @IsOptional()
  estadoUsuario?: EstadoUsuario;
}
