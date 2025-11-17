import { headers } from "next/headers";

type JsonLdData = string | Record<string, unknown> | null | undefined;

interface JsonLdScriptProps {
  id?: string;
  data: JsonLdData;
}

export default async function JsonLdScript({ id, data }: JsonLdScriptProps) {
  if (!data) {
    return null;
  }

  const nonce = (await headers()).get("x-csp-nonce") || undefined;
  const payload = typeof data === "string" ? data : JSON.stringify(data);

  return (
    <script
      id={id}
      type="application/ld+json"
      nonce={nonce}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: payload }}
    />
  );
}

