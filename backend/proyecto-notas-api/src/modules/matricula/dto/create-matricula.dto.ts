import { IsString, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMatriculaDto {
  @ApiProperty({ example: '0910203040' })
  @IsString()
  idUsuario: string;

  @ApiProperty({ example: 3 })
  @IsInt()
  idCurso: number;
}
