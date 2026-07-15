import { clearWorkspaceData } from "@/lib/database";

export const runtime = "nodejs";

export async function POST() {
  await clearWorkspaceData();
  return Response.json({ ok: true });
}
