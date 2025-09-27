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

interface InstagramPost {
  id: string;
  imageUrl: string;
  caption: string;
  likes: string;
}

const posts: InstagramPost[] = [
  {
    id: "1",
    imageUrl: "/demo-images/demo-asset.png",
    caption: "Piękny zachód słońca nad morzem w Grecji 🇬🇷 #podróże #grecja",
    likes: "1.2k",
  },
  {
    id: "2",
    imageUrl: "/demo-images/demo-asset1.png",
    caption: "Włoska kuchnia to najlepsza na świecie! 🍝 #włochy #kuchnia",
    likes: "856",
  },
  {
    id: "3",
    imageUrl: "/demo-images/demo-asset.png",
    caption: "Górskie wędrówki w Alpach 🏔️ #góry #alpy #wędrówki",
    likes: "2.1k",
  },
  {
    id: "4",
    imageUrl: "/demo-images/demo-asset1.png",
    caption: "Kolorowe ulice Lizbony 🌈 #portugalia #lizbona",
    likes: "743",
  },
  {
    id: "5",
    imageUrl: "/demo-images/demo-asset.png",
    caption: "Tradycyjne targi w Maroku 🛍️ #maroko #targi",
    likes: "1.5k",
  },
  {
    id: "6",
    imageUrl: "/demo-images/demo-asset1.png",
    caption: "Plaża w Tajlandii 🏖️ #tajlandia #plaża",
    likes: "3.2k",
  },
];

export default function InstagramSection() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [realIndex, setRealIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { isLoaded, isInView, containerRef } = useAnimation();

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
              Śledź nas na Instagramie
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Najnowsze zdjęcia z naszych podróży
            </p>
          </div>
          <Button
            href="https://instagram.com"
            variant="outline"
            external
            className="flex items-center space-x-2 w-full md:w-auto justify-center md:justify-start transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            <Instagram className="w-4 h-4" />
            <span>@naszblog</span>
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
                      <Image
                        src={post.imageUrl}
                        alt={post.caption}
                        fill
                        className={`object-cover transition-all duration-500 group-hover:scale-105 transform-gpu will-change-transform `}
                        itemProp="contentUrl"
                      />

                      {/* OVERLAY Z INFORMACJAMI */}
                      <div
                        className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-500 ${
                          isActive ? "opacity-100" : "opacity-0"
                        }`}
                      >
                        <div className="absolute bottom-0 left-0 right-0 p-4 m-1 text-white">
                          <div className="flex items-center space-x-4 mb-3">
                            <div className="flex items-center space-x-2">
                              <Heart className="w-5 h-5" />
                              <span className="text-lg font-medium">
                                {post.likes}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Instagram className="w-5 h-5" />
                              <span className="text-sm">@naszblog</span>
                            </div>
                          </div>
                          <p
                            className="text-sm leading-relaxed"
                            itemProp="description"
                          >
                            {post.caption}
                          </p>
                        </div>
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
