import React from "react";

type CircleIconProps = {
  className?: string;
  "aria-hidden"?: boolean;
};

export default function CircleIcon({
  className,
  "aria-hidden": ariaHidden = true,
}: CircleIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden={ariaHidden}
    >
      <path d="M10 2a6 6 0 100 12A6 6 0 0010 2z" />
    </svg>
  );
}
