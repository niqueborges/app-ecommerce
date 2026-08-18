import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength, IsEnum } from 'class-validator';
import { Role } from '../../../../generated/prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'Maria Compradora' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'maria.cliente@gmail.com' })
  @IsEmail({}, { message: 'Formato de e-mail inválido' })
  email!: string;

  @ApiProperty({ example: 'SenhaForte@123', minLength: 6 })
  @IsString()
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres' })
  password!: string;

  @ApiProperty({ enum: Role, default: Role.CUSTOMER })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
