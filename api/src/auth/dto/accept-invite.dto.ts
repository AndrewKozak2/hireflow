import { IsString, MinLength, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class AcceptInviteDto {
  @ApiProperty({
    example: "a1b2c3d4e5f6g7h8i9j0",
    description: "Unique invitation token received via email",
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    example: "John Doe",
    description: "Full name of the user",
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @ApiProperty({
    example: "SecureP@ssw0rd1",
    description: "New password for the account",
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: "Password must be at least 8 characters long" })
  password: string;
}
