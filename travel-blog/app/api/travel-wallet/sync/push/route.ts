import { NextRequest, NextResponse } from "next/server";
import type {
  SyncPushResponse,
} from "@/lib/travel-wallet/sync/types";
import { validateSyncPushRequest } from "@/lib/travel-wallet/sync/validation";
import { ZodError } from "zod";

/**
 * POST /api/travel-wallet/sync/push
 * Wysyła zmiany do serwera
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    
    // Validate request body
    let body;
    try {
      body = validateSyncPushRequest(rawBody);
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid request data",
            details: error.issues,
            processed: 0,
            serverVersion: 0,
          } as SyncPushResponse,
          { status: 400 }
        );
      }
      throw error;
    }

    // NOTE: Sync operations are currently handled by trip-sync-manager.ts
    // This endpoint is for future use when implementing operation-level sync
    // For now, operations are synced at the trip level via trip-sync-manager
    
    // TODO: Implement operation-level sync to database
    // This would require a sync_operations table in Supabase to store individual operations
    // Currently, trips are synced as whole entities via trip-sync-manager

    const response: SyncPushResponse = {
      success: true,
      processed: body.operations.length,
      serverVersion: 1, // TODO: Return actual version from database when implementing
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error pushing changes:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        error: `Failed to push changes: ${errorMessage}`,
      } as SyncPushResponse,
      { status: 500 }
    );
  }
}
