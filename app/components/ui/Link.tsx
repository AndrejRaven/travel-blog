import React from "react";
import Link from "next/link";

type LinkVariant = "default" | "secondary" | "destructive";
type LinkSize = "default" | "sm" | "lg";

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: LinkVariant;
  size?: LinkSize;
}

const CustomLink = React.forwardRef<HTMLAnchorElement, LinkProps>(
  (
    { className, variant = "default", size = "default", href, ...props },
    ref
  ) => {
    const baseClasses =
      "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background";

    const variantClasses = {
      default: "text-blue-600 hover:text-blue-600/60",
      secondary: "text-green-600 hover:text-green-600/60",
      destructive: "text-red-600 hover:text-red-600/60",
    };

    const sizeClasses = {
      default: "h-10 py-2 px-4",
      sm: "h-9 px-3 text-sm",
      lg: "h-11 px-8 text-2xl",
    };

    const classes = `${baseClasses} ${variantClasses[variant]} ${
      sizeClasses[size]
    } ${className || ""}`;

    return <Link className={classes} ref={ref} href={href} {...props} />;
  }
);

CustomLink.displayName = "CustomLink";

export { CustomLink };
