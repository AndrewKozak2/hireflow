import { ConfigService } from "@nestjs/config";

const TRUE_VALUES = new Set(["true", "1", "yes", "on"]);

export function getBooleanConfig(
  config: ConfigService,
  key: string,
  fallback: boolean,
): boolean {
  const value = config.get<string>(key);
  if (value === undefined) {
    return fallback;
  }

  return TRUE_VALUES.has(value.toLowerCase());
}

export function getNumberConfig(
  config: ConfigService,
  key: string,
  fallback: number,
): number {
  const value = config.get<string>(key);
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function isProduction(config: ConfigService): boolean {
  return config.get<string>("NODE_ENV") === "production";
}

export function getAllowedCorsOrigins(config: ConfigService): string[] {
  return (
    config
      .get<string>("CORS_ALLOWED_ORIGINS", "")
      ?.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean) ?? []
  );
}

export function buildCorsOriginResolver(config: ConfigService) {
  const production = isProduction(config);
  const allowAllInDev = getBooleanConfig(config, "CORS_ALLOW_ALL_IN_DEV", true);
  const allowedOrigins = getAllowedCorsOrigins(config);

  return (
    origin: string | undefined,
    callback: (error: Error | null, allow?: boolean) => void,
  ): void => {
    if (!production && allowAllInDev) {
      callback(null, true);
      return;
    }

    if (!origin) {
      callback(null, true);
      return;
    }

    callback(null, allowedOrigins.includes(origin));
  };
}

export function buildThrottleSkipIf(config: ConfigService) {
  const skipInDev = getBooleanConfig(
    config,
    "THROTTLE_SKIP_IN_DEV",
    !isProduction(config),
  );

  return (): boolean => skipInDev;
}
