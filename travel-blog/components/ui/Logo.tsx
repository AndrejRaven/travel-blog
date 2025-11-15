"use client";

import { getImageUrl } from "@/lib/sanity";
import { HeaderData } from "@/lib/sanity";
import Link from "@/components/ui/Link";

interface LogoProps {
  headerData: HeaderData | null;
}

const Logo = ({ headerData }: LogoProps) => {
  if (!headerData) {
    return (
      <Link href="/" className="flex items-center gap-2 group">
        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
        <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </Link>
    );
  }

  const logoUrl = getImageUrl(headerData.logo);

  return (
    <Link href="/" className="flex items-center gap-2 group">
      {logoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={headerData.title}
          className="h-8 w-8 rounded-full object-cover"
          loading="lazy"
          decoding="async"
        />
      )}
      <span className="text-lg font-serif font-semibold tracking-tight transition-colors duration-200 group-hover:text-gray-900 dark:group-hover:text-gray-100">
        {headerData.title}
      </span>
    </Link>
  );
};

export default Logo;
