import React from "react";

type NavLinkProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
};

export default function NavLink({ href, children, className }: NavLinkProps) {
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}
