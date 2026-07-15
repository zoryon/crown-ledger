import { createGoal, getSummary } from "@/lib/database";

export const runtime = "nodejs";

export async function GET() {
  const summary = await getSummary();
  return Response.json({ goals: summary.goals });
}

export async function POST(request: Request) {
  await createGoal(await request.json());
  return Response.json({ ok: true }, { status: 201 });
}
