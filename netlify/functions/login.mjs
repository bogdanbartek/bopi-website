import crypto from 'node:crypto';
import { signToken } from '../lib/shared.mjs';

const SECRET = process.env.ADMIN_SECRET || '';
const PASSWORD = process.env.ADMIN_PASSWORD || '';

// Logowanie pracownika hasłem → zwraca token sesji (ważny 8 godzin).
export default async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  if (!SECRET || !PASSWORD) {
    return Response.json(
      { error: 'Serwer nie jest skonfigurowany — ustaw zmienne ADMIN_PASSWORD i ADMIN_SECRET w Netlify.' },
      { status: 500 }
    );
  }
  const { password } = await req.json().catch(() => ({}));
  const a = Buffer.from(String(password || ''));
  const b = Buffer.from(PASSWORD);
  const ok = a.length === b.length && crypto.timingSafeEqual(a, b);
  if (!ok) return Response.json({ error: 'Nieprawidłowe hasło.' }, { status: 401 });

  return Response.json({ token: signToken(SECRET) });
};
