/**
 * SEO Check Endpoint
 * 
 * Endpoint do sprawdzania SEO dla danego URL
 * Analizuje meta tagi, structured data i sitemap
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface SEOAnalysisResult {
  url: string;
  success: boolean;
  error?: string;
  metaTags?: {
    title?: string;
    description?: string;
    og?: {
      title?: string;
      description?: string;
      image?: string;
      type?: string;
      url?: string;
    };
    twitter?: {
      card?: string;
      title?: string;
      description?: string;
      image?: string;
    };
    robots?: string;
    canonical?: string;
  };
  structuredData?: {
    found: boolean;
    types: string[];
    count: number;
    schemas: Array<{
      type: string;
      content: object;
    }>;
  };
  sitemap?: {
    available: boolean;
    url: string;
    urlCount?: number;
    lastModified?: string;
    error?: string;
  };
}

/**
 * Parsuje HTML i wyciąga meta tagi
 */
function parseMetaTags(html: string): SEOAnalysisResult['metaTags'] {
  const metaTags: SEOAnalysisResult['metaTags'] = {
    og: {},
    twitter: {},
  };

  // Title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    metaTags.title = titleMatch[1].trim();
  }

  // Meta tags
  const metaRegex = /<meta\s+([^>]+)>/gi;
  let metaMatch;

  while ((metaMatch = metaRegex.exec(html)) !== null) {
    const metaContent = metaMatch[1];
    const nameMatch = metaContent.match(/name=["']([^"']+)["']/i);
    const propertyMatch = metaContent.match(/property=["']([^"']+)["']/i);
    const contentMatch = metaContent.match(/content=["']([^"']+)["']/i);

    if (!contentMatch) continue;

    const content = contentMatch[1];
    const name = nameMatch?.[1]?.toLowerCase();
    const property = propertyMatch?.[1]?.toLowerCase();

    if (name === 'description') {
      metaTags.description = content;
    } else if (name === 'robots') {
      metaTags.robots = content;
    } else if (name === 'canonical') {
      metaTags.canonical = content;
    } else if (property?.startsWith('og:')) {
      const ogKey = property.replace('og:', '');
      if (ogKey === 'title' && metaTags.og) {
        metaTags.og.title = content;
      } else if (ogKey === 'description' && metaTags.og) {
        metaTags.og.description = content;
      } else if (ogKey === 'image' && metaTags.og) {
        metaTags.og.image = content;
      } else if (ogKey === 'type' && metaTags.og) {
        metaTags.og.type = content;
      } else if (ogKey === 'url' && metaTags.og) {
        metaTags.og.url = content;
      }
    } else if (name?.startsWith('twitter:')) {
      const twitterKey = name.replace('twitter:', '');
      if (twitterKey === 'card' && metaTags.twitter) {
        metaTags.twitter.card = content;
      } else if (twitterKey === 'title' && metaTags.twitter) {
        metaTags.twitter.title = content;
      } else if (twitterKey === 'description' && metaTags.twitter) {
        metaTags.twitter.description = content;
      } else if (twitterKey === 'image' && metaTags.twitter) {
        metaTags.twitter.image = content;
      }
    }
  }

  return metaTags;
}

/**
 * Parsuje structured data (JSON-LD)
 */
