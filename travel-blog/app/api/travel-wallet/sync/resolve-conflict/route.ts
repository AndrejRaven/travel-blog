import { NextRequest, NextResponse } from "next/server";
import type {
  ConflictResolutionResponse,
} from "@/lib/travel-wallet/sync/types";
import { validateConflictResolutionRequest } from "@/lib/travel-wallet/sync/validation";
import { ZodError } from "zod";

/**
 * POST /api/travel-wallet/sync/resolve-conflict
 * Rozwiązanie konfliktu synchronizacji (endpoint zarezerwowany na przyszłość).
 *
 * Obecnie konflikty są rozwiązywane po stronie klienta: ConflictResolver w UI,
 * applyTripConflictResolution() w trips-storage (zapis do localStorage + ewentualny push).
 * Ten endpoint może w przyszłości zapisywać wybór w DB lub kolejce rozwiązań.
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    
    let body;
    try {
      body = validateConflictResolutionRequest(rawBody);
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          { success: false, error: "Invalid request data", details: error.issues } as unknown as ConflictResolutionResponse,
          { status: 400 }
        );
      }
      throw error;
    }

    // Future: persist resolution in DB / conflicts table. Client-side resolution is in use.

    const response: ConflictResolutionResponse = {
      success: true,
      resolvedConflict: {
        id: body.conflictId,
        entityType: "trip", // TODO: Fetch from database when implementing
        entityId: "",
        localVersion: 0,
        remoteVersion: 0,
        localData: {},
        remoteData: {},
        localTimestamp: new Date().toISOString(),
        remoteTimestamp: new Date().toISOString(),
        deviceId: "",
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error resolving conflict:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        error: `Failed to resolve conflict: ${errorMessage}`,
      } as ConflictResolutionResponse,
      { status: 500 }
    );
  }
}
