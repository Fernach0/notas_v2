import { IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMateriaDto {
  @ApiProperty({ example: 'Matemáticas' })
  @IsString()
  @MaxLength(30)
  nombreMateria: string;
}
