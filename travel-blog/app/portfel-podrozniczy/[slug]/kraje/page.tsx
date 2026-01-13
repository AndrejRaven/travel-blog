import type { Metadata } from "next";
import { buildStaticPageMetadata } from "@/lib/metadata";
import CountriesListClient from "./CountriesListClient";

interface CountriesPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: CountriesPageProps): Promise<Metadata> {
  const { slug } = await params;
  
  return buildStaticPageMetadata({
    path: `/portfel-podrozniczy/${slug}/kraje`,
    title: "Kraje | Portfel podróżniczy | Vlogi Z Drogi",
    description: "Lista krajów w podróży",
  });
}

export default async function CountriesPage({ params }: CountriesPageProps) {
  const { slug } = await params;
  return <CountriesListClient slug={slug} />;
}

