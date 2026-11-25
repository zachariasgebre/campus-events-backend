import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length } from 'class-validator';

export class RegisterDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  email!: string;

  @IsString()
  @Length(8, 64)
  password!: string;
}
