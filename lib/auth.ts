import "server-only";

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createSessionRecord,
  createUserRecord,
  deleteSessionRecord,
  deleteUserRecord,
  getUserByEmailWithPassword,
  getUserBySessionTokenHash,
  hasUsers,
  listUsers,
} from "@/lib/database";
import { authReadyMarker, sessionCookieName } from "@/lib/auth-constants";
import type { AuthUser } from "@/lib/types";

const authDirectory = path.join(process.cwd(), "data");
const authReadyPath = path.join(authDirectory, authReadyMarker);
const sessionMaxAgeSeconds = 60 * 60 * 24 * 7;
const scryptOptions = {
  cost: 32768,
  blockSize: 8,
  parallelization: 1,
  keyLength: 64,
  maxmem: 64 * 1024 * 1024,
};

export type AuthFormState = {
  error?: string;
};

export function ensureAuthReadyMarker() {
  fs.mkdirSync(authDirectory, { recursive: true });
  fs.closeSync(fs.openSync(authReadyPath, "a"));
}

export async function isSetupRequired() {
  const usersExist = await hasUsers();

  if (usersExist) {
    ensureAuthReadyMarker();
  } else if (fs.existsSync(authReadyPath)) {
    fs.unlinkSync(authReadyPath);
  }

  return !usersExist;
}

export function normalizeEmail(email: FormDataEntryValue | null) {
  return String(email ?? "").trim().toLowerCase();
}

function formString(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function validateName(name: string) {
  if (name.length < 2 || name.length > 80) {
    return "Name must be between 2 and 80 characters.";
  }
}

function validateEmail(email: string) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return "Enter a valid email address.";
  }
}

function validatePassword(password: string) {
  const rules = [
    password.length >= 14,
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];

  if (rules.some((rule) => !rule)) {
    return "Use at least 14 characters with uppercase, lowercase, a number, and a symbol.";
  }
}

export function validateNewUserForm(formData: FormData) {
  const name = formString(formData.get("name"));
  const email = normalizeEmail(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  const error =
    validateName(name) ?? validateEmail(email) ?? validatePassword(password);

  if (error) {
    return { error };
  }

  return { name, email, password };
}

async function hashPassword(password: string) {
  const salt = crypto.randomBytes(24).toString("base64url");
  const hash = await scryptPassword(password, salt, scryptOptions.keyLength, {
    N: scryptOptions.cost,
    r: scryptOptions.blockSize,
    p: scryptOptions.parallelization,
    maxmem: scryptOptions.maxmem,
  });

  return [
    "scrypt",
    scryptOptions.cost,
    scryptOptions.blockSize,
    scryptOptions.parallelization,
    scryptOptions.keyLength,
    salt,
    hash.toString("base64url"),
  ].join("$");
}

async function verifyPassword(password: string, encodedHash: string) {
  const [scheme, cost, blockSize, parallelization, keyLength, salt, storedHash] =
    encodedHash.split("$");

  if (scheme !== "scrypt" || !salt || !storedHash) {
    return false;
  }

  const expected = Buffer.from(storedHash, "base64url");
  const actual = await scryptPassword(password, salt, Number(keyLength), {
    N: Number(cost),
    r: Number(blockSize),
    p: Number(parallelization),
    maxmem: scryptOptions.maxmem,
  });

  return (
    expected.length === actual.length && crypto.timingSafeEqual(expected, actual)
  );
}

function scryptPassword(
  password: string,
  salt: string,
  keyLength: number,
  options: crypto.ScryptOptions,
) {
  return new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, keyLength, options, (error, derivedKey) => {
      if (error) {
        reject(error);
      } else {
        resolve(derivedKey);
      }
    });
  });
}

function hashSessionToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("base64url");
}

function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionMaxAgeSeconds,
  };
}

export async function startSession(userId: number) {
  const token = crypto.randomBytes(48).toString("base64url");
  const expiresAt = new Date(
    Date.now() + sessionMaxAgeSeconds * 1000,
  ).toISOString();

  await createSessionRecord({
    userId,
    tokenHash: hashSessionToken(token),
    expiresAt,
  });

  (await cookies()).set(sessionCookieName, token, sessionCookieOptions());
}

export async function clearCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;

  if (token) {
    await deleteSessionRecord(hashSessionToken(token));
  }

  cookieStore.delete(sessionCookieName);
}

async function userForToken(token: string | undefined) {
  if (!token) {
    return null;
  }

  return getUserBySessionTokenHash(hashSessionToken(token));
}

export async function getCurrentUser() {
  const token = (await cookies()).get(sessionCookieName)?.value;
  return userForToken(token);
}

export async function getCurrentUserFromRequest(request: Request) {
  const cookie = request.headers.get("cookie") ?? "";
  const token = cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${sessionCookieName}=`))
    ?.slice(sessionCookieName.length + 1);

  return userForToken(token ? decodeURIComponent(token) : undefined);
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireSuperuser() {
  const user = await requireUser();

  if (user.role !== "superuser") {
    redirect("/");
  }

  return user;
}

export async function requireAuthenticatedRequest(request: Request) {
  return getCurrentUserFromRequest(request);
}

export async function authenticate(email: string, password: string) {
  const user = await getUserByEmailWithPassword(email);

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return null;
  }

  return user;
}

export async function createInitialSuperuser(formData: FormData) {
  if (!(await isSetupRequired())) {
    throw new Error("Setup is already complete.");
  }

  const validated = validateNewUserForm(formData);

  if ("error" in validated) {
    throw new Error(validated.error);
  }

  const passwordHash = await hashPassword(validated.password);

  if (!(await isSetupRequired())) {
    throw new Error("Setup is already complete.");
  }

  const user = await createUserRecord({
    name: validated.name,
    email: validated.email,
    passwordHash,
    role: "superuser",
  });

  if (!user) {
    throw new Error("Unable to create the superuser.");
  }

  ensureAuthReadyMarker();
  await startSession(user.id);
  return user;
}

export async function createManagedUser(formData: FormData) {
  await requireSuperuser();
  const validated = validateNewUserForm(formData);

  if ("error" in validated) {
    throw new Error(validated.error);
  }

  try {
    return await createUserRecord({
      name: validated.name,
      email: validated.email,
      passwordHash: await hashPassword(validated.password),
      role: "user",
    });
  } catch {
    throw new Error("A user with that email already exists.");
  }
}

export async function deleteManagedUser(id: number) {
  const currentUser = await requireSuperuser();

  if (currentUser.id === id) {
    throw new Error("You cannot delete your own account.");
  }

  await deleteUserRecord(id);
}

export async function getUsersForAdmin() {
  await requireSuperuser();
  return listUsers();
}

export function publicUser(user: AuthUser) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    created_at: user.created_at,
  };
}
