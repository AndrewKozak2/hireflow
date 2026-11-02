import { IsEmail, IsString, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class SendEmailDto {
  @ApiProperty({ example: "candidate@email.com" })
  @IsEmail()
  to!: string;

  @ApiProperty({ example: "Quick chat about Senior Developer at HireFlow?" })
  @IsString()
  @IsNotEmpty()
  subject!: string;

  @ApiProperty({ example: "Hi Yulia,\n\nThanks for applying..." })
  @IsString()
  @IsNotEmpty()
  body!: string;
}
