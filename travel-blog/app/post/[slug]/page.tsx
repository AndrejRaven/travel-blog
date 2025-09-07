import Image from "next/image";
import { fetchGroq, Post } from "@/lib/sanity";

type Params = { params: { slug: string } };

async function getPost(slug: string) {
  const query = `*[_type == "post" && slug.current == $slug][0]{
    _id,
    title,
    slug,
    publishedAt,
    "coverImage": coalesce(coverImage.asset->url, null),
    body
  }`;
  return fetchGroq<Post | null>(query, { slug });
}

export default async function PostPage({ params }: Params) {
  const post = await getPost(params.slug);

  if (!post) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-semibold">Nie znaleziono posta</h1>
        <p className="text-gray-600">
          Sprawdź adres URL lub wróć na stronę główną.
        </p>
      </main>
    );
  }

  const formattedDate = post.publishedAt
    ? new Intl.DateTimeFormat("pl-PL", {
        year: "numeric",
        month: "long",
        day: "2-digit",
      }).format(new Date(post.publishedAt))
    : null;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      {/* Meta */}
      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-gray-600">
        {formattedDate ? (
          <time dateTime={post.publishedAt}>{formattedDate}</time>
        ) : null}
      </div>

      {/* Tytuł */}
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
        {post.title}
      </h1>

      {/* Okładka */}
      {post.coverImage ? (
        <div className="relative w-full aspect-[16/9] overflow-hidden rounded-2xl border bg-gray-50 mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.coverImage as string}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      ) : null}

      {/* Treść – prosty render tekstu z blocków */}
      <article className="prose prose-gray max-w-none">
        {Array.isArray(post.body) && post.body.length > 0 ? (
          post.body.map((block) => {
            if (block._type === "block") {
              const text = (block.children || [])
                .map((c) => (typeof c.text === "string" ? c.text : ""))
                .join("");
              return <p key={block._key}>{text}</p>;
            }
            return null;
          })
        ) : (
          <p className="text-gray-600">Brak treści.</p>
        )}
      </article>
    </main>
  );
}

export async function generateStaticParams() {
  const query = `*[_type == "post" && defined(slug.current)][].slug.current`;
  const slugs = await fetchGroq<string[]>(query);
  return slugs.map((slug) => ({ slug }));
}
