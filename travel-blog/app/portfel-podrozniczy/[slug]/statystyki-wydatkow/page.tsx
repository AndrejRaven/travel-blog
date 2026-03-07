"use client";

import { use } from "react";
import ExpenseStatisticsClient from "./ExpenseStatisticsClient";

interface ExpenseStatisticsPageProps {
  params: Promise<{ slug: string }>;
}

export default function ExpenseStatisticsPage({
  params,
}: ExpenseStatisticsPageProps) {
  const { slug } = use(params);

  return <ExpenseStatisticsClient slug={slug} />;
}
