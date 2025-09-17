import React from "react";
import Link from "next/link";
import { RichTextBlock } from "@/lib/component-types";

type Props = {
  blocks: RichTextBlock[];
  className?: string;
  textColor?: "default" | "white";
};

export default function RichText({
  blocks,
  className = "",
  textColor = "default",
}: Props) {
  // Funkcja do generowania klas kolorów
  const getColorClasses = (style: string) => {
    if (textColor === "white") {
      switch (style) {
        case "h1":
          return "text-white";
        case "h2":
          return "text-white";
        case "h3":
          return "text-white";
        case "normal":
        default:
          return "text-white";
      }
    } else {
      switch (style) {
        case "h1":
          return "text-gray-900 dark:text-gray-100";
        case "h2":
          return "text-gray-900 dark:text-gray-100";
        case "h3":
          return "text-gray-900 dark:text-gray-100";
        case "normal":
        default:
          return "text-gray-600 dark:text-gray-300";
      }
    }
  };

  const renderBlock = (block: RichTextBlock) => {
    const { _key, style, children = [], markDefs = [] } = block;

    // Sprawdź czy blok ma wyrównanie tekstu
    const getTextAlignClass = () => {
      if (!children || children.length === 0) return "";

      // Sprawdź czy którykolwiek z children ma mark wyrównania
      const hasTextAlign = children.some((child: any) => {
        return (
          child.marks &&
          child.marks.some((mark: any) =>
            ["left", "center", "right", "justify"].includes(mark)
          )
        );
      });

      if (!hasTextAlign) return "";

      // Znajdź pierwszy mark wyrównania
      for (const child of children) {
        if (child.marks) {
          for (const mark of child.marks) {
            if (mark === "left") return "text-left";
            if (mark === "center") return "text-center";
            if (mark === "right") return "text-right";
            if (mark === "justify") return "text-justify";
          }
        }
      }

      return "";
    };

    // Renderuj children z markami (bez wyrównania)
    const renderChildren = () => {
      // Jeśli nie ma children lub children jest pusty, zwróć pusty element
      if (!children || children.length === 0) {
        return <span key={`empty-${_key}`}>&nbsp;</span>;
      }

      // Sprawdź czy wszystkie children są puste
      const hasContent = children.some(
        (child) => child.text && child.text.trim() !== ""
      );

      if (!hasContent) {
        return <span key={`empty-${_key}`}>&nbsp;</span>;
      }

      return children.map((child) => {
        // Sprawdź czy dziecko ma marki (oprócz wyrównania)
        const hasNonAlignMarks =
          child.marks &&
          child.marks.some(
            (mark: any) =>
              !["left", "center", "right", "justify"].includes(mark)
          );

        // Jeśli nie ma żadnych marków (oprócz wyrównania), zwróć tekst bezpośrednio
        if (!hasNonAlignMarks) {
          return child.text || "";
        }

        // Jeśli ma marki, utwórz element i aplikuj marki
        let element = <span key={child._key}>{child.text || ""}</span>;

        // Aplikuj marki (bold, italic, link, custom style, text align, etc.)
        if (child.marks) {
          child.marks.forEach((mark) => {
            if (mark === "strong") {
              element = <strong key={child._key}>{element}</strong>;
            } else if (mark === "em") {
              element = <em key={child._key}>{element}</em>;
            } else if (mark === "underline") {
              element = <u key={child._key}>{element}</u>;
            } else if (["left", "center", "right", "justify"].includes(mark)) {
              // Marki wyrównania są obsługiwane na poziomie bloku, więc je pomijamy
              // Nie tworzymy dodatkowych elementów HTML
            } else if (
              mark.startsWith("link-") ||
              markDefs.some((def) => def._key === mark && def._type === "link")
            ) {
              const linkDef = markDefs.find((def) => def._key === mark);
              if (linkDef) {
                // Określ URL na podstawie typu linku
                const href =
                  linkDef.linkType === "external"
                    ? linkDef.externalHref || "#"
                    : linkDef.internalHref || "#";

                // Dla linków zewnętrznych używaj zwykłego <a>, dla wewnętrznych Next.js Link
                if (linkDef.linkType === "external") {
                  element = (
                    <a
                      key={child._key}
                      href={href}
                      className="text-black dark:text-white hover:text-gray-700 dark:hover:text-gray-300 font-medium"
                      target={linkDef.blank ? "_blank" : undefined}
                      rel={linkDef.blank ? "noopener noreferrer" : undefined}
                    >
                      {element}
                    </a>
                  );
                } else {
                  element = (
                    <Link
                      key={child._key}
                      href={href}
                      className="text-black dark:text-white hover:text-gray-700 dark:hover:text-gray-300 font-medium"
                      target={linkDef.blank ? "_blank" : undefined}
                      rel={linkDef.blank ? "noopener noreferrer" : undefined}
                    >
                      {element}
                    </Link>
                  );
                }
              }
            } else if (
              mark.startsWith("customStyle-") ||
              markDefs.some(
                (def) => def._key === mark && def._type === "customStyle"
              )
            ) {
              const customStyleDef = markDefs.find((def) => def._key === mark);
              if (customStyleDef && customStyleDef.style) {
                const getCustomStyleClasses = (styleObj: any) => {
                  // Obsługa nowej struktury obiektowej z tablicami
                  if (typeof styleObj === "object" && styleObj !== null) {
                    const { links = [], margins = [], colors = [] } = styleObj;
                    const allStyles = [...links, ...margins, ...colors];

                    // Generuj klasy dla wszystkich wybranych stylów
                    const classes = allStyles
                      .map((style: string) => {
                        switch (style) {
                          case "link-primary":
                            return "text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium";
                          case "link-secondary":
                            return "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 font-medium";
                          case "margin-top":
                            return "block mt-4";
                          case "margin-bottom":
                            return "block mb-4";
                          case "highlight":
                            return "bg-yellow-200 dark:bg-yellow-800 px-1 py-0.5 rounded";
                          case "warning":
                            return "text-orange-600 dark:text-orange-400 font-medium";
                          case "success":
                            return "text-green-600 dark:text-green-400 font-medium";
                          case "error":
                            return "text-red-600 dark:text-red-400 font-medium";
                          case "info":
                            return "text-blue-600 dark:text-blue-400 font-medium";
                          default:
                            return "";
                        }
                      })
                      .filter(Boolean);

                    return classes.join(" ");
                  }

                  // Fallback dla starej struktury (string)
                  if (typeof styleObj === "string") {
                    switch (styleObj) {
                      case "link-primary":
                        return "text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium";
                      case "link-secondary":
                        return "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 font-medium";
                      case "margin-top":
                        return "block mt-4";
                      case "margin-bottom":
                        return "block mb-4";
                      case "highlight":
                        return "bg-yellow-200 dark:bg-yellow-800 px-1 py-0.5 rounded";
                      case "warning":
                        return "text-orange-600 dark:text-orange-400 font-medium";
                      case "success":
                        return "text-green-600 dark:text-green-400 font-medium";
                      case "error":
                        return "text-red-600 dark:text-red-400 font-medium";
                      case "info":
                        return "text-blue-600 dark:text-blue-400 font-medium";
                      default:
                        return "";
                    }
                  }

                  return "";
                };

                const styleClasses = getCustomStyleClasses(
                  customStyleDef.style
                );
                element = (
                  <span key={child._key} className={styleClasses}>
                    {element}
                  </span>
                );
              }
            } else {
              // Fallback dla nieznanych marków
            }
          });
        }

        return element;
      });
    };

    // Renderuj odpowiedni tag HTML na podstawie style
    const textAlignClass = getTextAlignClass();

    switch (style) {
      case "h1":
        return (
          <h1
            key={_key}
            className={`text-3xl md:text-5xl font-serif font-bold tracking-tight mb-4 ${getColorClasses(
              style
            )} ${textAlignClass}`}
          >
            {renderChildren()}
          </h1>
        );
      case "h2":
        return (
          <h2
            key={_key}
            className={`text-2xl md:text-3xl font-serif font-semibold mb-4 ${getColorClasses(
              style
            )} ${textAlignClass}`}
          >
            {renderChildren()}
          </h2>
        );
      case "h3":
        return (
          <h3
            key={_key}
            className={`text-xl md:text-2xl font-serif font-semibold mb-3 ${getColorClasses(
              style
            )} ${textAlignClass}`}
          >
            {renderChildren()}
          </h3>
        );
      case "normal":
      default:
        return (
          <p
            key={_key}
            className={`text-lg font-sans ${getColorClasses(
              style || "normal"
            )} ${textAlignClass}`}
          >
            {renderChildren()}
          </p>
        );
    }
  };

  return <div className={className}>{blocks?.map(renderBlock) || []}</div>;
}
