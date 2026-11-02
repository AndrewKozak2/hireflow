import { IsArray, IsNotEmpty, IsString } from "class-validator";
export class UpdateSkillsDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  skills!: string[];
}
