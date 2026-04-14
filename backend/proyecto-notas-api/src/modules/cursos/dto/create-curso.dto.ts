import { IsInt, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCursoDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  idAnioLectivo: number;

  @ApiProperty({ example: '8vo EGB A' })
  @IsString()
  @MaxLength(15)
  nombreCurso: string;
}
