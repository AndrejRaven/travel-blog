"use client";

import React from "react";
import RichText from "@/components/ui/RichText";
import { TextContentData } from "@/lib/component-types";
import SectionContainer from "@/components/shared/SectionContainer";
import { getTextSizeClass } from "@/lib/section-utils";

type Props = {
  data: TextContentData;
};

export default function TextContent({ data }: Props) {
  const { container, content, layout } = data;

  return (
    <SectionContainer config={container}>
      <div
        className={`prose max-w-none px-6 md:px-0 ${getTextSizeClass(
          layout.textSize
        )} prose-serif`}
      >
        <RichText blocks={content} />
      </div>
    </SectionContainer>
  );
}
