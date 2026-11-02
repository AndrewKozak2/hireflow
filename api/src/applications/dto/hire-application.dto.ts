import {
  IsNumber,
  IsPositive,
  IsEnum,
  IsOptional,
  Min,
  Max,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { RecruitmentCostCurrency } from "../../recruitment-costs/enums/recruitment-cost-currency.enum";

export class HireApplicationDto {
  @ApiProperty({
    description: "Actual monthly salary of the hired candidate",
    example: 3000,
  })
  @IsNumber()
  @IsPositive()
  actualMonthlySalary!: number;

  @ApiProperty({
    enum: RecruitmentCostCurrency,
    default: RecruitmentCostCurrency.USD,
    description: "Salary currency — fixed to USD",
    example: "USD",
  })
  @IsEnum(RecruitmentCostCurrency)
  currency!: RecruitmentCostCurrency;

  @ApiProperty({
    description: "Recruiter commission as a percentage of monthly salary",
    example: 10,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionPercent!: number;

  @ApiProperty({
    description:
      "Referral bonus amount — only applicable for referral candidates",
    example: 500,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  referralBonus?: number;
}
