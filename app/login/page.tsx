import { redirect } from "next/navigation";
import { BadgeEuro } from "lucide-react";
import { loginAction } from "@/app/actions/auth";
import { LoginForm } from "@/app/components/AuthForms";
import { LocalizedText, PreferenceControls } from "@/app/components/PreferenceControls";
import { getCurrentUser, isSetupRequired } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await isSetupRequired()) {
    redirect("/setup");
  }

  if (await getCurrentUser()) {
    redirect("/");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f4ee] p-4 text-[#151815]">
      <div className="fixed right-4 top-4">
        <PreferenceControls />
      </div>
      <section className="w-full max-w-md rounded-md border border-black/10 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-md bg-[#171b18] text-white">
            <BadgeEuro className="size-6" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Crown Ledger</h1>
            <LocalizedText
              as="p"
              className="text-sm text-black/50"
              en="Log in to continue"
              it="Accedi per continuare"
            />
          </div>
        </div>

        <LoginForm action={loginAction} />
      </section>
    </main>
  );
}
