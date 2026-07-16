import { deleteTransaction, updateTransaction } from "@/lib/database";
import { authenticatedUserOrResponse } from "@/lib/api-auth";

export const runtime = "nodejs";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: Context) {
  const user = await authenticatedUserOrResponse(request);
  if (user instanceof Response) return user;

  const { id } = await context.params;
  await updateTransaction(user.id, Number(id), await request.json());
  return Response.json({ ok: true });
}

export async function DELETE(request: Request, context: Context) {
  const user = await authenticatedUserOrResponse(request);
  if (user instanceof Response) return user;

  const { id } = await context.params;
  await deleteTransaction(user.id, Number(id));
  return Response.json({ ok: true });
}
