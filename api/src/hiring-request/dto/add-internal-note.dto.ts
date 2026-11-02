import { IsString, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class AddInternalNoteDto {
  @ApiProperty({ example: "Candidate has good soft skills." })
  @IsString()
  @IsNotEmpty()
  text!: string;
}
