"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Button from "@/components/ui/Button";

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
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer - animacja uruchamia się gdy komponent wchodzi w viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            setTimeout(() => {
              setIsLoaded(true);
            }, 200);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  return (
    <section
      ref={containerRef}
      id="o-nas"
      className="rounded-xl border border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-800"
    >
      <h2
        className={`text-xl font-serif font-semibold text-gray-900 dark:text-gray-100 mb-4 transition-all duration-1000 ease-out ${
          isLoaded && isInView
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-8"
        }`}
      >
        {title}
      </h2>

      {/* ZDJĘCIE */}
      <div
        className={`relative w-full aspect-square overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 mb-4 transition-all duration-1000 ease-out delay-200 ${
          isLoaded && isInView
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-8 scale-95"
        }`}
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
        className={`space-y-3 mb-4 transition-all duration-1000 ease-out delay-300 ${
          isLoaded && isInView
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-8"
        }`}
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
        className={`transition-all duration-1000 ease-out delay-500 ${
          isLoaded && isInView
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-8"
        }`}
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
