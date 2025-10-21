# System komentarzy - Dokumentacja

## Przegląd

System komentarzy został w pełni zaimplementowany i zawiera następujące funkcjonalności:

### ✅ Zaimplementowane funkcje

1. **Schemat komentarzy w Sanity CMS**

   - Pełne pole komentarza z autorem, treścią, statusem
   - Obsługa odpowiedzi na komentarze (threading)
   - Automatyczne zapisywanie IP i User Agent
   - Statusy: pending, approved, rejected, spam

2. **Konfiguracja komentarzy na poziomie posta**

   - Włączanie/wyłączanie komentarzy
   - Ustawienia moderacji (wymaganie zatwierdzenia, maksymalna długość, zezwalanie na odpowiedzi)

3. **Komponenty UI**

   - `CommentsSection` - główny komponent wyświetlania komentarzy
   - `CommentsModeration` - panel administracyjny do moderacji
   - `Notification` - system powiadomień

4. **API Endpoints**

   - `GET /api/comments` - pobieranie komentarzy dla posta
   - `POST /api/comments` - dodawanie nowych komentarzy
   - `GET /api/comments/admin` - pobieranie wszystkich komentarzy (moderacja)
   - `PATCH /api/comments/[id]/status` - zmiana statusu komentarza
   - `DELETE /api/comments/[id]` - usuwanie komentarza
   - `PATCH /api/comments/bulk-status` - masowa zmiana statusu

5. **Zabezpieczenia i walidacja**

   - Rate limiting (max 3 komentarze na IP w 5 minut)
   - Walidacja duplikatów (ten sam content + IP w 10 minut)
   - Walidacja długości i formatu danych
   - Walidacja email i URL

6. **System powiadomień**
   - Globalny system powiadomień z kontekstem React
   - Powiadomienia o sukcesie i błędach
   - Automatyczne zamykanie po czasie

## Struktura plików

### Sanity CMS

```
studio/schemas/comentaries/
├── comentaries.ts          # Schemat komentarzy
studio/schemaTypes/
├── index.ts                # Eksport schematu komentarzy
studio/schemas/strony/
├── post.ts                 # Dodane pola komentarzy do posta
```

### Frontend

```
travel-blog/components/ui/
├── CommentsSection.tsx     # Komponent wyświetlania komentarzy
├── CommentsModeration.tsx  # Panel moderacji
├── Notification.tsx        # System powiadomień
travel-blog/components/providers/
├── NotificationProvider.tsx # Provider powiadomień
travel-blog/lib/
├── useComments.ts          # Hook do zarządzania komentarzami
travel-blog/app/api/comments/
├── route.ts                # Główny endpoint komentarzy
├── admin/route.ts          # Endpoint moderacji
├── [id]/route.ts           # Usuwanie komentarza
├── [id]/status/route.ts    # Zmiana statusu
└── bulk-status/route.ts    # Masowa zmiana statusu
travel-blog/app/admin/
└── komentarze/page.tsx     # Strona moderacji
```

## Użycie

### 1. Wyświetlanie komentarzy na stronie posta

Komentarze są automatycznie wyświetlane na każdej stronie posta, jeśli są włączone w ustawieniach posta.

### 2. Konfiguracja komentarzy w Sanity

W panelu Sanity, w zakładce "Komentarze" każdego posta można ustawić:

- **Włącz komentarze** - czy komentarze mają być wyświetlane
- **Wymagaj zatwierdzenia** - czy komentarze wymagają moderacji
- **Maksymalna długość** - limit znaków w komentarzu
- **Zezwól na odpowiedzi** - czy użytkownicy mogą odpowiadać na komentarze

### 3. Moderacja komentarzy

Panel moderacji dostępny pod adresem `/admin/komentarze` umożliwia:

- Przeglądanie wszystkich komentarzy
- Filtrowanie według statusu
- Wyszukiwanie komentarzy
- Zmianę statusu pojedynczych komentarzy
- Masową zmianę statusu
- Usuwanie komentarzy

### 4. Statusy komentarzy

- **pending** - oczekuje na zatwierdzenie (żółta ikona)
- **approved** - zatwierdzony i widoczny (zielona ikona)
- **rejected** - odrzucony (czerwona ikona)
- **spam** - oznaczony jako spam (czerwona ikona)

