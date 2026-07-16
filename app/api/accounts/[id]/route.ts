import { deleteAccount, updateAccount } from "@/lib/database";
import { authenticatedUserOrResponse } from "@/lib/api-auth";

export const runtime = "nodejs";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: Context) {
  const user = await authenticatedUserOrResponse(request);
  if (user instanceof Response) return user;

  try {
    const { id } = await context.params;
    const account = await updateAccount(user.id, Number(id), await request.json());
    return Response.json({ account });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to update account" },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request, context: Context) {
  const user = await authenticatedUserOrResponse(request);
  if (user instanceof Response) return user;

  const { id } = await context.params;
  await deleteAccount(user.id, Number(id));
  return Response.json({ ok: true });
}
