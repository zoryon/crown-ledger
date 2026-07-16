import { deleteRecurringRule, updateRecurringRule } from "@/lib/database";
import { authenticatedUserOrResponse } from "@/lib/api-auth";

export const runtime = "nodejs";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: Context) {
  const user = await authenticatedUserOrResponse(request);
  if (user instanceof Response) return user;

  const { id } = await context.params;

  try {
    await updateRecurringRule(user.id, Number(id), await request.json());
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update recurring rule",
      },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request, context: Context) {
  const user = await authenticatedUserOrResponse(request);
  if (user instanceof Response) return user;

  const { id } = await context.params;
  await deleteRecurringRule(user.id, Number(id));
  return Response.json({ ok: true });
}
