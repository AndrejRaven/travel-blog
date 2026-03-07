import { redirect } from "next/navigation";

interface BudgetVsActualPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BudgetVsActualPage({ params }: BudgetVsActualPageProps) {
  const { slug } = await params;
  redirect(`/portfel-podrozniczy/${slug}/analityka?tab=budzet`);
}
