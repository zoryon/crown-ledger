import { updateBudget } from "@/lib/database";
import { rejectUnauthenticated } from "@/lib/api-auth";

export const runtime = "nodejs";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: Context) {
  const unauthorized = await rejectUnauthenticated(request);
  if (unauthorized) return unauthorized;

  const { id } = await context.params;
  const body = await request.json();
  await updateBudget(Number(id), Number(body.amount ?? 0));
  return Response.json({ ok: true });
}
