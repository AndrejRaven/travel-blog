import React from "react";
import ChevronIcon from "@/components/ui/icons/ChevronIcon";

type ToggleChevronProps = {
  isOpen: boolean;
  className?: string;
  "aria-hidden"?: boolean;
  count?: number;
};

export default function ToggleChevron({
  isOpen,
  className,
  "aria-hidden": ariaHidden = true,
  count = 1,
}: ToggleChevronProps) {
  const icons = Array.from({ length: Math.max(1, count) });
  return (
    <>
      {icons.map((_, idx) => (
        <ChevronIcon
          key={idx}
          className={`${className ?? ""} ${
            isOpen ? "rotate-180" : "rotate-0"
          }`.trim()}
          aria-hidden={ariaHidden}
        />
      ))}
    </>
  );
}
