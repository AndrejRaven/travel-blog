# 🚀 Przewodnik importu menu do Sanity Studio

## Sposoby importu menu bez pisania ręcznego

### 1. 🎯 Najłatwiejszy sposób - Użyj gotowego pliku JSON

Masz już przygotowany plik `menu-structure-example.json` z kompletną strukturą menu. Możesz go skopiować bezpośrednio do Sanity Studio:

1. **Otwórz Sanity Studio**: `npm run dev`
2. **Przejdź do "Header Navigation"**
3. **Skopiuj zawartość** z `menu-structure-example.json`
4. **Wklej do pola "Główne menu"** w Sanity Studio

### 2. 🔧 Automatyczny import przez skrypt

#### Krok 1: Zainstaluj zależności

```bash
cd studio
npm install @sanity/client
```

#### Krok 2: Ustaw token Sanity

```bash
# Pobierz token z Sanity Studio (Settings > API > Tokens)
export SANITY_TOKEN="your-token-here"
```

#### Krok 3: Uruchom import

```bash
# Importuj gotowe menu
npm run menu:import

# Lub stwórz podstawowe menu
npm run menu:create
```

### 3. 📝 Edytuj menu w pliku JSON

Jeśli chcesz zmodyfikować menu przed importem:

1. **Edytuj plik** `menu-structure-example.json`
2. **Uruchom import**: `npm run menu:import`

### 4. 🔄 Eksport/Import cykliczny

```bash
# Eksportuj obecne menu z Sanity do pliku
npm run menu:export

# Edytuj plik JSON
# ...

# Importuj z powrotem do Sanity
npm run menu:import
```

## 📋 Struktura pliku JSON

```json
{
  "mainMenu": [
    {
      "label": "Podróże - świat",
      "hasDropdown": true,
      "dropdownSections": [
        {
          "title": "Podróże na własną rękę - porady",
          "emoji": "🧭",
          "items": [
            {
              "label": "Planowanie podróży",
              "href": "/poradniki/planowanie",
              "isExternal": false
            }
          ]
        }
      ]
    }
  ]
}
```

## 🎨 Dostosowanie menu

### Dodaj nowy element menu:

```json
{
  "label": "Nowa sekcja",
  "href": "/nowa-sekcja",
  "isExternal": false,
  "hasDropdown": false
}
```

### Dodaj dropdown z podmenu:

```json
{
  "label": "Menu z dropdown",
  "hasDropdown": true,
  "dropdownSections": [
    {
      "title": "Sekcja 1",
      "emoji": "🔥",
      "items": [
        {
          "label": "Element z podmenu",
          "href": "/element",
          "isExternal": false,
          "hasSubmenu": true,
          "submenuItems": [
            {
              "label": "Podmenu 1",
              "href": "/podmenu1",
              "isExternal": false
            }
          ]
        }
      ]
    }
  ]
}
```

## 🚨 Rozwiązywanie problemów

### Problem: "Nie znaleziono dokumentu header"

**Rozwiązanie**: Upewnij się, że masz utworzony dokument "Header Navigation" w Sanity Studio

### Problem: "Błąd autoryzacji"

**Rozwiązanie**: Sprawdź czy token Sanity jest poprawny i ma odpowiednie uprawnienia

### Problem: "Menu nie wyświetla się"

**Rozwiązanie**:

1. Sprawdź czy `mainMenu` nie jest puste
2. Uruchom `npm run menu:export` żeby sprawdzić co jest w Sanity
3. Sprawdź konsolę przeglądarki pod kątem błędów

## 🎯 Gotowe do użycia!

Po imporcie menu będzie automatycznie wyświetlane na stronie z pełną obsługą:

- ✅ Dropdownów na hover (desktop)
- ✅ Rozwijanych sekcji (mobile)
- ✅ Linków zewnętrznych
- ✅ Motywów (jasny/ciemny)
- ✅ Responsywności

## 📞 Wsparcie

Jeśli masz problemy:

1. Sprawdź logi w konsoli
2. Upewnij się, że token Sanity jest poprawny
3. Sprawdź czy dokument header istnieje w Sanity Studio
