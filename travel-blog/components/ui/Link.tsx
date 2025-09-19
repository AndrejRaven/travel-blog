import React from "react";
import NextLink from "next/link";

type LinkVariant = "default" | "arrow" | "underline";

type LinkProps = {
  children: React.ReactNode;
  href: string;
  variant?: LinkVariant;
  className?: string;
  external?: boolean;
};

const variantStyles = {
  default:
    "text-sm font-sans text-gray-900 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200",
  arrow:
    "inline-flex items-center gap-1 text-sm font-sans font-medium text-gray-900 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-300 group hover:scale-105",
  underline:
    "text-sm font-sans text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-300 hover:scale-105 relative group",
};

export default function Link({
  children,
  href,
  variant = "default",
  className = "",
  external = false,
}: LinkProps) {
  const variantStyle = variantStyles[variant];
  const combinedClassName = `${variantStyle} ${className}`.trim();

  // Sprawdź czy href nie jest pusty
  if (!href || href.trim() === "") {
    return <span className={combinedClassName}>{children}</span>;
  }

  if (external) {
    return (
      <a
        href={href}
        className={combinedClassName}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
        {variant === "arrow" && (
          <span className="group-hover:translate-x-1 transition-transform duration-200 ease-out">
            →
          </span>
        )}
        {variant === "underline" && (
          <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-current group-hover:w-full transition-all duration-300 ease-out"></span>
        )}
      </a>
    );
  }

  return (
    <NextLink href={href} className={combinedClassName}>
      {children}
      {variant === "arrow" && (
        <span className="group-hover:translate-x-1 transition-transform duration-200 ease-out">
          →
        </span>
      )}
      {variant === "underline" && (
        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-current group-hover:w-full transition-all duration-300 ease-out"></span>
      )}
    </NextLink>
  );
}
