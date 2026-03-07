"use client";

import { use } from "react";
import KursyClient from "./KursyClient";

interface KursyPageProps {
  params: Promise<{ slug: string }>;
}

export default function KursyPage({ params }: KursyPageProps) {
  const { slug } = use(params);
  return <KursyClient slug={slug} />;
}
