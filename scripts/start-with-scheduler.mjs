import { spawn } from "node:child_process";

const nextArgs = ["start", ...process.argv.slice(2)];
const port = resolvePort(nextArgs) ?? process.env.PORT ?? "3000";
const schedulerEnv = {
  ...process.env,
  CROWN_APP_URL: process.env.CROWN_APP_URL ?? `http://localhost:${port}`,
};
const nextBin = process.platform === "win32" ? "next.cmd" : "next";
const children = [];
let shuttingDown = false;

function resolvePort(args) {
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if ((arg === "-p" || arg === "--port") && args[index + 1]) {
      return args[index + 1];
    }

    if (arg.startsWith("--port=")) {
      return arg.slice("--port=".length);
    }
  }

  return null;
}

function startChild(name, command, args, env = process.env) {
  const child = spawn(command, args, {
    env,
    stdio: "inherit",
    shell: false,
    windowsHide: true,
  });

  children.push(child);

  child.on("exit", (code, signal) => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    console.log(`${name} exited; stopping Crown services.`);
    stopChildren(child);
    process.exit(code ?? (signal ? 1 : 0));
  });

  child.on("error", (error) => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    console.error(`${name} failed to start`, error);
    stopChildren(child);
    process.exit(1);
  });

  return child;
}

function stopChildren(except) {
  for (const child of children) {
    if (child === except || child.killed) {
      continue;
    }

    child.kill();
  }
}

function stop() {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  stopChildren();
}

process.on("SIGINT", () => {
  stop();
  process.exit(0);
});
process.on("SIGTERM", () => {
  stop();
  process.exit(0);
});

startChild("Next.js", nextBin, nextArgs);
startChild("Recurring scheduler", process.execPath, [
  "scripts/recurring-scheduler.mjs",
], schedulerEnv);
