"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { SanityImage } from "@/lib/sanity";

type StaticImage = {
  src: string;
  alt?: string;
};

type LightboxImage = SanityImage | StaticImage | null | undefined;

type OptimizedImageProps = {
  src: string;
  alt?: string;
  srcSet?: string;
  sizes?: string;
  [key: string]: unknown;
};

type RenderProps = {
  open: (index: number) => void;
  close: () => void;
  isOpen: boolean;
  selectedIndex: number | null;
};

type ImageLightboxProps = {
  images: LightboxImage[];
  getImageProps: (image: LightboxImage) => OptimizedImageProps | null | undefined;
  children: (controls: RenderProps) => React.ReactNode;
};

export default function ImageLightbox({
  images,
  getImageProps,
  children,
}: ImageLightboxProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null
  );
  const [isMounted, setIsMounted] = useState(false);
  const [previousSelectedIndex, setPreviousSelectedIndex] = useState<
    number | null
  >(null);
  const scrollPositionRef = useRef(0);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImageIndex === null) return;

      switch (e.key) {
        case "Escape":
          setSelectedImageIndex(null);
          break;
        case "ArrowLeft":
          e.preventDefault();
          setSelectedImageIndex((prev) => {
            if (prev === null) return null;
            return prev > 0 ? prev - 1 : images.length - 1;
          });
          break;
        case "ArrowRight":
          e.preventDefault();
          setSelectedImageIndex((prev) => {
            if (prev === null) return null;
            return prev < images.length - 1 ? prev + 1 : 0;
          });
          break;
      }
    };

    if (selectedImageIndex !== null) {
      if (previousSelectedIndex === null) {
        scrollPositionRef.current = window.scrollY;
      }

      requestAnimationFrame(() => {
        document.body.style.overflow = "hidden";
        document.body.style.position = "fixed";
        document.body.style.top = `-${scrollPositionRef.current}px`;
        document.body.style.width = "100%";
        document.body.style.height = "100%";
      });

      document.addEventListener("keydown", handleKeyDown);
    } else {
      requestAnimationFrame(() => {
        document.body.style.overflow = "unset";
        document.body.style.position = "unset";
        document.body.style.top = "unset";
        document.body.style.width = "unset";
        document.body.style.height = "unset";
      });

      if (previousSelectedIndex !== null) {
        requestAnimationFrame(() => {
          window.scrollTo(0, scrollPositionRef.current);
        });
      }
    }

    setPreviousSelectedIndex(selectedImageIndex);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
      document.body.style.position = "unset";
      document.body.style.top = "unset";
      document.body.style.width = "unset";
      document.body.style.height = "unset";
    };
  }, [images.length, isMounted, previousSelectedIndex, selectedImageIndex]);

  const open = (index: number) => {
    if (index < 0 || index >= images.length) return;
    setSelectedImageIndex(index);
  };

  const close = () => setSelectedImageIndex(null);

  const nextImage = () => {
    setSelectedImageIndex((prev) => {
      if (prev === null) return null;
      return prev < images.length - 1 ? prev + 1 : 0;
    });
  };

  const prevImage = () => {
    setSelectedImageIndex((prev) => {
      if (prev === null) return null;
      return prev > 0 ? prev - 1 : images.length - 1;
    });
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      close();
    }
  };

  const renderModal =
    selectedImageIndex !== null &&
    isMounted &&
    typeof document !== "undefined" &&
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
        <button
          onClick={close}
          className="absolute top-4 right-4 z-10 rounded-full p-3 bg-black/50 hover:bg-black/70 backdrop-blur-sm transition-all duration-200 hover:scale-110"
          aria-label="Zamknij modal"
          type="button"
        >
          <X className="h-6 w-6 text-white" />
        </button>

        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 rounded-full p-3 bg-black/50 hover:bg-black/70 backdrop-blur-sm transition-all duration-200 hover:scale-110"
              aria-label="Poprzednie zdjęcie"
              type="button"
            >
              <ChevronLeft className="h-6 w-6 text-white" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 rounded-full p-3 bg-black/50 hover:bg-black/70 backdrop-blur-sm transition-all duration-200 hover:scale-110"
              aria-label="Następne zdjęcie"
              type="button"
            >
              <ChevronRight className="h-6 w-6 text-white" />
            </button>
          </>
        )}

        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2">
            <span className="text-white text-sm font-medium">
              {selectedImageIndex + 1} / {images.length}
            </span>
          </div>
        )}

        <div className="relative w-[70vw] h-[70vh] max-w-4xl xl:max-w-5xl 2xl:max-w-6xl max-h-[80vh]">
          {(() => {
            const image = images[selectedImageIndex];
            const imageProps = getImageProps(image);
            if (!imageProps) return null;

            const altText =
              typeof imageProps.alt === "string" ? imageProps.alt : "Obraz";

            return (
              <Image
                {...imageProps}
                fill
                className="object-contain"
                sizes={imageProps.sizes || "70vw"}
                priority
                alt={altText}
              />
            );
          })()}
        </div>
      </div>,
      document.body
    );

  return (
    <>
      {children({
        open,
        close,
        isOpen: selectedImageIndex !== null,
        selectedIndex: selectedImageIndex,
      })}
      {renderModal}
    </>
  );
}

