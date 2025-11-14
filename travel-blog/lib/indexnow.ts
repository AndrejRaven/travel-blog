/**
 * IndexNow Integration
 * 
 * Funkcje do powiadamiania wyszukiwarek (Bing, Yandex) o zmianach w treści
 * poprzez protokół IndexNow.
 * 
 * Dokumentacja: https://www.indexnow.org/documentation
 * 
 * Konfiguracja:
 * - INDEXNOW_API_KEY: Klucz API IndexNow (opcjonalny, ma fallback do domyślnego klucza)
 *   Dodaj do .env.local: INDEXNOW_API_KEY=e52becabde4e448683cc5da9c447431c
 */

import { SITE_CONFIG } from './config';

const INDEXNOW_API_URL = 'https://api.indexnow.org/IndexNow';
// Klucz API IndexNow - można ustawić przez zmienną środowiskową INDEXNOW_API_KEY
// Jeśli nie jest ustawiona, używa domyślnego klucza z projektu
const INDEXNOW_KEY = process.env.INDEXNOW_API_KEY || 'e52becabde4e448683cc5da9c447431c';

/**
 * Wysyła listę URL-i do IndexNow API
 * 
 * @param urls - Lista pełnych URL-i do zindeksowania (muszą być z tej samej domeny)
 * @returns Promise z wynikiem operacji
 */
export async function submitToIndexNow(urls: string[]): Promise<{
  success: boolean;
  message: string;
  statusCode?: number;
}> {
  // Walidacja wejściowa
  if (!urls || urls.length === 0) {
    return {
      success: false,
      message: 'Brak URL-i do wysłania',
    };
  }

  // Walidacja klucza API
  if (!INDEXNOW_KEY) {
    console.error('❌ IndexNow: Brak klucza API (INDEXNOW_API_KEY)');
    return {
      success: false,
      message: 'Brak konfiguracji klucza API',
    };
  }

  // Walidacja że wszystkie URL-e są z właściwej domeny
  const siteUrl = new URL(SITE_CONFIG.url);
  const invalidUrls = urls.filter(url => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname !== siteUrl.hostname;
    } catch {
      return true; // Nieprawidłowy URL
    }
  });

  if (invalidUrls.length > 0) {
    console.warn('⚠️ IndexNow: Niektóre URL-e nie należą do właściwej domeny:', invalidUrls);
    // Kontynuuj z prawidłowymi URL-ami
    urls = urls.filter(url => {
      try {
        const urlObj = new URL(url);
        return urlObj.hostname === siteUrl.hostname;
      } catch {
        return false;
      }
    });

    if (urls.length === 0) {
      return {
        success: false,
        message: 'Wszystkie URL-e są nieprawidłowe',
      };
    }
  }

  // Przygotuj dane do wysłania
  const host = siteUrl.hostname;
  const keyLocation = `${SITE_CONFIG.url}/${INDEXNOW_KEY}.txt`;

  const payload = {
    host,
    key: INDEXNOW_KEY,
    keyLocation,
    urlList: urls,
  };

  try {
    const response = await fetch(INDEXNOW_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    // IndexNow zwraca 200 dla sukcesu, 400/403/422/429 dla błędów
    if (response.ok) {
      console.log(`✅ IndexNow: Wysłano ${urls.length} URL-i pomyślnie`);
      return {
        success: true,
        message: `Wysłano ${urls.length} URL-i pomyślnie`,
        statusCode: response.status,
      };
    } else {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`❌ IndexNow: Błąd ${response.status}:`, errorText);
      
      let errorMessage = 'Błąd podczas wysyłania do IndexNow';
      if (response.status === 400) {
        errorMessage = 'Nieprawidłowy format żądania';
      } else if (response.status === 403) {
        errorMessage = 'Nieprawidłowy klucz API';
      } else if (response.status === 422) {
        errorMessage = 'URL-e nie należą do właściwej domeny lub klucz nie pasuje';
      } else if (response.status === 429) {
        errorMessage = 'Zbyt wiele żądań (rate limit)';
      }

      return {
        success: false,
        message: errorMessage,
        statusCode: response.status,
      };
    }
  } catch (error) {
    console.error('❌ IndexNow: Błąd sieci:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Nieoczekiwany błąd',
    };
  }
}

/**
 * Wysyła pojedynczy URL do IndexNow
 * 
 * @param url - Pełny URL do zindeksowania
 * @returns Promise z wynikiem operacji
 */
export async function submitSingleUrlToIndexNow(url: string): Promise<{
  success: boolean;
  message: string;
  statusCode?: number;
}> {
  return submitToIndexNow([url]);
}

