# Przykłady użycia fontów w projekcie

## Dostępne fonty

### 1. Inter (`font-sans`) - Font główny

- **Zastosowanie**: Tekst główny, interfejs użytkownika, przyciski, nawigacja
- **Charakterystyka**: Nowoczesny, czytelny, doskonały do długich tekstów

### 2. Playfair Display (`font-serif`) - Font dla nagłówków

- **Zastosowanie**: Tytuły, nagłówki, wyróżnienia, eleganckie elementy
- **Charakterystyka**: Elegancki, z charakterem, idealny do tytułów blogowych

### 3. Source Code Pro (`font-mono`) - Font monospace

- **Zastosowanie**: Kod, preformatowany tekst, wartości techniczne
- **Charakterystyka**: Monospace, czytelny dla kodu

## Przykłady użycia

### Nagłówki blogowe

```tsx
// Główny tytuł artykułu
<h1 className="text-4xl md:text-6xl font-serif font-bold mb-6">
  Nasze podróże po Europie
</h1>

// Podtytuł sekcji
<h2 className="text-2xl md:text-3xl font-serif font-semibold mb-4">
  Odkrywanie Włoch
</h2>

// Nagłówek sekcji
<h3 className="text-xl md:text-2xl font-serif font-medium mb-3">
  Rzym - Wieczne Miasto
</h3>
```

### Tekst główny

```tsx
// Paragraf główny
<p className="text-lg font-sans leading-relaxed mb-6">
  Nasza podróż do Rzymu była niezapomnianym doświadczeniem...
</p>

// Tekst w nawigacji
<nav className="font-sans">
  <a href="/o-nas" className="font-medium">O nas</a>
</nav>

// Tekst w przyciskach
<button className="px-6 py-3 font-sans font-medium">
  Czytaj więcej
</button>
```

### Kod i wartości techniczne

```tsx
// Blok kodu
<pre className="font-mono text-sm bg-gray-100 p-4 rounded">
  <code>const blogPost = { title: "Nasze podróże" }</code>
</pre>

// Wartości techniczne
<span className="font-mono text-sm">2024-01-15</span>
```

### Kombinacje fontów

```tsx
// Karta artykułu
<article className="bg-white rounded-lg shadow-md p-6">
  <h2 className="text-2xl font-serif font-bold mb-3">Tytuł artykułu</h2>
  <p className="text-gray-600 font-sans leading-relaxed mb-4">
    Opis artykułu...
  </p>
  <div className="flex items-center justify-between">
    <span className="text-sm font-mono text-gray-500">2024-01-15</span>
    <button className="px-4 py-2 font-sans font-medium">Czytaj</button>
  </div>
</article>
```

## Zasady użycia

1. **Nagłówki**: Zawsze używaj `font-serif` (Playfair Display)
2. **Tekst główny**: Zawsze używaj `font-sans` (Inter)
3. **Kod**: Zawsze używaj `font-mono` (Source Code Pro)
4. **Konsystencja**: Używaj tych samych fontów w całym projekcie
5. **Responsywność**: Fonty automatycznie skalują się na różnych urządzeniach

## Klasy Tailwind

- `font-sans` - Inter (główny font)
- `font-serif` - Playfair Display (nagłówki)
- `font-mono` - Source Code Pro (kod)

## Właściwości CSS

Fonty są dostępne jako CSS custom properties:

- `--font-inter` - Inter
- `--font-playfair` - Playfair Display
- `--font-source-code` - Source Code Pro
