# BO-PI — strona stacji paliw (Czermin)

Strona stacji paliw **BO-PI**, Czermin 146, 39-304 Czermin, z panelem do zarządzania
przez pracownika. Hostowana na **Netlify** (strona statyczna + funkcje serverless +
magazyn Netlify Blobs).

## Co potrafi panel (`/admin`)

Po zalogowaniu hasłem pracownik może zmienić — wszystko widoczne na stronie od razu:

- **Ceny paliw** Pb 95 / ON / LPG (przy każdej cenie strona pokazuje strzałkę ▲/▼ —
  czy podrożało, czy staniało od ostatniej zmiany).
- **Produkty dodatkowe** (Butla LPG 11 kg, Kawa, Mycie szyb) — cena + przełącznik „pokaż".
- **Godziny otwarcia** dla każdego dnia (z opcją „zamknięte"). Strona sama liczy z nich
  status „otwarte / zamknięte" i grupuje dni (np. „Pon – Pt").
- **Pasek ogłoszeń** u góry strony (np. „Brak ON do 14:00").

## Struktura

| Plik | Opis |
|------|------|
| `index.html` | Strona publiczna. Pobiera dane z funkcji; przy braku backendu pokazuje wartości domyślne. |
| `admin.html` | Panel (pod `/admin`). Logowanie hasłem → edycja cen, produktów, godzin, ogłoszeń. |
| `netlify/functions/prices.mjs` | Publiczny odczyt: ceny + trend, godziny, ogłoszenie, produkty. |
| `netlify/functions/login.mjs` | Logowanie → token sesji (8 h). |
| `netlify/functions/save-settings.mjs` | Zapis ustawień (wymaga tokenu). |
| `netlify/lib/shared.mjs` | Wspólna logika: domyślne dane, walidacja, tokeny. |
| `robots.txt`, `sitemap.xml` | SEO. Dane strukturalne `GasStation` są w `index.html`. |
| `netlify.toml`, `package.json` | Konfiguracja Netlify i zależności. |

## Wdrożenie na Netlify

1. Wrzuć projekt do repozytorium (GitHub) i w Netlify wybierz **Add new site → Import from Git**,
   albo przeciągnij folder na `app.netlify.com`.
2. Build nie jest potrzebny — Netlify samo zainstaluje zależności i wykryje funkcje.
3. W **Site configuration → Environment variables** ustaw dwie zmienne:

   | Zmienna | Wartość |
   |---------|---------|
   | `ADMIN_PASSWORD` | hasło dla pracownika |
   | `ADMIN_SECRET`   | długi losowy ciąg do podpisywania sesji (min. 32 znaki) |

   `ADMIN_SECRET` możesz wygenerować: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
4. Po wdrożeniu panel jest pod adresem **`https://twoja-domena/admin`**.

> Bez ustawionych zmiennych logowanie zwróci komunikat o braku konfiguracji,
> a strona publiczna pokaże domyślne dane.

### Po podpięciu własnej domeny

Podmień adres w `robots.txt` (linia `Sitemap:`) i w `sitemap.xml` (`<loc>`) na swój.
Dane strukturalne i mapa działają bez zmian.

## Podgląd lokalny

- Sam `index.html` otwarty w przeglądarce działa (pokazuje domyślne dane — funkcje są
  dostępne dopiero na Netlify).
- Pełny podgląd z funkcjami i panelem:

  ```bash
  npm install
  netlify dev
  ```

  Ustaw lokalnie `ADMIN_PASSWORD` i `ADMIN_SECRET` (np. w pliku `.env`), żeby przetestować panel.

## Godziny otwarcia (domyślne)

Pon–Pt 6:00–20:00 · Sobota 7:00–19:00 · Niedziela 9:00–17:00
(edytowalne w panelu; dane strukturalne `GasStation` w `index.html` mają te same wartości —
zmień je tam ręcznie, jeśli na stałe zmienisz godziny).
