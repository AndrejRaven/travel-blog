/**
 * Funkcja pomocnicza do bezpiecznego renderowania JSON-LD
 */
export function safeJsonLd(data: unknown): string | null {
  try {
    // Walidacja że to obiekt JSON
    const json = JSON.stringify(data);
    
    // Sprawdzenie że nie zawiera <script> tagów
    if (json.includes("<script") || json.includes("</script>")) {
      console.error("JSON-LD contains script tags");
      return null;
    }
    
    return json;
  } catch (e) {
    console.error("Invalid JSON-LD data", e);
    return null;
  }
}

