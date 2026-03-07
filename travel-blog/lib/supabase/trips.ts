import { supabase } from '@/lib/supabase/client';
import type { Trip, TravelWalletData } from '@/lib/travel-wallet/types';

/** Wiersz podróży z bazy (kolumny snake_case) */
interface DbTripRow {
  id: string;
  user_id: string | null;
  slug: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  data: TravelWalletData;
  created_at: string;
  updated_at: string;
}

/**
 * Konwertuje Trip z bazy danych na format aplikacji
 */
function mapDbTripToTrip(dbTrip: DbTripRow): Trip {
  return {
    id: dbTrip.id,
    ownerUserId: dbTrip.user_id ?? null,
    slug: dbTrip.slug,
    name: dbTrip.name,
    startDate: dbTrip.start_date || undefined,
    endDate: dbTrip.end_date || undefined,
    data: dbTrip.data,
    createdAt: dbTrip.created_at,
    updatedAt: dbTrip.updated_at,
  };
}

/**
 * Konwertuje Trip z aplikacji na format bazy danych
 */
function mapTripToDbTrip(trip: Trip) {
  return {
    id: trip.id,
    slug: trip.slug,
    name: trip.name,
    start_date: trip.startDate || null,
    end_date: trip.endDate || null,
    data: trip.data,
    is_anonymous: false,
  };
}

/**
 * Pobiera wszystkie podróże użytkownika z Supabase
 */
export async function getTripsFromSupabase(userId: string): Promise<Trip[]> {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('user_id', userId)
    .eq('is_anonymous', false)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching trips from Supabase:', error);
    throw error;
  }

  return (data || []).map(mapDbTripToTrip);
}

/**
 * Pobiera tylko slugi podróży użytkownika z Supabase (lekki odczyt do sprawdzania unikalności)
 */
export async function getTripSlugsFromSupabase(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('trips')
    .select('slug')
    .eq('user_id', userId)
    .eq('is_anonymous', false);

  if (error) {
    console.error('Error fetching trip slugs from Supabase:', error);
    throw error;
  }

  return (data || []).map((row: { slug: string }) => row.slug);
}

/**
 * Pobiera podróż po ID z Supabase
 */
export async function getTripByIdFromSupabase(
  tripId: string,
  userId: string
): Promise<Trip | null> {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Trip not found
    }
    console.error('Error fetching trip from Supabase:', error);
    throw error;
  }

  return mapDbTripToTrip(data);
}

/**
 * Pobiera podróż po slug z Supabase
 */
export async function getTripBySlugFromSupabase(
  slug: string,
  userId: string
): Promise<Trip | null> {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('slug', slug)
    .eq('user_id', userId)
    .eq('is_anonymous', false)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Trip not found
    }
    console.error('Error fetching trip by slug from Supabase:', error);
    throw error;
  }

  return mapDbTripToTrip(data);
}

/**
 * Helper function do dodawania timeoutu do Promise
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  const timeoutPromise = new Promise<T>((_, reject) => {
    setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);
  });
  
  return Promise.race([promise, timeoutPromise]);
}

/**
 * Sprawdza limit podróży dla użytkownika.
 * Profil i liczba podróży pobierane równolegle, jeden wspólny timeout (8 s).
 */
export async function checkTripLimit(userId: string): Promise<{
  canCreate: boolean;
  currentCount: number;
  limit: number;
  tier: string;
}> {
  const profilePromise = supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', userId)
    .single();

  const countPromise = supabase
    .from('trips')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_anonymous', false);

  const timeoutMs = 8000;
  const timeoutMessage =
    'Timeout: Sprawdzanie limitu podróży trwa zbyt długo. Sprawdź połączenie z internetem.';

  const [profileResult, countResult] = await withTimeout(
    Promise.all([
      profilePromise.then((r) => ({ data: r.data, error: r.error })),
      countPromise.then((r) => ({ count: r.count, error: r.error })),
    ]),
    timeoutMs,
    timeoutMessage
  ) as [
      { data: { subscription_tier?: string } | null; error: unknown },
      { count: number | null; error: unknown },
    ];

  const [{ data: profile, error: profileError }, { count, error: countError }] = [
    profileResult,
    countResult,
  ];

  if (profileError) {
    console.error('Error fetching profile:', profileError);
    throw profileError;
  }
  if (countError) {
    console.error('Error counting trips:', countError);
    throw countError;
  }

  const tier = profile?.subscription_tier || 'free';
  const currentCount = count ?? 0;
  const limit = tier === 'premium' ? Infinity : 1;
  const canCreate = currentCount < limit;

  return {
    canCreate,
    currentCount,
    limit,
    tier,
  };
}

/**
 * Tworzy nową podróż w Supabase
 */
export async function createTripInSupabase(
  trip: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>,
  userId: string
): Promise<Trip> {
  // Sprawdź limit przed utworzeniem
  const limitCheck = await checkTripLimit(userId);
  if (!limitCheck.canCreate) {
    const tierName = limitCheck.tier === 'free' ? 'Darmowy plan' : 'Twój plan';
    const limitText = limitCheck.limit === Infinity ? 'nielimitowane' : `${limitCheck.limit} ${limitCheck.limit === 1 ? 'podróży' : 'podróży'}`;
    throw new Error(
      `Masz już ${limitCheck.currentCount} ${limitCheck.currentCount === 1 ? 'podróż' : 'podróże'}. ` +
      `${tierName} pozwala na utworzenie tylko ${limitText}. ` +
      `Przejdź na Premium, aby tworzyć nieograniczoną liczbę podróży.`
    );
  }

  const now = new Date().toISOString();
  const dbTrip = {
    user_id: userId,
    slug: trip.slug,
    name: trip.name,
    start_date: trip.startDate || null,
    end_date: trip.endDate || null,
    data: trip.data,
    is_anonymous: false,
    created_at: now,
    updated_at: now,
  };

  // Utwórz podróż z timeoutem (15 sekund)
  const insertPromise = supabase
    .from('trips')
    .insert(dbTrip)
    .select()
    .single();
  
  type InsertResult = { data: DbTripRow | null; error: { message?: string } | null };
  const result = await withTimeout<InsertResult>(
    insertPromise as unknown as Promise<InsertResult>,
    15000,
    'Timeout: Tworzenie podróży trwa zbyt długo. Sprawdź połączenie z internetem i spróbuj ponownie.'
  );
  const { data, error } = result;

  if (error) {
    console.error('Error creating trip in Supabase:', error);
    throw error;
  }
  if (!data) {
    throw new Error('Błąd tworzenia podróży: brak zwróconych danych.');
  }
  return mapDbTripToTrip(data);
}

/**
 * Aktualizuje podróż w Supabase
 */
export async function updateTripInSupabase(
  tripId: string,
  updates: Partial<Trip>,
  userId: string
): Promise<Trip> {
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.slug !== undefined) updateData.slug = updates.slug;
  if (updates.startDate !== undefined) updateData.start_date = updates.startDate || null;
  if (updates.endDate !== undefined) updateData.end_date = updates.endDate || null;
  if (updates.data !== undefined) updateData.data = updates.data;

  const { data, error } = await supabase
    .from('trips')
    .update(updateData)
    .eq('id', tripId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating trip in Supabase:', error);
    throw error;
  }

  return mapDbTripToTrip(data);
}

/**
 * Usuwa podróż z Supabase (po slug – lokalne id nie zgadza się z id w DB).
 */
export async function deleteTripFromSupabase(
  slug: string,
  userId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('trips')
    .delete()
    .eq('slug', slug)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting trip from Supabase:', error);
    throw error;
  }

  return true;
}
