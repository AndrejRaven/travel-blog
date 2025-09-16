"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { ImageCollageData } from "@/lib/component-types";

type Props = {
  data: ImageCollageData;
};

export default function ImageCollage({ data }: Props) {
  const { images, layout } = data;

  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null
  );
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [previousSelectedIndex, setPreviousSelectedIndex] = useState<
    number | null
  >(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mount check dla SSR
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Intersection Observer - animacja uruchamia się gdy komponent wchodzi w viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            setTimeout(() => {
              setIsLoaded(true);
            }, 200);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  // Obsługa klawiatury w modalu i blokowanie scrollingu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImageIndex === null) return;

      switch (e.key) {
        case "Escape":
          setSelectedImageIndex(null);
          break;
        case "ArrowLeft":
          e.preventDefault();
          setSelectedImageIndex((prev) =>
            prev !== null ? (prev > 0 ? prev - 1 : images.length - 1) : null
          );
          break;
        case "ArrowRight":
          e.preventDefault();
          setSelectedImageIndex((prev) =>
            prev !== null ? (prev < images.length - 1 ? prev + 1 : 0) : null
          );
          break;
      }
    };

    if (selectedImageIndex !== null) {
      // Zapisz pozycję scrollu tylko przy pierwszym otwarciu
      if (previousSelectedIndex === null) {
        const currentScrollY = window.scrollY;
        setScrollPosition(currentScrollY);
      }

      // Blokuj scrolling z płynnym przejściem
      requestAnimationFrame(() => {
        document.body.style.overflow = "hidden";
        document.body.style.position = "fixed";
        document.body.style.top = `-${scrollPosition}px`;
        document.body.style.width = "100%";
        document.body.style.height = "100%";
      });

      document.addEventListener("keydown", handleKeyDown);
    } else {
      // Przywróć scrolling z płynnym przejściem
      requestAnimationFrame(() => {
        document.body.style.overflow = "unset";
        document.body.style.position = "unset";
        document.body.style.top = "unset";
        document.body.style.width = "unset";
        document.body.style.height = "unset";
      });

      // Przywróć scroll tylko jeśli zamykamy modal (z wartości na null)
      if (previousSelectedIndex !== null && scrollPosition !== 0) {
        requestAnimationFrame(() => {
          window.scrollTo(0, scrollPosition);
        });
      }
    }

    // Zaktualizuj poprzedni indeks
    setPreviousSelectedIndex(selectedImageIndex);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // Przywróć scrolling przy unmount
      document.body.style.overflow = "unset";
      document.body.style.position = "unset";
      document.body.style.top = "unset";
      document.body.style.width = "unset";
      document.body.style.height = "unset";
    };
  }, [selectedImageIndex, images.length]);

  const openModal = (index: number) => {
    setSelectedImageIndex(index);
  };

  const closeModal = () => {
    setSelectedImageIndex(null);
  };

  const nextImage = () => {
    setSelectedImageIndex((prev) =>
      prev !== null ? (prev < images.length - 1 ? prev + 1 : 0) : null
    );
  };

  const prevImage = () => {
    setSelectedImageIndex((prev) =>
      prev !== null ? (prev > 0 ? prev - 1 : images.length - 1) : null
    );
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  if (!images || images.length === 0) return null;

  const mainImage = images[0];
  const thumbnailImages = images.slice(1, layout.thumbnailCount + 1);

  return (
    <div
      ref={containerRef}
      className={`w-full transition-all duration-700 ${
        isInView && isLoaded
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-8"
      }`}
    >
      <div
        className={`w-full ${
          layout.maxWidth === "full" ? "max-w-none" : `max-w-${layout.maxWidth}`
        } mx-auto`}
      >
        {/* Główne zdjęcie */}
        <div
          className="relative w-full h-64 md:h-80 lg:h-96 xl:h-[28rem] rounded-2xl overflow-hidden cursor-pointer group"
          onClick={() => openModal(0)}
        >
          <Image
            src={mainImage.src}
            alt={mainImage.alt || "Główne zdjęcie"}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out">
            <span className="text-white/70 group-hover:text-white text-xs font-medium transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
              Zobacz
            </span>
          </div>
        </div>

        {/* Miniaturki */}
        {thumbnailImages.length > 0 && (
          <div
            className={`mt-4 grid gap-3 ${
              thumbnailImages.length === 1
                ? "grid-cols-1 max-w-xs mx-auto"
                : thumbnailImages.length === 2
                ? "grid-cols-2"
                : thumbnailImages.length === 3
                ? "grid-cols-3"
                : "grid-cols-4"
            }`}
          >
            {thumbnailImages.map((image, index) => (
              <div
                key={index}
                className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group"
                onClick={() => openModal(index + 1)}
              >
                <Image
                  src={image.src}
                  alt={image.alt || `Miniatura ${index + 1}`}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out">
                  <span className="text-white/70 group-hover:text-white text-xs font-medium transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                    Zobacz
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedImageIndex !== null &&
        isMounted &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: "100vw",
              height: "100vh",
              zIndex: 9999,
            }}
            onClick={handleBackdropClick}
          >
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-10 rounded-full p-3 bg-black/50 hover:bg-black/70 backdrop-blur-sm transition-all duration-200 hover:scale-110"
              aria-label="Zamknij modal"
            >
              <X className="h-6 w-6 text-white" />
            </button>

            {/* Navigation Buttons */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 rounded-full p-3 bg-black/50 hover:bg-black/70 backdrop-blur-sm transition-all duration-200 hover:scale-110"
                  aria-label="Poprzednie zdjęcie"
                >
                  <ChevronLeft className="h-6 w-6 text-white" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 rounded-full p-3 bg-black/50 hover:bg-black/70 backdrop-blur-sm transition-all duration-200 hover:scale-110"
                  aria-label="Następne zdjęcie"
                >
                  <ChevronRight className="h-6 w-6 text-white" />
                </button>
              </>
            )}

            {/* Image Counter */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2">
                <span className="text-white text-sm font-medium">
                  {selectedImageIndex + 1} / {images.length}
                </span>
              </div>
            )}

            {/* Image */}
            <div className="relative w-[70vw] h-[70vh] max-w-6xl max-h-[80vh]">
              <Image
                src={images[selectedImageIndex].src}
                alt={
                  images[selectedImageIndex].alt ||
                  `Zdjęcie ${selectedImageIndex + 1}`
                }
                fill
                className="object-contain"
                sizes="70vw"
                priority
              />
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
