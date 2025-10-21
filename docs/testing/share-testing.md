# Testowanie funkcji udostępniania

## Jak przetestować udostępnianie

### 1. Uruchom aplikację

```bash
cd travel-blog
npm run dev
```

### 2. Otwórz stronę postu

- Przejdź na dowolną stronę postu (np. `/post/jakiś-slug`)
- Przewiń w dół do sekcji komentarzy
- Po komentarzach powinna być sekcja "Udostępnij ten artykuł"

### 3. Sprawdź debug info

- W trybie deweloperskim zobaczysz żółte pole z informacjami debug
- Sprawdź czy URL i tytuł są prawidłowe
- Otwórz konsolę przeglądarki (F12) i sprawdź logi

### 4. Przetestuj przyciski

#### Facebook

- Kliknij "Facebook"
- Powinno otworzyć się okno z Facebookiem
- Sprawdź czy tytuł i URL są prawidłowe

#### X (Twitter)

- Kliknij "X (Twitter)"
- Powinno otworzyć się okno z Twitterem
- Sprawdź czy tytuł i URL są prawidłowe

#### Natywne udostępnianie

- Na mobile: powinno otworzyć natywne okno udostępniania
- Na desktop: powinno skopiować link do schowka

### 5. Sprawdź logi w konsoli

Powinieneś zobaczyć logi typu:

```
ShareButtons debug: {postTitle: "...", postUrl: "...", ...}
Udostępnianie na facebook: https://www.facebook.com/sharer/sharer.php?u=...
Pełne dane: {postTitle: "...", postUrl: "...", postDescription: "..."}
```

## Rozwiązywanie problemów

### Problem: "Nieprawidłowy URL do udostępniania"

- Sprawdź czy `NEXT_PUBLIC_SITE_URL` jest ustawione w `.env.local`
- Sprawdź czy post ma prawidłowy slug

### Problem: Popup zablokowany

- Sprawdź czy przeglądarka nie blokuje popupów
- Spróbuj kliknąć ponownie

### Problem: Link nie działa

- Sprawdź konsolę przeglądarki
- Sprawdź czy URL jest prawidłowy w debug info
- Sprawdź czy wszystkie parametry są przekazywane

## Konfiguracja

### Zmienne środowiskowe

Dodaj do `.env.local`:

```
NEXT_PUBLIC_SITE_URL=https://twoja-domena.com
```

### Testowanie na różnych urządzeniach

- Mobile: sprawdź natywne udostępnianie
- Desktop: sprawdź popup i kopiowanie do schowka
- Różne przeglądarki: Chrome, Firefox, Safari
