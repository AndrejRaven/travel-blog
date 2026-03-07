/**
 * Validation schemas for sync API routes using Zod
 */

import { z } from "zod";

/**
 * Entity types for sync operations
 */
export const EntityTypeSchema = z.enum([
  "trip",
  "expense",
  "exchange",
  "country",
  "budget_adjustment",
]);

/**
 * Sync operation schema
 */
export const SyncOperationSchema = z.object({
  id: z.string().min(1).max(255),
  type: z.enum(["CREATE", "UPDATE", "DELETE"]),
  entityType: EntityTypeSchema,
  entityId: z.string().min(1).max(255),
  data: z.unknown(),
  timestamp: z.string().datetime(),
  deviceId: z.string().min(1).max(255),
  version: z.number().int().positive().optional(),
});

/**
 * Sync pull request schema
 */
export const SyncPullRequestSchema = z.object({
  deviceId: z.string().min(1).max(255),
  lastSyncAt: z.string().datetime().nullable(),
  version: z.number().int().nonnegative(),
});

/**
 * Sync push request schema with limits
 */
export const SyncPushRequestSchema = z.object({
  deviceId: z.string().min(1).max(255),
  operations: z
    .array(SyncOperationSchema)
    .min(0)
    .max(1000), // Max 1000 operations per request
  version: z.number().int().nonnegative(),
});

/**
 * Conflict resolution request schema
 */
export const ConflictResolutionRequestSchema = z.object({
  conflictId: z.string().min(1).max(255),
  resolution: z.enum(["local", "remote", "merge"]),
  mergedData: z.unknown().optional(),
});

/**
 * Validates and parses sync pull request
 */
export function validateSyncPullRequest(
  data: unknown
): z.infer<typeof SyncPullRequestSchema> {
  return SyncPullRequestSchema.parse(data);
}

/**
 * Validates and parses sync push request
 */
export function validateSyncPushRequest(
  data: unknown
): z.infer<typeof SyncPushRequestSchema> {
  return SyncPushRequestSchema.parse(data);
}

/**
 * Validates and parses conflict resolution request
 */
export function validateConflictResolutionRequest(
  data: unknown
): z.infer<typeof ConflictResolutionRequestSchema> {
  return ConflictResolutionRequestSchema.parse(data);
}
