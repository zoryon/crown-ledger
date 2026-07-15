import { deleteAccount, updateAccount } from "@/lib/database";

export const runtime = "nodejs";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: Context) {
  const { id } = await context.params;
  const account = await updateAccount(Number(id), await request.json());
  return Response.json({ account });
}

export async function DELETE(_request: Request, context: Context) {
  const { id } = await context.params;
  await deleteAccount(Number(id));
  return Response.json({ ok: true });
}
