import { createGoal, getSummary } from "@/lib/database";
import { rejectUnauthenticated } from "@/lib/api-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const unauthorized = await rejectUnauthenticated(request);
  if (unauthorized) return unauthorized;

  const summary = await getSummary();
  return Response.json({ goals: summary.goals });
}

export async function POST(request: Request) {
  const unauthorized = await rejectUnauthenticated(request);
  if (unauthorized) return unauthorized;

  await createGoal(await request.json());
  return Response.json({ ok: true }, { status: 201 });
}
