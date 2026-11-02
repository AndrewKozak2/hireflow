import { PartialType } from "@nestjs/swagger";
import { CreateHiringRequestDto } from "./create-hiring-request.dto";

export class UpdateHiringRequestDto extends PartialType(
  CreateHiringRequestDto,
) {}
