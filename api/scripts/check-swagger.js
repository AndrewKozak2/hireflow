const fs = require("fs");
const path = require("path");

const files = process.argv.slice(2);
let hasError = false;

files.forEach((rawPath) => {
  const cleanPath = rawPath.replace(/['"]/g, "");
  const normalizedInputPath = path.normalize(cleanPath);
  const fullPath = path.resolve(process.cwd(), normalizedInputPath);

  if (!fs.existsSync(fullPath) || fs.lstatSync(fullPath).isDirectory()) return;

  const content = fs.readFileSync(fullPath, "utf8");

  const isController = normalizedInputPath.endsWith(".controller.ts");
  const isDto = normalizedInputPath.endsWith(".dto.ts");

  let missing = false;

  if (isController) {
    if (!content.includes("@ApiTags")) {
      missing = true;
    }

    const lines = content.split("\n");
    let inMethodBlock = false;
    let hasApiDecoratorInBlock = false;

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (
        trimmedLine.startsWith("@") &&
        /@(Get|Post|Patch|Delete|Put)\(/.test(trimmedLine)
      ) {
        inMethodBlock = true;
        hasApiDecoratorInBlock = false;
      }

      if (inMethodBlock) {
        if (trimmedLine.includes("@Api")) {
          hasApiDecoratorInBlock = true;
        }

        const isMethod =
          trimmedLine.match(
            /^(?:public|private|protected|async\s+)?\w+\s*\(/,
          ) && !trimmedLine.startsWith("@");
        const isConstructor = trimmedLine.startsWith("constructor");

        if (isMethod && !isConstructor) {
          if (!hasApiDecoratorInBlock) {
            missing = true;
            break;
          }
          inMethodBlock = false;
        }
      }
    }
  }

  if (isDto && content.includes("export class")) {
    const lines = content.split("\n");
    let classStarted = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith("export class")) {
        classStarted = true;
        continue;
      }

      if (!classStarted) continue;

      const propertyMatch = line.match(/^(\w+)[!?]?\s*:\s*.+$/);
      if (!propertyMatch) continue;

      let hasApi = false;
      for (let j = i - 1; j >= 0; j--) {
        const prev = lines[j].trim();
        if (prev === "") break;
        if (prev.startsWith("export class")) break;
        if (/^@ApiProperty\s*\(/.test(prev)) {
          hasApi = true;
          break;
        }
      }

      if (!hasApi) {
        missing = true;
        break;
      }
    }
  }

  if (missing) {
    const fileName = path.basename(normalizedInputPath);

    let relativePath = normalizedInputPath.startsWith("api" + path.sep)
      ? normalizedInputPath.slice(4)
      : normalizedInputPath;

    const crossPlatformPath = relativePath.split(path.sep).join("/");

    console.error(
      `❌ Error: Swagger documentation is incomplete in ${fileName}.`,
    );
    console.error(
      `👉 From api directory run: npm run ai:docs -- ${crossPlatformPath} to fix it`,
    );
    hasError = true;
  }
});

if (hasError) {
  process.exit(1);
} else {
  console.log("✅ Swagger validation passed.");
  process.exit(0);
}
