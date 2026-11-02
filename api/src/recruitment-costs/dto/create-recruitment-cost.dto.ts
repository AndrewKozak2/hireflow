import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  IsDateString,
} from "class-validator";
import { Transform } from "class-transformer";
import { RecruitmentCostCategory } from "../enums/recruitment-cost-category.enum";
import { RecruitmentCostCurrency } from "../enums/recruitment-cost-currency.enum";

export class CreateRecruitmentCostDto {
  @IsUUID()
  @IsNotEmpty()
  jobId!: string;

  @IsUUID()
  @IsOptional()
  applicationId?: string | null;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.toUpperCase() : value,
  )
  @IsEnum(RecruitmentCostCategory)
  @IsNotEmpty()
  category!: RecruitmentCostCategory;

  @IsString()
  @IsOptional()
  source?: string | null;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsNotEmpty()
  amount!: number;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.toUpperCase() : value,
  )
  @IsEnum(RecruitmentCostCurrency)
  @IsOptional()
  currency?: RecruitmentCostCurrency;

  @IsDateString()
  @IsNotEmpty()
  incurredAt!: string;

  @IsString()
  @IsOptional()
  description?: string | null;

  @IsUUID()
  @IsOptional()
  createdBy?: string;

  @IsString()
  @IsOptional()
  automationKey?: string | null;
}
