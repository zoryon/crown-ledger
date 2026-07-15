import { importSnapshot } from "@/lib/database";

export const runtime = "nodejs";

export async function POST(request: Request) {
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
