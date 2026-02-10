import { useState, useCallback } from "react";

/**
 * Universal hook for managing modal state with optional data
 * @template T - Type of data associated with the modal
 */
export function useModalState<T = void>() {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<T | null>(null);

  const open = useCallback((modalData?: T) => {
    setData((modalData ?? null) as T | null);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setData(null);
  }, []);

  return { isOpen, data, open, close };
}
