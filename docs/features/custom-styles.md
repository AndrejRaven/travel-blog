# Custom Style w Rich Text Editor

## ✅ Zaimplementowane funkcjonalności

Dodałem możliwość stylowania fragmentów tekstu w Rich Text Editorze poprzez custom marki!

## 🎨 Dostępne style

### Linki

- **🔗 Link Primary** - Niebieski link z hover effect
- **🔗 Link Secondary** - Szary link z hover effect

### Marginesy

- **📏 Margin Top** - Dodaje odstęp od góry (`mt-4`)
- **📏 Margin Bottom** - Dodaje odstęp od dołu (`mb-4`)

### Kolory tekstu

- **✨ Highlight** - Podświetlenie żółtym tłem
- **⚠️ Warning** - Pomarańczowy tekst
- **✅ Success** - Zielony tekst
- **❌ Error** - Czerwony tekst
- **💡 Info** - Niebieski tekst

## 🚀 Jak używać

### W Sanity Studio

1. **Otwórz pole Rich Text** w komponencie
2. **Zaznacz fragment tekstu** który chcesz stylować
3. **Kliknij ikonę 🎨** w toolbarze (Custom Style)
4. **Wybierz styl** z dropdown listy
5. **Zapisz** - styl zostanie zastosowany

### Przykład użycia

```
H1: Odkrywaj świat z nami
P: Krótki opis bloga z [✨ highlight] zachętą do eksploracji [/highlight].
P: [🔗 link-primary] Sprawdź nasze podróże [/link-primary] i [🔗 link-secondary] poznaj nas [/link-secondary].
P: [⚠️ warning] Uwaga: [/warning] Pamiętaj o ubezpieczeniu!
P: [✅ success] Sukces! [/success] Rezerwacja została potwierdzona.
```

## 🔧 Implementacja techniczna

### Schemat RichText

- Dodano `customStyle` annotation
- Dropdown z 9 predefiniowanymi stylami
- Ikony emoji dla lepszej identyfikacji

### Typy TypeScript

- `RichTextBlock.markDefs` obsługuje `customStyle` type
- Dodano `style` field z wszystkimi opcjami

### Komponent RichText

- Obsługa marki `customStyle-*`
- Funkcja `getCustomStyleClasses()` dla stylów
- Renderowanie jako `<span>` z odpowiednimi klasami CSS

### Zapytania Sanity

- Pobiera `style` dla custom style
- Obsługuje nowe marki w `markDefs`

## 🎯 Style CSS

### Link Primary

```css
text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium
```

### Link Secondary

```css
text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 font-medium
```

### Highlight

```css
bg-yellow-200 dark:bg-yellow-800 px-1 py-0.5 rounded
```

### Marginesy

```css
block mt-4  /* margin-top */
block mb-4  /* margin-bottom */
```

### Kolory

```css
text-orange-600 dark:text-orange-400 font-medium  /* warning */
text-green-600 dark:text-green-400 font-medium    /* success */
text-red-600 dark:text-red-400 font-medium        /* error */
text-blue-600 dark:text-blue-400 font-medium      /* info */
```

## 📝 Przykład danych

### W Sanity (Portable Text JSON)

```json
{
  "_type": "block",
  "children": [
    {
      "_type": "span",
      "text": "Przykładowy ",
      "marks": []
    },
    {
      "_type": "span",
      "text": "tekst",
      "marks": ["customStyle-abc123"]
    }
  ],
  "markDefs": [
    {
      "_type": "customStyle",
      "_key": "customStyle-abc123",
      "style": "highlight"
    }
  ]
}
```

### Na frontendzie (HTML)

```html
<p>
  Przykładowy
  <span class="bg-yellow-200 dark:bg-yellow-800 px-1 py-0.5 rounded"
    >tekst</span
  >
</p>
```

## 🚀 Korzyści

1. **Elastyczność** - Możliwość stylowania dowolnych fragmentów tekstu
2. **Spójność** - Predefiniowane style zapewniają jednolity wygląd
3. **Łatwość użycia** - Intuicyjny interfejs w Sanity Studio
4. **Responsywność** - Style dostosowują się do motywów (dark/light)
5. **Rozszerzalność** - Łatwe dodawanie nowych stylów

System jest gotowy do użycia! Teraz możesz stylować fragmenty tekstu w Rich Text Editorze! 🎉