function parseStructuredData(html: string): SEOAnalysisResult['structuredData'] {
  const schemas: Array<{ type: string; content: object }> = [];
  const types = new Set<string>();

  // Rozszerzony regex - obsługuje różne formaty:
  // 1. Standardowy: <script type="application/ld+json">...</script>
  // 2. Z pojedynczymi cudzysłowami: <script type='application/ld+json'>...</script>
  // 3. Bez cudzysłowów: <script type=application/ld+json>...</script>
  // 4. Z dodatkowymi atrybutami: <script type="application/ld+json" id="...">...</script>
  // 5. Z białymi znakami: <script type = "application/ld+json" >...</script>
  const jsonLdPatterns = [
    // Standardowy pattern z type="application/ld+json"
    /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    // Pattern bez type (niektóre mogą mieć tylko JSON)
    /<script[^>]*>([\s\S]*?)<\/script>/gi,
  ];

  for (const pattern of jsonLdPatterns) {
    let match;
    // Reset lastIndex dla każdego pattern
    pattern.lastIndex = 0;
    
    while ((match = pattern.exec(html)) !== null) {
      try {
        const scriptContent = match[1].trim();
        
        // Sprawdź czy to wygląda na JSON (zaczyna się od { lub [)
        if (!scriptContent.startsWith('{') && !scriptContent.startsWith('[')) {
          continue;
        }
        
        // Sprawdź czy nie zawiera HTML tagów (może być w komentarzach)
        if (scriptContent.includes('<') && scriptContent.includes('>')) {
          // Spróbuj wyciągnąć JSON z komentarzy HTML
          const commentMatch = scriptContent.match(/<!--[\s\S]*?-->([\s\S]*)/);
          if (commentMatch) {
            const jsonInComment = commentMatch[1].trim();
            if (jsonInComment.startsWith('{') || jsonInComment.startsWith('[')) {
              const parsed = JSON.parse(jsonInComment);
              processSchema(parsed, schemas, types);
              continue;
            }
          }
          continue;
        }
        
        const parsed = JSON.parse(scriptContent);
        processSchema(parsed, schemas, types);
      } catch (error) {
        // Ignoruj nieprawidłowe JSON - może to być zwykły script tag
        // Debug logging tylko dla development
        if (process.env.NODE_ENV === 'development') {
          console.debug('Error parsing JSON-LD:', error);
        }
      }
    }
  }

  return {
    found: schemas.length > 0,
    types: Array.from(types),
    count: schemas.length,
    schemas,
  };
}

/**
 * Przetwarza schemat JSON-LD i dodaje do listy
 */
function processSchema(
  parsed: unknown,
  schemas: Array<{ type: string; content: object }>,
  types: Set<string>
): void {
  // Obsługa tablicy schematów
  const schemasToProcess = Array.isArray(parsed) ? parsed : [parsed];
  
  schemasToProcess.forEach((schema: Record<string, unknown>) => {
    // Sprawdź czy to wygląda na JSON-LD (ma @context lub @type)
    const hasContext = '@context' in schema;
    const hasType = '@type' in schema || 'type' in schema;
    
    if (!hasContext && !hasType) {
      // Może to być zwykły obiekt JSON, nie JSON-LD
      return;
    }
    
    const type = (schema['@type'] as string) || (schema.type as string) || 'Unknown';
    types.add(type);
    schemas.push({
      type,
      content: schema as object,
    });
  });
}

/**
 * Sprawdza dostępność sitemap dla danej domeny
 */
async function checkSitemap(origin: string): Promise<SEOAnalysisResult['sitemap']> {
  const sitemapUrl = `${origin}/sitemap.xml`;
  
  try {
    const response = await fetch(sitemapUrl, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'User-Agent': 'SEO-Check/1.0',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return {
        available: false,
        url: sitemapUrl,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const xml = await response.text();
    
    // Proste parsowanie XML - liczenie <url> lub <urlset>
    const urlMatches = xml.match(/<url[^>]*>/gi);
    const urlCount = urlMatches ? urlMatches.length : 0;
    
    // Sprawdź lastmod
    const lastModMatch = xml.match(/<lastmod[^>]*>([^<]+)<\/lastmod>/i);
    const lastModified = lastModMatch ? lastModMatch[1].trim() : undefined;

    return {
      available: true,
      url: sitemapUrl,
      urlCount,
      lastModified,
    };
  } catch (error) {
    return {
      available: false,
      url: sitemapUrl,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        {
          success: false,
          error: 'Brak parametru url',
        },
        { status: 400 }
      );
    }

    // Walidacja URL
    let urlObj: URL;
    try {
      urlObj = new URL(url);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Nieprawidłowy format URL',
        },
        { status: 400 }
      );
    }

    // Pobierz HTML strony
    let html: string;
    try {
      const response = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SEO-Check/1.0)',
        },
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        return NextResponse.json({
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          url,
        });
      }

      html = await response.text();
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Błąd pobierania strony',
        url,
      });
    }

    // Parsuj meta tagi
    const metaTags = parseMetaTags(html);

    // Parsuj structured data
    const structuredData = parseStructuredData(html);

    // Sprawdź sitemap dla domeny z analizowanego URL
    const sitemap = await checkSitemap(urlObj.origin);

    const result: SEOAnalysisResult = {
      url,
      success: true,
      metaTags,
      structuredData,
      sitemap,
    };

    return NextResponse.json(result);
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

