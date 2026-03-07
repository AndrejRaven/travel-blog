"use client";

import { use } from "react";
import AnalitykaClient from "./AnalitykaClient";

interface AnalitykaPageProps {
  params: Promise<{ slug: string }>;
}

export default function AnalitykaPage({ params }: AnalitykaPageProps) {
  const { slug } = use(params);
  return <AnalitykaClient slug={slug} />;
}
