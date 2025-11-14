/**
 * Sanitizuje SVG przed renderowaniem
 * Używamy dynamicznego importu DOMPurify tylko po stronie klienta
 */
export async function sanitizeSvg(svg: string): Promise<string> {
  if (typeof window === "undefined") {
    // Po stronie serwera - prostsza sanitizacja
    // Usuń potencjalnie niebezpieczne atrybuty i skrypty
    return svg
      .replace(/<script[^>]*>.*?<\/script>/gi, "")
      .replace(/on\w+="[^"]*"/gi, "")
      .replace(/on\w+='[^']*'/gi, "")
      .replace(/javascript:/gi, "");
  }

  // Po stronie klienta - użyj DOMPurify
  const DOMPurify = (await import("isomorphic-dompurify")).default;
  return DOMPurify.sanitize(svg, {
    USE_PROFILES: { svg: true, svgFilters: true },
    ALLOWED_TAGS: [
      "svg",
      "path",
      "circle",
      "rect",
      "line",
      "polyline",
      "polygon",
      "g",
    ],
    ALLOWED_ATTR: [
      "d",
      "fill",
      "stroke",
      "stroke-width",
      "viewBox",
      "width",
      "height",
      "x",
      "y",
      "cx",
      "cy",
      "r",
    ],
  });
}

