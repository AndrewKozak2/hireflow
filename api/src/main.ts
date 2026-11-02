import "./instrument";
process.env.TZ = "UTC";
import { HttpAdapterHost, NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SentryExceptionFilter } from "./shared/filters/sentry-exception.filter";
import * as cookieParser from "cookie-parser";
import helmet from "helmet";
import { json, urlencoded } from "express";
import { buildCorsOriginResolver } from "./config/security.config";

const blog = (m: string) => process.stderr.write(`[bootstrap] ${m}\n`);
blog("main.ts loaded — instrument survived, static imports resolved");

// Probe every native addon explicitly so a SIGILL names the culprit.
try {
  blog("PROBE: require('bcrypt') [native .node] ...");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("bcrypt");
  blog("PROBE OK: bcrypt loaded");
} catch (e) {
  blog(`PROBE bcrypt threw (not SIGILL): ${(e as Error).message}`);
}

const REQUEST_BODY_LIMIT = "50mb";

async function bootstrap() {
  blog("bootstrap: NestFactory.create(AppModule) [inits all modules] ...");
  const app = await NestFactory.create(AppModule);
  blog("bootstrap: AppModule created OK");
  const { httpAdapter } = app.get(HttpAdapterHost);
  const config = app.get(ConfigService);

  app.use(json({ limit: REQUEST_BODY_LIMIT }));
  app.use(urlencoded({ extended: true, limit: REQUEST_BODY_LIMIT }));
  app.use(helmet());
  app.useGlobalFilters(new SentryExceptionFilter(httpAdapter));
  app.use(cookieParser());

  app.enableCors({
    origin: buildCorsOriginResolver(config),
    credentials: true,
  });

  if (process.env.NODE_ENV !== "production") {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("HireFlow API")
      .setDescription("The HireFlow recruitment platform API documentation")
      .setVersion("1.0")
      .addBearerAuth(
        {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          name: "JWT",
          description: "Enter JWT token",
          in: "header",
        },
        "access-token",
      )
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("api/docs", app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  const port = config.get<string>("API_PORT") ?? 3000;
  blog(`bootstrap: app.listen(${port}) ...`);
  await app.listen(port);
  blog("bootstrap: LISTENING — startup complete");
}
void bootstrap();
