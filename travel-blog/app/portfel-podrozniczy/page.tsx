import type { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/config";
import JsonLdScript from "@/components/shared/JsonLdScript";
import { safeJsonLd } from "@/lib/json-ld-utils";
import {
  generateWebPageSchema,
  generateOrganizationSchema,
} from "@/lib/schema-org";
import TripsListClient from "./TripsListClient";
import { buildStaticPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildStaticPageMetadata({
  path: "/portfel-podrozniczy",
  title: "Portfel podróżniczy | Vlogi Z Drogi",
  description:
    "Planuj, kontroluj i zarządzaj budżetem w podróży. Zarządzaj wieloma podróżami i finansami podczas podróży z obsługą wielu walut.",
});

export default function PortfelPodrozniczy() {
  const siteUrl = SITE_CONFIG.url;
  const pageUrl = `${siteUrl}/portfel-podrozniczy`;

  // WebPage schema
  const webPageJsonLd = generateWebPageSchema({
    name: "Portfel podróżniczy",
    description:
      "Narzędzie do planowania, kontrolowania i zarządzania budżetem podróżniczym z obsługą wielu walut",
    url: pageUrl,
  });

  // Organization schema
  const organizationJsonLd = generateOrganizationSchema({});

  const webPageJsonLdString = safeJsonLd(webPageJsonLd);
  const organizationJsonLdString = safeJsonLd(organizationJsonLd);

  return (
    <>
      <JsonLdScript data={webPageJsonLdString} />
      <JsonLdScript data={organizationJsonLdString} />
      <TripsListClient />
    </>
  );
}
