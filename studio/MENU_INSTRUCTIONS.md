# Instrukcja konfiguracji menu w Sanity Studio

## Nowa struktura menu

Zaktualizowałem schemat `header.ts` aby obsługiwał nową, bardziej elastyczną strukturę menu z wielopoziomowymi dropdownami.

## Jak skonfigurować menu

1. **Otwórz Sanity Studio** (`npm run dev` w folderze `studio/`)

2. **Przejdź do sekcji "Header Navigation"**

3. **Skonfiguruj "Główne menu"** zgodnie z Twoją strukturą:

### Struktura menu:

```
1. Podróże - świat
   ├── Podróże na własną rękę - porady
   │   ├── Planowanie podróży
   │   ├── Transport
   │   └── Zakwaterowanie
   └── Co warto zobaczyć
       ├── Azja
       │   ├── Tajlandia
       │   ├── Indonezja
       │   └── Japonia
       ├── Europa
       │   ├── Włochy
       │   ├── Francja
       │   └── Hiszpania
       ├── Afryka
       │   ├── Maroko
       │   └── Egipt
       ├── Ameryka Północna
       │   ├── USA
       │   └── Kanada
       └── Ameryka Południowa
           ├── Brazylia
           ├── Peru
           └── Chile

2. Podróże - Polska

3. Recenzje produktów

4. Porady praktyczne podczas podróżowania
   ├── Koszty naszych podróży
   │   ├── Budżet na podróż
   │   ├── Jak oszczędzać w podróży
   │   └── Koszty transportu
   └── Inne porady
       ├── Bezpieczeństwo w podróży
       ├── Sprzęt i pakowanie
       └── Dokumenty i wizy

5. O nas
   ├── Info o nas
   │   ├── Nasza historia
   │   └── Kim jesteśmy
   ├── Kontakt
   │   ├── Napisz do nas
   │   └── Media społecznościowe
   └── Wsparcie
       ├── Wesprzyj nas
       └── Współpraca
```

## Konfiguracja w Studio

### Dla każdego elementu menu głównego:

1. **Etykieta** - nazwa elementu menu (np. "Podróże - świat")
2. **Link** - opcjonalny link bezpośredni do elementu
3. **Link zewnętrzny** - zaznacz jeśli link prowadzi poza stronę
4. **Ma dropdown** - zaznacz jeśli element ma rozwijane podmenu

### Dla sekcji dropdowna:

1. **Tytuł sekcji** - nazwa sekcji (np. "Podróże na własną rękę - porady")
2. **Emoji** - opcjonalne emoji dla sekcji (max 2 znaki)
3. **Elementy sekcji** - lista elementów w sekcji

### Dla elementów dropdowna:

1. **Etykieta** - nazwa elementu
2. **Link** - link do strony
3. **Link zewnętrzny** - zaznacz jeśli link prowadzi poza stronę
4. **Ma podmenu** - zaznacz jeśli element ma dodatkowe podmenu
5. **Elementy podmenu** - lista elementów podmenu (tylko jeśli "Ma podmenu" jest zaznaczone)

## Przykładowe dane

W pliku `menu-structure-example.json` znajdziesz gotową strukturę danych, którą możesz skopiować do Sanity Studio.

## Uwagi techniczne

- Schemat obsługuje maksymalnie 3 poziomy menu (główny → dropdown → podmenu)
- Każdy element może mieć opcjonalny bezpośredni link
- Wszystkie linki mogą być wewnętrzne lub zewnętrzne
- Emoji są opcjonalne i ograniczone do 2 znaków
- Struktura jest w pełni responsywna i będzie działać na wszystkich urządzeniach
