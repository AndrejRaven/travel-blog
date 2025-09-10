import Image from "next/image";
import { fetchGroq, Post } from "@/lib/sanity";
import ComponentRenderer from "@/components/ui/ComponentRenderer";
import { PostComponent } from "@/lib/component-types";

type Params = { params: Promise<{ slug: string }> };

async function getPost(slug: string) {
  const query = `*[_type == "post" && slug.current == $slug][0]{
    _id,
    title,
    slug,
    publishedAt,
    "coverImage": coalesce(coverImage.asset->url, null),
    components[] {
      _type,
      _key,
      ...,
      content[] {
        ...,
        children[] {
          ...,
          marks[],
          markDefs[] {
            ...,
            _type == "link" => {
              ...,
              "href": @.href,
              "blank": @.blank
            },
            _type == "customStyle" => {
              ...,
              "style": @.style
            }
          }
        }
      },
      image {
        asset-> {
          _id,
          url
        }
      },
      buttons[] {
        ...,
        _type == "button" => {
          ...,
          "label": @.label,
          "href": @.href,
          "variant": @.variant,
          "external": @.external
        }
      }
    }
  }`;
  return fetchGroq<Post | null>(query, { slug });
}

export default async function PostPage({ params }: Params) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-serif font-semibold">
          Nie znaleziono posta
        </h1>
        <p className="text-gray-600 font-sans">
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
    <main>
      {/* Meta - tylko jeśli nie ma komponentów lub pierwszy komponent nie jest banerem */}
      {(!post.components ||
        post.components.length === 0 ||
        (post.components[0]?._type !== "heroBanner" &&
          post.components[0]?._type !== "backgroundHeroBanner")) && (
        <div className="mx-auto max-w-3xl px-6 py-10">
          <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-sans text-gray-600">
            {formattedDate ? (
              <time dateTime={post.publishedAt}>{formattedDate}</time>
            ) : null}
          </div>

          {/* Tytuł */}
          <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight mb-6">
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
        </div>
      )}

      {/* Komponenty */}
      {post.components && post.components.length > 0 ? (
        post.components.map((component) => (
          <ComponentRenderer
            key={component._key}
            component={component as PostComponent}
          />
        ))
      ) : (
        <div className="mx-auto max-w-3xl px-6 py-10">
          <p className="text-gray-600 font-sans">Brak treści.</p>
        </div>
      )}
    </main>
  );
}

export async function generateStaticParams() {
  const query = `*[_type == "post" && defined(slug.current)][].slug.current`;
  const slugs = await fetchGroq<string[]>(query);
  return slugs.map((slug) => ({ slug }));
}
