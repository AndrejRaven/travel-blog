# TableOfContents - Komponent Spisu Treści

## Opis

Komponent `TableOfContents` tworzy interaktywny spis treści z płynnym przewijaniem do sekcji. Wyświetla się jako przycisk po lewej stronie ekranu i rozwija się w panel boczny.

## Wymagania

- Wszystkie sekcje muszą mieć unikalne ID generowane przez `generateSectionId()`
- Komponenty muszą używać `SectionContainer` lub mieć własną implementację ID
- ID musi być generowane na podstawie `contentTitle` z kontenera

## Użycie

### Podstawowe użycie

```tsx
import TableOfContents from "@/components/ui/TableOfContents";

const tableOfContentsItems = [
  { id: "wprowadzenie", title: "Wprowadzenie", level: 1 },
  { id: "rozdzial-1", title: "Rozdział 1", level: 1 },
  { id: "podrozdzial-1-1", title: "Podrozdział 1.1", level: 2 },
];

<TableOfContents
  items={tableOfContentsItems}
  onToggle={(isOpen) => console.log("Spis treści:", isOpen)}
/>;
```

### Z generowaniem ID z Sanity CMS

```tsx
// W page.tsx
const generateTableOfContents = () => {
  if (!post.components) return [];

  const generateId = (title: string) => {
    return (
      title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/^-+|-+$/g, "")
        .replace(/^-/, "section-")
        .trim() || "section"
    );
  };

  return post.components
    .filter(
      (component) =>
        component.container?.contentTitle &&
        component.container.contentTitle.trim() !== ""
    )
    .map((component) => ({
      id: generateId(component.container.contentTitle),
      title: component.container.contentTitle,
      level: 1,
    }));
};
```

## Props

### `items: TableOfContentsItem[]`

Tablica elementów spisu treści.

```tsx
interface TableOfContentsItem {
  id: string; // Unikalne ID sekcji (musi odpowiadać ID w DOM)
  title: string; // Tytuł sekcji wyświetlany w spisie
  level: number; // Poziom zagnieżdżenia (1, 2, 3...)
}
```

### `className?: string`

Dodatkowe klasy CSS dla kontenera.

### `onToggle?: (isOpen: boolean) => void`

Callback wywoływany przy otwieraniu/zamykaniu spisu treści.

## Funkcjonalności

### Przewijanie

- **Płynne przewijanie** do wybranej sekcji
- **Automatyczne obliczanie offsetu** dla header
- **Responsywność** - różne zachowanie na mobile i desktop
- **Fallback** dla ujemnych pozycji

### Obserwowanie sekcji

- **Intersection Observer** do śledzenia aktywnej sekcji
- **Automatyczne podświetlanie** aktualnie widocznej sekcji
- **Responsywny rootMargin** dla lepszej detekcji

### UI/UX

- **Fixed positioning** - przycisk zawsze widoczny
- **Smooth animations** - płynne przejścia
- **Keyboard navigation** - obsługa klawiatury
- **Touch friendly** - optymalizacja dla urządzeń dotykowych

## Wymagania dla komponentów

### Komponenty z SectionContainer

```tsx
// ✅ Automatycznie działa
<SectionContainer config={container}>
  <div>Treść sekcji</div>
</SectionContainer>
```

### Komponenty bez SectionContainer

```tsx
// ✅ Wymaga ręcznego dodania ID
import { generateSectionId } from "@/lib/section-utils";

const sectionId = container.contentTitle
  ? generateSectionId(container.contentTitle)
  : undefined;

return <div id={sectionId}>{/* Treść sekcji */}</div>;
```

## Stylowanie

### Motywy

Komponent automatycznie obsługuje motywy ciemny/jasny:

- `bg-white dark:bg-gray-800` - tło panelu
- `text-gray-900 dark:text-gray-100` - tekst główny
- `border-gray-200 dark:border-gray-700` - ramki

### Responsywność

- **Mobile**: Panel na pełną szerokość z overlay
- **Desktop**: Panel boczny 320px z marginesem dla treści
- **Breakpoint**: 1024px (lg)

### Pozycjonowanie

- **Przycisk**: `fixed top-20 left-4` (mobile: `left-6`)
- **Panel**: `fixed left-0 top-20` z `w-80`
- **Z-index**: `z-50` (panel), `z-40` (overlay)

## Przykłady implementacji

### W PostPageClient

```tsx
export default function PostPageClient({ post, tableOfContentsItems }) {
  const [isTocOpen, setIsTocOpen] = useState(false);

  return (
    <main
      className={`relative transition-all duration-300 ${
        isTocOpen ? "lg:ml-80" : ""
      }`}
    >
      {tableOfContentsItems.length > 0 && (
        <TableOfContents items={tableOfContentsItems} onToggle={setIsTocOpen} />
      )}
      {/* Treść postu */}
    </main>
  );
}
```

### W page.tsx

```tsx
export default async function PostPage({ params }) {
  const post = await getPost(slug);

  const tableOfContentsItems = generateTableOfContents();

  return (
    <PostPageClient post={post} tableOfContentsItems={tableOfContentsItems} />
  );
}
```

## Rozwiązywanie problemów

### Element nie znaleziony

- Sprawdź czy komponent ma `id` w DOM
- Upewnij się, że `generateSectionId()` zwraca to samo ID
- Sprawdź czy element jest renderowany po załadowaniu

### Nieprawidłowe przewijanie

- Sprawdź wysokość header w logach
- Upewnij się, że element ma prawidłową pozycję
- Sprawdź czy nie ma konfliktów z innymi stylami

### Brak aktywnej sekcji

- Sprawdź czy `IntersectionObserver` działa
- Upewnij się, że `rootMargin` jest odpowiedni
- Sprawdź czy sekcje mają odpowiednie ID

## Zależności

- `lucide-react` - ikony (List, X, ChevronRight)
- `@/lib/section-utils` - `generateSectionId()`
- Tailwind CSS - stylowanie
