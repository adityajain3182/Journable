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

// In-memory OTP store — intentionally not persisted so codes die on reload.
type OTPEntry = { code: string; expiresAt: number; purpose: "signup" | "reset" };
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
 * Generates an OTP for signup or password-reset flows.
 * Returns the code so the caller can display it (no email backend).
 * Throws a user-visible error when the precondition is not met.
 */
export function requestOTP(
  email: string,
  purpose: "signup" | "reset"
): string {
  const key = email.trim().toLowerCase();
  if (!EMAIL_RE.test(key)) throw new Error("Please enter a valid email address.");
  const users = loadUsers();
  if (purpose === "signup" && users.some((u) => u.email === key)) {
    throw new Error("An account with this email already exists.");
  }
  if (purpose === "reset" && !users.some((u) => u.email === key)) {
    throw new Error("No account found with this email.");
  }
  const code = generateOTPCode();
  pendingOTPs.set(key, { code, expiresAt: Date.now() + 10 * 60 * 1000, purpose });
  return code;
}

/** Returns true and clears the entry when the code matches. */
export function verifyOTP(
  email: string,
  code: string,
  purpose: "signup" | "reset"
): boolean {
  const key = email.trim().toLowerCase();
  const entry = pendingOTPs.get(key);
  if (!entry || entry.purpose !== purpose) return false;
  if (Date.now() > entry.expiresAt) {
    pendingOTPs.delete(key);
    return false;
  }
  if (entry.code !== code.trim()) return false;
  pendingOTPs.delete(key);
  return true;
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
