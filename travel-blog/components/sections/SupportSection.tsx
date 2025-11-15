import Image from "next/image";
import Button from "@/components/ui/Button";
import SectionContainer from "@/components/shared/SectionContainer";
import { SupportSectionData } from "@/lib/component-types";
import { getAnimationClass } from "@/lib/render-utils";
import { sanitizeSvg } from "@/lib/svg-sanitizer";

interface Props {
  data: SupportSectionData;
}

export default async function SupportSection({ data }: Props) {
  if (!data) {
    console.error("SupportSection: Missing data", { data });
    return null;
  }

  const { container, title, description, supportOptions, thankYouMessage } = data;

  if (!container) {
    console.error("SupportSection: Missing container data", { container });
    return null;
  }

  const sanitizedSvgs: Record<string, string> = {};
  await Promise.all(
    supportOptions.map(async (option) => {
      if (option.iconSvg) {
        sanitizedSvgs[option.id] = await sanitizeSvg(option.iconSvg);
      }
    })
  );

  return (
    <SectionContainer config={container}>
      <section className="rounded-xl border border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-800 space-y-4">
        <h2
          className={`text-lg font-serif font-semibold text-gray-900 dark:text-gray-100 ${getAnimationClass({
            type: "sectionHeader",
            delay: "none",
            isInView: true,
            isLoaded: true,
          })}`}
        >
          {title}
        </h2>

        <p className="text-xs text-gray-600 dark:text-gray-300">
          {description}
        </p>

        <div className="space-y-3">
          {supportOptions.map((option, index) => (
            <Button
              key={option.id}
              href={option.href}
              variant={option.variant || "outline"}
              external
              className={`w-full text-xs px-3 py-2 flex items-center justify-center space-x-2 transition-all duration-300 hover:scale-105 hover:shadow-lg ${getAnimationClass({
                type: "text",
                delay: index < 2 ? "short" : index < 4 ? "medium" : "long",
                isInView: true,
                isLoaded: true,
              })}`}
            >
              {(() => {
                const iconUrl =
                  typeof option.icon === "string"
                    ? option.icon
                    : option.icon?.asset?.url;

                if (iconUrl) {
                  return (
                    <Image
                      src={iconUrl}
                      alt={option.name}
                      width={16}
                      height={16}
                      className={option.invertOnDark === true ? "dark:invert" : ""}
                    />
                  );
                }

                if (option.iconSvg) {
                  return (
                    <span
                      className="w-4 h-4 flex items-center justify-center"
                      dangerouslySetInnerHTML={{
                        __html: sanitizedSvgs[option.id] || option.iconSvg,
                      }}
                    />
                  );
                }

                return null;
              })()}
              <span>{option.name}</span>
            </Button>
          ))}
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          {thankYouMessage}
        </p>
      </section>
    </SectionContainer>
  );
}
