import { getSummary } from "@/lib/database";
import { MoneyApp } from "@/app/components/MoneyApp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Home() {
  const data = await getSummary();

  return <MoneyApp initialData={data} />;
}
