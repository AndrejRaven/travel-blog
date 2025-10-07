"use client";

import Image from "next/image";
import { useState } from "react";
import React from "react";
import Button from "@/components/ui/Button";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import { Instagram, Heart } from "lucide-react";
import "swiper/css/pagination";
import AnimatedSection from "@/components/shared/AnimatedSection";
import { useAnimation } from "@/lib/useAnimation";
import { useResponsiveImage } from "@/lib/render-utils";

interface InstagramPost {
  id: string;
  imageUrl?: {
    asset: {
      _id: string;
      url: string;
      metadata: {
        dimensions: {
          width: number;
          height: number;
        };
      };
    };
    hotspot?: any;
    crop?: any;
  };
  caption?: string;
  likes?: string;
}

interface InstagramSectionProps {
  title?: string;
  subtitle?: string;
  instagramHandle?: string;
  instagramUrl?: string;
  buttonText?: string;
  posts?: InstagramPost[];
  container?: {
    maxWidth?: string;
    padding?: string;
    alignment?: string;
    height?: string;
    innerMargin?: string;
  };
}

// Domyślne posty jako fallback
const defaultPosts: InstagramPost[] = [
  {
    id: "1",
    imageUrl: {
      asset: {
        _id: "default-1",
        url: "/demo-images/demo-asset.png",
        metadata: {
          dimensions: {
            width: 400,
            height: 400,
          },
        },
      },
    },
    caption: "Piękny zachód słońca nad morzem w Grecji 🇬🇷 #podróże #grecja",
    likes: "1.2k",
  },
  {
    id: "2",
    imageUrl: {
      asset: {
        _id: "default-2",
        url: "/demo-images/demo-asset1.png",
        metadata: {
          dimensions: {
            width: 400,
            height: 400,
          },
        },
      },
    },
    caption: "Włoska kuchnia to najlepsza na świecie! 🍝 #włochy #kuchnia",
    likes: "856",
  },
  {
    id: "3",
    imageUrl: {
      asset: {
        _id: "default-3",
        url: "/demo-images/demo-asset.png",
        metadata: {
          dimensions: {
            width: 400,
            height: 400,
          },
        },
      },
    },
    caption: "Górskie wędrówki w Alpach 🏔️ #góry #alpy #wędrówki",
    likes: "2.1k",
  },
  {
    id: "4",
    imageUrl: {
      asset: {
        _id: "default-4",
        url: "/demo-images/demo-asset1.png",
        metadata: {
          dimensions: {
            width: 400,
            height: 400,
          },
        },
      },
    },
    caption: "Kolorowe ulice Lizbony 🌈 #portugalia #lizbona",
    likes: "743",
  },
  {
    id: "5",
    imageUrl: {
      asset: {
        _id: "default-5",
        url: "/demo-images/demo-asset.png",
        metadata: {
          dimensions: {
            width: 400,
            height: 400,
          },
        },
      },
    },
    caption: "Tradycyjne targi w Maroku 🛍️ #maroko #targi",
    likes: "1.5k",
  },
  {
    id: "6",
    imageUrl: {
      asset: {
        _id: "default-6",
        url: "/demo-images/demo-asset1.png",
        metadata: {
          dimensions: {
            width: 400,
            height: 400,
          },
        },
      },
    },
    caption: "Plaża w Tajlandii 🏖️ #tajlandia #plaża",
    likes: "3.2k",
  },
];

