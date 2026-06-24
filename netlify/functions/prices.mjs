import { getStore } from '@netlify/blobs';

// Domyślne ceny pokazywane, dopóki pracownik nie ustawi własnych.
const DEFAULTS = { pb95: 6.19, on: 6.34, lpg: 2.89, updatedAt: null };

// Publiczny odczyt aktualnych cen paliw.
export default async () => {
  let data = DEFAULTS;
  try {
    const store = getStore('bopi');
    const stored = await store.get('prices', { type: 'json' });
    if (stored) data = stored;
  } catch (e) {
    // Brak skonfigurowanego magazynu (np. lokalnie) — zwróć wartości domyślne.
  }
  return Response.json(data, { headers: { 'Cache-Control': 'no-store' } });
};
