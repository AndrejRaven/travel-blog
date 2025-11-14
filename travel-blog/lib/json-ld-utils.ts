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
    
    // Podstawowa walidacja Schema.org - sprawdź czy ma @context i @type
    try {
      const parsed = JSON.parse(json);
      if (typeof parsed === "object" && parsed !== null) {
        if (!parsed["@context"]) {
          console.warn("JSON-LD missing @context");
        }
        if (!parsed["@type"]) {
          console.warn("JSON-LD missing @type");
        }
      }
    } catch {
      // Ignoruj błędy parsowania - to może być poprawny JSON-LD
    }
    
    return json;
  } catch (e) {
    console.error("Invalid JSON-LD data", e);
    return null;
  }
}

