import { HeaderData } from '@/lib/sanity';
import { headerFallback } from '@/lib/header-fallback';

export type MenuItem = {
  label: string;
  href: string;
  isExternal?: boolean;
};

export type SectionKey = "places" | "guides" | "culture";

export type Section = {
  key: SectionKey;
  title: string;
  emoji: string;
  items: MenuItem[];
};

// Funkcja do konwersji danych z Sanity na format używany w komponentach
export function getSectionsFromHeaderData(headerData: HeaderData | null): Section[] {
  if (!headerData?.categoriesDropdown?.sections) {
    return headerFallback.categoriesDropdown.sections as Section[];
  }

  return headerData.categoriesDropdown.sections.map(section => ({
    key: section.key as SectionKey,
    title: section.title,
    emoji: section.emoji,
    items: section.items.map(item => ({
      label: item.label,
      href: item.href,
      isExternal: item.isExternal || false,
    })),
  }));
}

// Fallback data dla kompatybilności wstecznej
export const sections: Section[] = headerFallback.categoriesDropdown.sections as Section[];


