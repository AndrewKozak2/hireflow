import {
  Body,
  Controller,
  Headers,
  HttpCode,
  InternalServerErrorException,
  Post,
  UnauthorizedException,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiExtraModels,
  ApiHeader,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from "@nestjs/swagger";
import { Public } from "../auth/decorators/public.decorator";
import {
  EmailIngestAttachmentDto,
  EmailIngestBatchDto,
  EmailIngestItemDto,
  EmailIngestResponseDto,
  EmailIngestResultDto,
} from "./dto/email-ingest.dto";
import { EmailIngestService } from "./email-ingest.service";

@ApiTags("Email Ingest")
@ApiExtraModels(
  EmailIngestBatchDto,
  EmailIngestItemDto,
  EmailIngestResponseDto,
  EmailIngestResultDto,
  EmailIngestAttachmentDto,
)
@Public()
@Controller("webhooks")
export class EmailIngestController {
  constructor(private readonly emailIngestService: EmailIngestService) {}

  @ApiConsumes("application/json")
  @ApiProduces("application/json")
  @ApiHeader({
    name: "x-hireflow-webhook-token",
    description: "Security token for webhook authentication",
    required: true,
  })
  @ApiBody({
    description: "Batch email payload from Apps Script",
    schema: {
      oneOf: [
        {
          type: "array",
          items: { $ref: getSchemaPath(EmailIngestItemDto) },
        },
        { $ref: getSchemaPath(EmailIngestBatchDto) },
      ],
    },
  })
  @ApiOkResponse({
    description: "Batch processed with per-item statuses",
    type: EmailIngestResponseDto,
  })
  @ApiBadRequestResponse({ description: "Invalid payload" })
  @ApiUnauthorizedResponse({ description: "Invalid webhook token" })
  @ApiInternalServerErrorResponse({ description: "Internal server error" })
  @HttpCode(200)
  @Post("email-ingest")
  @ApiOperation({
    summary: "Receive batched email payloads from Apps Script",
    description:
      "Processes a batch of email messages from Gmail via Apps Script and creates ingestion events for further processing.",
  })
  // @Api
  ingestEmails(
    @Headers("x-hireflow-webhook-token") webhookToken: string | undefined,
    @Body() body: EmailIngestBatchDto | EmailIngestItemDto[],
  ): EmailIngestResponseDto {
    const expectedToken = process.env.HIREFLOW_WEBHOOK_TOKEN;

    if (!expectedToken) {
      throw new InternalServerErrorException("Webhook token is not configured");
    }

    if (!webhookToken || webhookToken !== expectedToken) {
      throw new UnauthorizedException("Invalid webhook token");
    }

    const items = this.emailIngestService.extractBatchItems(body);

    const response: EmailIngestResponseDto = {
      results: items.map((item) => ({
        gmailMessageId: item.gmailMessageId,
        status: "received",
      })),
    };
    this.emailIngestService.handleFullFlow(items).catch((err) => {
      console.error("Critical background error:", err);
    });
    return response;
  }
}
