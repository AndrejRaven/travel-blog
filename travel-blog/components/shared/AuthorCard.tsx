import ResponsiveImage from "@/components/shared/ResponsiveImage";
import type { Author } from "@/lib/sanity";

type AuthorCardProps = {
  author: Author;
  className?: string;
};

export default function AuthorCard({ author, className = "" }: AuthorCardProps) {
  return (
    <section
      className={`rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/60 p-6 shadow-sm backdrop-blur ${className}`}
    >
      <div className="flex flex-col md:flex-row gap-6">
        <div className="relative h-24 w-24 md:h-28 md:w-28 rounded-full border-4 border-gray-100 dark:border-gray-800 overflow-hidden shadow-inner">
          <ResponsiveImage
            desktopImage={author.avatar}
            className="object-cover"
            fill
            sizes="112px"
            fallback={{
              src: "/demo-images/demo-asset.png",
              alt: author.name,
            }}
          />
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
              Autor artykułu
            </p>
            <h3 className="text-2xl font-serif font-bold text-gray-900 dark:text-gray-100">
              {author.name}
            </h3>
            {author.role && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {author.role}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

