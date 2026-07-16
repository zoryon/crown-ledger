import { createGoal, getSummary } from "@/lib/database";
import { authenticatedUserOrResponse } from "@/lib/api-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await authenticatedUserOrResponse(request);
  if (user instanceof Response) return user;

  const summary = await getSummary(user.id);
  return Response.json({ goals: summary.goals });
}

export async function POST(request: Request) {
  const user = await authenticatedUserOrResponse(request);
  if (user instanceof Response) return user;

  await createGoal(user.id, await request.json());
  return Response.json({ ok: true }, { status: 201 });
}
