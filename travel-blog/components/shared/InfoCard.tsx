import { ReactNode } from "react";

type InfoCardVariant = "blue" | "green" | "yellow" | "red" | "purple" | "gray";

type InfoCardProps = {
  children: ReactNode;
  variant?: InfoCardVariant;
  className?: string;
};

const variantStyles = {
  blue: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100",
  green:
    "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100",
  yellow:
    "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-100",
  red: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100",
  purple:
    "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-100",
  gray: "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300",
};

export default function InfoCard({
  children,
  variant = "blue",
  className = "",
}: InfoCardProps) {
  const baseStyles = "rounded-lg p-6 border";
  const variantStyle = variantStyles[variant];

  return (
    <div className={`${baseStyles} ${variantStyle} ${className}`}>
      {children}
    </div>
  );
}
