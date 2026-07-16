import { createTransaction, getSummary } from "@/lib/database";
import { authenticatedUserOrResponse } from "@/lib/api-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await authenticatedUserOrResponse(request);
  if (user instanceof Response) return user;

  const summary = await getSummary(user.id);
  return Response.json({ transactions: summary.transactions });
}

export async function POST(request: Request) {
  const user = await authenticatedUserOrResponse(request);
  if (user instanceof Response) return user;

  const transaction = await createTransaction(user.id, await request.json());
  return Response.json({ transaction }, { status: 201 });
}
