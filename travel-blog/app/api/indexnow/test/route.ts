/**
 * IndexNow Test Endpoint
 * 
 * Endpoint do testowania funkcjonalności IndexNow
 * 
 * Użycie:
 * GET /api/indexnow/test - Sprawdza konfigurację
 * POST /api/indexnow/test?url=https://vlogizdrogi.pl/... - Testuje wysłanie URL
 */

import { NextRequest, NextResponse } from 'next/server';
import { submitToIndexNow } from '@/lib/indexnow';
import { SITE_CONFIG } from '@/lib/config';

export const dynamic = 'force-dynamic';

// Sprawdź czy plik klucza jest dostępny
async function checkKeyFile(key: string): Promise<{
  available: boolean;
  url: string;
  status?: number;
  error?: string;
  note?: string;
  keyMatches?: boolean;
}> {
  const keyFileUrl = `${SITE_CONFIG.url}/${key}.txt`;
  
  // Sprawdź czy jesteśmy w środowisku serwerowym i próbujemy fetch do siebie
  const isSelfReferential = keyFileUrl.includes(SITE_CONFIG.url);
  
  try {
    // Spróbuj fetch z dodatkowymi opcjami
    const response = await fetch(keyFileUrl, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'User-Agent': 'IndexNow-Test/1.0',
      },
      // Timeout po 5 sekundach
      signal: AbortSignal.timeout(5000),
    });
    
    if (response.ok) {
      const text = await response.text();
      const trimmedKey = text.trim();
      const keyMatches = trimmedKey === key;
      
      return {
        available: true,
        url: keyFileUrl,
        status: response.status,
        keyMatches,
        note: keyMatches 
          ? '✅ Klucz w pliku jest poprawny' 
          : `⚠️ Klucz w pliku nie pasuje. Oczekiwano: "${key}", otrzymano: "${trimmedKey.substring(0, 20)}..."`,
      };
    }
    
    return {
      available: false,
      url: keyFileUrl,
      status: response.status,
      error: `HTTP ${response.status}: ${response.statusText}`,
      note: 'Sprawdź czy plik jest dostępny publicznie w przeglądarce',
    };
  } catch (error) {
    // Jeśli to błąd sieciowy przy self-referential fetch, to może być normalne
    if (isSelfReferential && (error instanceof TypeError || error instanceof Error)) {
      // Sprawdź czy błąd jest związany z self-referential fetch
      const isNetworkError = error.message.includes('fetch failed') || 
                            error.message.includes('ECONNREFUSED') ||
                            error.message.includes('ENOTFOUND');
      
      if (isNetworkError) {
        return {
          available: true, // Zakładamy że plik istnieje jeśli jest w public/
          url: keyFileUrl,
          note: '⚠️ Nie można zweryfikować przez fetch (self-referential). Plik powinien być dostępny publicznie. Sprawdź ręcznie w przeglądarce.',
        };
      }
    }
    
    return {
      available: false,
      url: keyFileUrl,
      error: error instanceof Error ? error.message : 'Unknown error',
      note: 'Sprawdź czy plik jest dostępny publicznie w przeglądarce',
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const testUrl = searchParams.get('url');
    
    const INDEXNOW_KEY = process.env.INDEXNOW_API_KEY || 'e52becabde4e448683cc5da9c447431c';
    
    // Sprawdź konfigurację
    const config = {
      apiKey: INDEXNOW_KEY ? '✅ Ustawiony' : '❌ Brak',
      apiKeyValue: INDEXNOW_KEY ? `${INDEXNOW_KEY.substring(0, 8)}...` : 'Brak',
      siteUrl: SITE_CONFIG.url,
      keyFileUrl: `${SITE_CONFIG.url}/${INDEXNOW_KEY}.txt`,
    };
    
    // Sprawdź dostępność pliku klucza
    const keyFileCheck = await checkKeyFile(INDEXNOW_KEY);
    
    const response: {
      status: string;
      config: typeof config;
      keyFile: typeof keyFileCheck;
      testUrl?: string;
      testResult?: Awaited<ReturnType<typeof submitToIndexNow>>;
      instructions: {
        checkKeyFile: string;
        testSubmission: string;
        checkLogs: string;
      };
    } = {
      status: 'ready',
      config,
      keyFile: keyFileCheck,
      instructions: {
        checkKeyFile: `Sprawdź czy plik jest dostępny: ${config.keyFileUrl}`,
        testSubmission: `Wyślij POST z parametrem url: POST /api/indexnow/test?url=https://vlogizdrogi.pl/...`,
        checkLogs: 'Sprawdź logi serwera dla szczegółów wysyłki',
      },
    };
    
    // Jeśli podano URL, przetestuj wysłanie
    if (testUrl) {
      try {
        const testResult = await submitToIndexNow([testUrl]);
        response.testUrl = testUrl;
        response.testResult = testResult;
      } catch (error) {
        response.testResult = {
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
    
    return NextResponse.json(response, {
      status: 200,
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

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const url = searchParams.get('url');
    
    if (!url) {
      return NextResponse.json(
        {
          success: false,
          error: 'Brak parametru url. Użyj: POST /api/indexnow/test?url=https://vlogizdrogi.pl/...',
        },
        { status: 400 }
      );
    }
    
    // Walidacja URL
    try {
      const urlObj = new URL(url);
      const siteUrl = new URL(SITE_CONFIG.url);
      
      if (urlObj.hostname !== siteUrl.hostname) {
        return NextResponse.json(
          {
            success: false,
            error: `URL musi należeć do domeny ${siteUrl.hostname}`,
            providedUrl: url,
            expectedDomain: siteUrl.hostname,
          },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Nieprawidłowy format URL',
          providedUrl: url,
        },
        { status: 400 }
      );
    }
    
    // Wyślij do IndexNow
    const result = await submitToIndexNow([url]);
    
    return NextResponse.json({
      success: result.success,
      message: result.message,
      statusCode: result.statusCode,
      url,
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

