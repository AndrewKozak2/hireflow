const fs = require("fs");
const { execSync } = require("child_process");
const path = require("path");

async function run() {
  const args = process.argv.slice(2);

  let filePath = "";
  const fileArg = args.find((arg) => arg.startsWith("--file="));

  if (fileArg) {
    filePath = fileArg.split("=")[1];
  } else if (args.length > 0) {
    filePath = args[args.length - 1];
  }

  if (!filePath) {
    console.log("Full Arguments received:", process.argv);
    console.error("❌ File path not provided.");
    process.exit(1);
  }

  filePath = filePath.replace(/['"]/g, "");
  const fullPath = require("path").resolve(process.cwd(), filePath);

  if (!require("fs").existsSync(fullPath)) {
    console.error(`❌ File not found at: ${fullPath}`);
    process.exit(1);
  }

  console.log(`Requesting Gemini to add Swagger decorators to ${filePath}...`);

  const isController = filePath.endsWith(".controller.ts");
  const isDto = filePath.endsWith(".dto.ts");

  let specificInstructions = "";
  if (isController) {
    specificInstructions = `
      For controller methods, ensure the following Swagger decorators are present as appropriate:
      - @ApiBody({ type: YourDtoName }) for parameters decorated with @Body(). Infer 'YourDtoName' from the type annotation of the @Body() parameter.
      - @ApiQuery({ type: YourQueryDtoName }) for parameters decorated with @Query(). Infer 'YourQueryDtoName' from the type annotation of the @Query() parameter.
      - @ApiParam({ name: 'paramName', type: String, description: '...' }) for parameters decorated with @Param().
      - @ApiOperation({ summary: '...' }) and @ApiResponse/@ApiCreatedResponse for all endpoints.
      - IMPORTANT: Do not add any Swagger decorators to class constructors.
    `;
  } else if (isDto) {
    specificInstructions = `For DTO classes, ensure @ApiProperty() is added to each property. Include 'type' or 'enum' and 'example' for better documentation where applicable.`;
  }

  try {
    execSync(
      `gemini "Add missing Swagger decorators only. Do not rewrite logic. ${specificInstructions} Modify ${filePath}"`,
      { stdio: "inherit" },
    );
  } catch (error) {
    console.error("❌ Gemini CLI execution failed.");
    process.exit(1);
  }
}

run();