/**
 * Mutex for sync operations to prevent race conditions
 * Ensures only one sync operation can run at a time
 */

class SyncMutex {
  private isLocked = false;
  private queue: Array<() => void> = [];

  /**
   * Acquires the lock. If already locked, waits until the lock is released.
   */
  async acquire(): Promise<() => void> {
    return new Promise((resolve) => {
      if (!this.isLocked) {
        this.isLocked = true;
        resolve(() => this.release());
      } else {
        this.queue.push(() => {
          this.isLocked = true;
          resolve(() => this.release());
        });
      }
    });
  }

  /**
   * Releases the lock and processes the next waiting operation
   */
  private release(): void {
    this.isLocked = false;
    const next = this.queue.shift();
    if (next) {
      next();
    }
  }

  /**
   * Checks if the mutex is currently locked
   */
  isAcquired(): boolean {
    return this.isLocked;
  }
}

// Singleton instance for sync operations
export const syncMutex = new SyncMutex();

/**
 * Executes a function with sync mutex lock
 * Ensures only one sync operation runs at a time
 */
export async function withSyncLock<T>(fn: () => Promise<T>): Promise<T> {
  const release = await syncMutex.acquire();
  try {
    return await fn();
  } finally {
    release();
  }
}
