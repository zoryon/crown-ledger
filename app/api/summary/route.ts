import { getSummary } from "@/lib/database";

export const runtime = "nodejs";

export async function GET() {
  return Response.json(await getSummary());
}
