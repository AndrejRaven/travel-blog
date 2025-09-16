# ImageCollage - Przykłady użycia

## Opis komponentu

`ImageCollage` to komponent do wyświetlania kolażu zdjęć z jednym dużym zdjęciem na górze i 2-4 miniaturkami na dole. Po kliknięciu na zdjęcie otwiera się modal z pełnym podglądem.

## Funkcjonalności

- **Responsywny design** - dostosowuje się do różnych rozmiarów ekranu
- **Modal z podglądem** - pełnoekranowy podgląd zdjęć z nawigacją
- **Animacje** - płynne przejścia i hover effects
- **Nawigacja klawiatury** - strzałki, Escape do zamykania
- **Intersection Observer** - animacja pojawiania się przy przewijaniu
- **Konfigurowalny layout** - różne szerokości i liczby miniatur

## Konfiguracja w Sanity

```typescript
// Schemat imageCollage
{
  _type: 'imageCollage',
  _key: 'unique-key',
  images: [
    {
      asset: { _id: 'image-id', url: 'image-url' },
      alt: 'Opis zdjęcia'
    },
    // ... więcej zdjęć (2-5 łącznie)
  ],
  layout: {
    maxWidth: '4xl', // sm, md, lg, xl, 2xl, 4xl, 6xl, full
    thumbnailCount: 3 // 2, 3, 4
  }
}
```

## Użycie w ComponentRenderer

Komponent jest automatycznie renderowany przez `ComponentRenderer` gdy w danych posta znajdzie się komponent typu `imageCollage`.

## Stylowanie

Komponent używa Tailwind CSS z klasami `dark:` dla motywów:

- **Główne zdjęcie**: `h-64 md:h-80 lg:h-96 xl:h-[28rem]`
- **Miniaturki**: `aspect-square` z responsywną siatką
- **Hover effects**: `group-hover:scale-105` i `group-hover:bg-black/20`
- **Modal**: `fixed inset-0 z-50` z `bg-black/90 backdrop-blur-sm`

## Animacje

- **Pojawianie się**: `opacity-0 translate-y-8` → `opacity-100 translate-y-0`
- **Hover na zdjęciach**: `scale-100` → `scale-105`
- **Modal**: `scale-95 opacity-0` → `scale-100 opacity-100`

## Dostępność

- **Alt text** dla wszystkich zdjęć
- **Aria labels** dla przycisków nawigacji
- **Keyboard navigation** (strzałki, Escape)
- **Focus management** w modalu

## Przykład użycia w poście

```typescript
// W danych posta z Sanity
{
  _type: 'post',
  title: 'Nasza podróż do Włoch',
  components: [
    {
      _type: 'imageCollage',
      _key: 'italy-photos',
      images: [
        { asset: { _id: 'main-photo', url: '...' }, alt: 'Główne zdjęcie z Rzymu' },
        { asset: { _id: 'thumb1', url: '...' }, alt: 'Koloseum' },
        { asset: { _id: 'thumb2', url: '...' }, alt: 'Fontanna di Trevi' },
        { asset: { _id: 'thumb3', url: '...' }, alt: 'Panteon' }
      ],
      layout: {
        maxWidth: '4xl',
        thumbnailCount: 3
      }
    }
  ]
}
```

## Responsywność

- **Mobile**: 1 kolumna dla miniatur, mniejsza wysokość głównego zdjęcia
- **Tablet**: 2-3 kolumny dla miniatur
- **Desktop**: 3-4 kolumny dla miniatur, większa wysokość głównego zdjęcia

## Optymalizacja obrazów

Komponent używa Next.js `Image` z:

- `sizes` dla responsywności
- `priority` dla pierwszego zdjęcia w modalu
- `object-cover` dla głównego zdjęcia
- `object-contain` dla zdjęć w modalu
