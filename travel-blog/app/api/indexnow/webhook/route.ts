/**
 * IndexNow Webhook Endpoint
 * 
 * Odbiera webhooki z Sanity CMS gdy post jest publikowany/aktualizowany/usuwany
 * i automatycznie powiadamia wyszukiwarki przez IndexNow.
 * 
 * Konfiguracja webhooka w Sanity:
 * 1. Przejdź do https://sanity.io/manage
 * 2. Wybierz projekt → "API" → "Webhooks"
 * 3. Dodaj nowy webhook:
 *    - URL: https://vlogizdrogi.pl/api/indexnow/webhook
 *    - Dataset: production
 *    - Trigger on: "Create", "Update", "Delete"
 *    - Filter: _type == "post"
 *    - HTTP method: POST
 *    - API version: v2021-06-07 lub nowsza
 *    - Secret (opcjonalnie): Ustaw token dla bezpieczeństwa
 * 
 * Zmienne środowiskowe:
 * - INDEXNOW_API_KEY: Klucz API IndexNow (opcjonalny, ma fallback)
 *   Dodaj do .env.local: INDEXNOW_API_KEY=e52becabde4e448683cc5da9c447431c
 */

import { NextRequest, NextResponse } from 'next/server';
import { readOnlyClient } from '@/lib/sanity';
import { submitToIndexNow } from '@/lib/indexnow';
import { getPostUrl } from '@/lib/utils';
import { SITE_CONFIG } from '@/lib/config';
import type { Post } from '@/lib/sanity';

export const dynamic = 'force-dynamic';

// Typ dla webhook payload z Sanity
type SanityWebhookPayload = {
  _id: string;
  _type: string;
  _rev?: string;
  _createdAt?: string;
  _updatedAt?: string;
  _deleted?: boolean;
};

/**
 * Pobiera pełne dane posta z Sanity (z kategoriami) po ID
 */
async function getPostById(id: string): Promise<Post | null> {
  try {
    // Używamy tego samego zapytania co BY_SLUG, ale z _id
    const query = `*[_type == "post" && _id == $id][0]{
      _id,
      title,
      subtitle,
      description,
      slug,
      publishedAt,
      categories[]-> {
        _id,
        name,
        slug {
          current
        },
        color,
        mainCategory-> {
          _id,
          name,
          slug {
            current
          },
          superCategory-> {
            _id,
            name,
            slug {
              current
            }
          }
        }
      },
      seo {
        noIndex,
        noFollow
      }
    }`;
    
    const post = await readOnlyClient.fetch<Post>(query, { id });
    return post || null;
  } catch (error) {
    console.error('❌ IndexNow Webhook: Błąd podczas pobierania posta:', error);
    return null;
  }
}

/**
 * Generuje pełny URL posta na podstawie danych z Sanity
 */
function generatePostUrl(post: Post): string | null {
  const relativeUrl = getPostUrl(post);
  
  if (relativeUrl === '#' || !relativeUrl) {
    return null;
  }

  return `${SITE_CONFIG.url}${relativeUrl}`;
}

export async function POST(request: NextRequest) {
  try {
    // Pobierz dane z webhooka
    const body = await request.json().catch(() => null);
    
    if (!body) {
      return NextResponse.json(
        { error: 'Brak danych w żądaniu' },
        { status: 400 }
      );
    }

    // Walidacja że to webhook dla posta
    const payload = body as SanityWebhookPayload;
    
    if (payload._type !== 'post') {
      // Ignoruj inne typy dokumentów
      return NextResponse.json(
        { message: 'Ignored - not a post', type: payload._type },
        { status: 200 }
      );
    }

    // Sprawdź czy post został usunięty
    if (payload._deleted) {
      // Dla usuniętych postów możemy też powiadomić IndexNow, ale to wymaga
      // zapisania URL przed usunięciem. Na razie ignorujemy usunięcia.
      console.log('ℹ️ IndexNow Webhook: Post usunięty, pomijam:', payload._id);
      return NextResponse.json(
        { message: 'Post deleted - skipping IndexNow submission' },
        { status: 200 }
      );
    }

    // Pobierz pełne dane posta z Sanity (z kategoriami)
    const post = await getPostById(payload._id);
    
    if (!post) {
      console.warn('⚠️ IndexNow Webhook: Post nie znaleziony:', payload._id);
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Sprawdź czy post ma slug i kategorie (wymagane do wygenerowania URL)
    if (!post.slug?.current) {
      console.warn('⚠️ IndexNow Webhook: Post bez slug:', payload._id);
      return NextResponse.json(
        { message: 'Post has no slug - skipping' },
        { status: 200 }
      );
    }

    // Generuj pełny URL posta
    const postUrl = generatePostUrl(post);
    
    if (!postUrl) {
      console.warn('⚠️ IndexNow Webhook: Nie można wygenerować URL dla posta:', payload._id);
      return NextResponse.json(
        { message: 'Cannot generate URL - missing categories' },
        { status: 200 }
      );
    }

    // Sprawdź czy post ma noIndex (nie indeksuj jeśli jest ustawione)
    if (post.seo?.noIndex) {
      console.log('ℹ️ IndexNow Webhook: Post ma noIndex, pomijam:', postUrl);
      return NextResponse.json(
        { message: 'Post has noIndex - skipping IndexNow submission' },
        { status: 200 }
      );
    }

    // Wyślij URL do IndexNow
    const result = await submitToIndexNow([postUrl]);

    if (result.success) {
      console.log(`✅ IndexNow Webhook: Wysłano URL do IndexNow: ${postUrl}`);
      return NextResponse.json({
        success: true,
        message: 'URL submitted to IndexNow',
        url: postUrl,
        indexnowResult: result,
      });
    } else {
      console.error(`❌ IndexNow Webhook: Błąd podczas wysyłania do IndexNow:`, result.message);
      // Zwracamy 200 żeby Sanity nie próbowało ponownie (błąd może być tymczasowy)
      return NextResponse.json({
        success: false,
        message: 'Failed to submit to IndexNow',
        error: result.message,
        url: postUrl,
      }, { status: 200 });
    }

  } catch (error) {
    console.error('❌ IndexNow Webhook: Nieoczekiwany błąd:', error);
    
    // Zwracamy 200 żeby Sanity nie próbowało ponownie
    // (błędy mogą być tymczasowe, a Sanity ma własny retry mechanism)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 200 }
    );
  }
}

// Obsługa GET dla testowania (opcjonalne)
export async function GET() {
  return NextResponse.json({
    message: 'IndexNow Webhook Endpoint',
    status: 'active',
    instructions: 'Configure this endpoint as a webhook in Sanity Studio',
  });
}

