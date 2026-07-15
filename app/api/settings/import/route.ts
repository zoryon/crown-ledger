import { importSnapshot } from "@/lib/database";
import { rejectNonSuperuser } from "@/lib/api-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const forbidden = await rejectNonSuperuser(request);
  if (forbidden) return forbidden;

  try {
    await importSnapshot(await request.json());
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to import snapshot" },
      { status: 400 },
    );
  }
}
