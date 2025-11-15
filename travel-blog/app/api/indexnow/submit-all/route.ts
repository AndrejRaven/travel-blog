/**
 * IndexNow - Wysyłanie wszystkich postów
 * 
 * Endpoint do wysłania wszystkich opublikowanych postów do IndexNow jednocześnie
 * 
 * Użycie:
 * POST /api/indexnow/submit-all - Wysyła wszystkie posty
 * GET /api/indexnow/submit-all - Sprawdza ile postów zostanie wysłanych
 */

import { NextResponse } from 'next/server';
import { submitToIndexNow } from '@/lib/indexnow';
import { SITE_CONFIG } from '@/lib/config';
import { fetchGroq } from '@/lib/sanity';
import { getPostUrl } from '@/lib/utils';
import type { Post } from '@/lib/sanity';

export const dynamic = 'force-dynamic';

/**
 * Pobiera wszystkie opublikowane posty z Sanity
 */
async function getAllPublishedPosts(): Promise<Post[]> {
  const query = `*[_type == "post" && defined(slug.current) && defined(publishedAt)] {
    _id,
    title,
    slug,
    publishedAt,
    seo {
      noIndex,
      noFollow
    },
    categories[]-> {
      _id,
      name,
      slug {
        current
      },
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
    }
  } | order(publishedAt desc)`;
  
  return await fetchGroq<Post[]>(query, {}, 'POSTS');
}

/**
 * Generuje pełne URL-e dla wszystkich postów
 */
function generatePostUrls(posts: Post[]): string[] {
  const urls: string[] = [];
  
  for (const post of posts) {
    // Pomiń posty z noIndex
    if (post.seo?.noIndex) {
      continue;
    }
    
    // Generuj URL posta
    const relativeUrl = getPostUrl(post);
    
    if (relativeUrl && relativeUrl !== '#') {
      const fullUrl = `${SITE_CONFIG.url}${relativeUrl}`;
      urls.push(fullUrl);
    }
  }
  
  return urls;
}

export async function GET() {
  try {
    const posts = await getAllPublishedPosts();
    const urls = generatePostUrls(posts);
    
    return NextResponse.json({
      status: 'ready',
      totalPosts: posts.length,
      postsWithNoIndex: posts.filter(p => p.seo?.noIndex).length,
      urlsToSubmit: urls.length,
      sampleUrls: urls.slice(0, 5),
      message: `Znaleziono ${urls.length} postów do wysłania. Użyj POST aby wysłać je do IndexNow.`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    // Pobierz wszystkie posty
    const posts = await getAllPublishedPosts();
    
    // Generuj URL-e
    const urls = generatePostUrls(posts);
    
    if (urls.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Brak postów do wysłania',
        totalPosts: posts.length,
        postsWithNoIndex: posts.filter(p => p.seo?.noIndex).length,
      });
    }
    
    // IndexNow może przyjąć do 10,000 URL-i w jednym żądaniu
    // Jeśli jest więcej, podziel na partie
    const MAX_URLS_PER_REQUEST = 10000;
    const batches: string[][] = [];
    
    for (let i = 0; i < urls.length; i += MAX_URLS_PER_REQUEST) {
      batches.push(urls.slice(i, i + MAX_URLS_PER_REQUEST));
    }
    
    // Wyślij wszystkie partie
    const results = await Promise.all(
      batches.map(async (batch, index) => {
        const result = await submitToIndexNow(batch);
        return {
          batch: index + 1,
          totalBatches: batches.length,
          urlsInBatch: batch.length,
          ...result,
        };
      })
    );
    
    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;
    
    return NextResponse.json({
      success: failedCount === 0,
      message: `Wysłano ${urls.length} URL-i w ${batches.length} partiach`,
      totalPosts: posts.length,
      totalUrls: urls.length,
      batches: results,
      summary: {
        successfulBatches: successCount,
        failedBatches: failedCount,
        totalBatches: batches.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

