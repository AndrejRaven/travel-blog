import { NextRequest, NextResponse } from "next/server";
import type {
  SyncPullResponse,
} from "@/lib/travel-wallet/sync/types";
import { validateSyncPullRequest } from "@/lib/travel-wallet/sync/validation";
import { ZodError } from "zod";

/**
 * POST /api/travel-wallet/sync/pull
 * Pobiera zmiany z serwera
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    
    // Validate request body
    let _body;
    try {
      _body = validateSyncPullRequest(rawBody);
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid request data",
            details: error.issues,
            changes: [],
            serverVersion: 0,
          } as SyncPullResponse,
          { status: 400 }
        );
      }
      throw error;
    }

    // NOTE: Sync operations are currently handled by trip-sync-manager.ts
    // This endpoint is for future use when implementing operation-level sync
    // For now, trips are synced as whole entities via trip-sync-manager
    
    // TODO: Implement operation-level sync from database
    // This would require querying sync_operations table in Supabase
    // Currently, trips are synced as whole entities via trip-sync-manager
    
    const response: SyncPullResponse = {
      success: true,
      changes: [],
      serverVersion: 0,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error pulling changes:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        error: `Failed to pull changes: ${errorMessage}`,
      } as SyncPullResponse,
      { status: 500 }
    );
  }
}
