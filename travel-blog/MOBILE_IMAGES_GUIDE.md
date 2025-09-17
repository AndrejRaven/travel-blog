# Przewodnik - Różne obrazki dla Mobile i Desktop

## Opis funkcjonalności

Komponenty `HeroBanner` i `BackgroundHeroBanner` teraz obsługują różne obrazki dla urządzeń mobilnych i desktopowych.

## Jak to działa

### 1. W Sanity CMS

- **Obraz (desktop)** - obowiązkowy, wyświetlany na desktop i jako fallback na mobile
- **Obraz (mobile)** - opcjonalny, wyświetlany tylko na mobile (jeśli nie zostanie wybrany, używany jest obraz desktop)

### 2. Logika wyboru obrazka

```typescript
const getCurrentImage = () => {
  if (isMobile && data.mobileImage) {
    return data.mobileImage; // Użyj obrazka mobile jeśli istnieje
  }
  return data.image; // W przeciwnym razie użyj obrazka desktop
};
```

### 3. Breakpoint

- Mobile: `window.innerWidth < 1024px` (poniżej lg breakpoint Tailwind)
- Desktop: `window.innerWidth >= 1024px` (lg i wyżej)

## Przykład użycia

### W Sanity Studio

1. Dodaj **Obraz (desktop)** - będzie widoczny na dużych ekranach
2. Opcjonalnie dodaj **Obraz (mobile)** - będzie widoczny na małych ekranach
3. Jeśli nie dodasz obrazka mobile, będzie używany obrazek desktop

### W kodzie

```tsx
// Komponenty automatycznie wybierają odpowiedni obrazek
<HeroBanner data={heroData} />
<BackgroundHeroBanner data={backgroundData} />
```

## Zalety

- **Responsywność** - różne obrazki dla różnych urządzeń
- **Wydajność** - możliwość użycia mniejszych obrazków na mobile
- **Elastyczność** - opcjonalne pole, nie wymusza dodawania obrazka mobile
- **Fallback** - jeśli nie ma obrazka mobile, używa desktop
- **Automatyczne przełączanie** - reaguje na zmianę rozmiaru okna

## Kompatybilność wsteczna

Istniejące komponenty bez obrazka mobile będą działać bez zmian - po prostu będą używać obrazka desktop na wszystkich urządzeniach.