## API Reference

### GET /api/comments?postId={id}&status={status}

Pobiera komentarze dla danego posta.

**Parametry:**

- `postId` (wymagane) - ID posta
- `status` (opcjonalne) - status komentarzy (domyślnie: approved)

**Odpowiedź:**

```json
{
  "comments": [
    {
      "_id": "comment_id",
      "author": {
        "name": "Jan Kowalski",
        "email": "jan@example.com",
        "website": "https://example.com"
      },
      "content": "Treść komentarza",
      "createdAt": "2024-01-01T12:00:00Z",
      "status": "approved",
      "parentComment": "parent_id",
      "post": {
        "_id": "post_id",
        "title": "Tytuł posta"
      }
    }
  ]
}
```

### POST /api/comments

Dodaje nowy komentarz.

**Body:**

```json
{
  "author": {
    "name": "Jan Kowalski",
    "email": "jan@example.com",
    "website": "https://example.com"
  },
  "content": "Treść komentarza",
  "postId": "post_id",
  "parentComment": "parent_id"
}
```

**Odpowiedź:**

```json
{
  "comment": {
    /* obiekt komentarza */
  },
  "message": "Komentarz został dodany pomyślnie"
}
```

## Zabezpieczenia

### Rate Limiting

- Maksymalnie 3 komentarze na IP w ciągu 5 minut
- Blokada duplikatów (ten sam content + IP w 10 minut)

### Walidacja

- Imię i nazwisko: 2-100 znaków
- Email: prawidłowy format, max 255 znaków
- Treść: min 10 znaków, max ustawiony w konfiguracji posta
- URL strony: prawidłowy format (opcjonalnie)

### Moderacja

- Wszystkie komentarze są domyślnie w statusie "pending"
- Administrator może zatwierdzać, odrzucać lub oznaczać jako spam
- Komentarze w statusie "approved" są widoczne publicznie

## Dostosowywanie

### Zmiana limitów

Aby zmienić limity rate limiting, edytuj plik `travel-blog/app/api/comments/route.ts`:

```typescript
// Zmień limit komentarzy na IP
if (recentComments > 5) {
  // zamiast 3
  // ...
}

// Zmień czas blokady duplikatów
tenMinutesAgo: new Date(Date.now() - 15 * 60 * 1000).toISOString(); // 15 minut zamiast 10
```

### Zmiana wyglądu

Komponenty używają Tailwind CSS z klasami `dark:` dla motywów. Główne style znajdują się w:

- `CommentsSection.tsx` - wygląd listy komentarzy
- `CommentsModeration.tsx` - wygląd panelu moderacji
- `Notification.tsx` - wygląd powiadomień

### Dodanie nowych pól

Aby dodać nowe pola do komentarzy:

1. Zaktualizuj schemat w `studio/schemas/comentaries/comentaries.ts`
2. Zaktualizuj typy w `lib/useComments.ts`
3. Zaktualizuj formularz w `CommentsSection.tsx`
4. Zaktualizuj panel moderacji w `CommentsModeration.tsx`

## Rozwiązywanie problemów

### Komentarze się nie wyświetlają

1. Sprawdź czy komentarze są włączone w ustawieniach posta
2. Sprawdź czy komentarze mają status "approved"
3. Sprawdź konsolę przeglądarki pod kątem błędów

### Błędy API

1. Sprawdź logi serwera
2. Sprawdź czy Sanity jest poprawnie skonfigurowane
3. Sprawdź czy wszystkie wymagane pola są wypełnione

### Problemy z moderacją

1. Sprawdź czy masz dostęp do panelu administracyjnego
2. Sprawdź czy endpointy API działają poprawnie
3. Sprawdź uprawnienia w Sanity

## Przyszłe rozszerzenia

Możliwe przyszłe funkcjonalności:

- Powiadomienia email o nowych komentarach
- Automatyczne wykrywanie spamu (AI)
- System ocen komentarzy (like/dislike)
- Eksport komentarzy do CSV
- Integracja z systemem użytkowników
- Komentarze w czasie rzeczywistym (WebSocket)
