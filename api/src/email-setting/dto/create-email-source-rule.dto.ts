import { IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateEmailSourceRuleDto {
  @ApiProperty({
    example: "*@djinni.co",
    description: "Email or domain pattern to match sender",
  })
  @IsString()
  @IsNotEmpty()
  sender_pattern!: string;

  @ApiProperty({
    example: "Djinni",
    description: "Label for the candidate source",
  })
  @IsString()
  @IsNotEmpty()
  source_label!: string;
}
