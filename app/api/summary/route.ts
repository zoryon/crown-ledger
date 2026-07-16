import { getSummary } from "@/lib/database";
import { authenticatedUserOrResponse } from "@/lib/api-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await authenticatedUserOrResponse(request);
  if (user instanceof Response) return user;

  const projectionDate = new URL(request.url).searchParams.get("as_of");

  return Response.json(await getSummary(user.id, { projectionDate }));
}
