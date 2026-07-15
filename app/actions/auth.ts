"use server";

import { redirect } from "next/navigation";
import {
  authenticate,
  clearCurrentSession,
  createInitialSuperuser,
  createManagedUser,
  deleteManagedUser,
  importInitialBackup,
  isSetupRequired,
  normalizeEmail,
  startSession,
  type AuthFormState,
} from "@/lib/auth";

export async function setupSuperuserAction(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  try {
    await createInitialSuperuser(formData);
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Unable to create superuser.",
    };
  }

  redirect("/");
}

export async function importSetupBackupAction(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  try {
    await importInitialBackup(formData);
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Unable to import backup.",
    };
  }

  redirect("/login");
}

export async function loginAction(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (await isSetupRequired()) {
    redirect("/setup");
  }

  const email = normalizeEmail(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  const user = await authenticate(email, password);

  if (!user) {
    return { error: "Invalid email or password." };
  }

  await startSession(user.id);
  redirect("/");
}

export async function logoutAction() {
  await clearCurrentSession();
  redirect("/login");
}

export async function createUserAction(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  try {
    await createManagedUser(formData);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to create user.",
    };
  }

  redirect("/users");
}

export async function deleteUserAction(formData: FormData) {
  await deleteManagedUser(Number(formData.get("id")));
  redirect("/users");
}
