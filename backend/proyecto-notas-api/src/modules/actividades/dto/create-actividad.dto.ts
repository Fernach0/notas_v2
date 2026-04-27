import { IsInt, IsEnum, IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoActividad } from '@prisma/client';

export class CreateActividadDto {
  @ApiProperty({ example: 12 })
  @IsInt()
  idParcial: number;

  @ApiProperty({ enum: TipoActividad })
  @IsEnum(TipoActividad)
  tipoActividad: TipoActividad;

  @ApiProperty({ example: '2026-10-01' })
  @IsDateString()
  fechaInicioEntrega: string;

  @ApiProperty({ example: '2026-10-08' })
  @IsDateString()
  fechaFinEntrega: string;

  @ApiPropertyOptional({ example: 'Resolver ejercicios 1-10' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  descripcion?: string;

  @ApiPropertyOptional({ example: 'Tarea 1' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  tituloActividad?: string;
}
