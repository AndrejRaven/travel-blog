import { ReactNode } from "react";

type PageLayoutProps = {
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl" | "6xl";
  className?: string;
};

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "4xl": "max-w-4xl",
  "6xl": "max-w-6xl",
};

export default function PageLayout({
  children,
  maxWidth = "4xl",
  className = "",
}: PageLayoutProps) {
  return (
    <div className="min-h-screen font-sans text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900">
      <div
        className={`mx-auto ${maxWidthClasses[maxWidth]} px-6 py-12 ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
