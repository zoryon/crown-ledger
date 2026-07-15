import { redirect } from "next/navigation";
import { ShieldCheck, Upload } from "lucide-react";
import { SetupForm, SetupImportForm } from "@/app/components/AuthForms";
import { LocalizedText, PreferenceControls } from "@/app/components/PreferenceControls";
import { importSetupBackupAction, setupSuperuserAction } from "@/app/actions/auth";
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
      <section className="w-full max-w-3xl rounded-md border border-black/10 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-md bg-[#f4b63f] text-[#171b18]">
            <ShieldCheck className="size-6" />
          </div>
          <div>
            <LocalizedText
              as="h1"
              className="text-xl font-semibold"
              en="First setup"
              it="Primo avvio"
            />
            <LocalizedText
              as="p"
              className="text-sm text-black/50"
              en="Create a superuser or restore a full backup"
              it="Crea un superutente oppure ripristina un backup completo"
            />
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-md border border-black/10 bg-[#f8f7f2] p-4">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck className="size-4 text-black/45" />
              <LocalizedText
                as="h2"
                className="text-sm font-semibold"
                en="Create superuser"
                it="Crea superutente"
              />
            </div>
            <SetupForm action={setupSuperuserAction} />
            <LocalizedText
              as="p"
              className="mt-4 text-xs leading-5 text-black/50"
              en="Use a long unique password. This account will be the only account allowed to invite future users."
              it="Usa una password lunga e unica. Questo account sara l'unico autorizzato a invitare utenti in futuro."
            />
          </div>

          <div className="rounded-md border border-black/10 bg-[#f8f7f2] p-4">
            <div className="mb-4 flex items-center gap-2">
              <Upload className="size-4 text-black/45" />
              <LocalizedText
                as="h2"
                className="text-sm font-semibold"
                en="Import full backup"
                it="Importa backup completo"
              />
            </div>
            <SetupImportForm action={importSetupBackupAction} />
            <LocalizedText
              as="p"
              className="mt-4 text-xs leading-5 text-black/50"
              en="After import, log in with the superuser contained in that backup."
              it="Dopo l'importazione, accedi con il superutente contenuto in quel backup."
            />
          </div>
        </div>
      </section>
    </main>
  );
}
