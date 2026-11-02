import * as Sentry from "@sentry/nestjs";

// Synchronous stderr — survives a SIGILL. The LAST line printed = the step that crashed.
const log = (m: string) => process.stderr.write(`[instrument] ${m}\n`);

log(
  `boot node=${process.version} platform=${process.platform} arch=${process.arch}`,
);

log(
  "STEP 1: require('@sentry/profiling-node') [loads native .node binary] ...",
);
/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */
const { nodeProfilingIntegration } = require("@sentry/profiling-node");
log("STEP 1 OK: profiling-node module loaded");

log("STEP 2: nodeProfilingIntegration() [native init] ...");
const profiling = nodeProfilingIntegration();
/* eslint-enable @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */
log("STEP 2 OK: integration constructed");

log("STEP 3: Sentry.init() ...");
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [profiling],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
  enabled: !!process.env.SENTRY_DSN,
});
log("STEP 3 OK: Sentry.init done — instrument complete");

// BISECT: load main.ts's static imports one-by-one so the SIGILL names the module.
// This file is imported first, so these run before main.ts evaluates its own imports.
/* eslint-disable @typescript-eslint/no-require-imports */
const probes: string[] = [
  "@nestjs/core",
  "@nestjs/swagger",
  "@nestjs/common",
  "@nestjs/config",
  "cookie-parser",
  "helmet",
  "express",
  "./shared/filters/sentry-exception.filter",
  "./config/security.config",
  "./app.module", // heaviest — pulls in every feature module + their deps
];
for (const p of probes) {
  log(`PROBE: require('${p}') ...`);
  require(p);
  log(`PROBE OK: ${p}`);
}
/* eslint-enable @typescript-eslint/no-require-imports */
log("ALL PROBES OK — every module loaded without SIGILL");
