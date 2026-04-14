import { IsInt, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEvidenciaDto {
  @ApiProperty({ example: 27 })
  @IsInt()
  idActividad: number;

  @ApiProperty({ example: 'Tarea 1' })
  @IsString()
  nombreActividad: string;

  @ApiProperty({ example: 'TAREA' })
  @IsString()
  tipoActividad: string;
}
