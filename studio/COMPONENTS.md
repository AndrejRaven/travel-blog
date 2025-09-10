# System Komponentów Sanity

## Przegląd

System komponentów pozwala na tworzenie postów z różnych komponentów zamiast zwykłej treści. Każdy post może składać się z wielu komponentów ułożonych w dowolnej kolejności.

## Dostępne Komponenty

### 1. Hero Banner

Komponent z obrazkiem i tekstem obok siebie.

**Pola:**

- **Tytuł** - Rich text z możliwością formatowania
- **Opis** - Rich text z możliwością formatowania
- **Obraz** - Główny obraz komponentu
- **Przyciski** - Tablica przycisków (opcjonalne)
- **Układ:**
  - Szerokość obrazka: 25%, 50%, 75%
  - Pozycja obrazka (desktop): Lewo/Prawo
  - Pozycja obrazka (mobile): Góra/Dół
  - Odstępy tekstu: Z odstępami/Bez odstępów
  - Wysokość baneru: 25vh, 50vh, 75vh
  - Kolor tła: Wybór z dostępnych kolorów motywu

### 2. Background Hero Banner

Komponent z obrazkiem w tle i tekstem na wierzchu.

**Pola:**

- **Tytuł** - Rich text z możliwością formatowania
- **Opis** - Rich text z możliwością formatowania
- **Obraz w tle** - Obraz wyświetlany jako tło
- **Przyciski** - Tablica przycisków (opcjonalne)
- **Układ:**
  - Wysokość baneru: 25vh, 50vh, 75vh, 100vh
  - Wyrównanie tekstu: Lewo/Środek/Prawo
  - Przezroczystość nakładki: 10%-90%
  - Styl tekstu: Normalny/Pogrubiony/Kontur/Cień

### 3. Przycisk

Wspólny komponent przycisku używany w bannerach.

**Pola:**

- **Etykieta** - Tekst przycisku
- **Link** - URL do którego prowadzi przycisk
- **Wariant** - Primary/Secondary/Outline
- **Link zewnętrzny** - Czy otwierać w nowej karcie

## Jak używać

1. **Tworzenie posta:**
   - W Sanity Studio przejdź do sekcji "Posts"
   - Kliknij "Create" aby utworzyć nowy post
   - Wypełnij podstawowe pola (tytuł, slug, zdjęcie główne, data)

2. **Dodawanie komponentów:**
   - W sekcji "Komponenty" kliknij "Add item"
   - Wybierz typ komponentu (Hero Banner lub Background Hero Banner)
   - Wypełnij pola komponentu
   - Możesz dodać wiele komponentów w dowolnej kolejności

3. **Konfiguracja układu:**
   - Każdy komponent ma sekcję "Układ" z opcjami wizualnymi
   - Dostosuj ustawienia do swoich potrzeb
   - Użyj podglądu aby zobaczyć jak będzie wyglądać

## Przyszłe komponenty

System jest przygotowany na dodanie kolejnych komponentów:

- Karuzele
- Blog artykułów
- Kategorie
- Embedy YouTube
- I wiele innych...

## Techniczne szczegóły

- Wszystkie komponenty używają systemu motywów z `lib/theme-colors.ts`
- Rich Text obsługuje formatowanie, linki i style
- Komponenty są responsywne i dostosowują się do różnych urządzeń
- Każdy komponent ma własny schemat w `schemas/`
