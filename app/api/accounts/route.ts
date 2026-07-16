import { createAccount, getSummary, reorderAccounts } from "@/lib/database";
import { authenticatedUserOrResponse } from "@/lib/api-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await authenticatedUserOrResponse(request);
  if (user instanceof Response) return user;

  const summary = await getSummary(user.id);
  return Response.json({ accounts: summary.accounts });
}

export async function POST(request: Request) {
  const user = await authenticatedUserOrResponse(request);
  if (user instanceof Response) return user;

  const account = await createAccount(user.id, await request.json());
  return Response.json({ account }, { status: 201 });
}

export async function PATCH(request: Request) {
  const user = await authenticatedUserOrResponse(request);
  if (user instanceof Response) return user;

  try {
    const body = await request.json();
    await reorderAccounts(user.id, Array.isArray(body.account_ids) ? body.account_ids : []);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to reorder accounts" },
      { status: 400 },
    );
  }
}
