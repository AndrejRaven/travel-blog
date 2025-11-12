import React from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
import { RichTextBlock } from "@/lib/component-types";

type Props = {
  blocks: RichTextBlock[];
  className?: string;
  textColor?: "default" | "white";
};

// Stałe dla kolorów
const COLOR_CLASSES = {
  white: {
    heading: "text-white",
    text: "text-white",
  },
  default: {
    heading: "text-gray-900 dark:text-gray-100",
    text: "text-gray-600 dark:text-gray-300",
  },
};

export default function RichText({
  blocks,
  className = "",
  textColor = "default",
}: Props) {
  // Uproszczona funkcja kolorów
  const getColorClasses = (style: string) => {
    const colors = COLOR_CLASSES[textColor];
    return style === "normal" ? colors.text : colors.heading;
  };

  // Type for list group
  type ListGroup = {
    type: "list";
    listType: "bullet" | "number";
    items: RichTextBlock[];
  };

  // Funkcja do grupowania bloków w listy
  const groupBlocksIntoLists = (
    blocks: RichTextBlock[]
  ): (RichTextBlock | ListGroup)[] => {
    const result: (RichTextBlock | ListGroup)[] = [];
    let currentList: ListGroup | null = null;

    for (const block of blocks) {
      if (block.listItem) {
        // To jest element listy
        if (!currentList || currentList.listType !== block.listItem) {
          // Zakończ poprzednią listę jeśli istnieje
          if (currentList) {
            result.push(currentList);
          }
          // Rozpocznij nową listę
          currentList = {
            type: "list",
            listType: block.listItem,
            items: [],
          };
        }
        currentList.items.push(block);
      } else {
        // To nie jest element listy
        // Zakończ poprzednią listę jeśli istnieje
        if (currentList) {
          result.push(currentList);
          currentList = null;
        }
        result.push(block);
      }
    }

    // Zakończ ostatnią listę jeśli istnieje
    if (currentList) {
      result.push(currentList);
    }

    return result;
  };

  // Funkcja do pobierania klasy wyrównania tekstu
  const getTextAlignClass = (children: RichTextBlock["children"]) => {
    if (!children?.length) return "";

    const alignMarks = ["left", "center", "right", "justify"];
    const alignMap = {
      left: "text-left",
      center: "text-center",
      right: "text-right",
      justify: "text-justify",
    };

    for (const child of children) {
      if (child.marks) {
        for (const mark of child.marks) {
          if (alignMarks.includes(mark)) {
            return alignMap[mark as keyof typeof alignMap];
          }
        }
      }
    }
    return "";
  };

  const renderBlock = (block: RichTextBlock) => {
    const { _key, style, children = [], markDefs = [] } = block;

    // Renderuj pojedynczy child z markami
    const renderChild = (child: RichTextBlock["children"][number]) => {
      if (!child.text?.trim()) return null;

      // Sprawdź czy ma marki (oprócz wyrównania)
      const alignMarks = ["left", "center", "right", "justify"];
      const hasNonAlignMarks = child.marks?.some(
        (mark: string) => !alignMarks.includes(mark)
      );

      if (!hasNonAlignMarks) {
        return child.text;
      }

      let element = <span key={child._key}>{child.text}</span>;

      // Aplikuj marki
      child.marks?.forEach((mark: string) => {
        if (mark === "strong") {
          element = <strong key={child._key}>{element}</strong>;
        } else if (mark === "em") {
          element = <em key={child._key}>{element}</em>;
        } else if (mark === "underline") {
          element = <u key={child._key}>{element}</u>;
        } else if (alignMarks.includes(mark)) {
          // Marki wyrównania obsługiwane na poziomie bloku
          return;
        } else if (
          mark.startsWith("link-") ||
          markDefs.some((def) => def._key === mark && def._type === "link")
        ) {
          const linkDef = markDefs.find((def) => def._key === mark);
          if (linkDef) {
            const href =
              linkDef.linkType === "external"
                ? linkDef.externalHref || "#"
                : linkDef.internalHref || "#";

            // Sprawdź czy href nie jest pusty
            if (!href || href.trim() === "") {
              return element; // Zwróć element bez linku jeśli href jest pusty
            }

            const linkProps = {
              href,
              className:
                " text-blue-600 text-bold dark:text-blue-900 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200 relative group",
              ...(linkDef.blank && {
                target: "_blank",
                rel: "noopener noreferrer",
              }),
            };

            element =
              linkDef.linkType === "external" ? (
                <a key={child._key} {...linkProps}>
                  {element}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-current group-hover:w-full transition-all duration-300 ease-out"></span>
                </a>
              ) : (
                <Link key={child._key} {...linkProps}>
                  {element}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-current group-hover:w-full transition-all duration-300 ease-out"></span>
                </Link>
              );
          }
        } else if (
          markDefs.some((def) => def._key === mark && def._type === "fileReference")
        ) {
          const fileDef = markDefs.find((def) => def._key === mark && def._type === "fileReference");
          if (fileDef && fileDef.file) {
            // Użyj _id jeśli dostępne (zawsze jest), w przeciwnym razie originalFilename
            const fileId = fileDef.file._id || fileDef.file._ref;
            const fileName = fileDef.file.originalFilename;
            const mimeType = fileDef.file.mimeType || "";
            const isPdf = mimeType === "application/pdf";

            // Użyj _id jeśli dostępne (bardziej niezawodne), w przeciwnym razie originalFilename
            const fileIdentifier = fileId || fileName;
            
            if (!fileIdentifier) {
              console.warn("Brak ID lub nazwy pliku dla fileReference", fileDef);
              return element;
            }

            // Użyj endpointu API zamiast bezpośredniego URL z Sanity
            const downloadUrl = `/api/downloads/${encodeURIComponent(fileIdentifier)}`;

            element = (
              <a
                key={child._key}
                href={downloadUrl}
                download={fileName || undefined}
                className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200 relative group"
              >
                {element}
                {isPdf && <FileText className="w-4 h-4 flex-shrink-0" />}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-current group-hover:w-full transition-all duration-300 ease-out"></span>
              </a>
            );
          }
        }
      });

      return element;
    };

    // Renderuj children
    const renderChildren = () => {
      if (!children?.length) return <span key={`empty-${_key}`}>&nbsp;</span>;

      const hasContent = children.some((child) => child.text?.trim());
      if (!hasContent) return <span key={`empty-${_key}`}>&nbsp;</span>;

      return children.map(renderChild).filter(Boolean);
    };

    // Renderuj odpowiedni tag HTML na podstawie style
    const textAlignClass = getTextAlignClass(children);
    const colorClass = getColorClasses(style || "normal");

    // Mapowanie stylów na klasy CSS
    const styleClasses = {
      h1: "text-3xl md:text-5xl font-serif font-bold tracking-tight mb-4",
      h2: "text-3xl md:text-3xl font-serif font-semibold mb-4",
      h3: "text-2xl md:text-2xl font-serif font-semibold mb-3",
      normal: "text-base font-sans leading-relaxed",
    };

    const Tag =
      style === "h1"
        ? "h1"
        : style === "h2"
          ? "h2"
          : style === "h3"
            ? "h3"
            : "p";
    const classes = `${
      styleClasses[style as keyof typeof styleClasses] || styleClasses.normal
    } ${colorClass} ${textAlignClass}`;

    return (
      <Tag key={_key} className={classes}>
        {renderChildren()}
      </Tag>
    );
  };

  // Funkcja do renderowania listy
  const renderList = (list: ListGroup, index: number) => {
    const { listType, items } = list;
    const ListTag = listType === "bullet" ? "ul" : "ol";

    // Stylizacje dla różnych typów list
    const listClasses =
      listType === "bullet"
        ? "space-y-3 sm:space-y-4 my-6 sm:my-8 pl-4 list-none" // Lista punktowana z delikatnym paddingiem z lewej
        : "space-y-3 sm:space-y-4 my-6 sm:my-8 pl-4 list-none"; // Lista numerowana z delikatnym paddingiem z lewej

    const itemClasses =
      listType === "bullet"
        ? "text-base text-gray-700 dark:text-gray-300 font-sans leading-relaxed flex items-start gap-3 sm:gap-4 relative"
        : "text-base text-gray-700 dark:text-gray-300 font-sans leading-relaxed flex items-baseline gap-3 sm:gap-4 relative";

    return (
      <ListTag key={`list-${listType}-${index}`} className={listClasses}>
        {items.map((item: RichTextBlock, itemIndex: number) => {
          // Renderuj children elementu listy bezpośrednio
          const renderListItemChildren = () => {
            if (!item.children?.length)
              return <span key={`empty-${item._key}`}>&nbsp;</span>;

            const hasContent = item.children.some((child) =>
              child.text?.trim()
            );
            if (!hasContent)
              return <span key={`empty-${item._key}`}>&nbsp;</span>;

            const markDefs = item.markDefs || [];

            return item.children
              .map((child: RichTextBlock["children"][number]) => {
                if (!child.text?.trim()) return null;

                // Sprawdź czy ma marki (oprócz wyrównania)
                const alignMarks = ["left", "center", "right", "justify"];
                const hasNonAlignMarks = child.marks?.some(
                  (mark: string) => !alignMarks.includes(mark)
                );

                if (!hasNonAlignMarks) {
                  return child.text;
                }

                let element = <span key={child._key}>{child.text}</span>;

                // Aplikuj marki (pełna wersja dla elementów listy z obsługą linków)
                child.marks?.forEach((mark: string) => {
                  if (mark === "strong") {
                    element = <strong key={child._key}>{element}</strong>;
                  } else if (mark === "em") {
                    element = <em key={child._key}>{element}</em>;
                  } else if (mark === "underline") {
                    element = <u key={child._key}>{element}</u>;
                  } else if (alignMarks.includes(mark)) {
                    // Marki wyrównania obsługiwane na poziomie bloku
                    return;
                  } else if (
                    mark.startsWith("link-") ||
                    markDefs.some(
                      (def) => def._key === mark && def._type === "link"
                    )
                  ) {
                    const linkDef = markDefs.find((def) => def._key === mark);
                    if (linkDef) {
                      const href =
                        linkDef.linkType === "external"
                          ? linkDef.externalHref || "#"
                          : linkDef.internalHref || "#";

                      // Sprawdź czy href nie jest pusty
                      if (!href || href.trim() === "") {
                        return element; // Zwróć element bez linku jeśli href jest pusty
                      }

                      const linkProps = {
                        href,
                        className:
                          " text-blue-600 text-bold dark:text-blue-900 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200 relative group",
                        ...(linkDef.blank && {
                          target: "_blank",
                          rel: "noopener noreferrer",
                        }),
                      };

                      element =
                        linkDef.linkType === "external" ? (
                          <a key={child._key} {...linkProps}>
                            {element}
                            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-current group-hover:w-full transition-all duration-300 ease-out"></span>
                          </a>
                        ) : (
                          <Link key={child._key} {...linkProps}>
                            {element}
                            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-current group-hover:w-full transition-all duration-300 ease-out"></span>
                          </Link>
                        );
                    }
                  } else if (
                    markDefs.some((def) => def._key === mark && def._type === "fileReference")
                  ) {
                    const fileDef = markDefs.find((def) => def._key === mark && def._type === "fileReference");
                    if (fileDef && fileDef.file) {
                      // Użyj _id jeśli dostępne (zawsze jest), w przeciwnym razie originalFilename
                      const fileId = fileDef.file._id || fileDef.file._ref;
                      const fileName = fileDef.file.originalFilename;
                      const mimeType = fileDef.file.mimeType || "";
                      const isPdf = mimeType === "application/pdf";

                      // Użyj _id jeśli dostępne (bardziej niezawodne), w przeciwnym razie originalFilename
                      const fileIdentifier = fileId || fileName;
                      
                      if (!fileIdentifier) {
                        console.warn("Brak ID lub nazwy pliku dla fileReference", fileDef);
                        return element;
                      }

                      // Użyj endpointu API zamiast bezpośredniego URL z Sanity
                      const downloadUrl = `/api/downloads/${encodeURIComponent(fileIdentifier)}`;

                      element = (
                        <a
                          key={child._key}
                          href={downloadUrl}
                          download={fileName || undefined}
                          className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200 relative group"
                        >
                          {element}
                          {isPdf && <FileText className="w-4 h-4 flex-shrink-0" />}
                          <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-current group-hover:w-full transition-all duration-300 ease-out"></span>
                        </a>
                      );
                    }
                  }
                });

                return element;
              })
              .filter(Boolean);
          };

          return (
            <li
              key={item._key || `list-item-${index}-${itemIndex}`}
              className={itemClasses}
            >
              {/* Marker dla listy punktowanej */}
              {listType === "bullet" && (
                <div className="flex-shrink-0 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 dark:bg-gray-500 rounded-full mt-3 sm:mt-2.5"></div>
              )}

              {/* Marker dla listy numerowanej */}
              {listType === "number" && (
                <div className="flex-shrink-0 text-base sm:text-lg font-serif font-semibold text-gray-700 dark:text-gray-300 leading-none">
                  {itemIndex + 1}.
                </div>
              )}

              {/* Treść elementu listy */}
              <div className="flex-1 min-w-0">{renderListItemChildren()}</div>
            </li>
          );
        })}
      </ListTag>
    );
  };

  // Funkcja do renderowania grupowanych bloków
  const renderGroupedBlocks = () => {
    if (!blocks?.length) return [];

    const groupedBlocks = groupBlocksIntoLists(blocks);

    return groupedBlocks.map((item, index) => {
      if ("type" in item && item.type === "list") {
        return renderList(item, index);
      } else if ("_type" in item && item._type === "block") {
        return renderBlock(item);
      }
      return null;
    });
  };

  return <div className={className}>{renderGroupedBlocks()}</div>;
}
