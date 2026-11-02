import { Controller, Get } from "@nestjs/common";
import { HealthCheck, HealthCheckService } from "@nestjs/terminus";
import { Public } from "src/auth/decorators/public.decorator";
import { TypeOrmHealthIndicator } from "@nestjs/terminus";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";

@ApiTags("Health")
@Controller("health")
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: "Check API and Database health" })
  @ApiResponse({ status: 200, description: "The Health Check is successful" })
  @ApiResponse({
    status: 503,
    description: "The Health Check experienced an error",
  })
  @HealthCheck()
  check() {
    return this.health.check([() => this.db.pingCheck("database")]);
  }
}
