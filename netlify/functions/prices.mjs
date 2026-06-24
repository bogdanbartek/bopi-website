import { getStore } from '@netlify/blobs';
import { publicPayload } from '../lib/shared.mjs';

// Publiczny odczyt ustawień strony: ceny + trend, godziny, ogłoszenie, produkty.
export default async () => {
  let stored = null;
  try {
    const store = getStore('bopi');
    stored = await store.get('site', { type: 'json' });
  } catch (e) {
    // Brak skonfigurowanego magazynu (np. lokalnie) — użyj wartości domyślnych.
  }
  return Response.json(publicPayload(stored), { headers: { 'Cache-Control': 'no-store' } });
};
