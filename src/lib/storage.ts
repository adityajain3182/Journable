const PREFIX = "journable:user";

export function userKey(userId: string, segment: string): string {
  return `${PREFIX}:${userId}:${segment}`;
}

export function readUserJson<T>(userId: string, segment: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(userKey(userId, segment));
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeUserJson<T>(userId: string, segment: string, value: T): void {
  localStorage.setItem(userKey(userId, segment), JSON.stringify(value));
}

export function clearUserSegment(userId: string, segment: string): void {
  localStorage.removeItem(userKey(userId, segment));
}
