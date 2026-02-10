import { useEffect } from "react";
import { useToast } from "@/components/ui/Toast";

/**
 * Hook for handling sessionStorage toast notifications
 * @param key - sessionStorage key to check
 * @param slug - Optional slug to match against stored data
 */
export function useSessionNotification(key: string, slug?: string) {
  const { addToast } = useToast();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const data = sessionStorage.getItem(key);
    if (!data) return;

    try {
      const parsed = JSON.parse(data);
      if (!slug || parsed.slug === slug) {
        setTimeout(() => {
          addToast(parsed.toast);
          sessionStorage.removeItem(key);
        }, 300);
      }
    } catch {
      sessionStorage.removeItem(key);
    }
  }, [key, slug, addToast]);
}
