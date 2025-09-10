# Ujednolicone Pole Treści

## ✅ Zmiany wprowadzone

### Problem

Wcześniej komponenty HeroBanner i BackgroundHeroBanner miały osobne pola:

- `title` - dla tytułu
- `description` - dla opisu

### Rozwiązanie

Teraz oba komponenty mają jedno pole:

- `content` - dla całej treści (tytuł + opis)

## 🎯 Korzyści

### 1. **Prostsze zarządzanie**

- Jedno pole zamiast dwóch
- Łatwiejsze edytowanie w Sanity Studio
- Mniej pól do wypełnienia

### 2. **Większa elastyczność**

- Możliwość dodawania wielu nagłówków (H1, H2, H3)
- Dowolna kolejność tytułów i opisów
- Możliwość dodawania dodatkowych elementów (listy, linki, etc.)

### 3. **Lepsze UX**

- Użytkownik może używać stylów Rich Text (H1, H2, H3, normal)
- Wszystko w jednym miejscu
- Intuicyjne formatowanie

## 📝 Jak używać

### W Sanity Studio

1. **Otwórz komponent** (HeroBanner lub BackgroundHeroBanner)
2. **W polu "Treść"**:
   - Użyj **H1** dla głównego tytułu
   - Użyj **H2** dla podtytułów
   - Użyj **H3** dla mniejszych nagłówków
   - Użyj **Normal** dla zwykłego tekstu/opisu
3. **Dodaj formatowanie**: pogrubienie, kursywa, linki
4. **Ustaw kolejność** według potrzeb

### Przykład struktury treści

```
H1: Odkrywaj świat z nami
Normal: Krótki opis bloga z zachętą do eksploracji.
        Sprawdź nasze najnowsze artykuły!
H2: Nasze podróże
Normal: Od egzotycznych plaż po górskie szczyty.
```

## 🔧 Zmiany techniczne

### Schematy Sanity

- `heroBanner.ts` - pole `content` zamiast `title` + `description`
- `backgroundHeroBanner.ts` - pole `content` zamiast `title` + `description`

### Typy TypeScript

- `HeroBanner` - `content: RichTextBlock[]`
- `BackgroundHeroBanner` - `content: RichTextBlock[]`
- `HeroBannerData` - `content: RichTextBlock[]`
- `BackgroundHeroBannerData` - `content: RichTextBlock[]`

### Komponenty React

- `HeroBanner.tsx` - renderuje `data.content`
- `BackgroundHeroBanner.tsx` - renderuje `data.content`
- `ComponentRenderer.tsx` - konwertuje `comp.content`

### Zapytania Sanity

- Pobiera pole `content[]` zamiast `title[]` i `description[]`

## 🚀 Następne kroki

System jest gotowy do użycia! Możesz:

1. **Tworzyć posty** z komponentami w Sanity Studio
2. **Używać jednego pola treści** dla tytułów i opisów
3. **Formatować tekst** używając stylów Rich Text
4. **Dodawać kolejne komponenty** w przyszłości

Wszystkie istniejące komponenty zostały zaktualizowane i są w pełni funkcjonalne! 🎉
