import { removeDemoData } from "@/lib/database";
import { rejectNonSuperuser } from "@/lib/api-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const forbidden = await rejectNonSuperuser(request);
  if (forbidden) return forbidden;

  await removeDemoData();
  return Response.json({ ok: true });
}
