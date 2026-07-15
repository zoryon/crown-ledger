import { getSummary } from "@/lib/database";

export const runtime = "nodejs";

export async function GET() {
  const summary = await getSummary();
  return Response.json({ categories: summary.categories });
}
