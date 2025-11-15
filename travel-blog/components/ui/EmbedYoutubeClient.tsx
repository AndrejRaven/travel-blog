"use client";

import EmbedYoutube from "@/components/sections/EmbedYoutube";
import { EmbedYoutube as EmbedYoutubeType } from "@/lib/component-types";

type EmbedYoutubeClientProps = Omit<EmbedYoutubeType, "_type" | "_key">;

export default function EmbedYoutubeClient(props: EmbedYoutubeClientProps) {
  return <EmbedYoutube {...props} />;
}

