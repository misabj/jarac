import { cookies } from 'next/headers';

const COOKIE_NAME = 'jarac_admin';

export async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const c = cookieStore.get(COOKIE_NAME);
  if (!c) return false;
  const expected = process.env.ADMIN_PASSWORD || '';
  return !!expected && c.value === expected;
}

export async function setAdminCookie(password: string): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD || '';
  if (!expected || password !== expected) return false;
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, password, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return true;
}

export async function clearAdminCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
