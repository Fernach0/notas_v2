import { IsDateString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EstadoLectivo } from '@prisma/client';

export class CreateAnioLectivoDto {
  @ApiProperty({ example: '2026-09-01' })
  @IsDateString()
  fechaInicio: string;

  @ApiProperty({ example: '2027-06-30' })
  @IsDateString()
  fechaFinal: string;

  @ApiProperty({ enum: EstadoLectivo })
  @IsEnum(EstadoLectivo)
  estadoLectivo: EstadoLectivo;
}
