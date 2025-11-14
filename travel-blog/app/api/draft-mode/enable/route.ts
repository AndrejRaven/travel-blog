import { writeClient, projectId, dataset } from '@/lib/sanity'
import { defineEnableDraftMode } from 'next-sanity/draft-mode'

// Funkcja do tworzenia handlera - opóźniona inicjalizacja
function createDraftModeHandler() {
  if (!projectId || !dataset) {
    // Fallback handler jeśli brakuje zmiennych środowiskowych
    return {
      GET: async () => {
        return new Response('Sanity configuration missing', { status: 500 });
      }
    };
  }

  try {
    // Użyj klienta tylko gdy zmienne środowiskowe istnieją
    // writeClient jest lazy-initialized przez Proxy, więc wywoła getWriteClient() przy pierwszym dostępie
    return defineEnableDraftMode({
      client: writeClient.withConfig({
        token: process.env.SANITY_VIEWER_TOKEN,
      }),
    });
  } catch (error) {
    // Fallback handler w przypadku błędu
    console.error('Error initializing draft mode:', error);
    return {
      GET: async () => {
        return new Response('Sanity configuration error', { status: 500 });
      }
    };
  }
}

// Inicjalizuj handler tylko gdy jest potrzebny (lazy initialization)
let draftModeHandler: { GET: (request: Request) => Promise<Response> } | null = null;

function getDraftModeHandler() {
  if (!draftModeHandler) {
    draftModeHandler = createDraftModeHandler();
  }
  return draftModeHandler;
}

// Eksportuj GET handler z lazy initialization
export const GET = async (request: Request) => {
  const handler = getDraftModeHandler();
  return handler.GET(request);
};

