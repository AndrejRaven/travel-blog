import Image from "next/image";
import Link from "@/components/ui/Link";

export default function PostPage() {
  // Placeholder danych posta – do podmiany danymi z Sanity
  const post = {
    title: "Przykładowy tytuł posta",
    publishedAt: new Date().toISOString(),
    coverImage: "/window.svg",
    category: "Podróże",
    readingTime: "5 min",
    body: [
      "To jest przykładowy akapit wpisu na blogu. W prawdziwej wersji zostanie tu wyrenderowana treść z Sanity (Portable Text).",
      "Dodaj tu cytaty, listy, zdjęcia i wszystko, co chcesz – obecnie to tylko tekst zastępczy.",
      "Trzeci akapit dla wypełnienia – lorem ipsum dolor sit amet...",
    ],
  };

  const formattedDate = new Intl.DateTimeFormat("pl-PL", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  }).format(new Date(post.publishedAt));

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      {/* Meta: kategoria, data, czas czytania */}
      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-sans text-gray-600">
        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-sans">
          {post.category}
        </span>
        <span>•</span>
        <time dateTime={post.publishedAt}>{formattedDate}</time>
        <span>•</span>
        <span>{post.readingTime} czytania</span>
      </div>

      {/* Tytuł */}
      <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight mb-6">
        {post.title}
      </h1>

      {/* Okładka */}
      <div className="relative w-full aspect-[16/9] overflow-hidden rounded-2xl border bg-gray-50 mb-8">
        <Image
          src={post.coverImage}
          alt={post.title}
          fill
          className="object-contain p-6"
        />
      </div>

      {/* Treść – placeholder */}
      <article className="prose prose-gray max-w-none font-sans">
        {post.body.map((paragraph, idx) => (
          <p key={idx}>{paragraph}</p>
        ))}
      </article>

      {/* Stopka artykułu – nawigacja / udostępnienia */}
      <hr className="my-10 border-gray-200" />
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm font-sans text-gray-600">
        <div className="flex items-center gap-3">
          <span className="font-sans font-medium">Udostępnij:</span>
          <a href="#" className="hover:text-gray-900 dark:hover:text-gray-100">
            Facebook
          </a>
          <a href="#" className="hover:text-gray-900 dark:hover:text-gray-100">
            X
          </a>
          <a href="#" className="hover:text-gray-900 dark:hover:text-gray-100">
            LinkedIn
          </a>
        </div>
        <nav className="flex items-center gap-3">
          <Link href="#" variant="underline">
            ← Poprzedni
          </Link>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <Link href="#" variant="underline">
            Następny →
          </Link>
        </nav>
      </div>
    </main>
  );
}
