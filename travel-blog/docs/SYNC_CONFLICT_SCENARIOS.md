# Scenariusze synchronizacji i konfliktów – Portfel podróżniczy

Dokument opisuje scenariusze sync (lokal ↔ Supabase) oraz konfliktów do testów ręcznych i E2E.

## Źródło prawdy i flow

- **Źródło prawdy:** localStorage. Lista podróży zawsze czyta z localStorage.
- **Merge:** jedna logika LWW w `lib/travel-wallet/sync/trip-merge.ts` – używana przy logowaniu (`migrateTripsFromSupabaseToLocal`) i w tle (`syncFromSupabaseInBackground`).
- **Konflikty:** gdy ta sama podróż (po slugu) ma różne `updatedAt` lokalnie i zdalnie, sync zwraca konflikt i zapisuje go w sessionStorage; UI pokazuje ConflictResolver (wybór: wersja z urządzenia / z chmury).

---

## Scenariusze do weryfikacji

### 1. Gość → logowanie (pull + push)

| Kroki | Oczekiwany wynik |
|-------|-------------------|
| Gość tworzy 1 podróż (np. „Wakacje”), potem loguje się | Po migracji ta podróż jest w chmurze (lub toast o limicie). Lista pokazuje podróż. |
| Gość ma 0 podróży, w chmurze jest 1 podróż | Po logowaniu lista pokazuje 1 podróż (ściągniętą z chmury). |

### 2. Konflikt po slugu (ta sama podróż, różna treść)

| Kroki | Oczekiwany wynik |
|-------|-------------------|
| Lokalna „Wakacje” (np. budżet 1000), chmura „Wakacje” (budżet 2000), obie zmodyfikowane | Sync wykrywa konflikt; pojawia się ConflictResolver. Po wyborze „lokalna” lub „zdalna” zapis w localStorage i (opcjonalnie) push. |
| Użytkownik zamyka ConflictResolver (X) | Konflikt jest pomijany (pozostaje wersja lokalna), modal znika. |

### 3. Limit tieru (np. 1 podróż na free)

| Kroki | Oczekiwany wynik |
|-------|-------------------|
| Lokalnie 3 podróże, konto free (limit 1) | Po logowaniu: toast o limicie; 1 podróż w chmurze, 2 tylko lokalnie. Lista pokazuje wszystkie 3; przy 2 podróżach niezsynchronizowanych badge „Tylko na tym urządzeniu”. |

### 4. Dwa urządzenia (ta sama podróż)

| Kroki | Oczekiwany wynik |
|-------|-------------------|
| Urządzenie A: edycja podróży X. Urządzenie B: inna edycja X. Sync na A | Wykrycie konfliktu lub LWW; nie ma cichej utraty danych bez informacji (toast / ConflictResolver). |

### 5. Usunięcie – błąd delete w Supabase

| Kroki | Oczekiwany wynik |
|-------|-------------------|
| Użytkownik usunął podróż lokalnie, delete do Supabase się nie udał | Przy kolejnym pull podróż z chmury nie wraca na listę (`failedDeleteSlugs`). |

### 6. Nowa podróż tylko w chmurze

| Kroki | Oczekiwany wynik |
|-------|-------------------|
| Podróż utworzona na innym urządzeniu (tylko w Supabase) | Pull / migrate dodaje ją do localStorage; lista pokazuje ją. |

### 7. Offline → online

| Kroki | Oczekiwany wynik |
|-------|-------------------|
| Wiele zmian offline, potem powrót online | Background sync; przy konflikcie ConflictResolver lub LWW z możliwością informacji (toast). |

---

## Powiązane pliki

- Merge: `lib/travel-wallet/sync/trip-merge.ts`
- Sync w tle: `lib/travel-wallet/trips-storage.ts` (`syncFromSupabaseInBackground`)
- Migracja przy logowaniu: `lib/supabase/sync-helpers.ts` (`migrateTripsFromSupabaseToLocal`, `migrateTripsToSupabase`)
- Pending conflicts: `lib/travel-wallet/sync/sync-cache.ts` (`getPendingConflicts`, `setPendingConflicts`)
- UI: `components/ui/ConflictResolver.tsx`, `app/portfel-podrozniczy/TripsListClient.tsx`, `components/pages/TripsList.tsx` (badge „Tylko na tym urządzeniu”)
