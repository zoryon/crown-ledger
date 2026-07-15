import { createAccount, getSummary } from "@/lib/database";

export const runtime = "nodejs";

export async function GET() {
  const summary = await getSummary();
  return Response.json({ accounts: summary.accounts });
}

export async function POST(request: Request) {
  const account = await createAccount(await request.json());
  return Response.json({ account }, { status: 201 });
}
