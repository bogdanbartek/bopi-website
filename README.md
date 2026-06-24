# BO-PI — strona stacji paliw (Czermin)

Strona stacji paliw **BO-PI**, Czermin 146, 39-304 Czermin, z panelem do zarządzania
cenami paliw przez pracownika. Hostowana na **Netlify** (strona statyczna + funkcje
serverless + magazyn Netlify Blobs).

## Struktura

| Plik | Opis |
|------|------|
| `index.html` | Strona publiczna. Ceny pobiera z funkcji, status otwarte/zamknięte liczy z godzin. |
| `admin.html` | Panel cen (dostępny pod `/admin`). Logowanie hasłem → edycja cen. |
| `netlify/functions/prices.mjs` | Publiczny odczyt aktualnych cen. |
| `netlify/functions/login.mjs` | Logowanie pracownika → token sesji (8 h). |
| `netlify/functions/save-prices.mjs` | Zapis cen (wymaga tokenu). |
| `netlify.toml`, `package.json` | Konfiguracja Netlify i zależności. |

## Wdrożenie na Netlify

1. Wrzuć projekt do repozytorium (GitHub) i w Netlify wybierz **Add new site → Import from Git**,
   albo przeciągnij folder na `app.netlify.com` (Deploy manually).
2. Build nie jest potrzebny — Netlify samo zainstaluje zależności i wykryje funkcje.
3. W **Site configuration → Environment variables** ustaw dwie zmienne:

   | Zmienna | Wartość |
   |---------|---------|
   | `ADMIN_PASSWORD` | hasło dla pracownika (np. mocne, własne) |
   | `ADMIN_SECRET`   | długi losowy ciąg do podpisywania sesji (min. 32 znaki) |

   `ADMIN_SECRET` możesz wygenerować np. komendą: `openssl rand -hex 32`.
4. Po wdrożeniu panel jest pod adresem **`https://twoja-domena/admin`**.

> Bez ustawionych zmiennych logowanie zwróci komunikat o braku konfiguracji,
> a strona publiczna pokaże domyślne ceny.

## Zmiana cen (pracownik)

1. Wejdź na `/admin`, wpisz hasło.
2. Zmień ceny Pb 95 / ON / LPG, kliknij **Zapisz ceny**.
3. Nowe ceny są od razu widoczne dla wszystkich na stronie głównej.

## Podgląd lokalny

- Sam `index.html` otwarty w przeglądarce działa (pokazuje domyślne ceny — funkcje są
  dostępne dopiero na Netlify).
- Pełny podgląd z funkcjami i panelem: zainstaluj [Netlify CLI](https://docs.netlify.com/cli/get-started/)
  i uruchom:

  ```bash
  npm install
  netlify dev
  ```

  Ustaw lokalnie `ADMIN_PASSWORD` i `ADMIN_SECRET` (np. w pliku `.env`), żeby przetestować panel.

## Godziny otwarcia

Pon–Pt 6:00–20:00 · Sobota 7:00–19:00 · Niedziela 9:00–17:00
(zaszyte w `index.html` — tabela oraz logika statusu „otwarte/zamknięte").
