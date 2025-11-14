import { SITE_CONFIG } from "@/lib/config";
import { safeJsonLd } from "@/lib/json-ld-utils";
import {
  generateContactPageSchema,
  generateFAQPageSchema,
  generateOrganizationSchema,
  type FAQItem,
} from "@/lib/schema-org";
import KontaktClient from "./KontaktClient";

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

  return (
    <>
      {safeJsonLd(contactPageJsonLd) && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(contactPageJsonLd)! }}
        />
      )}
      {safeJsonLd(faqPageJsonLd) && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(faqPageJsonLd)! }}
        />
      )}
      {safeJsonLd(organizationJsonLd) && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(organizationJsonLd)! }}
        />
      )}
      <KontaktClient />
    </>
  );
}
