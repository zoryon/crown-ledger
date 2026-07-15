import { deleteGoal, updateGoal } from "@/lib/database";
import { rejectUnauthenticated } from "@/lib/api-auth";

export const runtime = "nodejs";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: Context) {
  const unauthorized = await rejectUnauthenticated(request);
  if (unauthorized) return unauthorized;

  const { id } = await context.params;
  await updateGoal(Number(id), await request.json());
  return Response.json({ ok: true });
}

export async function DELETE(request: Request, context: Context) {
  const unauthorized = await rejectUnauthenticated(request);
  if (unauthorized) return unauthorized;

  const { id } = await context.params;
  await deleteGoal(Number(id));
  return Response.json({ ok: true });
}
