import { IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TrasladoMatriculaDto {
  @ApiProperty({ example: 2, description: 'ID del curso destino' })
  @IsInt()
  idCursoDestino: number;
}
