"use client";

import { useState, useEffect } from "react";
import { getThemeColor, generateThemeCSS } from "./theme-colors";

type Theme = "light" | "dark";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Sprawdź zapisany theme w localStorage lub preferencje systemu
    const savedTheme = localStorage.getItem("theme") as Theme;
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    
    const initialTheme = savedTheme || systemTheme;
    setTheme(initialTheme);
    
    // Zastosuj theme do document
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    
    // Zastosuj kolory theme do CSS custom properties
    const themeCSS = generateThemeCSS(initialTheme);
    Object.entries(themeCSS).forEach(([property, value]) => {
      document.documentElement.style.setProperty(property, value);
    });
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    
    // Zapisz w localStorage
    localStorage.setItem("theme", newTheme);
    
    // Zastosuj do document
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    
    // Zastosuj nowe kolory theme do CSS custom properties
    const themeCSS = generateThemeCSS(newTheme);
    Object.entries(themeCSS).forEach(([property, value]) => {
      document.documentElement.style.setProperty(property, value);
    });
  };

  return {
    theme,
    toggleTheme,
    mounted,
    getThemeColor: (colorKey: keyof typeof import("./theme-colors").themeColors) => 
      getThemeColor(colorKey, theme),
  };
}
