import "server-only";

import { requireAuthenticatedRequest } from "@/lib/auth";

export async function rejectUnauthenticated(request: Request) {
  const user = await requireAuthenticatedRequest(request);

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

export async function rejectNonSuperuser(request: Request) {
  const user = await requireAuthenticatedRequest(request);

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "superuser") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
}
