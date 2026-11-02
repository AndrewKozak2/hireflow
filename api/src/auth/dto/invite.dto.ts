import { IsEmail, IsEnum, IsNotEmpty } from "class-validator";
import { UserRole } from "../enums/userRole.enum";
import { ApiProperty } from "@nestjs/swagger";

export class InviteDto {
  @ApiProperty({
    example: "candidate@example.com",
    description: "Email address of the user to invite",
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.RECRUITER,
    description: "Role assigned to the invited user",
  })
  @IsEnum(UserRole)
  @IsNotEmpty()
  role!: UserRole;
}
