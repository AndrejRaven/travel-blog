/**
 * Event system for synchronizing trip data across components
 * Allows components to automatically refresh when data changes
 */

export type TripEvent =
  | "trip:updated"
  | "trip:deleted"
  | "expense:added"
  | "expense:updated"
  | "expense:deleted"
  | "currency_transaction:added"
  | "currency_transaction:deleted"
  | "country:added"
  | "country:updated"
  | "country:deleted"
  | "location:added"
  | "location:updated"
  | "location:deleted"
  | "wallet:updated";

type EventCallback = (tripId: string, data?: unknown) => void;

class TripEventEmitter {
  private listeners: Map<TripEvent, Set<EventCallback>> = new Map();

  /**
   * Subscribe to an event
   */
  on(event: TripEvent, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  /**
   * Unsubscribe from an event
   */
  off(event: TripEvent, callback: EventCallback): void {
    this.listeners.get(event)?.delete(callback);
  }

  /**
   * Emit an event to all listeners
   */
  emit(event: TripEvent, tripId: string, data?: unknown): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(tripId, data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Remove all listeners for an event
   */
  removeAllListeners(event?: TripEvent): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Get number of listeners for an event
   */
  listenerCount(event: TripEvent): number {
    return this.listeners.get(event)?.size || 0;
  }
}

// Singleton instance
export const tripEvents = new TripEventEmitter();
