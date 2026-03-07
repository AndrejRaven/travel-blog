import { redirect } from "next/navigation";

interface ExchangeAnalyticsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ExchangeAnalyticsPage({ params }: ExchangeAnalyticsPageProps) {
  const { slug } = await params;
  redirect(`/portfel-podrozniczy/${slug}/kursy?tab=wymiana`);
}
