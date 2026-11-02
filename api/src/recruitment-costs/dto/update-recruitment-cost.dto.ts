import {
  IsEnum,
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

export class UpdateRecruitmentCostDto {
  @IsUUID()
  @IsOptional()
  jobId?: string;

  @IsUUID()
  @IsOptional()
  applicationId?: string | null;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.toUpperCase() : value,
  )
  @IsEnum(RecruitmentCostCategory)
  @IsOptional()
  category?: RecruitmentCostCategory;

  @IsString()
  @IsOptional()
  source?: string | null;

  @IsString()
  @IsOptional()
  title?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  amount?: number;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.toUpperCase() : value,
  )
  @IsEnum(RecruitmentCostCurrency)
  @IsOptional()
  currency?: RecruitmentCostCurrency;

  @IsDateString()
  @IsOptional()
  incurredAt?: string;

  @IsString()
  @IsOptional()
  description?: string | null;
}
