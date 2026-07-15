import { getSummary } from "@/lib/database";
import { MoneyApp } from "@/app/components/MoneyApp";
import { logoutAction } from "@/app/actions/auth";
import { requireUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Home() {
  const currentUser = await requireUser();
  const data = await getSummary();

  return (
    <MoneyApp
      initialData={data}
      currentUser={currentUser}
      logoutAction={logoutAction}
    />
  );
}
