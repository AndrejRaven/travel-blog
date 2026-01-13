import type { Metadata } from "next";
import { buildStaticPageMetadata } from "@/lib/metadata";
import CountryDetailsClient from "./CountryDetailsClient";

interface CountryPageProps {
  params: Promise<{ slug: string; countrySlug: string }>;
}

export async function generateMetadata({
  params,
}: CountryPageProps): Promise<Metadata> {
  const { slug, countrySlug } = await params;
  
  return buildStaticPageMetadata({
    path: `/portfel-podrozniczy/${slug}/kraje/${countrySlug}`,
    title: "Kraj | Portfel podróżniczy | Vlogi Z Drogi",
    description: "Szczegóły kraju w portfelu podróżniczym",
  });
}

export default async function CountryPage({ params }: CountryPageProps) {
  const { slug, countrySlug } = await params;
  return <CountryDetailsClient countrySlug={countrySlug} slug={slug} />;
}

