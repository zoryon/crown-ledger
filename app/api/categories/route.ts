import { getSummary } from "@/lib/database";
import { rejectUnauthenticated } from "@/lib/api-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const unauthorized = await rejectUnauthenticated(request);
  if (unauthorized) return unauthorized;

  const summary = await getSummary();
  return Response.json({ categories: summary.categories });
}
