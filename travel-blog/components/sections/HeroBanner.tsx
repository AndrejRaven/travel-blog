import React from "react";
import Image from "next/image";
import Button from "@/components/ui/Button";
import RichText from "@/components/ui/RichText";
import { HeroBannerData } from "@/lib/hero-test-data";

type Props = {
  data: HeroBannerData;
};

export default function HeroBanner({ data }: Props) {
  return (
    <section className="mx-auto max-w-7xl px-6 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center py-14 md:py-20">
      {/* Tekst - lewa strona */}
      <div className="order-2 lg:order-1">
        <RichText blocks={data.title} />
        <RichText blocks={data.description} />
        <div className="flex items-center gap-3 flex-wrap">
          {data.buttons.map((button, index) => (
            <Button
              key={index}
              href={button.href}
              variant={button.variant}
              external={button.external}
            >
              {button.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Obraz - prawa strona, zajmuje połowę ekranu */}
      <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
        <div className="relative w-full max-w-lg aspect-[4/3] overflow-hidden rounded-2xl border bg-gray-50">
          <Image
            src={data.image.src}
            alt={data.image.alt}
            fill
            className="object-contain p-6"
            priority
          />
        </div>
      </div>
    </section>
  );
}
