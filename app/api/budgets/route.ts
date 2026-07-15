import { createBudget, getSummary } from "@/lib/database";
import { rejectUnauthenticated } from "@/lib/api-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const unauthorized = await rejectUnauthenticated(request);
  if (unauthorized) return unauthorized;

  const summary = await getSummary();
  return Response.json({ budgets: summary.budgets });
}

export async function POST(request: Request) {
  const unauthorized = await rejectUnauthenticated(request);
  if (unauthorized) return unauthorized;

  try {
    await createBudget(await request.json());
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to create budget" },
      { status: 400 },
    );
  }
}
