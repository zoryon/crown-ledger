import { createTransaction, getSummary } from "@/lib/database";

export const runtime = "nodejs";

export async function GET() {
  const summary = await getSummary();
  return Response.json({ transactions: summary.transactions });
}

export async function POST(request: Request) {
  const transaction = await createTransaction(await request.json());
  return Response.json({ transaction }, { status: 201 });
}
