import { spawnSync } from "node:child_process";
import { validateEnvironment } from "./verify-env";

interface CommandCheck {
  name: string;
  cmd: string;
  required: boolean;
  skipWhenNoDocker?: boolean;
}

interface CommandResult {
  check: CommandCheck;
  code: number;
  output: string;
  durationMs: number;
  skipped: boolean;
  warning?: string;
}

const checks: CommandCheck[] = [
  { name: "Lint", cmd: "npm run lint", required: true },
  { name: "Typecheck", cmd: "npm run typecheck", required: true },
  { name: "Unit/Integration tests (Vitest)", cmd: "npm test", required: true },
  {
    name: "Local DB integration cycle",
    cmd: "npm run test:integration:local",
    required: false,
    skipWhenNoDocker: true,
  },
];

function commandExists(command: string): boolean {
  const res = spawnSync("bash", ["-lc", `command -v ${command}`], { encoding: "utf8" });
  return res.status === 0;
}

function runCheck(check: CommandCheck): CommandResult {
  if (check.skipWhenNoDocker && !commandExists("docker")) {
    return {
      check,
      code: 0,
      output: "Skipped because docker is not available in this environment.",
      durationMs: 0,
      skipped: true,
      warning: "docker not found",
    };
  }

  const started = Date.now();
  const res = spawnSync("bash", ["-lc", check.cmd], {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
  const durationMs = Date.now() - started;

  return {
    check,
    code: res.status ?? 1,
    output: `${res.stdout ?? ""}${res.stderr ?? ""}`.trim(),
    durationMs,
    skipped: false,
  };
}

function main(): void {
  console.log("Capturely go-live execution runner\n");

  const env = validateEnvironment();
  if (env.missingRequired.length > 0) {
    console.log("❌ Required environment variables are missing:");
    for (const item of env.missingRequired) {
      console.log(`  - ${item.key} (${item.description})`);
    }
    console.log("\nPopulate .env.local (see .env.example) and rerun.");
    process.exitCode = 1;
    return;
  }

  console.log("✅ Environment prerequisites are present.");

  const results = checks.map(runCheck);

  let hasRequiredFailure = false;

  for (const result of results) {
    const seconds = (result.durationMs / 1000).toFixed(1);

    if (result.skipped) {
      console.log(`⚠️ ${result.check.name}: skipped (${result.warning ?? "n/a"})`);
      continue;
    }

    if (result.code === 0) {
      console.log(`✅ ${result.check.name}: passed (${seconds}s)`);
      continue;
    }

    if (result.check.required) {
      hasRequiredFailure = true;
      console.log(`❌ ${result.check.name}: failed (${seconds}s)`);
    } else {
      console.log(`⚠️ ${result.check.name}: failed (${seconds}s)`);
    }

    const snippet = result.output.split("\n").slice(-20).join("\n");
    console.log(snippet);
  }

  if (hasRequiredFailure) {
    process.exitCode = 1;
    return;
  }

  console.log("\n✅ Readiness runner completed without required failures.");
}

main();
