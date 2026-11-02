import { PartialType } from "@nestjs/swagger";
import { CreateEmailSourceRuleDto } from "./create-email-source-rule.dto";

export class UpdateEmailSourceRuleDto extends PartialType(
  CreateEmailSourceRuleDto,
) {}
