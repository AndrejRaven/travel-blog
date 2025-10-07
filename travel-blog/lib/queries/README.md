# 📋 Centralne zarządzanie zapytaniami GROQ

Ta struktura zapewnia centralizację wszystkich zapytań GROQ w jednym miejscu, co ułatwia utrzymanie, reużywalność i czytelność kodu.

## 🏗️ Struktura katalogów

```
lib/queries/
├── index.ts          # Wszystkie zapytania GROQ
├── functions.ts      # Funkcje pomocnicze
└── README.md         # Ten plik
```

## 📁 Pliki

### `index.ts` - Zapytania GROQ

Zawiera wszystkie zapytania GROQ pogrupowane według funkcjonalności:

- `POST.*` - zapytania dla postów
- `HEADER.*` - zapytania dla headera
- `ARTICLES.*` - zapytania dla komponentu articles
- `CATEGORY.*` - zapytania dla kategorii
- `HOME.*` - zapytania dla strony głównej

### `functions.ts` - Funkcje pomocnicze

Eksportuje funkcje TypeScript dla każdego zapytania:

- `getPostBySlug(slug)` - pobierz post po slug
- `getAllPostSlugs()` - pobierz wszystkie slugi postów
- `getLatestPosts(limit)` - pobierz najnowsze posty
- `getSelectedPosts(articleIds)` - pobierz wybrane posty
- `getHeaderData()` - pobierz dane headera
- `getArticlesComponentData()` - pobierz dane komponentu articles
- `getAllCategories()` - pobierz wszystkie kategorie
- `getCategoryBySlug(slug)` - pobierz kategorię po slug
- `getCategoryPosts(slug)` - pobierz posty z kategorii
- `getHomePageComponents()` - pobierz komponenty strony głównej

## 🚀 Użycie

### Podstawowe użycie

```typescript
import { getPostBySlug, getLatestPosts } from "@/lib/queries/functions";

// Pobierz post po slug
const post = await getPostBySlug("moj-post");

// Pobierz najnowsze posty
const latestPosts = await getLatestPosts(5);
```

### Bezpośrednie użycie zapytań

```typescript
import { QUERIES } from "@/lib/queries";
import { fetchGroq } from "@/lib/sanity";

// Użyj zapytania bezpośrednio (z strategią cache)
const posts = await fetchGroq(QUERIES.POST.LATEST, { limit: 3 }, "POSTS");
```

## ✅ Korzyści

1. **Centralizacja** - wszystkie zapytania w jednym miejscu
2. **Reużywalność** - łatwe ponowne użycie zapytań
3. **Łatwość utrzymania** - zmiany w jednym miejscu
4. **TypeScript** - pełne wsparcie typów
5. **Czytelność** - jasna struktura i nazewnictwo
6. **Testowanie** - łatwiejsze testowanie zapytań
7. **Prostota** - brak dodatkowych warstw abstrakcji
8. **Wydajność** - optymalizowane zapytania z indeksami
9. **Cacheowanie** - inteligentne strategie cache dla różnych typów danych
10. **Obsługa błędów** - zaawansowana obsługa błędów z retry logic

## 🔧 Dodawanie nowych zapytań

### 1. Dodaj zapytanie do `index.ts`

```typescript
export const QUERIES = {
  // ... istniejące zapytania
  NEW_FEATURE: {
    BY_ID: `*[_type == "newFeature" && _id == $id][0] {
      _id,
      title,
      // ... inne pola
    }`,
  },
} as const;
```

### 2. Dodaj funkcję do `functions.ts`

```typescript
export async function getNewFeatureById(
  id: string
): Promise<NewFeature | null> {
  try {
    return await fetchGroq<NewFeature | null>(
      QUERIES.NEW_FEATURE.BY_ID,
      { id },
      "STATIC" // Wybierz odpowiednią strategię cache
    );
  } catch (error) {
    if (error.message?.includes("Not found")) {
      return null; // Feature nie istnieje
    }
    handleSanityError(error, "Error fetching new feature");
  }
}
```

### 3. Użyj w komponencie

```typescript
import { getNewFeatureById } from "@/lib/queries/functions";

const feature = await getNewFeatureById("feature-id");
```

## 🎯 Best Practices

1. **Zawsze używaj funkcji z `functions.ts`** zamiast bezpośrednich zapytań
2. **Dodawaj obsługę błędów** w każdej funkcji z `handleSanityError`
3. **Używaj TypeScript** dla typów zwracanych
4. **Grupuj zapytania** według funkcjonalności
5. **Dokumentuj** nowe zapytania w komentarzach
6. **Testuj** nowe zapytania przed commitem
7. **Kopiuj wzorce** z istniejących zapytań dla konsystencji
8. **Wybierz odpowiednią strategię cache** dla typu danych
9. **Dodawaj indeksy** do schematów Sanity dla lepszej wydajności
10. **Używaj `readOnlyClient`** dla zapytań tylko do odczytu

## 🔄 Migracja z starych funkcji

Stare funkcje z `lib/sanity.ts` są nadal dostępne jako re-exporty dla kompatybilności wstecznej:

```typescript
// Stary sposób (nadal działa)
import { getLatestArticles } from "@/lib/sanity";

// Nowy sposób (zalecany)
import { getLatestPosts } from "@/lib/queries/functions";
```

## 📝 Notatki

- Wszystkie funkcje mają wbudowaną obsługę błędów
- Funkcje zwracają `null` lub puste tablice w przypadku błędu
- Zapytania są zoptymalizowane pod kątem wydajności
- Zapytania są kompletne i gotowe do użycia
- Struktura jest prosta i łatwa w utrzymaniu
