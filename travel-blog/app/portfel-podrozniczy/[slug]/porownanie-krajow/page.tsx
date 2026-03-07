import { redirect } from "next/navigation";

interface CountryComparisonPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CountryComparisonPage({ params }: CountryComparisonPageProps) {
  const { slug } = await params;
  redirect(`/portfel-podrozniczy/${slug}/analityka?tab=porownanie-krajow`);
}
