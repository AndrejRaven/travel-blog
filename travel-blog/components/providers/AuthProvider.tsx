"use client";

import { useState, useEffect, useRef } from 'react';
import { AuthProvider as SupabaseAuthProvider, useAuth } from '@/lib/auth/AuthContext';
import { migrateTripsToSupabase, migrateTripsFromSupabaseToLocal, shouldSyncToSupabase, shouldRunMigrationSync, setSessionSyncedUserId, clearSessionSyncedUserId } from '@/lib/supabase/sync-helpers';
import { useToast } from '@/components/ui/Toast';

/**
 * Wrapper dla AuthProvider z automatyczną migracją danych i toast notifications
 */
function MigrationNotificationHandler({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { addToast } = useToast();
  const [migrationChecked, setMigrationChecked] = useState(false);
  const addToastRef = useRef(addToast);
  const migrationInProgressRef = useRef(false);

  addToastRef.current = addToast;

  // Przy wylogowaniu wyczyść flagę „zsynchronizowano w tej sesji”, żeby po ponownym logowaniu sync się wykonał
  useEffect(() => {
    if (!user) {
      clearSessionSyncedUserId();
    }
  }, [user]);

  useEffect(() => {
    if (loading || !user || migrationChecked) {
      return;
    }
    if (migrationInProgressRef.current) {
      return;
    }

    // Zablokuj ponowne wejście od razu (effect może się odpalić 2–3× przed resolve promise)
    migrationInProgressRef.current = true;

    // Uruchom sync tylko gdy użytkownik ma lokalne zmiany (pending); reload nie wywołuje sync
    shouldSyncToSupabase()
      .then(async (hasUserAndTrips) => {
        if (!hasUserAndTrips) {
          migrationInProgressRef.current = false;
          setMigrationChecked(true);
          return;
        }
        const runMigration = await shouldRunMigrationSync(user.id);
        if (!runMigration) {
          migrationInProgressRef.current = false;
          setMigrationChecked(true);
          return; // Odświeżenie bez zmian – nie wywołuj pull/push
        }

        try {
          const pullResult = await migrateTripsFromSupabaseToLocal(user.id);
          const pushResult = await migrateTripsToSupabase(user.id);

          const result = {
            migrated: pushResult.migrated + pullResult.migrated,
            failed: pushResult.failed + pullResult.failed,
            trips: pushResult.trips,
            resolvedConflicts: pullResult.resolvedConflicts ?? 0,
          };

          setSessionSyncedUserId(user.id);

          if (result.migrated > 0) {
            addToastRef.current?.({
              type: 'success',
              title: 'Podróże zsynchronizowane',
              message: `Zmigrowano ${result.migrated} podróż(ży) do chmury.`,
              duration: 3000,
            });
          }

          if (result.resolvedConflicts > 0) {
            addToastRef.current?.({
              type: 'success',
              title: 'Synchronizacja',
              message: `W ${result.resolvedConflicts} podróż(ach) zachowano Twoje lokalne zmiany i zaktualizowano chmurę.`,
              duration: 4000,
            });
          }

          if (result.failed > 0) {
            addToastRef.current?.({
              type: 'warning',
              title: 'Częściowa synchronizacja',
              message: `${result.failed} podróż(ży) nie zostało zmigrowanych.`,
              duration: 4000,
            });
          }

          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("portfel-trips-updated"));
          }
        } catch (error) {
          console.error('Error during migration:', error);

          if (error instanceof Error && error.message.includes('LIMIT_EXCEEDED')) {
            addToastRef.current?.({
              type: 'info',
              title: 'Limit podróży',
              message: 'Nie można zmigrować wszystkich podróży. Masz już maksymalną liczbę podróży w chmurze.',
              duration: 5000,
            });
          } else {
            addToastRef.current?.({
              type: 'error',
              title: 'Błąd synchronizacji',
              message: 'Nie udało się zsynchronizować podróży. Spróbuj ponownie później.',
              duration: 4000,
            });
          }
        } finally {
          migrationInProgressRef.current = false;
          setMigrationChecked(true);
        }
      })
      .catch(() => {
        migrationInProgressRef.current = false;
        setMigrationChecked(true);
      });
  }, [user, loading, migrationChecked]);

  return <>{children}</>;
}

/**
 * Główny AuthProvider z migracją danych
 * Background sync jest obsługiwany przez BackgroundSyncProvider w ClientShell
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SupabaseAuthProvider>
      <MigrationNotificationHandler>
        {children}
      </MigrationNotificationHandler>
    </SupabaseAuthProvider>
  );
}
