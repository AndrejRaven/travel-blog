import Link from "@/components/ui/Link";

interface CategoryBadgeProps {
  category: {
    _id: string;
    name: string;
    slug: { current: string };
    color: string;
  };
  className?: string;
  showLink?: boolean;
}

export default function CategoryBadge({
  category,
  className = "",
  showLink = true,
}: CategoryBadgeProps) {
  const getCategoryColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      green:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      yellow:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
      red: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
      purple:
        "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
      gray: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
    };
    return colorMap[color] || colorMap.gray;
  };

  const badgeClasses = `inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColorClasses(
    category.color
  )} hover:opacity-80 transition-opacity duration-200 ${className}`;

  if (showLink) {
    return (
      <Link href={`/${category.slug.current}`} className={badgeClasses}>
        {category.name}
      </Link>
    );
  }

  return <span className={badgeClasses}>{category.name}</span>;
}
