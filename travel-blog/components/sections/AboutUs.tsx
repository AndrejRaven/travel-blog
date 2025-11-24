import Image from "next/image";
import Button from "@/components/ui/Button";
import SectionContainer from "@/components/shared/SectionContainer";
import { AboutUsData } from "@/lib/component-types";
import { getSanityImageProps } from "@/lib/sanity-image";

interface Props {
  data: AboutUsData;
}

export default function AboutUs({ data }: Props) {
  if (!data) {
    console.error("AboutUs: Missing data", { data });
    return null;
  }

  const {
    container,
    title,
    image,
    imageAlt,
    description = [],
    contactHref,
    contactText,
  } = data;

  if (!container) {
    console.error("AboutUs: Missing container data", { container });
    return null;
  }

  const heroImageProps = getSanityImageProps(image, {
    alt: imageAlt || title,
    profile: "square",
    quality: 85,
  });

  return (
    <SectionContainer config={container}>
      <div className="rounded-xl my-8 border border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-800 space-y-5">
        <h2 className="text-xl font-serif font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h2>

        <div className="relative w-full aspect-square overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <Image
            src={heroImageProps.src}
            alt={imageAlt || "O nas"}
            fill
            className="object-cover transition-transform duration-300 hover:scale-105"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>

        <div className="space-y-3">
          {description.map((paragraph, index) => (
            <p key={index} className="text-sm text-gray-600 dark:text-gray-300">
              {paragraph}
            </p>
          ))}
        </div>

        <Button
          href={contactHref}
          variant="outline"
          className="w-full text-xs px-3 py-2 transition-all duration-300 hover:scale-105 hover:shadow-lg"
        >
          {contactText}
        </Button>
      </div>
    </SectionContainer>
  );
}
