"use client";

import { use } from "react";
import FoodAnalyticsClient from "./FoodAnalyticsClient";

interface FoodAnalyticsPageProps {
  params: Promise<{ slug: string }>;
}

export default function FoodAnalyticsPage({
  params,
}: FoodAnalyticsPageProps) {
  const { slug } = use(params);

  return <FoodAnalyticsClient slug={slug} />;
}
