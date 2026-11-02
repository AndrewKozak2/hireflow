import { IsString, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ResetPasswordDto {
  @ApiProperty({
    example: "v4-uuid-token",
    description: "The reset token received via email",
  })
  @IsString()
  token!: string;

  @ApiProperty({
    example: "NewPassword123!",
    description: "The new password for the account",
  })
  @IsString()
  @MinLength(8)
  newPassword!: string;
}
