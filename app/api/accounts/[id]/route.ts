import { deleteAccount, updateAccount } from "@/lib/database";
import { rejectUnauthenticated } from "@/lib/api-auth";

export const runtime = "nodejs";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: Context) {
  const unauthorized = await rejectUnauthenticated(request);
  if (unauthorized) return unauthorized;

  try {
    const { id } = await context.params;
    const account = await updateAccount(Number(id), await request.json());
    return Response.json({ account });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to update account" },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request, context: Context) {
  const unauthorized = await rejectUnauthenticated(request);
  if (unauthorized) return unauthorized;

  const { id } = await context.params;
  await deleteAccount(Number(id));
  return Response.json({ ok: true });
}
