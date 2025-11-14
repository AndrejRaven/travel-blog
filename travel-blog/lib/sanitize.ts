/**
 * Sanitizuje tekst komentarza - usuwa wszystkie tagi HTML
 * Używamy prostszej sanitizacji bez DOMPurify, aby uniknąć problemów z jsdom w środowisku serwerowym
 */
export function sanitizeComment(content: string): string {
  if (!content || typeof content !== "string") {
    return "";
  }

  // Usuń wszystkie tagi HTML używając regex
  // Najpierw dekoduj encje HTML
  let sanitized = content
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Usuń wszystkie tagi HTML
  sanitized = sanitized.replace(/<[^>]*>/g, "");

  // Usuń encje HTML (ponownie, na wypadek gdyby były podwójnie zakodowane)
  sanitized = sanitized
    .replace(/&lt;/g, "")
    .replace(/&gt;/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");

  // Usuń nadmiarowe białe znaki
  sanitized = sanitized.replace(/\s+/g, " ").trim();

  return sanitized;
}

