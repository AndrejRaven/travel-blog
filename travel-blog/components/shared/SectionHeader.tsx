import React from "react";

interface SectionHeaderProps {
  title: string;
  description?: string;
  centered?: boolean;
  className?: string;
}

export default function SectionHeader({
  title,
  description,
  centered = false,
  className = "",
}: SectionHeaderProps) {
  const containerClass = centered
    ? "text-center"
    : "flex items-center justify-between";

  const titleClass = centered
    ? "text-2xl md:text-3xl font-serif font-semibold text-gray-900 dark:text-gray-100 mb-4"
    : "text-2xl md:text-3xl font-serif font-semibold text-gray-900 dark:text-gray-100";

  const descriptionClass = centered
    ? "text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
    : "text-gray-600 dark:text-gray-400";

  return (
    <div className={`${containerClass} ${className}`}>
      <div>
        <h2 className={titleClass}>{title}</h2>
        {description && <p className={descriptionClass}>{description}</p>}
      </div>
    </div>
  );
}
