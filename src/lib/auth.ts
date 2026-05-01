export type StoredUser = {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
};

export type SessionUser = {
  id: string;
  email: string;
  displayName: string;
};

const USERS_KEY = "journable:users";
const SESSION_KEY = "journable:session";

import { sendOTPEmail } from "./email";

const OTP_TTL_MS = 10 * 60 * 1000;   // code valid for 10 minutes
const OTP_COOLDOWN_MS = 60 * 1000;    // must wait 60 s before requesting a new code
const OTP_MAX_ATTEMPTS = 3;            // wrong guesses before the code is invalidated

// In-memory OTP store — intentionally not persisted so codes die on reload.
type OTPEntry = {
  code: string;
  expiresAt: number;
  purpose: "signup" | "reset";
  attempts: number;       // wrong-guess counter
  canResendAt: number;    // earliest timestamp a resend is allowed
};
const pendingOTPs = new Map<string, OTPEntry>();

function loadUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as StoredUser[]) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return bytesToHex(new Uint8Array(buf));
}

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function makeSalt(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return bytesToHex(arr);
}

function toSession(user: StoredUser): SessionUser {
  return { id: user.id, email: user.email, displayName: user.displayName };
}

function generateOTPCode(): string {
  const buf = new Uint8Array(4);
  crypto.getRandomValues(buf);
  const num = ((buf[0] << 16) | (buf[1] << 8) | buf[2]) >>> 0;
  return String((num % 900000) + 100000);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── OTP ──────────────────────────────────────────────────────────────────────

/**
 * Generates an OTP and emails it to the user via EmailJS.
 *
 * Rate-limited: a second request for the same email is rejected until the
 * 60-second cooldown elapses, preventing both spam and network-tab fishing
 * (rapidly requesting fresh codes to read them from the payload).
 */
export async function requestOTP(
  email: string,
  purpose: "signup" | "reset"
): Promise<void> {
  const key = email.trim().toLowerCase();
  if (!EMAIL_RE.test(key)) throw new Error("Please enter a valid email address.");

  // Cooldown check — applies to resends too.
  const existing = pendingOTPs.get(key);
  if (existing && Date.now() < existing.canResendAt) {
    const secsLeft = Math.ceil((existing.canResendAt - Date.now()) / 1000);
    throw new Error(`Please wait ${secsLeft} second${secsLeft !== 1 ? "s" : ""} before requesting a new code.`);
  }

  const users = loadUsers();
  if (purpose === "signup" && users.some((u) => u.email === key)) {
    throw new Error("An account with this email already exists.");
  }
  if (purpose === "reset" && !users.some((u) => u.email === key)) {
    throw new Error("No account found with this email.");
  }

  const code = generateOTPCode();
  pendingOTPs.set(key, {
    code,
    expiresAt: Date.now() + OTP_TTL_MS,
    purpose,
    attempts: 0,
    canResendAt: Date.now() + OTP_COOLDOWN_MS,
  });
  await sendOTPEmail(key, code);
}

/**
 * Verifies a submitted OTP code.
 * Throws on wrong code so the caller can surface the remaining-attempts count.
 * Deletes the entry (and throws) after OTP_MAX_ATTEMPTS wrong guesses.
 */
export function verifyOTP(
  email: string,
  code: string,
  purpose: "signup" | "reset"
): void {
  const key = email.trim().toLowerCase();
  const entry = pendingOTPs.get(key);

  if (!entry || entry.purpose !== purpose) {
    throw new Error("No active code found. Please request a new one.");
  }
  if (Date.now() > entry.expiresAt) {
    pendingOTPs.delete(key);
    throw new Error("Your code has expired. Please request a new one.");
  }

  if (entry.code !== code.trim()) {
    entry.attempts += 1;
    const remaining = OTP_MAX_ATTEMPTS - entry.attempts;
    if (remaining <= 0) {
      pendingOTPs.delete(key);
      throw new Error("Too many incorrect attempts. Please request a new code.");
    }
    throw new Error(
      `Incorrect code. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`
    );
  }

  // Correct — consume the entry.
  pendingOTPs.delete(key);
}

// ─── Auth actions ─────────────────────────────────────────────────────────────

export async function signup(
  email: string,
  password: string,
  displayName: string
): Promise<SessionUser> {
  const trimmedEmail = email.trim().toLowerCase();
  const trimmedName = displayName.trim();
  if (!trimmedEmail || !password || !trimmedName) {
    throw new Error("All fields are required.");
  }
  if (!EMAIL_RE.test(trimmedEmail)) {
    throw new Error("Please enter a valid email address.");
  }
  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }
  const users = loadUsers();
  if (users.some((u) => u.email === trimmedEmail)) {
    throw new Error("An account with this email already exists.");
  }
  const salt = makeSalt();
  const passwordHash = await hashPassword(password, salt);
  const user: StoredUser = {
    id: makeId(),
    email: trimmedEmail,
    displayName: trimmedName,
    passwordHash,
    salt,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  saveUsers(users);
  const session = toSession(user);
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export async function login(email: string, password: string): Promise<SessionUser> {
  const trimmedEmail = email.trim().toLowerCase();
  const users = loadUsers();
  const user = users.find((u) => u.email === trimmedEmail);
  if (!user) throw new Error("No account found with this email.");
  const passwordHash = await hashPassword(password, user.salt);
  if (passwordHash !== user.passwordHash) {
    throw new Error("Incorrect password.");
  }
  const session = toSession(user);
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export async function resetPassword(email: string, newPassword: string): Promise<void> {
  if (newPassword.length < 6) throw new Error("Password must be at least 6 characters.");
  const users = loadUsers();
  const idx = users.findIndex((u) => u.email === email.trim().toLowerCase());
  if (idx === -1) throw new Error("Account not found.");
  const salt = makeSalt();
  const passwordHash = await hashPassword(newPassword, salt);
  users[idx] = { ...users[idx], salt, passwordHash };
  saveUsers(users);
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export function getCurrentSession(): SessionUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}
