import React from "react";
import { ChevronDown } from "lucide-react";

type ChevronIconProps = {
  className?: string;
  "aria-hidden"?: boolean;
};

export default function ChevronIcon({
  className,
  "aria-hidden": ariaHidden = true,
}: ChevronIconProps) {
  return <ChevronDown className={className} aria-hidden={ariaHidden} />;
}
