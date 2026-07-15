import crypto from "node:crypto";
import { runDueRecurringTransactions } from "@/lib/database";

export const runtime = "nodejs";

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    crypto.timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function isLocalRequest(request: Request) {
  const url = new URL(request.url);
  const host = url.hostname.toLowerCase();

  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

function authorizeScheduler(request: Request) {
  const secret = process.env.CROWN_SCHEDULER_SECRET;

  if (!secret && process.env.NODE_ENV !== "production" && isLocalRequest(request)) {
    return true;
  }

  if (!secret) {
    return false;
  }

  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";

  return token.length > 0 && safeEqual(token, secret);
}

export async function POST(request: Request) {
  if (!authorizeScheduler(request)) {
    return Response.json({ error: "Unauthorized scheduler request" }, { status: 401 });
  }

  const result = await runDueRecurringTransactions();
  return Response.json({ ok: true, ...result });
}
