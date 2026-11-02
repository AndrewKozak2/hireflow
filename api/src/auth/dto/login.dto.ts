import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LoginDto {
  @ApiProperty({
    example: "admin@hireflow.com",
    description: "User email address",
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: "Admin_123", description: "User password" })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password!: string;
}
