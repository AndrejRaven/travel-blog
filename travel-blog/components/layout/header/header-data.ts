import { HeaderData, MenuItem, DropdownSection, DropdownItem, SubmenuItem } from '@/lib/sanity';

export type LegacyMenuItem = {
  label: string;
  href: string;
  isExternal?: boolean;
};

export type SectionKey = "places" | "guides" | "culture";

export type Section = {
  key: SectionKey;
  title: string;
  emoji: string;
  items: LegacyMenuItem[];
};

// Funkcja do konwersji danych z Sanity na format używany w komponentach
export function getSectionsFromHeaderData(headerData: HeaderData | null): Section[] {
  if (!headerData?.categoriesDropdown?.sections) {
    return [];
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

// Funkcja do pobierania nowego menu z Sanity
export function getMainMenuFromHeaderData(headerData: HeaderData | null): MenuItem[] {
  if (!headerData?.mainMenu) {
    return [];
  }

  return headerData.mainMenu;
}

// Puste sections - dane będą pobierane z Sanity
export const sections: Section[] = [];


