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
    console.log("Rendering block:", { _key, style, children, markDefs }); // Debug

    // Renderuj children z markami
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
        let element = <span key={child._key}>{child.text || ""}</span>;

        // Aplikuj marki (bold, italic, link, custom style, etc.)
        if (child.marks) {
          console.log("Child marks:", child.marks); // Debug
          child.marks.forEach((mark) => {
            if (mark === "strong") {
              element = <strong key={child._key}>{element}</strong>;
            } else if (mark === "em") {
              element = <em key={child._key}>{element}</em>;
            } else if (
              mark.startsWith("link-") ||
              markDefs.some((def) => def._key === mark && def._type === "link")
            ) {
              const linkDef = markDefs.find((def) => def._key === mark);
              console.log("Link mark:", mark, "Def:", linkDef); // Debug
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
              console.log("Custom style mark:", mark, "Def:", customStyleDef); // Debug
              if (customStyleDef && customStyleDef.style) {
                const getCustomStyleClasses = (style: string) => {
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
              console.log("Unknown mark:", mark);
            }
          });
        }

        return element;
      });
    };

    // Renderuj odpowiedni tag HTML na podstawie style
    switch (style) {
      case "h1":
        return (
          <h1
            key={_key}
            className={`text-3xl md:text-5xl font-serif font-bold tracking-tight mb-4 ${getColorClasses(
              style
            )}`}
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
            )}`}
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
            )}`}
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
            )}`}
          >
            {renderChildren()}
          </p>
        );
    }
  };

  return <div className={className}>{blocks?.map(renderBlock) || []}</div>;
}
