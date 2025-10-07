# Migracje Sanity Studio

Ten folder zawiera migracje dla schematu i treści w Sanity Studio.

## Dostępne migracje

### 1. add-inner-margin-default

**Opis:** Dodaje domyślną wartość "none" dla pola `innerMargin` w `baseContainer` dla konkretnych typów dokumentów (homepage, post, category).

**Użycie:**

```bash
# Test (dry run)
sanity migration run add-inner-margin-default

# Wykonaj migrację
sanity migration run add-inner-margin-default --no-dry-run
```

### 2. add-inner-margin-simple

**Opis:** Uniwersalna migracja dodająca domyślną wartość "none" dla pola `innerMargin` we wszystkich obiektach `baseContainer` w całym dataset.

**Użycie:**

```bash
# Test (dry run)
sanity migration run add-inner-margin-simple

# Wykonaj migrację
sanity migration run add-inner-margin-simple --no-dry-run
```

## Jak uruchomić migrację

1. **Zawsze najpierw zrób backup:**

   ```bash
   sanity dataset export
   ```

2. **Sprawdź dostępne migracje:**

   ```bash
   sanity migration list
   ```

3. **Uruchom test (dry run):**

   ```bash
   sanity migration run [nazwa-migracji]
   ```

4. **Jeśli test wygląda dobrze, wykonaj migrację:**
   ```bash
   sanity migration run [nazwa-migracji] --no-dry-run
   ```

## Co robi migracja innerMargin

Pole `innerMargin` zostało dodane do schematu `baseContainer` z domyślną wartością "none". Jednak istniejące dokumenty mogą mieć puste pola `innerMargin` w obiektach `container`.

Migracja:

- Znajduje wszystkie obiekty `baseContainer` w dataset
- Sprawdza czy pole `innerMargin` jest puste (undefined, null, lub pusty string)
- Ustawia wartość "none" dla pustych pól

## Komponenty dotknięte migracją

Migracja wpłynie na wszystkie komponenty używające `baseContainer`:

- heroBanner
- backgroundHeroBanner
- newsletter
- textContent
- embedYoutube
- articles
- aboutUs
- categoriesSection
- instagramSection
- youtubeChannel
- imageCollage
- supportSection

## Bezpieczeństwo

- Migracja jest bezpieczna - nie usuwa istniejących wartości
- Używa `setIfMissing` - ustawia wartość tylko jeśli pole jest puste
- Zawsze testuj w trybie dry-run przed wykonaniem
