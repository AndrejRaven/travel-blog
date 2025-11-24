import type { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/config";
import JsonLdScript from "@/components/shared/JsonLdScript";
import { safeJsonLd } from "@/lib/json-ld-utils";
import {
  generateContactPageSchema,
  generateFAQPageSchema,
  generateOrganizationSchema,
  type FAQItem,
} from "@/lib/schema-org";
import KontaktClient from "./KontaktClient";
import { buildStaticPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildStaticPageMetadata({
  path: "/kontakt",
  title: "Kontakt | Vlogi Z Drogi",
  description: "Masz pytania? Skontaktuj się z zespołem Vlogi Z Drogi.",
});

export default function Kontakt() {
  const siteUrl = SITE_CONFIG.url;
  const contactUrl = `${siteUrl}/kontakt`;

  // FAQ items
  const faqs: FAQItem[] = [
    {
      question: "Jak długo czekać na odpowiedź?",
      answer:
        "Odpowiadamy na wszystkie wiadomości w ciągu 24 godzin w dni robocze.",
    },
    {
      question: "Czy oferujecie współpracę?",
      answer:
        "Tak! Chętnie współpracujemy z markami związanymi z podróżami i lifestyle.",
    },
    {
      question: "Gdzie mogę znaleźć Wasze najnowsze treści?",
      answer:
        "Zapisz się do naszego newslettera lub śledź nas w mediach społecznościowych.",
    },
  ];

  // ContactPage schema
  const contactPageJsonLd = generateContactPageSchema({
    name: "Kontakt",
    description: "Skontaktuj się z nami - masz pytania? Napisz do nas!",
    url: contactUrl,
    contactPoint: {
      email: "poczta@vlogizdrogi.pl",
      contactType: "customer service",
    },
  });

  // FAQPage schema
  const faqPageJsonLd = generateFAQPageSchema({
    name: "Często zadawane pytania",
    description: "Odpowiedzi na najczęściej zadawane pytania",
    url: contactUrl,
    faqs: faqs,
  });

  // Organization schema z contactPoint
  const organizationJsonLd = generateOrganizationSchema({
    contactPoint: {
      email: "poczta@vlogizdrogi.pl",
      contactType: "customer service",
    },
  });

  const contactPageJsonLdString = safeJsonLd(contactPageJsonLd);
  const faqPageJsonLdString = safeJsonLd(faqPageJsonLd);
  const organizationJsonLdString = safeJsonLd(organizationJsonLd);

  return (
    <>
      <JsonLdScript data={contactPageJsonLdString} />
      <JsonLdScript data={faqPageJsonLdString} />
      <JsonLdScript data={organizationJsonLdString} />
      <KontaktClient />
    </>
  );
}
