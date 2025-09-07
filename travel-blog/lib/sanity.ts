export const projectId = "k5fsny25";
export const dataset = "production";
export const apiVersion = "2023-10-10";

type GroqParams = Record<string, unknown>;

export async function fetchGroq<T>(query: string, params: GroqParams = {}): Promise<T> {
  const url = `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, params }),
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Sanity query failed: ${res.status} ${res.statusText} ${text}`);
  }
  const data = await res.json();
  return data.result as T;
}

export type PortableBlock = {
  _key: string;
  _type: string;
  children?: Array<{ _key: string; _type: string; text?: string }>;
};

export type Post = {
  _id: string;
  title: string;
  slug?: { current: string };
  publishedAt?: string;
  coverImage?: { asset?: { url?: string } } | string | null;
  body?: PortableBlock[];
};


