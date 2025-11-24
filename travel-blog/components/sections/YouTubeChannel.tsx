import Image from "next/image";
import Button from "@/components/ui/Button";
import SectionContainer from "@/components/shared/SectionContainer";
import { YouTubeChannelData } from "@/lib/component-types";
import { getSanityImageProps } from "@/lib/sanity-image";

interface Props {
  data: YouTubeChannelData;
}

export default function YouTubeChannel({ data }: Props) {
  if (!data) {
    console.error("YouTubeChannel: Missing data", { data });
    return null;
  }

  const {
    container,
    title,
    channelName,
    channelDescription,
    channelHref,
    buttonText,
    buttonVariant,
    channelImage,
  } = data;

  if (!container) {
    console.error("YouTubeChannel: Missing container data", { container });
    return null;
  }

  const avatarProps = getSanityImageProps(channelImage, {
    alt: channelName,
    profile: "square",
    quality: 90,
  });

  return (
    <SectionContainer config={container}>
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-800 space-y-4">
        <h3 className="text-lg font-serif font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {title}
        </h3>

        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full overflow-hidden">
            <Image
              src={avatarProps.src}
              alt={avatarProps.alt || channelName}
              width={40}
              height={40}
              className="object-cover"
            />
          </div>
          <div>
            <p className="font-sans font-medium text-gray-900 dark:text-gray-100 text-sm">
              {channelName}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {channelDescription}
            </p>
          </div>
        </div>

        <p className="text-xs text-gray-600 dark:text-gray-300">
          Obejrzyj nasze najnowsze filmy z podróży i dowiedz się więcej o miejscach, które odwiedzamy.
        </p>

        <Button
          href={channelHref}
          variant={buttonVariant}
          external
          className="w-full text-xs px-3 py-2 transition-all duration-300 hover:scale-105 hover:shadow-lg"
        >
          {buttonText}
        </Button>
      </div>
    </SectionContainer>
  );
}
