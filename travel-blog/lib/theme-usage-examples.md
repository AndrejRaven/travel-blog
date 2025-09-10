# Przykłady użycia systemu kolorów theme

## Dostępne kolory

System zawiera następujące pary kolorów (tylko te można używać w HeroBanner):

- `background` - tła sekcji (#f8fafc / #0f172a)
- `card` - tła kart/komponentów (#ffffff / #1e293b)
- `accent` - tła akcentów (#f1f5f9 / #334155)
- `hero` - tła hero bannerów (#f8fafc / #0f172a)
- `button` - tła przycisków (#f8fafc / #1e293b)
- `navigation` - tła nawigacji (#ffffff / #0f172a)

## Typy TypeScript

```typescript
// Dostępne kolory theme dla hero bannerów
export type ThemeColorKey =
  | "background"
  | "card"
  | "accent"
  | "hero"
  | "button"
  | "navigation";

// W HeroBannerData
layout: {
  backgroundColor: ThemeColorKey; // Tylko z dostępnych kolorów!
}
```

## Sposoby użycia

### 1. CSS Custom Properties (Zalecane)

```tsx
// W komponencie React
<div style={{ backgroundColor: 'var(--color-hero)' }}>
  Hero Banner
</div>

<section style={{ backgroundColor: 'var(--color-background)' }}>
  Sekcja
</section>
```

### 2. Hook useTheme (JavaScript)

```tsx
import { useTheme } from "@/lib/use-theme";

function MyComponent() {
  const { getThemeColor } = useTheme();

  return (
    <div style={{ backgroundColor: getThemeColor("hero") }}>
      Dynamiczny kolor
    </div>
  );
}
```

### 3. Tailwind CSS z custom properties

```tsx
// W globals.css dodaj klasy:
.bg-theme-hero { background-color: var(--color-hero); }
.bg-theme-card { background-color: var(--color-card); }
.bg-theme-background { background-color: var(--color-background); }

// W komponencie:
<div className="bg-theme-hero">
  Hero Banner
</div>
```

## Przykłady implementacji

### Hero Banner (Nowy system)

```tsx
// W hero-test-data.ts
export const heroTestData: HeroBannerData = {
  // ... inne właściwości
  layout: {
    // ... inne właściwości layout
    backgroundColor: "hero", // Tylko z dostępnych ThemeColorKey!
  },
};

// W HeroBanner.tsx
<section
  style={{
    backgroundColor: getThemeColorCSS(layout.backgroundColor),
  }}
>
  {/* Zawartość */}
</section>;
```

### Przykłady różnych kolorów hero bannerów

```tsx
// Hero z tłem sekcji
const heroWithSectionBg = {
  ...heroTestData,
  layout: {
    ...heroTestData.layout,
    backgroundColor: "background" as ThemeColorKey,
  },
};

// Hero z tłem karty
const heroWithCardBg = {
  ...heroTestData,
  layout: {
    ...heroTestData.layout,
    backgroundColor: "card" as ThemeColorKey,
  },
};

// Hero z tłem akcentu
const heroWithAccentBg = {
  ...heroTestData,
  layout: {
    ...heroTestData.layout,
    backgroundColor: "accent" as ThemeColorKey,
  },
};
```

### Karty

```tsx
<div
  className="rounded-xl border p-5"
  style={{ backgroundColor: "var(--color-card)" }}
>
  {/* Zawartość karty */}
</div>
```

### Sekcje

```tsx
<section
  className="py-12"
  style={{ backgroundColor: "var(--color-background)" }}
>
  {/* Zawartość sekcji */}
</section>
```

## Dodawanie nowych kolorów

1. Dodaj nową parę do `theme-colors.ts`:

```ts
export const themeColors = {
  // ... istniejące kolory
  newColor: {
    light: "#ffffff",
    dark: "#000000",
  },
} as const;
```

2. Dodaj CSS custom property do `globals.css`:

```css
:root {
  --color-new-color: #ffffff;
}

.dark {
  --color-new-color: #000000;
}
```

3. Użyj w komponencie:

```tsx
<div style={{ backgroundColor: "var(--color-new-color)" }}>Nowy kolor</div>
```
