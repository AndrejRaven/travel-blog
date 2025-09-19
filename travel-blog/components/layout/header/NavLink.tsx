import React from "react";
import Link from "@/components/ui/Link";

type NavLinkProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
  external?: boolean;
};

export default function NavLink({
  href,
  children,
  className,
  external = false,
}: NavLinkProps) {
  // Sprawdź czy href nie jest pusty
  if (!href || href.trim() === "") {
    return <span className={className}>{children}</span>;
  }

  if (external) {
    return (
      <a
        href={href}
        className={className}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
