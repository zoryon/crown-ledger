import { updateBudget } from "@/lib/database";

export const runtime = "nodejs";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: Context) {
  const { id } = await context.params;
  const body = await request.json();
  await updateBudget(Number(id), Number(body.amount ?? 0));
  return Response.json({ ok: true });
}
