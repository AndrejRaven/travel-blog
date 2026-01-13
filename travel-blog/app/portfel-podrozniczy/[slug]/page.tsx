import type { Metadata } from "next";
import { buildStaticPageMetadata } from "@/lib/metadata";
import TravelWalletClient from "./TravelWalletClient";

interface TripPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: TripPageProps): Promise<Metadata> {
  const { slug } = await params;
  
  return buildStaticPageMetadata({
    path: `/portfel-podrozniczy/${slug}`,
    title: "Portfel podróżniczy | Vlogi Z Drogi",
    description: "Dashboard podróży w portfelu podróżniczym",
  });
}

export default async function TripPage({ params }: TripPageProps) {
  const { slug } = await params;
  return <TravelWalletClient slug={slug} />;
}

