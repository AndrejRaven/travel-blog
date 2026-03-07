"use client";

import { use } from "react";
import TripTimelineClient from "./TripTimelineClient";

interface TripTimelinePageProps {
  params: Promise<{ slug: string }>;
}

export default function TripTimelinePage({
  params,
}: TripTimelinePageProps) {
  const { slug } = use(params);

  return <TripTimelineClient slug={slug} />;
}