export default function InstagramSection({
  title = "Śledź nas na Instagramie",
  subtitle = "Najnowsze zdjęcia z naszych podróży",
  instagramHandle = "@naszblog",
  instagramUrl = "https://instagram.com",
  buttonText = "@naszblog",
  posts = defaultPosts,
  container,
}: InstagramSectionProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [realIndex, setRealIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { isLoaded, isInView, containerRef } = useAnimation();

  // Użyj useResponsiveImage dla optymalizacji obrazków Instagram
  const { getOptimizedImageProps } = useResponsiveImage({
    width: 600,
    height: 600,
    quality: 95,
    format: "webp",
    fit: "fillmax",
  });

  return (
    <AnimatedSection
      role="complementary"
      aria-labelledby="instagram-heading"
      itemScope
      itemType="https://schema.org/ItemList"
      isLoaded={isLoaded}
      isInView={isInView}
      containerRef={containerRef}
    >
      <div className="mx-auto max-w-7xl px-0 md:px-6">
        {/* HEADER */}
        <div className="flex flex-col space-y-4 mb-8 px-6 md:px-0 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h2
              id="instagram-heading"
              className="text-2xl md:text-3xl font-serif font-bold mb-2"
            >
              {title}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              {subtitle}
            </p>
          </div>
          <Button
            href={instagramUrl}
            variant="outline"
            external
            className="flex items-center space-x-2 w-full md:w-auto justify-center md:justify-start transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            <Instagram className="w-4 h-4" />
            <span>{buttonText}</span>
          </Button>
        </div>

        {/* SWIPER CAROUSEL */}
        <div className="relative">
          <Swiper
            modules={[Pagination, Autoplay]}
            spaceBetween={20}
            slidesPerView={3}
            centeredSlides={true}
            loop={true}
            grabCursor={true}
            slideToClickedSlide={true}
            autoplay={{
              delay: 4000,
              disableOnInteraction: false,
            }}
            breakpoints={{
              0: {
                slidesPerView: 1.4,
                spaceBetween: 10,
                centeredSlides: true,
              },
              640: {
                slidesPerView: 1.5,
                spaceBetween: 20,
                centeredSlides: true,
              },
              1024: {
                slidesPerView: 3,
                spaceBetween: 30,
                centeredSlides: true,
              },
            }}
            pagination={{
              clickable: true,
              el: ".swiper-pagination",
            }}
            onTouchStart={() => {
              setIsTransitioning(true);
            }}
            onTouchEnd={(swiper) => {
              setActiveSlide(swiper.realIndex);
              setRealIndex(swiper.realIndex);
              setTimeout(() => setIsTransitioning(false), 300);
            }}
            onSlideChange={(swiper) => {
              setActiveSlide(swiper.realIndex);
              setRealIndex(swiper.realIndex);
            }}
            className="mySwiper"
          >
            {posts.map((post, index) => {
              const isActive = index === activeSlide;
              const isTransitioningOut = isTransitioning && !isActive;
              const caption = post.caption || "";
              const likes = post.likes || "0";

              // Przygotuj dane obrazka dla useResponsiveImage
              const imageData = post.imageUrl?.asset
                ? {
                    asset: post.imageUrl.asset,
                    hotspot: post.imageUrl.hotspot,
                    crop: post.imageUrl.crop,
                  }
                : null;

              return (
                <SwiperSlide key={post.id}>
                  <article
                    className={`relative group transition-all duration-500 rounded-2xl ease-out overflow-hidden ${
                      isActive ? "scale-100 z-10" : "scale-90 opacity-30"
                    }`}
                    itemScope
                    itemType="https://schema.org/ImageObject"
                  >
                    <div className="relative h-[250px] w-full">
                      {imageData ? (
                        (() => {
                          const imageProps = getOptimizedImageProps(imageData);
                          return (
                            <img
                              {...imageProps}
                              className={`object-cover transition-all duration-500 group-hover:scale-105 transform-gpu will-change-transform w-full h-full`}
                              itemProp="contentUrl"
                            />
                          );
                        })()
                      ) : (
                        <Image
                          src="/demo-images/demo-asset.png"
                          alt={caption}
                          fill
                          className={`object-cover transition-all duration-500 group-hover:scale-105 transform-gpu will-change-transform `}
                          itemProp="contentUrl"
                        />
                      )}

                      {/* TEKST Z OPISEM - BEZ PRZYCIEMNIENIA */}
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        <p
                          className="text-sm leading-relaxed"
                          itemProp="description"
                        >
                          {caption}
                        </p>
                      </div>
                    </div>
                  </article>
                </SwiperSlide>
              );
            })}
          </Swiper>
        </div>

        {/* PAGINATION DOTS - POD ZDJĘCIAMI */}
        <div
          className="swiper-pagination !flex !justify-center !mt-6 !space-x-2 !relative !bottom-0"
          style={
            {
              "--swiper-pagination-color": "#374151",
              "--swiper-pagination-bullet-size": "12px",
              "--swiper-pagination-bullet-inactive-color": "#d1d5db",
              "--swiper-pagination-bullet-inactive-opacity": "0.5",
              "--swiper-pagination-bottom": "0px",
            } as React.CSSProperties
          }
        ></div>
      </div>
    </AnimatedSection>
  );
}
