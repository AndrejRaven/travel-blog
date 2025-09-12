"use client";

import Image from "next/image";
import { useState } from "react";
import React from "react";
import Button from "@/components/ui/Button";
import SectionHeader from "@/components/shared/SectionHeader";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

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

  return (
    <section className="py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-0 md:px-6">
        {/* HEADER */}
        <div className="flex flex-col space-y-4 mb-8 px-6 md:px-0 md:flex-row md:items-center md:justify-between md:space-y-0">
          <SectionHeader
            title="Śledź nas na Instagramie"
            description="Najnowsze zdjęcia z naszych podróży"
          />
          <Button
            href="https://instagram.com"
            variant="outline"
            external
            className="flex items-center space-x-2 w-full md:w-auto justify-center md:justify-start"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.40s-.644-1.44-1.439-1.40z" />
            </svg>
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
                  <div
                    className={`relative group transition-all duration-500 rounded-2xl ease-out overflow-hidden ${
                      isActive ? "scale-100 z-10" : "scale-90 opacity-30"
                    }`}
                  >
                    <div className="relative aspect-square">
                      <Image
                        src={post.imageUrl}
                        alt={post.caption}
                        fill
                        className={`object-cover transition-all duration-500 group-hover:scale-105 transform-gpu will-change-transform `}
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
                              <svg
                                className="w-5 h-5"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                              </svg>
                              <span className="text-lg font-medium">
                                {post.likes}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <svg
                                className="w-5 h-5"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.40s-.644-1.44-1.439-1.40z" />
                              </svg>
                              <span className="text-sm">@naszblog</span>
                            </div>
                          </div>
                          <p className="text-sm leading-relaxed">
                            {post.caption}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
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
    </section>
  );
}
