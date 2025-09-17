/**
 * Ujednolicony system animacji dla komponentów sections
 * 
 * Zasady:
 * - Wszystkie animacje używają spójnych czasów trwania
 * - Opóźnienia są progresywne (100ms, 200ms, 300ms, 400ms, 500ms)
 * - Transformacje są spójne (translate-y-8, scale-95)
 * - Easing jest spójny (ease-out)
 */

// Podstawowe klasy animacji
export const ANIMATION_CLASSES = {
  // Główne animacje (dla elementów wchodzących w viewport)
  main: "transition-all duration-1000 ease-out",
  
  // Animacje hover (dla interakcji)
  hover: "transition-all duration-300 ease-out",
  
  // Animacje szybkie (dla UI elements)
  fast: "transition-all duration-200 ease-out",
  
  // Animacje wolne (dla specjalnych efektów)
  slow: "transition-all duration-700 ease-out",
} as const;

// Stany animacji
export const ANIMATION_STATES = {
  // Stan początkowy (przed wejściem w viewport)
  initial: "opacity-0 translate-y-8",
  
  // Stan końcowy (po wejściu w viewport)
  visible: "opacity-100 translate-y-0",
  
  // Stan z skalą (dla elementów z efektem scale)
  initialWithScale: "opacity-0 translate-y-8 scale-95",
  visibleWithScale: "opacity-100 translate-y-0 scale-100",
  
  // Stan z translate-x (dla elementów z boku)
  initialX: "opacity-0 translate-x-8",
  visibleX: "opacity-100 translate-x-0",
  
  // Stan z translate-y mniejszym (dla subtelnych animacji)
  initialSubtle: "opacity-0 translate-y-4",
  visibleSubtle: "opacity-100 translate-y-0",
} as const;

// Opóźnienia animacji (w ms)
export const ANIMATION_DELAYS = {
  none: 0,
  short: 100,
  medium: 200,
  long: 300,
  longer: 400,
  longest: 500,
} as const;

// Klasy opóźnień Tailwind
export const ANIMATION_DELAY_CLASSES = {
  none: "",
  short: "delay-100",
  medium: "delay-200", 
  long: "delay-300",
  longer: "delay-400",
  longest: "delay-500",
} as const;

// Hover efekty
export const HOVER_EFFECTS = {
  // Podstawowy hover (scale + shadow)
  basic: "hover:scale-105 hover:shadow-lg",
  
  // Hover z większą skalą
  scale: "hover:scale-110",
  
  // Hover z cieniem
  shadow: "hover:shadow-lg",
  
  // Hover z opacity
  opacity: "hover:opacity-100",
  
  // Hover z transform
  transform: "hover:scale-105",
} as const;

// Funkcje pomocnicze do tworzenia klas animacji
export const createAnimationClass = (
  baseClass: string = ANIMATION_CLASSES.main,
  state: keyof typeof ANIMATION_STATES = "initial",
  delay: keyof typeof ANIMATION_DELAY_CLASSES = "none",
  hoverEffect: keyof typeof HOVER_EFFECTS = "basic"
) => {
  const delayClass = ANIMATION_DELAY_CLASSES[delay];
  const hoverClass = HOVER_EFFECTS[hoverEffect];
  
  return `${baseClass} ${ANIMATION_STATES[state]} ${delayClass} ${hoverClass}`.trim();
};

// Funkcja do tworzenia warunkowych klas animacji
export const createConditionalAnimationClass = (
  isVisible: boolean,
  baseClass: string = ANIMATION_CLASSES.main,
  state: keyof typeof ANIMATION_STATES = "initial",
  delay: keyof typeof ANIMATION_DELAY_CLASSES = "none",
  hoverEffect: keyof typeof HOVER_EFFECTS = "basic"
) => {
  const delayClass = ANIMATION_DELAY_CLASSES[delay];
  const hoverClass = HOVER_EFFECTS[hoverEffect];
  const stateClass = isVisible ? 
    (state.includes("visible") ? ANIMATION_STATES[state] : ANIMATION_STATES[state.replace("initial", "visible")]) :
    (state.includes("initial") ? ANIMATION_STATES[state] : ANIMATION_STATES[state.replace("visible", "initial")]);
  
  return `${baseClass} ${stateClass} ${delayClass} ${hoverClass}`.trim();
};

// Predefiniowane kombinacje dla typowych przypadków
export const ANIMATION_PRESETS = {
  // Nagłówek sekcji
  sectionHeader: (isVisible: boolean) => 
    createConditionalAnimationClass(isVisible, ANIMATION_CLASSES.main, "initial", "none", "none"),
  
  // Elementy listy (z progresywnym opóźnieniem)
  listItem: (isVisible: boolean, index: number) => {
    const delay = index === 0 ? "none" : 
                  index === 1 ? "short" : 
                  index === 2 ? "medium" : 
                  index === 3 ? "long" : "longer";
    return createConditionalAnimationClass(isVisible, ANIMATION_CLASSES.main, "initial", delay, "basic");
  },
  
  // Obrazy z efektem scale
  image: (isVisible: boolean, delay: keyof typeof ANIMATION_DELAY_CLASSES = "medium") =>
    createConditionalAnimationClass(isVisible, ANIMATION_CLASSES.main, "initialWithScale", delay, "transform"),
  
  // Przyciski
  button: (isVisible: boolean, delay: keyof typeof ANIMATION_DELAY_CLASSES = "long") =>
    createConditionalAnimationClass(isVisible, ANIMATION_CLASSES.main, "initial", delay, "basic"),
  
  // Tekst
  text: (isVisible: boolean, delay: keyof typeof ANIMATION_DELAY_CLASSES = "medium") =>
    createConditionalAnimationClass(isVisible, ANIMATION_CLASSES.main, "initial", delay, "none"),
  
  // Elementy z boku (translate-x)
  sideElement: (isVisible: boolean, delay: keyof typeof ANIMATION_DELAY_CLASSES = "medium") =>
    createConditionalAnimationClass(isVisible, ANIMATION_CLASSES.main, "initialX", delay, "basic"),
  
  // Subtelne animacje
  subtle: (isVisible: boolean, delay: keyof typeof ANIMATION_DELAY_CLASSES = "short") =>
    createConditionalAnimationClass(isVisible, ANIMATION_CLASSES.main, "initialSubtle", delay, "none"),
} as const;

// Funkcja do tworzenia stylów inline dla opóźnień
export const createDelayStyle = (delay: number) => ({
  transitionDelay: `${delay}ms`,
});

// Funkcja do tworzenia stylów inline dla opóźnień progresywnych
export const createProgressiveDelayStyle = (index: number, baseDelay: number = 100) => ({
  transitionDelay: `${baseDelay + (index * 100)}ms`,
});

// Eksport typów dla TypeScript
export type AnimationClass = keyof typeof ANIMATION_CLASSES;
export type AnimationState = keyof typeof ANIMATION_STATES;
export type AnimationDelay = keyof typeof ANIMATION_DELAYS;
export type HoverEffect = keyof typeof HOVER_EFFECTS;
export type AnimationPreset = keyof typeof ANIMATION_PRESETS;
