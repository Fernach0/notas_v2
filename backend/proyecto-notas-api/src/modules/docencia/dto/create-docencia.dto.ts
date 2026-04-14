import { IsString, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDocenciaDto {
  @ApiProperty({ example: '1102030405' })
  @IsString()
  idUsuario: string;

  @ApiProperty({ example: 3 })
  @IsInt()
  idCurso: number;

  @ApiProperty({ example: 5 })
  @IsInt()
  idMateria: number;
}
