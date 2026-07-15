import { deleteGoal, updateGoal } from "@/lib/database";

export const runtime = "nodejs";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: Context) {
  const { id } = await context.params;
  await updateGoal(Number(id), await request.json());
  return Response.json({ ok: true });
}

export async function DELETE(_request: Request, context: Context) {
  const { id } = await context.params;
  await deleteGoal(Number(id));
  return Response.json({ ok: true });
}
