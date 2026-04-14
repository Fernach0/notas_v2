import { IsString, IsInt, IsNumber, IsOptional, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCalificacionDto {
  @ApiProperty({ example: '0910203040' })
  @IsString()
  idUsuario: string;

  @ApiProperty({ example: 27 })
  @IsInt()
  idActividad: number;

  @ApiProperty({ example: 85.5 })
  @IsNumber()
  @Min(0)
  nota: number;

  @ApiPropertyOptional({ example: 'Buen trabajo' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  comentario?: string;
}

export class BulkCalificacionItemDto {
  @IsString()
  idUsuario: string;

  @IsNumber()
  @Min(0)
  nota: number;

  @IsString()
  @IsOptional()
  comentario?: string;
}

export class BulkCalificacionDto {
  @ApiProperty({ example: 27 })
  @IsInt()
  idActividad: number;

  @ApiProperty({ type: [BulkCalificacionItemDto] })
  calificaciones: BulkCalificacionItemDto[];
}
