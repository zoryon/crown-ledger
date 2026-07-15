import { createTransaction, getSummary } from "@/lib/database";
import { rejectUnauthenticated } from "@/lib/api-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const unauthorized = await rejectUnauthenticated(request);
  if (unauthorized) return unauthorized;

  const summary = await getSummary();
  return Response.json({ transactions: summary.transactions });
}

export async function POST(request: Request) {
  const unauthorized = await rejectUnauthenticated(request);
  if (unauthorized) return unauthorized;

  const transaction = await createTransaction(await request.json());
  return Response.json({ transaction }, { status: 201 });
}
