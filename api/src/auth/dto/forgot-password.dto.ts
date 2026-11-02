import { IsEmail } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ForgotPasswordDto {
  @ApiProperty({
    example: "admin@hireflow.com",
    description: "The email address associated with the account",
  })
  @IsEmail()
  email!: string;
}
