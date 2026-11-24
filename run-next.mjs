import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const nextCli = require.resolve("next/dist/bin/next");

const rawMode = process.argv[2];
const mode =
  rawMode === "build" ? "build" : rawMode === "start" ? "start" : "dev";
const extraArgs = process.argv.slice(3);

let nextArgs;
let nodeEnv;

if (mode === "build") {
  nodeEnv = "production";
  nextArgs = ["build", ...extraArgs];
} else {
  nodeEnv = mode === "start" ? "production" : "development";
  let port = process.env.PORT || "3000";
  let host = "0.0.0.0";

  for (let i = 0; i < extraArgs.length; i++) {
    const arg = extraArgs[i];
    if ((arg === "-p" || arg === "--port") && extraArgs[i + 1]) {
      port = extraArgs[++i];
    } else if (arg.startsWith("--port=")) {
      port = arg.slice("--port=".length);
    } else if (
      (arg === "-H" || arg === "--host" || arg === "--hostname") &&
      extraArgs[i + 1]
    ) {
      host = extraArgs[++i];
    } else if (arg.startsWith("--host=")) {
      host = arg.slice("--host=".length);
    } else if (arg.startsWith("--hostname=")) {
      host = arg.slice("--hostname=".length);
    }
  }

  nextArgs = [mode, "-p", port, "-H", host];
}

const child = spawn(process.execPath, [nextCli, ...nextArgs], {
  stdio: "inherit",
  env: {
    ...process.env,
    NODE_ENV: nodeEnv,
  },
});

for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => {
    if (!child.killed) child.kill(sig);
  });
}

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 0);
  }
});
