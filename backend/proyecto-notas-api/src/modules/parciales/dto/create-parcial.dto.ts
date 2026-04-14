import { IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateParcialDto {
  @ApiProperty({ example: 5 })
  @IsInt()
  idMateria: number;

  @ApiProperty({ example: 3 })
  @IsInt()
  idCurso: number;

  @ApiProperty({ example: 1, description: 'Número de parcial (1, 2 o 3)' })
  @IsInt()
  @Min(1)
  @Max(3)
  numeroParcial: number;
}

export class CreateBulkParcialDto {
  @ApiProperty({ example: 5 })
  @IsInt()
  idMateria: number;

  @ApiProperty({ example: 3 })
  @IsInt()
  idCurso: number;
}
