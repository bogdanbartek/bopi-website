import { getStore } from '@netlify/blobs';
import { buildSettings, publicPayload, verifyToken } from '../lib/shared.mjs';

const SECRET = process.env.ADMIN_SECRET || '';

// Zapis ustawień (ceny, godziny, ogłoszenie, produkty) — wymaga ważnego tokenu.
export default async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const auth = req.headers.get('authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  if (!verifyToken(SECRET, token)) {
    return Response.json({ error: 'Sesja wygasła. Zaloguj się ponownie.' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));

  let existing = null;
  let store;
  try {
    store = getStore('bopi');
    existing = await store.get('site', { type: 'json' });
  } catch (e) {
    return Response.json({ error: 'Magazyn danych jest niedostępny.' }, { status: 500 });
  }

  const { data, error } = buildSettings(body, existing);
  if (error) return Response.json({ error }, { status: 400 });

  try {
    await store.setJSON('site', data);
  } catch (e) {
    return Response.json({ error: 'Nie udało się zapisać. Spróbuj ponownie.' }, { status: 500 });
  }

  return Response.json(publicPayload(data));
};
