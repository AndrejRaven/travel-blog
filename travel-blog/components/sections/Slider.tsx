import React, { useState, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay, Navigation } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import SectionContainer from "@/components/shared/SectionContainer";
import { useAnimation } from "@/lib/useAnimation";
import { SliderData } from "@/lib/component-types";

type Props = {
  data: SliderData;
};

export default function Slider({ data }: Props) {
  // Wszystkie hooki muszą być przed wczesnymi returnami
  const [activeSlide, setActiveSlide] = useState(0);
  const swiperRef = useRef<SwiperType | null>(null);
  const { isLoaded, isInView, containerRef } = useAnimation();

  // Zabezpieczenie na wypadek gdyby data był undefined
  if (!data) {
    console.error("Slider: Missing data", { data });
    return null;
  }

  const { container, title, slides } = data;

  // Zabezpieczenie na wypadek gdyby container był undefined
  if (!container) {
    console.error("Slider: Missing container data", { container });
    return null;
  }

  return (
    <SectionContainer config={container}>
      <div className="w-full px-0 my-12">
        <div className="relative">
          {/* Strzałka w lewo */}
          <button
            onClick={() => swiperRef.current?.slidePrev()}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-full p-2 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 border border-gray-200/50 dark:border-gray-700/50 opacity-60 hover:opacity-100"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          {/* Strzałka w prawo */}
          <button
            onClick={() => swiperRef.current?.slideNext()}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-full p-2 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 border border-gray-200/50 dark:border-gray-700/50 opacity-60 hover:opacity-100"
          >
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          <Swiper
            modules={[Pagination, Autoplay, Navigation]}
            spaceBetween={20}
            slidesPerView={1.5}
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
                slidesPerView: 1.1,
                spaceBetween: 10,
                centeredSlides: true,
              },
              640: {
                slidesPerView: 1.1,
                spaceBetween: 15,
                centeredSlides: true,
              },
              1024: {
                slidesPerView: 1.5,
                spaceBetween: 30,
                centeredSlides: true,
              },
            }}
            pagination={{
              clickable: true,
              el: ".swiper-pagination",
              renderBullet: function (index: number, className: string) {
                return '<span class="' + className + '"></span>';
              },
            }}
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
            onSlideChange={(swiper) => {
              setActiveSlide(swiper.activeIndex);
            }}
            className="mySwiper"
          >
            {slides.map((post, index) => {
              const isActive = index === activeSlide;

              return (
                <SwiperSlide key={post.id}>
                  <div
                    className={`w-full max-w-4xl xl:max-w-5xl 2xl:max-w-6xl p-12 mt-0 mb-0 rounded-none shadow-none mx-auto overflow-hidden transition-all duration-500 ease-out ${
                      isActive ? "scale-105 z-10" : "scale-95 opacity-60"
                    }`}
                    role="banner"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:min-h-[50vh] bg-gray-50 dark:bg-gray-800 rounded-2xl overflow-hidden">
                      {/* Tekst po lewej stronie na desktop */}
                      <div className="order-2 lg:order-1 lg:col-span-6 px-6 lg:px-12 py-8 lg:py-16 flex items-center">
                        <div className="space-y-4 text-center lg:text-left transition-all duration-1000 ease-out opacity-100 translate-y-0">
                          <div>
                            <h3 className="text-2xl md:text-2xl font-serif font-semibold mb-3 text-gray-900 dark:text-gray-100">
                              <strong>
                                <span>{post.title}</span>
                              </strong>
                            </h3>
                            <p className="text-lg font-serif leading-relaxed text-gray-600 dark:text-gray-300">
                              {post.caption}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Obrazek po prawej stronie na desktop */}
                      <div className="order-1 lg:order-2 lg:col-span-6 w-full aspect-square lg:aspect-auto lg:h-full">
                        <div className="relative w-full h-full overflow-hidden">
                          <Image
                            src={post.imageUrl}
                            alt={post.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              );
            })}
          </Swiper>
        </div>

        {/* Paginacja */}
        <div
          className="swiper-pagination mt-8 flex justify-center"
          style={
            {
              "--swiper-pagination-color": "#f59e0b",
              "--swiper-pagination-bullet-size": "12px",
              "--swiper-pagination-bullet-inactive-color": "#d1d5db",
              "--swiper-pagination-bullet-inactive-opacity": "0.5",
            } as React.CSSProperties
          }
        />
      </div>
    </SectionContainer>
  );
}
