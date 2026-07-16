import { createBudget, getSummary } from "@/lib/database";
import { authenticatedUserOrResponse } from "@/lib/api-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await authenticatedUserOrResponse(request);
  if (user instanceof Response) return user;

  const summary = await getSummary(user.id);
  return Response.json({ budgets: summary.budgets });
}

export async function POST(request: Request) {
  const user = await authenticatedUserOrResponse(request);
  if (user instanceof Response) return user;

  try {
    await createBudget(user.id, await request.json());
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to create budget" },
      { status: 400 },
    );
  }
}
