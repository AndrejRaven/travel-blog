// Pary kolorów dla light i dark theme
export const themeColors = {
  // Tła sekcji
  background: {
    light: '#f8fafc', // szary bardzo jasny
    dark: '#0f172a',  // szary bardzo ciemny
  },
  
  // Tła kart/komponentów
  card: {
    light: '#ffffff', // biały
    dark: '#1e293b',  // szary ciemny
  },
  
  // Tła akcentów
  accent: {
    light: '#f1f5f9', // szary jasny
    dark: '#334155',  // szary średni
  },
  
  // Tła hero bannerów
  hero: {
    light: '#f8fafc', // szary bardzo jasny
    dark: '#0f172a',  // szary bardzo ciemny
  },
  
  // Tła przycisków
  button: {
    light: '#f8fafc', // szary bardzo jasny
    dark: '#1e293b',  // szary ciemny
  },
  
  // Tła nawigacji
  navigation: {
    light: '#ffffff', // biały
    dark: '#0f172a',  // szary bardzo ciemny
  },
} as const;

// Funkcja do pobierania koloru na podstawie theme
export function getThemeColor(
  colorKey: keyof typeof themeColors,
  theme: 'light' | 'dark'
): string {
  return themeColors[colorKey][theme];
}

// Funkcja do generowania CSS custom properties
export function generateThemeCSS(theme: 'light' | 'dark'): Record<string, string> {
  const css: Record<string, string> = {};
  
  Object.entries(themeColors).forEach(([key, colors]) => {
    css[`--color-${key}`] = colors[theme];
  });
  
  return css;
}

// Predefiniowane pary kolorów dla różnych komponentów
export const componentColors = {
  heroBanner: {
    light: themeColors.hero.light,
    dark: themeColors.hero.dark,
  },
  section: {
    light: themeColors.background.light,
    dark: themeColors.background.dark,
  },
  card: {
    light: themeColors.card.light,
    dark: themeColors.card.dark,
  },
  navigation: {
    light: themeColors.navigation.light,
    dark: themeColors.navigation.dark,
  },
} as const;

// Helper funkcja do generowania CSS custom property
export function getThemeColorCSS(colorKey: keyof typeof themeColors): string {
  return `var(--color-${colorKey})`;
}

// Lista dostępnych kolorów theme (dla TypeScript i walidacji)
export const availableThemeColors: Array<keyof typeof themeColors> = [
  'background',
  'card', 
  'accent',
  'hero',
  'button',
  'navigation'
] as const;
