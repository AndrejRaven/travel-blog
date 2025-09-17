"use client";

import React from "react";
import Image from "next/image";
import Button from "@/components/ui/Button";
import { useAnimation } from "@/lib/useAnimation";
import { ANIMATION_PRESETS } from "@/lib/animations";

interface AboutUsProps {
  title?: string;
  image?: string;
  imageAlt?: string;
  description?: string[];
  contactHref?: string;
  contactText?: string;
}

const defaultDescription = [
  "Jesteśmy Aga i Andrej - para, która od kilku lat przemierza świat w poszukiwaniu najpiękniejszych miejsc i najsmaczniejszych potraw. Nasze podróże to nie tylko zwiedzanie, ale przede wszystkim poznawanie lokalnych kultur i tradycji.",
  "Na tym blogu dzielimy się naszymi doświadczeniami, praktycznymi poradami podróżniczymi oraz przepisami kulinarnymi z różnych zakątków świata. Każda podróż to nowa historia do opowiedzenia.",
  "Dołącz do nas w tej podróży pełnej przygód, smaków i niezapomnianych wspomnień!",
];

export default function AboutUs({
  title = "Kim jesteśmy",
  image = "/demo-images/demo-asset.png",
  imageAlt = "O nas - para podróżników",
  description = defaultDescription,
  contactHref = "#kontakt",
  contactText = "Skontaktuj się z nami",
}: AboutUsProps) {
  const { isLoaded, isInView, containerRef } = useAnimation();

  return (
    <section
      ref={containerRef}
      id="o-nas"
      className="rounded-xl border border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-800"
    >
      <h2
        className={`text-xl font-serif font-semibold text-gray-900 dark:text-gray-100 mb-4 ${ANIMATION_PRESETS.sectionHeader(
          isLoaded && isInView
        )}`}
      >
        {title}
      </h2>

      {/* ZDJĘCIE */}
      <div
        className={`relative w-full aspect-square overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 mb-4 ${ANIMATION_PRESETS.image(
          isLoaded && isInView,
          "medium"
        )}`}
      >
        <Image
          src={image}
          alt={imageAlt}
          fill
          className="object-cover transition-transform duration-300 hover:scale-105"
        />
      </div>

      {/* OPIS */}
      <div
        className={`space-y-3 mb-4 ${ANIMATION_PRESETS.text(
          isLoaded && isInView,
          "long"
        )}`}
      >
        {description.map((paragraph, index) => (
          <p
            key={index}
            className="text-sm text-gray-600 dark:text-gray-300"
            style={{
              transitionDelay: `${400 + index * 100}ms`,
            }}
          >
            {paragraph}
          </p>
        ))}
      </div>

      <div
        className={ANIMATION_PRESETS.button(isLoaded && isInView, "longest")}
      >
        <Button
          href={contactHref}
          variant="outline"
          className="w-full text-xs px-3 py-2 transition-all duration-300 hover:scale-105 hover:shadow-lg"
        >
          {contactText}
        </Button>
      </div>
    </section>
  );
}
