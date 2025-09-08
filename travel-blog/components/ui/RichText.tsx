import React from "react";
import Link from "next/link";
import { RichTextBlock } from "@/lib/hero-test-data";

type Props = {
  blocks: RichTextBlock[];
  className?: string;
};

export default function RichText({ blocks, className = "" }: Props) {
  const renderBlock = (block: RichTextBlock) => {
    const { _key, style, children, markDefs = [] } = block;

    // Renderuj children z markami
    const renderChildren = () => {
      return children.map((child) => {
        let element = <span key={child._key}>{child.text}</span>;

        // Aplikuj marki (bold, italic, link, etc.)
        if (child.marks) {
          child.marks.forEach((mark) => {
            if (mark === "strong") {
              element = <strong key={child._key}>{element}</strong>;
            } else if (mark === "em") {
              element = <em key={child._key}>{element}</em>;
            } else if (mark.startsWith("link-")) {
              const linkDef = markDefs.find((def) => def._key === mark);
              if (linkDef) {
                element = (
                  <Link
                    key={child._key}
                    href={linkDef.href}
                    className="text-blue-600 hover:text-blue-800 underline"
                    target={linkDef.blank ? "_blank" : undefined}
                    rel={linkDef.blank ? "noopener noreferrer" : undefined}
                  >
                    {element}
                  </Link>
                );
              }
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
            className="text-3xl md:text-5xl font-bold tracking-tight mb-4"
          >
            {renderChildren()}
          </h1>
        );
      case "h2":
        return (
          <h2 key={_key} className="text-2xl md:text-3xl font-semibold mb-4">
            {renderChildren()}
          </h2>
        );
      case "h3":
        return (
          <h3 key={_key} className="text-xl md:text-2xl font-semibold mb-3">
            {renderChildren()}
          </h3>
        );
      case "normal":
      default:
        return (
          <p key={_key} className="text-gray-600 mb-6 text-lg">
            {renderChildren()}
          </p>
        );
    }
  };

  return <div className={className}>{blocks.map(renderBlock)}</div>;
}
