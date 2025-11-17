type JsonLdData = string | Record<string, unknown> | null | undefined;

interface JsonLdScriptProps {
  id?: string;
  data: JsonLdData;
}

export default function JsonLdScript({ id, data }: JsonLdScriptProps) {
  if (!data) {
    return null;
  }

  const payload = typeof data === "string" ? data : JSON.stringify(data);

  return (
    <script
      id={id}
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: payload }}
    />
  );
}

