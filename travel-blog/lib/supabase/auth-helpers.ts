import { supabase } from '@/lib/supabase/client';
import { uploadAvatar, deleteAvatar } from './storage-helpers';
import { getTripsFromSupabase } from './trips';
import { deleteTripFromSupabase } from './trips';

/**
 * Sprawdza czy użytkownik jest zalogowany
 */
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }
    
    return user;
  } catch (error) {
    // Obsłuż AbortError (przerwane żądania podczas unmount)
    if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('signal is aborted'))) {
      return null; // Ciche ignorowanie
    }
    // Rethrow inne błędy
    throw error;
  }
}

/**
 * Rejestracja użytkownika
 */
export async function signUp(email: string, password: string, fullName?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName || email,
      },
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Logowanie użytkownika
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Wylogowanie użytkownika
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    throw error;
  }
}

/**
 * Pobiera profil użytkownika
 */
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data;
}

/**
 * Aktualizuje subscription tier użytkownika
 */
export async function updateSubscriptionTier(userId: string, tier: 'free' | 'premium'): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ subscription_tier: tier })
    .eq('id', userId);

  if (error) {
    console.error('Error updating subscription tier:', error);
    throw new Error(`Błąd podczas aktualizacji tier: ${error.message}`);
  }
}

/**
 * Upload zdjęcia profilowego i zwraca URL
 */
export async function uploadAvatarToStorage(userId: string, file: File): Promise<string> {
  return uploadAvatar(userId, file);
}

/**
 * Aktualizuje profil użytkownika
 * Jeśli podano file, uploaduje zdjęcie do Supabase Storage i aktualizuje avatar_url
 * Jeśli podano avatar_url, aktualizuje bezpośrednio
 */
export async function updateUserProfile(
  userId: string,
  updates: {
    full_name?: string;
    avatar_url?: string;
    avatar_file?: File; // Nowy plik do uploadu
  },
  oldAvatarUrl?: string // Stary URL do usunięcia po udanym uploadzie
) {
  const profileUpdates: { full_name?: string; avatar_url?: string } = {};

  // Jeśli podano full_name, dodaj do aktualizacji
  if (updates.full_name !== undefined) {
    profileUpdates.full_name = updates.full_name;
  }

  // Jeśli podano avatar_file, uploaduj najpierw
  if (updates.avatar_file) {
    try {
      const newAvatarUrl = await uploadAvatarToStorage(userId, updates.avatar_file);
      profileUpdates.avatar_url = newAvatarUrl;

      // Usuń stare zdjęcie jeśli istnieje i jest różne od nowego (asynchronicznie, nie blokuj)
      if (oldAvatarUrl && oldAvatarUrl !== newAvatarUrl) {
        deleteAvatar(oldAvatarUrl).catch((error) => {
          // Loguj błąd ale nie przerywaj procesu
          console.warn('[AuthHelpers] Error deleting old avatar:', error);
        });
      }
    } catch (error) {
      console.error('[AuthHelpers] Error uploading avatar:', error);
      throw error;
    }
  } else if (updates.avatar_url !== undefined) {
    // Jeśli podano bezpośrednio URL, użyj go
    profileUpdates.avatar_url = updates.avatar_url;
  }

  // Sprawdź czy są jakieś zmiany do zapisania
  if (Object.keys(profileUpdates).length === 0) {
    // Pobierz aktualny profil i zwróć go
    const currentProfile = await getUserProfile(userId);
    if (!currentProfile) {
      throw new Error('Profil nie został znaleziony');
    }
    return currentProfile;
  }

  // Aktualizuj profil w bazie danych (z timeout)
  const updatePromise = supabase
    .from('profiles')
    .update(profileUpdates)
    .eq('id', userId)
    .select()
    .single();

  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Timeout: Aktualizacja profilu trwa zbyt długo.')), 10000)
  );

  const result = await Promise.race([updatePromise, timeoutPromise]) as { data: unknown; error: { message?: string } | null };

  if (result.error) {
    console.error('[AuthHelpers] Error updating user profile:', result.error);
    throw new Error(`Błąd podczas aktualizacji profilu: ${result.error.message}`);
  }

  return result.data;
}

/**
 * Usuwa konto użytkownika i wszystkie powiązane dane
 * Wymaga potwierdzenia przez API route (używa service role key)
 */
export async function deleteUserAccount(userId: string): Promise<void> {
  try {
    // 1. Pobierz wszystkie podróże użytkownika
    const trips = await getTripsFromSupabase(userId);
    
    // 2. Usuń wszystkie podróże
    for (const trip of trips) {
      try {
        await deleteTripFromSupabase(trip.slug, userId);
      } catch (error) {
        console.error(`Error deleting trip ${trip.id}:`, error);
        // Kontynuuj nawet jeśli jedna podróż się nie usunęła
      }
    }

    // 3. Pobierz profil aby uzyskać avatar_url
    const profile = await getUserProfile(userId);
    
    // 4. Usuń zdjęcie profilowe jeśli istnieje
    if (profile?.avatar_url) {
      try {
        await deleteAvatar(profile.avatar_url);
      } catch (error) {
        console.error('Error deleting avatar:', error);
        // Kontynuuj nawet jeśli avatar się nie usunął
      }
    }

    // 5. Usuń profil z tabeli profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.error('Error deleting profile:', profileError);
      throw profileError;
    }

    // 6. Usuń konto z auth.users przez API route (wymaga service role key)
    const response = await fetch('/api/auth/delete-account', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || 'Failed to delete account');
    }

    // 7. Wyloguj użytkownika
    await signOut();
  } catch (error) {
    console.error('Error deleting user account:', error);
    throw error;
  }
}
