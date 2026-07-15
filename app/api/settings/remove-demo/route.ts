import { removeDemoData } from "@/lib/database";

export const runtime = "nodejs";

export async function POST() {
  await removeDemoData();
  return Response.json({ ok: true });
}
