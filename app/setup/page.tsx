import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { SetupForm } from "@/app/components/AuthForms";
import { LocalizedText, PreferenceControls } from "@/app/components/PreferenceControls";
import { setupSuperuserAction } from "@/app/actions/auth";
import { isSetupRequired } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function SetupPage() {
  if (!(await isSetupRequired())) {
    redirect("/login");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f4ee] p-4 text-[#151815]">
      <div className="fixed right-4 top-4">
        <PreferenceControls />
      </div>
      <section className="w-full max-w-md rounded-md border border-black/10 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-md bg-[#f4b63f] text-[#171b18]">
            <ShieldCheck className="size-6" />
          </div>
          <div>
            <LocalizedText
              as="h1"
              className="text-xl font-semibold"
              en="Create superuser"
              it="Crea superutente"
            />
            <LocalizedText
              as="p"
              className="text-sm text-black/50"
              en="Required before Crown Ledger opens"
              it="Richiesto prima di aprire Crown Ledger"
            />
          </div>
        </div>

        <SetupForm action={setupSuperuserAction} />

        <LocalizedText
          as="p"
          className="mt-5 text-xs leading-5 text-black/50"
          en="Use a long unique password. This account will be the only account allowed to invite future users."
          it="Usa una password lunga e unica. Questo account sara l'unico autorizzato a invitare utenti in futuro."
        />
      </section>
    </main>
  );
}
