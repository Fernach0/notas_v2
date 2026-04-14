import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsCedulaEcuatoriana } from '../../../common/validators/cedula.validator';

export class LoginDto {
  @ApiProperty({ example: '0102030405' })
  @IsCedulaEcuatoriana()
  idUsuario: string;

  @ApiProperty({ example: 'Admin#2026' })
  @IsString()
  @MinLength(6)
  password: string;
}
