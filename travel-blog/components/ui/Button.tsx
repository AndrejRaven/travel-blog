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
  primary: "bg-gray-900 text-white hover:bg-gray-800 focus:ring-gray-500",
  secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500",
  outline:
    "border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500",
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
    "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
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
