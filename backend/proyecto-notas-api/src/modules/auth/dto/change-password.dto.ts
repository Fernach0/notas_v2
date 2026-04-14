import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  oldPassword: string;

  @ApiProperty({ example: 'NuevaClave#2026' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
