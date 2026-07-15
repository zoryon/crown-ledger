import { getBackupSnapshot } from "@/lib/database";
import { rejectNonSuperuser } from "@/lib/api-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const forbidden = await rejectNonSuperuser(request);
  if (forbidden) return forbidden;

  const snapshot = await getBackupSnapshot();
  const date = new Date().toISOString().slice(0, 10);

  return new Response(JSON.stringify(snapshot, null, 2), {
    headers: {
      "Content-Disposition": `attachment; filename="crown-ledger-full-${date}.json"`,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}
