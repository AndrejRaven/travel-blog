# YouTube API - Przykłady użycia

## Server-side (EmbedYoutube)

Komponent `EmbedYoutube` działa po stronie serwera i automatycznie pobiera najnowszy film:

```tsx
import EmbedYoutube from "@/components/sections/EmbedYoutube";

// Użycie najnowszego filmu
<EmbedYoutube videoId="latest" />

// Użycie konkretnego filmu
<EmbedYoutube
  videoId="hqxze0KhTLk"
  title="Mój film"
  description="Opis filmu"
/>

// Automatyczne pobieranie najnowszego filmu z własnym tytułem
<EmbedYoutube
  videoId="latest"
  title="Nasz najnowszy film"
  description="Sprawdź co nowego na naszym kanale!"
/>
```

## Client-side (EmbedYoutubeClient)

Komponent `EmbedYoutubeClient` działa po stronie klienta z loading state:

```tsx
import EmbedYoutubeClient from "@/components/sections/EmbedYoutubeClient";

// Użycie najnowszego filmu z loading state
<EmbedYoutubeClient videoId="latest" />

// Użycie z własnymi danymi
<EmbedYoutubeClient
  videoId="latest"
  title="Nasz najnowszy film"
  description="Sprawdź co nowego na naszym kanale!"
/>
```

## Bezpośrednie użycie funkcji

```tsx
import {
  getLatestYouTubeVideo,
  getLatestYouTubeVideoClient,
} from "@/lib/youtube";

// Server-side
const latestVideo = await getLatestYouTubeVideo();

// Client-side
const latestVideo = await getLatestYouTubeVideoClient();
```

## Dostępne funkcje

- `getLatestYouTubeVideo()` - Pobiera najnowszy film (server-side)
- `getLatestYouTubeVideoClient()` - Pobiera najnowszy film (client-side)
- `getYouTubeChannelInfo()` - Pobiera informacje o kanale
- `resolveVideoId(videoId)` - Rozwiązuje "latest" na konkretny ID

## Struktura danych

```typescript
interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnailUrl: string;
  channelTitle: string;
}
```
