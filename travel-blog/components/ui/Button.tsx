import React from "react";
import Link from "next/link";

type ButtonVariant = "primary" | "secondary" | "outline";

type ButtonProps = {
  children: React.ReactNode;
  href?: string;
  variant?: ButtonVariant;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  external?: boolean;
};

const variantStyles = {
  primary:
    "border border-gray-900 dark:border-gray-100 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:text-gray-900 dark:hover:text-gray-100 focus:ring-gray-500 dark:focus:ring-gray-400 relative overflow-hidden group before:absolute before:inset-0 before:bg-white dark:before:bg-gray-900 before:-translate-x-full before:transition-transform before:duration-300 before:ease-out hover:before:translate-x-0 before:-z-10 hover:shadow-lg hover:scale-105 transition-all duration-300 ease-out transition-transform duration-150 ease-out",
  secondary:
    " dark:border-gray-100 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 hover:text-white dark:hover:text-gray-900 focus:ring-gray-500 dark:focus:ring-gray-400 relative overflow-hidden group before:absolute before:inset-0 before:bg-gray-900 dark:before:bg-gray-100 before:translate-x-full before:transition-transform before:duration-300 before:ease-out hover:before:translate-x-0 before:-z-10 hover:shadow-lg hover:scale-105 transition-all duration-300 ease-out transition-transform duration-150 ease-out",
  outline:
    "border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-600 dark:hover:border-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:ring-gray-500 dark:focus:ring-gray-400 transition-all duration-300 ease-out hover:shadow-md hover:scale-105 transition-transform duration-150 ease-out",
};

export default function Button({
  children,
  href,
  variant = "primary",
  className = "",
  onClick,
  disabled = false,
  external = false,
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-sans font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed relative z-10";
  const variantStyle = variantStyles[variant];
  const combinedClassName = `${baseStyles} ${variantStyle} ${className}`.trim();

  if (href) {
    if (external) {
      return (
        <a
          href={href}
          className={combinedClassName}
          target="_blank"
          rel="noopener noreferrer"
        >
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={combinedClassName}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={combinedClassName}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
