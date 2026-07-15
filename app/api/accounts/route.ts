import { createAccount, getSummary } from "@/lib/database";
import { rejectUnauthenticated } from "@/lib/api-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const unauthorized = await rejectUnauthenticated(request);
  if (unauthorized) return unauthorized;

  const summary = await getSummary();
  return Response.json({ accounts: summary.accounts });
}

export async function POST(request: Request) {
  const unauthorized = await rejectUnauthenticated(request);
  if (unauthorized) return unauthorized;

  const account = await createAccount(await request.json());
  return Response.json({ account }, { status: 201 });
}
