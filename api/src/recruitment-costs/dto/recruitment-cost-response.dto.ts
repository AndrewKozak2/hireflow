import { RecruitmentCostCategory } from "../enums/recruitment-cost-category.enum";
import { RecruitmentCostCurrency } from "../enums/recruitment-cost-currency.enum";

export class RecruitmentCostResponseDto {
  id!: string;
  jobId!: string;
  applicationId!: string | null;
  category!: RecruitmentCostCategory;
  source!: string | null;
  title!: string;
  amount!: number;
  currency!: RecruitmentCostCurrency;
  incurredAt!: Date;
  description!: string | null;
  createdBy!: string;
  automationKey!: string | null;
  createdAt!: Date;
  updatedAt!: Date;
}
