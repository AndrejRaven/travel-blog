import React from "react";
import Image from "next/image";
import Button from "@/components/ui/Button";
import RichText from "@/components/ui/RichText";
import { BackgroundHeroBannerData } from "@/lib/hero-test-data";

type Props = {
  data: BackgroundHeroBannerData;
};

export default function BackgroundHeroBanner({ data }: Props) {
  const { layout } = data;

  // Klasy dla wysokości baneru
  const getHeightClass = (height: number | "auto") => {
    switch (height) {
      case 25:
        return "h-[25vh]";
      case 50:
        return "h-[50vh]";
      case 75:
        return "h-[75vh]";
      case 100:
        return "h-[100vh]";
      case "auto":
        return "h-auto";
      default:
        return "h-[60vh]";
    }
  };

  // Style dla nakładki
  const getOverlayStyle = (opacity: number) => {
    return {
      backgroundColor: `rgba(0, 0, 0, ${opacity / 100})`,
    };
  };

  // Klasy dla stylu tekstu
  const getTextStyleClass = (
    textStyle: "normal" | "bold" | "outline" | "shadow"
  ) => {
    switch (textStyle) {
      case "bold":
        return "font-black";
      case "outline":
        return "text-stroke-2 text-stroke-white";
      case "shadow":
        return "drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]";
      case "normal":
      default:
        return "";
    }
  };

  return (
    <section
      className={`relative w-full ${getHeightClass(
        layout.height
      )} overflow-hidden`}
    >
      {/* Obraz w tle */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          src={data.image.src}
          alt={data.image.alt}
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Nakładka przyciemniająca */}
      <div
        className="absolute inset-0 w-full h-full"
        style={getOverlayStyle(layout.overlayOpacity)}
      />

      {/* Zawartość tekstowa */}
      <div
        className={`relative z-10 w-full h-full flex items-center px-6 lg:px-12 py-8 lg:py-16 ${
          layout.textAlignment === "center"
            ? "justify-center"
            : layout.textAlignment === "right"
            ? "justify-end"
            : "justify-start"
        }`}
      >
        <div
          className={`max-w-4xl w-full space-y-6 ${
            layout.textAlignment === "center"
              ? "flex flex-col items-center text-center"
              : layout.textAlignment === "right"
              ? "flex flex-col items-end text-right"
              : "flex flex-col items-start text-left"
          }`}
        >
          <div className={getTextStyleClass(layout.textStyle)}>
            <RichText blocks={data.title} textColor="white" />
            <RichText blocks={data.description} textColor="white" />
          </div>
          <div
            className={`flex items-center gap-3 flex-wrap ${
              layout.textAlignment === "center"
                ? "justify-center"
                : layout.textAlignment === "right"
                ? "justify-end"
                : "justify-start"
            }`}
          >
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
      </div>
    </section>
  );
}
