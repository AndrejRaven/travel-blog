"use client";

import React from "react";
import Button from "@/components/ui/Button";
import { useCookies } from "@/lib/useCookies";
import { useAnalytics } from "@/lib/cookie-analytics";

interface TrackedButtonProps
  extends React.ComponentPropsWithoutRef<typeof Button> {
  children: React.ReactNode;
  onClick?: () => void;
  trackingName: string;
  variant?: "primary" | "secondary" | "outline" | "youtube";
  className?: string;
}

export function TrackedButton({
  children,
  onClick,
  trackingName,
  variant = "primary",
  className = "",
  ...props
}: TrackedButtonProps) {
  const { isAllowed } = useCookies();
  const analytics = useAnalytics();

  const handleClick = () => {
    // Sprawdź czy użytkownik wyraził zgodę na analityczne cookies
    if (isAllowed("analytics")) {
      analytics.trackEvent("button_click", {
        button_name: trackingName,
        page: window.location.pathname,
      });
    }
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
