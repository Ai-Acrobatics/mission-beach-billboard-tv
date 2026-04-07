import { cookies } from "next/headers";

const COOKIE_NAME = "billboard-admin";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function verifyAdmin(): Promise<boolean> {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;

  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return token === hashToken(password);
}

export function hashToken(password: string): string {
  // Simple deterministic hash for cookie value
  let hash = 0;
  const str = `billboard-admin:${password}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `admin_${Math.abs(hash).toString(36)}`;
}

export { COOKIE_NAME, COOKIE_MAX_AGE };
