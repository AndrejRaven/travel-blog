import Image from "next/image";
import Button from "./ui/Button";

interface HeroBannerProps {
  backgroundImage: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  backgroundImageAlt: string;
}

const HeroBanner: React.FC<HeroBannerProps> = ({
  backgroundImage,
  backgroundImageAlt,
  title,
  subtitle,
  ctaText,
  ctaLink,
}) => {
  return (
    <div className="relative h-[500px] w-full">
      <Image
        src={backgroundImage}
        alt={backgroundImageAlt}
        layout="fill"
        objectFit="cover"
        quality={100}
        priority
      />
      <div className="absolute inset-0 bg-black opacity-50" />
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center text-white">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">{title}</h1>
        <p className="text-lg md:text-xl mb-8">{subtitle}</p>
        <Button variant="primary" href={ctaLink}>
          {ctaText}
        </Button>
      </div>
    </div>
  );
};

export default HeroBanner;
