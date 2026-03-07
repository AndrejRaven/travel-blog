import { getErrorMessage, isError } from '@/lib/utils/error-handling';
import { supabase } from './client';

const AVATAR_BUCKET = 'avatars';
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Sprawdza czy bucket jest dostępny
 */
async function checkBucketAccess(): Promise<void> {
  try {
    const { data, error } = await supabase.storage
      .from(AVATAR_BUCKET)
      .list('', { limit: 1 });

    if (error) {
      if (error.message?.includes('Bucket not found') || error.message?.includes('does not exist')) {
        throw new Error('Bucket "avatars" nie istnieje. Utwórz go w Supabase Storage → Storage → New bucket (nazwa: avatars, public: ON)');
      }
      if (error.message?.includes('permission') || error.message?.includes('policy') || error.message?.includes('RLS')) {
        throw new Error('Brak uprawnień do bucketu "avatars". Sprawdź polityki RLS w Supabase Storage → Storage → avatars → Policies');
      }
      throw new Error(`Błąd dostępu do bucketu: ${error.message}`);
    }
  } catch (error: unknown) {
    if (isError(error)) {
      throw error;
    }
    const errorMessage = getErrorMessage(error);
    throw new Error(`Nie można sprawdzić dostępu do bucketu: ${errorMessage}`);
  }
}

/**
 * Upload zdjęcia profilowego do Supabase Storage
 * Z retry logic dla AbortError
 */
export async function uploadAvatar(userId: string, file: File, retries = 3): Promise<string> {
  // Walidacja rozmiaru pliku
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Plik jest zbyt duży. Maksymalny rozmiar to 2MB.');
  }

  // Walidacja typu pliku
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Nieprawidłowy typ pliku. Dozwolone formaty: JPEG, PNG, WebP.');
  }

  // Sprawdź dostępność bucketu przed uploadem
  try {
    await checkBucketAccess();
  } catch (error: unknown) {
    console.error('[StorageHelpers] Bucket access check failed:', error);
    if (isError(error)) {
      throw error;
    }
    throw new Error('Błąd podczas sprawdzania dostępu do bucketu');
  }

  // Generuj unikalną nazwę pliku
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  // Retry logic dla AbortError
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Timeout dla uploadu (15 sekund - krótszy timeout)
      const uploadPromise = supabase.storage
        .from(AVATAR_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true, // Nadpisuj jeśli istnieje (dla retry)
        });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Upload timeout: Operacja trwa zbyt długo. Sprawdź polityki RLS dla bucketu "avatars" w Supabase Storage → Storage → avatars → Policies')), 15000)
      );

      const uploadResult = await Promise.race([uploadPromise, timeoutPromise]) as { data: { path: string } | null; error: { message?: string; statusCode?: number } | null };

      if (uploadResult.error) {
        const err = uploadResult.error;
        console.error(`[StorageHelpers] Upload error on attempt ${attempt}:`, err);
        
        // Sprawdź czy to błąd związany z bucketem
        if (err.message?.includes('Bucket not found') || err.message?.includes('does not exist')) {
          throw new Error('Bucket "avatars" nie istnieje. Utwórz go w Supabase Storage → Storage → New bucket (nazwa: avatars, public: ON)');
        }
        
        // Sprawdź czy to błąd uprawnień
        if (err.message?.includes('permission') || err.message?.includes('policy') || err.message?.includes('RLS') || err.message?.includes('Forbidden') || err.statusCode === 403) {
          throw new Error('Brak uprawnień do uploadu. Sprawdź polityki RLS dla bucketu "avatars" w Supabase Storage → Storage → avatars → Policies. Upewnij się, że polityka INSERT pozwala authenticated users na upload do folderu {userId}/');
        }
        
        // Sprawdź czy to AbortError
        if (err.message?.includes('signal is aborted') || err.message?.includes('AbortError')) {
          if (attempt < retries) {
            console.warn(`[StorageHelpers] Upload attempt ${attempt} aborted, retrying...`);
            // Czekaj przed retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 500 * attempt));
            continue;
          }
          throw new Error('Upload został przerwany. Spróbuj ponownie.');
        }
        
        throw new Error(`Błąd podczas uploadu zdjęcia: ${err.message || err.statusCode || 'Unknown error'}`);
      }

      // Pobierz publiczny URL do zdjęcia
      const { data: urlData } = supabase.storage
        .from(AVATAR_BUCKET)
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error('Nie udało się wygenerować URL do zdjęcia.');
      }

      return urlData.publicUrl;
    } catch (error: unknown) {
      // Obsłuż AbortError
      if (isError(error) && (error.name === 'AbortError' || error.message.includes('signal is aborted'))) {
        if (attempt < retries) {
          console.warn(`[StorageHelpers] Upload attempt ${attempt} aborted, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 500 * attempt));
          continue;
        }
        throw new Error('Upload został przerwany. Spróbuj ponownie.');
      }
      
      // Jeśli to ostatnia próba lub inny błąd, rzuć go dalej
      const isAborted = isError(error) && error.message?.includes('signal is aborted');
      if (attempt === retries || !isAborted) {
        throw error;
      }
    }
  }

  throw new Error('Nie udało się przesłać zdjęcia po kilku próbach.');
}

/**
 * Usuwa zdjęcie profilowe z Supabase Storage
 */
export async function deleteAvatar(avatarUrl: string): Promise<void> {
  if (!avatarUrl) {
    return;
  }

  // Wyciągnij ścieżkę pliku z URL
  // Format URL: https://[project].supabase.co/storage/v1/object/public/avatars/[userId]/[fileName]
  try {
    const urlParts = avatarUrl.split('/');
    const fileNameIndex = urlParts.findIndex(part => part === AVATAR_BUCKET);
    
    if (fileNameIndex === -1) {
      console.warn('Invalid avatar URL format:', avatarUrl);
      return;
    }

    const filePath = urlParts.slice(fileNameIndex + 1).join('/');

    const { error } = await supabase.storage
      .from(AVATAR_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error('Error deleting avatar:', error);
      // Nie rzucaj błędu - może to być stary plik który już nie istnieje
    }
  } catch (error) {
    console.error('Error parsing avatar URL:', error);
    // Nie rzucaj błędu - może to być zewnętrzny URL
  }
}

/**
 * Generuje URL do zdjęcia profilowego
 */
export function getAvatarUrl(userId: string, fileName: string): string {
  const { data } = supabase.storage
    .from(AVATAR_BUCKET)
    .getPublicUrl(`${userId}/${fileName}`);

  return data?.publicUrl || '';
}
