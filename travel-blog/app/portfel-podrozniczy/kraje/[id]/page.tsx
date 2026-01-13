import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildStaticPageMetadata } from "@/lib/metadata";
import { getCountryById } from "@/lib/travel-wallet/countries";
import CountryDetailsClient from "./CountryDetailsClient";

interface CountryPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: CountryPageProps): Promise<Metadata> {
  const { id } = await params;
  const country = getCountryById(id);

  if (!country) {
    return buildStaticPageMetadata({
      path: `/portfel-podrozniczy/kraje/${id}`,
      title: "Kraj nie znaleziony | Portfel podróżniczy | Vlogi Z Drogi",
      description: "Nie udało się znaleźć kraju o podanym ID",
    });
  }

  return buildStaticPageMetadata({
    path: `/portfel-podrozniczy/kraje/${id}`,
    title: `${country.name} | Portfel podróżniczy | Vlogi Z Drogi`,
    description: `Szczegóły kraju ${country.name} w portfelu podróżniczym`,
  });
}

export default async function CountryPage({ params }: CountryPageProps) {
  const { id } = await params;
  const country = getCountryById(id);

  if (!country) {
    notFound();
  }

  return <CountryDetailsClient countryId={id} />;
}

