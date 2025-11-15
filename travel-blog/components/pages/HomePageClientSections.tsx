"use client";

import dynamic from "next/dynamic";
import { InstagramSectionData, NewsletterData } from "@/lib/component-types";

const LazyPopup = dynamic(
  () => import("@/components/ui/Popup"),
  { ssr: false }
);

const LazyInstagramSection = dynamic(
  () => import("@/components/sections/InstagramSection"),
  { ssr: false }
);

const LazyNewsletter = dynamic(
  () => import("@/components/sections/Newsletter"),
  { ssr: false }
);

export function ClientPopup({
  scrollThreshold,
  cooldownMinutes,
}: {
  scrollThreshold: number;
  cooldownMinutes: number;
}) {
  return (
    <LazyPopup
      scrollThreshold={scrollThreshold}
      cooldownMinutes={cooldownMinutes}
    />
  );
}

export function ClientInstagramSection({ data }: { data: InstagramSectionData }) {
  return <LazyInstagramSection data={data} />;
}

export function ClientNewsletterSection({ data }: { data: NewsletterData }) {
  return <LazyNewsletter data={data} />;
}

