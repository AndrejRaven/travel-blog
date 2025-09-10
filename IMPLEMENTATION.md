# Implementacja Systemu Komponentów

## ✅ Co zostało zaimplementowane

### 1. Schematy Sanity

- **`button.ts`** - Schemat dla przycisków
- **`richText.ts`** - Schemat dla sformatowanego tekstu
- **`heroBanner.ts`** - Schemat dla komponentu HeroBanner
- **`backgroundHeroBanner.ts`** - Schemat dla komponentu BackgroundHeroBanner
- **`post.ts`** - Zmodyfikowany schemat posta z polem `components` zamiast `body`

### 2. Typy TypeScript

- **`component-types.ts`** - Wszystkie typy dla komponentów
- **`sanity.ts`** - Zaktualizowane typy dla postów
- **`hero-test-data.ts`** - Zaktualizowane dane testowe

### 3. Komponenty React

- **`ComponentRenderer.tsx`** - Komponent do renderowania komponentów z Sanity
- **`HeroBanner.tsx`** - Zaktualizowany do nowych typów
- **`BackgroundHeroBanner.tsx`** - Zaktualizowany do nowych typów
- **`RichText.tsx`** - Zaktualizowany do nowych typów

### 4. Strony

- **`app/post/[slug]/page.tsx`** - Zaktualizowana strona posta do obsługi komponentów

## 🔧 Jak to działa

### Tworzenie posta w Sanity

1. W Sanity Studio przejdź do sekcji "Posts"
2. Utwórz nowy post i wypełnij podstawowe pola
3. W sekcji "Komponenty" dodaj komponenty:
   - Hero Banner
   - Background Hero Banner
4. Skonfiguruj każdy komponent według potrzeb

### Renderowanie na stronie

1. Strona posta pobiera dane z Sanity z pełną strukturą komponentów
2. `ComponentRenderer` konwertuje dane z Sanity na format oczekiwany przez komponenty
3. Każdy komponent renderuje się z odpowiednimi danymi

### Logika wyświetlania

- Jeśli pierwszy komponent to baner (HeroBanner lub BackgroundHeroBanner), meta informacje (tytuł, data, okładka) nie są wyświetlane
- Jeśli nie ma komponentów lub pierwszy komponent nie jest banerem, wyświetlane są standardowe meta informacje
- Komponenty renderują się w kolejności dodania w Sanity

## 🚀 Następne kroki

### Dodawanie nowych komponentów

1. Stwórz schemat w `studio/schemas/`
2. Dodaj typ w `lib/component-types.ts`
3. Zaktualizuj `ComponentRenderer.tsx`
4. Dodaj schemat do `schemaTypes/index.ts`
5. Dodaj typ komponentu do tablicy `of` w schemacie post

### Przykład nowego komponentu

```typescript
// studio/schemas/carousel.ts
export default {
  name: 'carousel',
  type: 'object',
  title: 'Karuzele',
  fields: [
    // pola komponentu
  ],
}

// lib/component-types.ts
export type Carousel = {
  _type: 'carousel';
  _key: string;
  // pola komponentu
};

// components/ui/ComponentRenderer.tsx
case "carousel": {
  return <Carousel data={component} />;
}
```

## 📝 Uwagi techniczne

- Wszystkie komponenty używają systemu motywów z `lib/theme-colors.ts`
- Rich Text obsługuje formatowanie, linki i style
- Komponenty są responsywne i dostosowują się do różnych urządzeń
- System jest przygotowany na rozszerzenie o kolejne komponenty
