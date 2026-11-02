import { ApiProperty } from "@nestjs/swagger";
import { IsIn } from "class-validator";

export class UpdateEmailProviderDto {
  @ApiProperty({
    enum: ["brevo", "resend"],
    example: "resend",
    description: "Active email provider to use for outgoing emails",
  })
  @IsIn(["brevo", "resend"], {
    message: "Provider must be either 'brevo' or 'resend'.",
  })
  provider!: string;
}
