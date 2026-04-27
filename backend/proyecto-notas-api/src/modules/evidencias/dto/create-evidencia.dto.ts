import { IsInt, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEvidenciaDto {
  @ApiProperty({ example: 27 })
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  idActividad: number;

  @ApiProperty({ example: 'Tarea 1' })
  @IsString()
  nombreActividad: string;

  @ApiProperty({ example: 'TAREA' })
  @IsString()
  tipoActividad: string;
}
