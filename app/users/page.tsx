import { BadgeEuro, ShieldCheck, Trash2, UserCircle } from "lucide-react";
import Link from "next/link";
import { createUserAction, deleteUserAction, logoutAction } from "@/app/actions/auth";
import { CreateUserForm } from "@/app/components/AuthForms";
import { LocalizedText, PreferenceControls } from "@/app/components/PreferenceControls";
import { getUsersForAdmin, requireSuperuser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const currentUser = await requireSuperuser();
  const users = await getUsersForAdmin();

  return (
    <main className="min-h-screen bg-[#f6f4ee] text-[#151815]">
      <header className="border-b border-black/10 bg-[#f6f4ee]/88 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3">
          <Link
            href="/"
            className="grid size-10 place-items-center rounded-md bg-[#171b18] text-white"
            title="Dashboard"
          >
            <BadgeEuro className="size-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <LocalizedText
              as="h1"
              className="text-xl font-semibold sm:text-2xl"
              en="Users"
              it="Utenti"
            />
            <p className="text-xs text-black/50">{currentUser.email}</p>
          </div>
          <PreferenceControls />
          <form action={logoutAction}>
            <button className="h-10 rounded-md border border-black/10 bg-white px-4 text-sm font-semibold text-black/70 shadow-sm">
              <LocalizedText en="Log out" it="Esci" />
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[380px_1fr] lg:px-8">
        <CreateUserForm action={createUserAction} />

        <section className="rounded-md border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <LocalizedText
              as="h2"
              className="text-base font-semibold"
              en="Registered users"
              it="Utenti registrati"
            />
            <ShieldCheck className="size-4 text-black/45" />
          </div>

          <div className="mt-4 divide-y divide-black/8">
            {users.map((user) => (
              <div key={user.id} className="flex min-h-[64px] items-center gap-3 py-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-md bg-[#f7f7f3] text-black/55">
                  <UserCircle className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{user.name}</p>
                  <p className="truncate text-xs text-black/45">{user.email}</p>
                </div>
                <span className="rounded-md border border-black/10 bg-[#f7f7f3] px-2 py-1 text-xs font-semibold text-black/60">
                  {user.role}
                </span>
                {user.id !== currentUser.id && (
                  <form action={deleteUserAction}>
                    <input type="hidden" name="id" value={user.id} />
                    <button
                      className="grid size-8 place-items-center rounded-md border border-black/10 text-black/45 transition hover:text-[#d94864]"
                      title="Delete user"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
