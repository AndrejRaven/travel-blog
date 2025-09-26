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
    ? "text-3xl md:text-3xl font-serif font-semibold mb-4 text-gray-900 dark:text-gray-100"
    : "text-3xl md:text-3xl font-serif font-semibold mb-4 text-gray-900 dark:text-gray-100";

  const descriptionClass = centered
    ? "text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
    : "text-gray-600 dark:text-gray-400";

  return (
    <div className={`${containerClass} ${className}`}>
      <div>
        <h2 className={titleClass}>
          <strong>{title}</strong>
        </h2>
        {description && <p className={descriptionClass}>{description}</p>}
      </div>
    </div>
  );
}
