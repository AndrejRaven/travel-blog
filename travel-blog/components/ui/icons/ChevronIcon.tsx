import React from "react";

type ChevronIconProps = {
  className?: string;
  "aria-hidden"?: boolean;
};

export default function ChevronIcon({
  className,
  "aria-hidden": ariaHidden = true,
}: ChevronIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden={ariaHidden}
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.177l3.71-3.946a.75.75 0 111.08 1.04l-4.24 4.51a.75.75 0 01-1.08 0l-4.24-4.51a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}
