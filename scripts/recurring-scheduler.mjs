const appUrl = (process.env.CROWN_APP_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);
const intervalMs = Number(process.env.CROWN_SCHEDULER_INTERVAL_MS ?? 300000);
const secret = process.env.CROWN_SCHEDULER_SECRET;

if (!Number.isFinite(intervalMs) || intervalMs < 60000) {
  throw new Error("CROWN_SCHEDULER_INTERVAL_MS must be at least 60000.");
}

let running = false;

async function runOnce() {
  if (running) {
    return;
  }

  running = true;

  try {
    const response = await fetch(`${appUrl}/api/scheduler/recurring`, {
      method: "POST",
      headers: secret ? { authorization: `Bearer ${secret}` } : undefined,
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`${response.status} ${response.statusText}: ${body}`);
    }

    const result = await response.json();
    console.log(
      `[${new Date().toISOString()}] recurring generated=${result.generated ?? 0} advanced=${result.advanced ?? 0} stopped=${result.stopped ?? 0} pendingCleared=${result.pendingCleared ?? 0} interestPayments=${result.interestPayments ?? 0} taxPayments=${result.taxPayments ?? 0}`,
    );
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] recurring scheduler failed`,
      error,
    );
  } finally {
    running = false;
  }
}

console.log(
  `Recurring scheduler polling ${appUrl} every ${Math.round(intervalMs / 1000)}s`,
);

await runOnce();
const timer = setInterval(runOnce, intervalMs);

function stop() {
  clearInterval(timer);
  process.exit(0);
}

process.on("SIGINT", stop);
process.on("SIGTERM", stop);
