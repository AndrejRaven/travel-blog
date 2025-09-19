import { fetchGroq, Post } from "@/lib/sanity";
import PostPageClient from "@/components/pages/PostPageClient";

type Params = { params: Promise<{ slug: string }> };

async function getPost(slug: string) {
  const query = `*[_type == "post" && slug.current == $slug][0]{
    _id,
    title,
    subtitle,
    slug,
    publishedAt,
    categories[]-> {
      _id,
      name,
      slug,
      color
    },
    coverImage {
      asset-> {
        _id,
        url,
        metadata {
          dimensions {
            width,
            height
          }
        }
      },
      hotspot,
      crop
    },
    coverMobileImage {
      asset-> {
        _id,
        url,
        metadata {
          dimensions {
            width,
            height
          }
        }
      },
      hotspot,
      crop
    },
    components[] {
      _type,
      _key,
      ...,
      container {
        ...,
        "contentTitle": @.contentTitle
      },
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
          url,
          metadata {
            dimensions {
              width,
              height
            }
          }
        },
        hotspot,
        crop
      },
      images[] {
        asset-> {
          _id,
          url,
          metadata {
            dimensions {
              width,
              height
            }
          }
        },
        hotspot,
        crop,
        alt
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
      <div className="flex min-h-screen">
        <main className="flex-1 mx-auto max-w-3xl px-6 py-10">
          <h1 className="text-2xl font-serif font-semibold text-gray-900 dark:text-gray-100">
            Nie znaleziono posta
          </h1>
          <p className="text-gray-600 dark:text-gray-400 font-sans">
            Sprawdź adres URL lub wróć na stronę główną.
          </p>
        </main>
      </div>
    );
  }

  const formattedDate = post.publishedAt
    ? new Intl.DateTimeFormat("pl-PL", {
        year: "numeric",
        month: "long",
        day: "2-digit",
      }).format(new Date(post.publishedAt))
    : null;

  // Generuj spis treści na podstawie komponentów z tytułami treści
  const generateTableOfContents = () => {
    if (!post.components) return [];

    const generateId = (title: string) => {
      return (
        title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/^-+|-+$/g, "") // Usuń myślniki z początku i końca
          .replace(/^-/, "section-") // Jeśli zaczyna się od myślnika, dodaj prefix
          .trim() || "section"
      ); // Fallback jeśli pusty string
    };

    return post.components
      .filter(
        (component) =>
          component.container?.contentTitle &&
          component.container.contentTitle.trim() !== ""
      )
      .map((component, index) => ({
        id: generateId(component.container.contentTitle),
        title: component.container.contentTitle,
        level: 1, // Wszystkie sekcje na tym samym poziomie
      }));
  };

  const tableOfContentsItems = generateTableOfContents();

  return (
    <PostPageClient post={post} tableOfContentsItems={tableOfContentsItems} />
  );
}

export async function generateStaticParams() {
  const query = `*[_type == "post" && defined(slug.current)][].slug.current`;
  const slugs = await fetchGroq<string[]>(query);
  return slugs.map((slug) => ({ slug }));
}
