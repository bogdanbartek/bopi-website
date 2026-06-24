// Wspólna logika dla funkcji Netlify: domyślne dane, walidacja, budowanie
// publicznego ładunku (z trendem cen i opisanymi produktami dodatkowymi).

export const DEFAULTS = {
  prices: { pb95: 6.19, on: 6.34, lpg: 2.89 },
  prevPrices: null,
  pricesUpdatedAt: null,
  hours: {
    '1': ['06:00', '20:00'],
    '2': ['06:00', '20:00'],
    '3': ['06:00', '20:00'],
    '4': ['06:00', '20:00'],
    '5': ['06:00', '20:00'],
    '6': ['07:00', '19:00'],
    '0': ['09:00', '17:00'],
  },
  notice: { active: false, text: '' },
  extras: {
    lpgButla: { price: 89, active: true },
    kawa: { price: 6, active: true },
  },
};

// Stałe definicje produktów dodatkowych (etykiety/jednostki nie są edytowalne).
export const EXTRA_DEFS = {
  lpgButla: { label: 'Butla LPG 11 kg', unit: 'zł' },
  kawa: { label: 'Kawa', unit: 'zł' },
};

const FUELS = ['pb95', 'on', 'lpg'];
const DAYS = ['0', '1', '2', '3', '4', '5', '6'];

// Liczba dodatnia, max 2 miejsca po przecinku, do 1000.
export function cleanPrice(v) {
  const n = Number(String(v).replace(',', '.'));
  if (!isFinite(n) || n <= 0 || n > 1000) return null;
  return Math.round(n * 100) / 100;
}

// Godzina w formacie HH:MM (24h).
export function validTime(s) {
  return typeof s === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
}

function toMin(s) {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
}

// Uzupełnia brakujące pola wartościami domyślnymi.
export function withDefaults(data) {
  const d = data && typeof data === 'object' ? data : {};
  const out = {
    prices: { ...DEFAULTS.prices, ...(d.prices || {}) },
    prevPrices: d.prevPrices || null,
    pricesUpdatedAt: d.pricesUpdatedAt || null,
    hours: { ...DEFAULTS.hours, ...(d.hours || {}) },
    notice: { ...DEFAULTS.notice, ...(d.notice || {}) },
    extras: {},
  };
  for (const key of Object.keys(EXTRA_DEFS)) {
    out.extras[key] = { ...DEFAULTS.extras[key], ...((d.extras || {})[key] || {}) };
  }
  return out;
}

// Publiczny ładunek dla strony: ceny, trend (▲/▼), godziny, ogłoszenie, produkty.
export function publicPayload(data) {
  const d = withDefaults(data);
  const trend = {};
  for (const k of FUELS) {
    const cur = d.prices[k];
    const prev = d.prevPrices ? d.prevPrices[k] : null;
    trend[k] = typeof prev === 'number' && prev !== cur ? (cur > prev ? 'up' : 'down') : 'same';
  }
  const extras = Object.entries(EXTRA_DEFS).map(([key, def]) => ({
    key,
    label: def.label,
    unit: def.unit,
    price: d.extras[key].price,
    active: !!d.extras[key].active,
  }));
  return {
    prices: d.prices,
    trend,
    pricesUpdatedAt: d.pricesUpdatedAt,
    hours: d.hours,
    notice: d.notice,
    extras,
  };
}

// Waliduje i normalizuje dane z panelu admina. Zwraca { data } albo { error }.
export function buildSettings(body, existing) {
  const prev = withDefaults(existing);
  const out = withDefaults({});

  // Ceny paliw
  for (const k of FUELS) {
    const p = cleanPrice((body.prices || {})[k]);
    if (p === null) return { error: 'Podaj poprawne ceny paliw — liczby większe od 0 (np. 6,19).' };
    out.prices[k] = p;
  }

  // Trend: zapamiętaj poprzednie ceny tylko gdy faktycznie się zmieniły.
  const changed = FUELS.some((k) => out.prices[k] !== prev.prices[k]);
  out.prevPrices = changed ? prev.prices : prev.prevPrices;
  out.pricesUpdatedAt = changed ? new Date().toISOString() : prev.pricesUpdatedAt;

  // Godziny otwarcia
  const hours = body.hours || {};
  for (const day of DAYS) {
    const val = hours[day];
    if (val == null || val === 'closed' || (Array.isArray(val) && (!val[0] || !val[1]))) {
      out.hours[day] = null; // dzień zamknięty (lub brak danych)
    } else if (Array.isArray(val) && validTime(val[0]) && validTime(val[1]) && toMin(val[0]) < toMin(val[1])) {
      out.hours[day] = [val[0], val[1]];
    } else {
      return { error: 'Sprawdź godziny otwarcia — godzina otwarcia musi być wcześniejsza niż zamknięcia.' };
    }
  }

  // Ogłoszenie
  const notice = body.notice || {};
  out.notice = {
    active: !!notice.active,
    text: String(notice.text || '').slice(0, 160).trim(),
  };
  if (out.notice.active && !out.notice.text) {
    return { error: 'Wpisz treść ogłoszenia albo je wyłącz.' };
  }

  // Produkty dodatkowe
  const extras = body.extras || {};
  for (const key of Object.keys(EXTRA_DEFS)) {
    const e = extras[key] || {};
    const price = cleanPrice(e.price);
    if (price === null) return { error: 'Podaj poprawne ceny produktów dodatkowych.' };
    out.extras[key] = { price, active: !!e.active };
  }

  out.updatedAt = new Date().toISOString();
  return { data: out };
}

// --- Tokeny sesji (HMAC) ---
import crypto from 'node:crypto';

export function signToken(secret, ttlMs = 8 * 60 * 60 * 1000) {
  const body = Buffer.from(JSON.stringify({ exp: Date.now() + ttlMs })).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifyToken(secret, token) {
  if (!token || !secret) return false;
  const [body, sig] = token.split('.');
  if (!body || !sig) return false;
  const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url');
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
