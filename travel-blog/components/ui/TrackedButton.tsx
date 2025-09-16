"use client";

import React from "react";
import Button from "@/components/ui/Button";
import { useCookieExamples } from "@/lib/cookie-examples";

interface TrackedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  trackingName: string;
  variant?: "primary" | "secondary" | "outline" | "youtube";
  className?: string;
  [key: string]: any;
}

export function TrackedButton({
  children,
  onClick,
  trackingName,
  variant = "primary",
  className = "",
  ...props
}: TrackedButtonProps) {
  const { trackButtonClick } = useCookieExamples();

  const handleClick = () => {
    trackButtonClick(trackingName);
    onClick?.();
  };

  return (
    <Button
      onClick={handleClick}
      variant={variant}
      className={className}
      {...props}
    >
      {children}
    </Button>
  );
}

export default TrackedButton;
