"use client";

import { supabase } from '@/lib/supabase/client';
import { getUserProfile } from '@/lib/supabase/auth-helpers';
import { getAuthFromCache, saveAuthToCache, clearAuthCache, type UserProfile } from './auth-cache';
import type { User } from '@supabase/supabase-js';

/**
 * Wykrywa czy jest połączenie z internetem
 */
export function detectOnlineStatus(): boolean {
  if (typeof window === 'undefined') return true;
  return navigator.onLine;
}

/**
 * Synchronizuje stan autentykacji gdy powrót online
 */
export async function syncAuthOnOnline(): Promise<{
  user: User | null;
  profile: UserProfile | null;
  isValid: boolean;
}> {
  try {
    // Sprawdź aktualną sesję w Supabase
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('[OnlineSync] Error getting session:', error);
      // Jeśli błąd, użyj cache'owanego stanu
      const cached = getAuthFromCache();
      return {
        user: cached?.user || null,
        profile: cached?.profile || null,
        isValid: false,
      };
    }
    
    const user = session?.user ?? null;
    
    if (!user) {
      // Brak sesji - wyczyść cache
      clearAuthCache();
      return {
        user: null,
        profile: null,
        isValid: true,
      };
    }
    
    // Pobierz profil użytkownika (email z session.user, bez zbędnego getUser)
    let profile: UserProfile | null = null;
    const userEmail = user.email || '';
    try {
      const userProfile = await getUserProfile(user.id);
      if (userProfile) {
        profile = {
          id: userProfile.id,
          email: userEmail,
          full_name: userProfile.full_name,
          avatar_url: userProfile.avatar_url,
          subscription_tier: userProfile.subscription_tier || 'free',
          subscription_status: userProfile.subscription_status || 'active',
        };
      }
    } catch (error) {
      console.error('[OnlineSync] Error loading profile:', error);
      // Użyj cache'owanego profilu jeśli dostępny
      const cached = getAuthFromCache();
      profile = cached?.profile || null;
    }
    
    // Zaktualizuj cache z najnowszymi danymi
    saveAuthToCache(user, profile);
    
    return {
      user,
      profile,
      isValid: true,
    };
  } catch (error) {
    console.error('[OnlineSync] Error syncing auth:', error);
    // W przypadku błędu, użyj cache'owanego stanu
    const cached = getAuthFromCache();
    return {
      user: cached?.user || null,
      profile: cached?.profile || null,
      isValid: false,
    };
  }
}

/**
 * Obsługuje zmiany statusu online/offline
 */
export function handleOnlineStatusChange(
  isOnline: boolean,
  onOnline: () => void,
  onOffline: () => void
): void {
  if (typeof window === 'undefined') return;
  
  if (isOnline) {
    onOnline();
  } else {
    onOffline();
  }
}
