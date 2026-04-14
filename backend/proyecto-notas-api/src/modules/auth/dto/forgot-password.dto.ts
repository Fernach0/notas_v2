import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'docente@notas.edu.ec' })
  @IsEmail()
  email: string;
}
