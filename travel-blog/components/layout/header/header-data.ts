import { HeaderData, MenuItem, SuperCategory, MainCategory, Category } from '@/lib/sanity';
import { fetchGroq } from '@/lib/sanity';
import { QUERIES } from '@/lib/queries';

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

export type HierarchicalSection = {
  key: string;
  title: string;
  emoji: string;
  items: Array<{
    label: string;
    href: string;
    isExternal?: boolean;
    subcategories?: Array<{
      label: string;
      href: string;
      isExternal?: boolean;
    }>;
  }>;
};

// Funkcja do pobierania hierarchicznych kategorii
export async function getHierarchicalCategories(): Promise<HierarchicalSection[]> {
  try {
    const [superCategories, mainCategories, allCategories] = await Promise.all([
      fetchGroq<SuperCategory[]>(QUERIES.SUPER_CATEGORY.ALL, {}, "CATEGORIES"),
      fetchGroq<MainCategory[]>(QUERIES.MAIN_CATEGORY.ALL, {}, "CATEGORIES"),
      fetchGroq<Category[]>(QUERIES.CATEGORY.ALL, {}, "CATEGORIES")
    ]);

    return superCategories.map(superCategory => {
      const relatedMainCategories = mainCategories.filter(mainCat => 
        mainCat.superCategory?._id === superCategory._id
      );

      return {
        key: superCategory.slug.current,
        title: superCategory.name,
        emoji: getCategoryEmoji(superCategory.name),
        items: relatedMainCategories.map(mainCategory => {
          const subcategories = allCategories.filter(cat => 
            cat.mainCategory?._id === mainCategory._id
          );

          return {
            label: mainCategory.name,
            href: `/${superCategory.slug.current}/${mainCategory.slug.current}`,
            isExternal: false,
            subcategories: subcategories.map(sub => ({
              label: sub.name,
              href: `/${superCategory.slug.current}/${mainCategory.slug.current}/${sub.slug.current}`,
              isExternal: false,
            }))
          };
        })
      };
    });
  } catch (error) {
    console.error('Error fetching hierarchical categories:', error);
    return [];
  }
}

// Funkcja do mapowania nazw kategorii na emoji
function getCategoryEmoji(categoryName: string): string {
  const emojiMap: Record<string, string> = {
    'Kierunki': '🗺️',
    'Porady': '💡',
    'Azja': '🌏',
    'Europa': '🌍',
    'Ameryka': '🌎',
    'Afryka': '🌍',
    'Oceania': '🌏',
  };
  
  return emojiMap[categoryName] || '📁';
}

// Funkcja do konwersji danych z Sanity na format używany w komponentach (legacy)
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


