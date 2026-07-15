"use client";

import { KeyRound, LogIn, ShieldCheck, UserPlus } from "lucide-react";
import { useActionState } from "react";
import { usePreferences } from "@/app/components/Preferences";

type AuthFormState = {
  error?: string;
};

type AuthAction = (
  state: AuthFormState,
  formData: FormData,
) => Promise<AuthFormState>;

const authText = {
  en: {
    addUser: "Add user",
    createSuperuser: "Create superuser",
    createUser: "Create user",
    email: "Email",
    login: "Log in",
    name: "Name",
    password: "Password",
    temporaryPassword: "Temporary password",
    userHelp: "New users receive normal access. Only the superuser can add more users.",
    working: "Working...",
  },
  it: {
    addUser: "Aggiungi utente",
    createSuperuser: "Crea superutente",
    createUser: "Crea utente",
    email: "Email",
    login: "Accedi",
    name: "Nome",
    password: "Password",
    temporaryPassword: "Password temporanea",
    userHelp: "I nuovi utenti ricevono accesso normale. Solo il superutente puo aggiungere altri utenti.",
    working: "Operazione in corso...",
  },
};

function Field(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="h-11 w-full rounded-md border border-black/10 bg-[#f7f7f3] px-3 text-sm outline-none transition placeholder:text-black/35 focus:border-[#171b18]"
    />
  );
}

function SubmitButton({
  pending,
  label,
  icon,
  workingLabel,
}: {
  pending: boolean;
  label: string;
  icon: React.ReactNode;
  workingLabel: string;
}) {
  return (
    <button
      disabled={pending}
      className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#171b18] px-4 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-60"
    >
      {icon}
      {pending ? workingLabel : label}
    </button>
  );
}

export function LoginForm({ action }: { action: AuthAction }) {
  const [state, formAction, pending] = useActionState(action, {});
  const { language } = usePreferences();
  const t = authText[language];

  return (
    <form action={formAction} className="space-y-3">
      {state.error && (
        <p className="rounded-md border border-[#d94864]/25 bg-[#d94864]/10 p-3 text-sm text-[#9f263e]">
          {state.error}
        </p>
      )}
      <Field name="email" type="email" placeholder={t.email} autoComplete="email" required />
      <Field
        name="password"
        type="password"
        placeholder={t.password}
        autoComplete="current-password"
        required
      />
      <SubmitButton
        pending={pending}
        label={t.login}
        workingLabel={t.working}
        icon={<LogIn className="size-4" />}
      />
    </form>
  );
}

export function SetupForm({ action }: { action: AuthAction }) {
  const [state, formAction, pending] = useActionState(action, {});
  const { language } = usePreferences();
  const t = authText[language];

  return (
    <form action={formAction} className="space-y-3">
      {state.error && (
        <p className="rounded-md border border-[#d94864]/25 bg-[#d94864]/10 p-3 text-sm text-[#9f263e]">
          {state.error}
        </p>
      )}
      <Field name="name" placeholder={t.name} autoComplete="name" required />
      <Field name="email" type="email" placeholder={t.email} autoComplete="email" required />
      <Field
        name="password"
        type="password"
        placeholder={t.password}
        autoComplete="new-password"
        minLength={14}
        required
      />
      <SubmitButton
        pending={pending}
        label={t.createSuperuser}
        workingLabel={t.working}
        icon={<ShieldCheck className="size-4" />}
      />
    </form>
  );
}

export function CreateUserForm({ action }: { action: AuthAction }) {
  const [state, formAction, pending] = useActionState(action, {});
  const { language } = usePreferences();
  const t = authText[language];

  return (
    <form
      action={formAction}
      className="rounded-md border border-black/10 bg-white p-5 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">{t.addUser}</h2>
        <UserPlus className="size-4 text-black/45" />
      </div>

      {state.error && (
        <p className="mt-4 rounded-md border border-[#d94864]/25 bg-[#d94864]/10 p-3 text-sm text-[#9f263e]">
          {state.error}
        </p>
      )}

      <div className="mt-4 space-y-3">
        <Field name="name" placeholder={t.name} autoComplete="name" required />
        <Field name="email" type="email" placeholder={t.email} autoComplete="email" required />
        <Field
          name="password"
          type="password"
          placeholder={t.temporaryPassword}
          autoComplete="new-password"
          minLength={14}
          required
        />
        <p className="flex items-start gap-2 text-xs leading-5 text-black/50">
          <KeyRound className="mt-0.5 size-3.5 shrink-0" />
          {t.userHelp}
        </p>
        <SubmitButton
          pending={pending}
          label={t.createUser}
          workingLabel={t.working}
          icon={<UserPlus className="size-4" />}
        />
      </div>
    </form>
  );
}
