import { HeaderData } from "@/lib/sanity";
import { getHeaderData } from "@/lib/sanity";

// Globalny cache dla danych header
let headerDataCache: HeaderData | null = null;
let headerDataPromise: Promise<HeaderData | null> | null = null;

export const getCachedHeaderData = (): HeaderData | null => {
  console.log("🔍 getCachedHeaderData:", headerDataCache ? "HIT" : "MISS");
  return headerDataCache;
};

export const fetchHeaderData = async (): Promise<HeaderData | null> => {
  // Jeśli mamy już dane w cache, zwróć je
  if (headerDataCache) {
    console.log("✅ fetchHeaderData: CACHE HIT");
    return headerDataCache;
  }

  // Jeśli już trwa pobieranie, zwróć istniejący promise
  if (headerDataPromise) {
    console.log("⏳ fetchHeaderData: PROMISE EXISTS");
    return headerDataPromise;
  }

  // Rozpocznij nowe pobieranie
  console.log("🚀 fetchHeaderData: FETCHING FROM API");
  headerDataPromise = (async () => {
    try {
      const data = await getHeaderData();
      headerDataCache = data;
      console.log("✅ fetchHeaderData: DATA CACHED", data ? "SUCCESS" : "NULL");
      return data;
    } catch (error) {
      console.error("❌ Error fetching header data:", error);
      return null;
    }
  })();

  return headerDataPromise;
};

// Funkcja do resetowania cache (opcjonalnie)
export const clearHeaderCache = (): void => {
  headerDataCache = null;
  headerDataPromise = null;
};
