import React from "react";
import { Circle } from "lucide-react";

type CircleIconProps = {
  className?: string;
  "aria-hidden"?: boolean;
};

export default function CircleIcon({
  className,
  "aria-hidden": ariaHidden = true,
}: CircleIconProps) {
  return <Circle className={className} aria-hidden={ariaHidden} />;
}
