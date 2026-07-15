import { createAccountTransfer } from "@/lib/database";
import { rejectUnauthenticated } from "@/lib/api-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const unauthorized = await rejectUnauthenticated(request);
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();
    await createAccountTransfer({
      sourceAccountId: Number(body.source_account_id),
      destinationAccountId: Number(body.destination_account_id),
      amount: Number(body.amount),
      date: body.date ? String(body.date) : undefined,
      status: body.status === "pending" ? "pending" : "cleared",
      isRecurring: Boolean(body.is_recurring),
      endMonth: body.end_month ? String(body.end_month) : null,
    });

    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create account transfer",
      },
      { status: 400 },
    );
  }
}
