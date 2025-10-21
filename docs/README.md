# Dokumentacja projektu Nasz Blog

## 📚 Przegląd dokumentacji

Ta dokumentacja zawiera wszystkie informacje potrzebne do zrozumienia, rozwoju i utrzymania projektu Nasz Blog.

## 🗂️ Struktura dokumentacji

### Funkcjonalności (`/features/`)

- **[System komentarzy](features/comments-system.md)** - Kompletna dokumentacja systemu komentarzy z moderacją
- **[Custom Style w Rich Text](features/custom-styles.md)** - Jak używać niestandardowych stylów w edytorze tekstu

### Implementacja (`/implementation.md`)

- **[Implementacja systemu komponentów](implementation.md)** - Szczegóły implementacji komponentów Sanity CMS
- **[System menu](implementation.md#podsumowanie-implementacji-nowego-systemu-menu)** - Nowy wielopoziomowy system nawigacji

### Testowanie (`/testing/`)

- **[Testowanie funkcji udostępniania](testing/share-testing.md)** - Jak przetestować funkcje udostępniania artykułów

### Studio (`/studio/`)

- **[Komponenty Sanity](studio/components.md)** - Dokumentacja komponentów dostępnych w Sanity Studio
- **[Przewodnik menu](studio/menu-guide.md)** - Instrukcje importu i zarządzania menu

## 🚀 Szybki start

### Dla deweloperów

1. Przeczytaj [implementację systemu komponentów](implementation.md)
2. Zapoznaj się z [systemem komentarzy](features/comments-system.md)
3. Sprawdź [komponenty Sanity](studio/components.md)

### Dla administratorów

1. Przeczytaj [przewodnik menu](studio/menu-guide.md)
2. Zapoznaj się z [systemem komentarzy](features/comments-system.md)
3. Sprawdź [testowanie funkcji](testing/share-testing.md)

## 📝 Reguły projektu

Projekt używa następujących zasad:

- **Tailwind CSS** z klasą `dark:` do zarządzania motywami
- **Lucide React** dla wszystkich ikon (bez wrapper'ów)
- **Sanity CMS** jako headless CMS
- **Next.js 15** z App Router
- **TypeScript** dla wszystkich plików

## 🔧 Struktura projektu

```
nasz-blog/
├── docs/                    # Dokumentacja
├── studio/                  # Sanity Studio
├── travel-blog/            # Frontend Next.js
│   ├── app/               # Strony i API
│   ├── components/        # Komponenty React
│   └── lib/              # Logika biznesowa
```

## 📞 Wsparcie

Jeśli masz pytania dotyczące projektu:

1. Sprawdź odpowiednią dokumentację powyżej
2. Przejrzyj kod w odpowiednim folderze
3. Skontaktuj się z zespołem deweloperskim

---

_Ostatnia aktualizacja: $(date)_
