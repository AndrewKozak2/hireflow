import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class RejectHiringRequestDto {
  @ApiProperty({
    example: "The role scope needs more detail before recruitment can start.",
    minLength: 10,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  reason!: string;
}
