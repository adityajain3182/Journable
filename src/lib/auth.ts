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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
