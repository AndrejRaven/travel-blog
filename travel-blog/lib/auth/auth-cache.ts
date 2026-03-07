"use client";

import type { User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  subscription_tier: 'free' | 'premium';
  subscription_status: 'active' | 'canceled' | 'past_due';
}

// Re-export dla kompatybilności
export type CachedUserProfile = UserProfile;

const AUTH_CACHE_KEY = 'auth_cache';
const AUTH_CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24h

export interface AuthCache {
  user: User | null;
  profile: UserProfile | null;
  timestamp: number;
}

/**
 * Zapisuje stan autentykacji do localStorage
 */
export function saveAuthToCache(user: User | null, profile: UserProfile | null): void {
  if (typeof window === 'undefined') return;
  
  try {
    // Serializuj tylko podstawowe pola User (wszystkie pola mogą nie być serializowalne)
    const u = user as User & Record<string, unknown>;
    const userData = user ? {
      id: user.id,
      email: user.email || '',
      created_at: user.created_at,
      app_metadata: user.app_metadata,
      user_metadata: user.user_metadata,
      aud: user.aud,
      confirmation_sent_at: user.confirmation_sent_at,
      recovery_sent_at: user.recovery_sent_at,
      email_change_sent_at: user.email_change_sent_at,
      new_email: user.new_email,
      invited_at: user.invited_at,
      action_link: user.action_link,
      phone: user.phone,
      phone_confirmed_at: user.phone_confirmed_at,
      phone_change: u.phone_change,
      phone_change_token: u.phone_change_token,
      phone_change_sent_at: u.phone_change_sent_at,
      confirmed_at: user.confirmed_at,
      email_change_confirm_status: u.email_change_confirm_status,
      banned_until: user.banned_until,
      is_anonymous: user.is_anonymous,
    } : null;
    
    const cache: AuthCache = {
      user: userData as User | null,
      profile,
      timestamp: Date.now(),
    };
    
    localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('[AuthCache] Error saving auth to cache:', error);
    // W przypadku błędu serializacji, spróbuj zapisać tylko podstawowe dane
    try {
      const basicCache: AuthCache = {
        user: user ? { id: user.id, email: user.email || '' } as User : null,
        profile,
        timestamp: Date.now(),
      };
      localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(basicCache));
    } catch (fallbackError) {
      console.error('[AuthCache] Error saving basic cache:', fallbackError);
    }
  }
}

/**
 * Pobiera cache'owany stan autentykacji z localStorage
 */
export function getAuthFromCache(): AuthCache | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const cached = localStorage.getItem(AUTH_CACHE_KEY);
    if (!cached) return null;
    
    const cache: AuthCache = JSON.parse(cached);
    
    // Sprawdź czy cache jest ważny
    if (!isAuthCacheValid(cache)) {
      clearAuthCache();
      return null;
    }
    
    return cache;
  } catch (error) {
    console.error('[AuthCache] Error reading auth cache:', error);
    clearAuthCache();
    return null;
  }
}

/**
 * Czyści cache autentykacji
 */
export function clearAuthCache(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(AUTH_CACHE_KEY);
  } catch (error) {
    console.error('[AuthCache] Error clearing auth cache:', error);
  }
}

/**
 * Sprawdza czy cache jest ważny (nie starszy niż 24h)
 */
export function isAuthCacheValid(cache: AuthCache): boolean {
  if (!cache || !cache.timestamp) return false;
  
  const now = Date.now();
  const age = now - cache.timestamp;
  
  return age < AUTH_CACHE_EXPIRY;
}
