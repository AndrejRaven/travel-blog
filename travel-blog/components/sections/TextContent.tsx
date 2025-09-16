"use client";

import React from "react";
import RichText from "@/components/ui/RichText";
import { TextContentData } from "@/lib/component-types";

type Props = {
  data: TextContentData;
};

export default function TextContent({ data }: Props) {
  const { content, layout } = data;

  // Klasy dla maksymalnej szerokości
  const getMaxWidthClass = (maxWidth: string) => {
    switch (maxWidth) {
      case "sm":
        return "max-w-sm";
      case "md":
        return "max-w-md";
      case "lg":
        return "max-w-lg";
      case "xl":
        return "max-w-xl";
      case "2xl":
        return "max-w-2xl";
      case "4xl":
        return "max-w-4xl";
      case "6xl":
        return "max-w-6xl";
      case "full":
        return "max-w-full";
      default:
        return "max-w-4xl";
    }
  };

  // Klasy dla paddingu
  const getPaddingClass = (padding: string) => {
    switch (padding) {
      case "none":
        return "p-0";
      case "sm":
        return "p-4";
      case "md":
        return "p-6";
      case "lg":
        return "p-8";
      case "xl":
        return "p-12";
      default:
        return "p-6";
    }
  };

  // Klasy dla rozmiaru tekstu
  const getTextSizeClass = (textSize: string) => {
    switch (textSize) {
      case "sm":
        return "prose-sm";
      case "base":
        return "prose-base";
      case "lg":
        return "prose-lg";
      case "xl":
        return "prose-xl";
      default:
        return "prose-lg";
    }
  };

  return (
    <div
      className={`mx-auto ${getMaxWidthClass(
        layout.maxWidth
      )} ${getPaddingClass(layout.padding)}`}
    >
      <div className={`prose max-w-none ${getTextSizeClass(layout.textSize)}`}>
        <RichText blocks={content} />
      </div>
    </div>
  );
}
