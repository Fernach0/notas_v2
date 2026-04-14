import { IsString, IsEmail, IsOptional, IsArray, IsInt, MinLength, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsCedulaEcuatoriana } from '../../../common/validators/cedula.validator';
import { EstadoUsuario } from '@prisma/client';

export class CreateUsuarioDto {
  @ApiProperty({ example: '0102030405' })
  @IsCedulaEcuatoriana()
  idUsuario: string;

  @ApiProperty({ example: 'María López Pérez' })
  @IsString()
  nombreCompleto: string;

  @ApiProperty({ example: 'Clave#2026' })
  @IsString()
  @MinLength(6)
  contrasenaUsuario: string;

  @ApiPropertyOptional({ example: 'maria.lopez@notas.edu.ec' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ enum: EstadoUsuario })
  @IsEnum(EstadoUsuario)
  estadoUsuario: EstadoUsuario;

  @ApiPropertyOptional({ example: [2] })
  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  roles?: number[];
}
