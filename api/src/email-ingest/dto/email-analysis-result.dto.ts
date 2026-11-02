import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsEmail, IsOptional, IsString } from "class-validator";

export class EmailAnalysisResultDto {
  @ApiProperty({ description: "Whether the email is a job application" })
  @IsBoolean()
  isApplication!: boolean;

  @ApiProperty({
    description: "Full name of the candidate",
    example: "John Doe",
  })
  @IsOptional()
  @IsString()
  candidateName?: string;

  @ApiProperty({
    description: "Candidate email address",
    example: "john.doe@example.com",
  })
  @IsOptional()
  @IsEmail()
  candidateEmail?: string;

  @ApiProperty({
    description: "Candidate phone number",
    example: "+380999999999",
  })
  @IsOptional()
  candidatePhone?: string;

  @ApiProperty({ description: "URL to LinkedIn profile" })
  @IsOptional()
  @IsString()
  linkedinUrl?: string;

  @ApiProperty({
    description: "Title of the vacancy the candidate is applying for",
  })
  @IsOptional()
  @IsString()
  vacancyTitle?: string;

  @ApiProperty({
    description: "Extracted skills or summary from the email body",
  })
  @IsOptional()
  @IsString()
  skillsSummary?: string;

  @ApiProperty({ description: "Reason for classification" })
  @IsString()
  classificationReason!: string;
}
