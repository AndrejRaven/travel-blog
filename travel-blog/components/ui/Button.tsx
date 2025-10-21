import React from "react";
import Link from "@/components/ui/Link";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "outlinewhite"
  | "youtube"
  | "danger";

type ButtonProps = {
  children: React.ReactNode;
  href?: string;
  variant?: ButtonVariant;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  external?: boolean;
  type?: "button" | "submit" | "reset";
};

const variantStyles = {
  primary:
    "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:text-gray-900 dark:hover:text-gray-100 focus:ring-gray-500 dark:focus:ring-gray-400 relative overflow-hidden group before:absolute before:inset-0 before:bg-white dark:before:bg-gray-900 before:-translate-x-full before:transition-transform before:duration-300 before:ease-out hover:before:translate-x-0 before:-z-10 hover:shadow-lg hover:scale-105 transition-all duration-300 ease-out transition-transform duration-150 ease-out uppercase border border-gray-900 dark:border-gray-100",
  secondary:
    "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 hover:text-white dark:hover:text-gray-900 focus:ring-gray-500 dark:focus:ring-gray-400 relative overflow-hidden group before:absolute before:inset-0 before:bg-gray-900 dark:before:bg-gray-100 before:translate-x-full before:transition-transform before:duration-300 before:ease-out hover:before:translate-x-0 before:-z-10 hover:shadow-lg hover:scale-105 transition-all duration-300 ease-out transition-transform duration-150 ease-out uppercase border border-white dark:border-gray-900",
  outline:
    "border border-gray-900 dark:border-white text-gray-900 dark:text-white hover:text-gray-900 dark:hover:text-white focus:ring-gray-500 dark:focus:ring-gray-400 transition-all duration-300 ease-out hover:shadow-md hover:scale-105 hover:backdrop-blur-sm transition-transform duration-150 ease-out uppercase",
  outlinewhite:
    "border border-white text-white hover:text-white focus:ring-white transition-all duration-300 ease-out hover:shadow-md hover:scale-105 hover:backdrop-blur-sm transition-transform duration-150 ease-out uppercase",
  youtube:
    "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 relative overflow-hidden group before:absolute before:inset-0 before:bg-red-500 before:-translate-x-full before:transition-transform before:duration-300 before:ease-out hover:before:translate-x-0 before:-z-10 hover:shadow-lg hover:scale-105 transition-all duration-300 ease-out transition-transform duration-150 ease-out uppercase border border-red-600",
  danger:
    "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 transition-all duration-300 ease-out hover:shadow-lg hover:scale-105 transition-transform duration-150 ease-out uppercase border border-red-600",
};

export default function Button({
  children,
  href,
  variant = "primary",
  className = "",
  onClick,
  disabled = false,
  external = false,
  type = "button",
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center rounded-md px-8 py-2 text-sm font-sans font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed relative z-10";
  const variantStyle = variantStyles[variant];
  const combinedClassName = `${baseStyles} ${variantStyle} ${className}`.trim();

  if (href && href.trim() !== "") {
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
      type={type}
      className={combinedClassName}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
