import { IsArray, ValidateNested, IsNotEmpty } from "class-validator";
import { Type } from "class-transformer";
import { CreateRecruitmentCostDto } from "./create-recruitment-cost.dto";

export class CreateRecruitmentCostsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRecruitmentCostDto)
  @IsNotEmpty()
  costs!: CreateRecruitmentCostDto[];
}
