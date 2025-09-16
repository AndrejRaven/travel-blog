"use client";

import { useEffect } from "react";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const updateTheme = () => {
      // Sprawdź zapisany theme w localStorage lub preferencje systemu
      const savedTheme = localStorage.getItem("theme");
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";

      const theme = savedTheme || systemTheme;

      // Zastosuj theme do document
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    // Ustaw początkowy theme
    updateTheme();

    // Listener dla zmian w localStorage (gdy theme jest zmieniany przez inne komponenty)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "theme") {
        updateTheme();
      }
    };

    // Listener dla zmian w preferencjach systemu
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = () => {
      if (!localStorage.getItem("theme")) {
        updateTheme();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    mediaQuery.addEventListener("change", handleSystemThemeChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
    };
  }, []);

  return <>{children}</>;
}
