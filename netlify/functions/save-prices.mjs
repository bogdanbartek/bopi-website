import crypto from 'node:crypto';
import { getStore } from '@netlify/blobs';

const SECRET = process.env.ADMIN_SECRET || '';

// Sprawdza podpis i ważność tokenu sesji.
function verify(token) {
  if (!token || !SECRET) return false;
  const [body, sig] = token.split('.');
  if (!body || !sig) return false;
  const expected = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    return typeof payload.exp === 'number' && payload.exp > Date.now();
  } catch (e) {
    return false;
  }
}

// Waliduje pojedynczą cenę: liczba dodatnia, max 2 miejsca po przecinku.
function clean(v) {
  const n = Number(String(v).replace(',', '.'));
  if (!isFinite(n) || n <= 0 || n > 100) return null;
  return Math.round(n * 100) / 100;
}

// Zapis nowych cen — wymaga ważnego tokenu z logowania.
export default async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const auth = req.headers.get('authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  if (!verify(token)) {
    return Response.json({ error: 'Sesja wygasła. Zaloguj się ponownie.' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const pb95 = clean(body.pb95);
  const on = clean(body.on);
  const lpg = clean(body.lpg);
  if (pb95 === null || on === null || lpg === null) {
    return Response.json({ error: 'Podaj poprawne ceny — liczby większe od 0 (np. 6,19).' }, { status: 400 });
  }

  const data = { pb95, on, lpg, updatedAt: new Date().toISOString() };
  try {
    const store = getStore('bopi');
    await store.setJSON('prices', data);
  } catch (e) {
    return Response.json({ error: 'Nie udało się zapisać cen. Spróbuj ponownie.' }, { status: 500 });
  }
  return Response.json(data);
};
