import crypto from 'node:crypto';

const SECRET = process.env.ADMIN_SECRET || '';
const PASSWORD = process.env.ADMIN_PASSWORD || '';

// Tworzy podpisany token (HMAC) ważny przez 8 godzin.
function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}

// Logowanie pracownika hasłem → zwraca token sesji.
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

  const token = sign({ exp: Date.now() + 8 * 60 * 60 * 1000 });
  return Response.json({ token });
};
