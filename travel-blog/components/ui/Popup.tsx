"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import Image from "next/image";
import Button from "./Button";
import { getSanityImageProps } from "@/lib/sanity-image";
import type { SiteConfig } from "@/lib/sanity";

type PopupContent = NonNullable<SiteConfig["popup"]>;

interface PopupProps {
  popupData: PopupContent;
  onClose?: () => void;
}

export default function Popup({ popupData, onClose }: PopupProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [hasShown, setHasShown] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);
  const scrollThreshold = popupData.scrollThreshold ?? 60;
  const cooldownMinutes = popupData.cooldownMinutes ?? 60;
  const hasButton = popupData.button?.label && popupData.button?.href;
  const imageProps = popupData.image
    ? getSanityImageProps(popupData.image, {
        width: 160,
        height: 160,
      })
    : null;

  const isEnabled = popupData.enabled ?? true;
  const hasContent = Boolean(popupData?.title || popupData?.description);
  const canRenderPopup = isEnabled && hasContent;

  // Sprawdź czy popup może być pokazany (z konfigurowalnym cooldown)
  useEffect(() => {
    if (!canRenderPopup) {
      setShouldShow(false);
      return;
    }

    const checkIfCanShow = () => {
      if (typeof window === "undefined") return;

      const lastShown = localStorage.getItem("popup-last-shown");
      const now = Date.now();
      const cooldownMs = cooldownMinutes * 60 * 1000; // Konwertuj minuty na milisekundy

      if (!lastShown || now - parseInt(lastShown) >= cooldownMs) {
        setShouldShow(true);
      } else {
        setShouldShow(false);
      }
    };

    checkIfCanShow();
  }, [cooldownMinutes, canRenderPopup]);

  useEffect(() => {
    if (!canRenderPopup || !shouldShow) return; // Nie pokazuj jeśli nie minął cooldown

    const handleScroll = () => {
      if (hasShown) return; // Nie pokazuj ponownie

      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercentage = (scrollTop / scrollHeight) * 100;

      if (scrollPercentage >= scrollThreshold) {
        setIsVisible(true);
        setHasShown(true);
        // Zapisz czas pokazania popup
        localStorage.setItem("popup-last-shown", Date.now().toString());
      }
    };

    // Dodaj event listener
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Sprawdź czy już jesteśmy powyżej progu (dla krótkich stron)
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [scrollThreshold, hasShown, shouldShow, canRenderPopup]);

  useEffect(() => {
    if (canRenderPopup) return;

    setIsVisible(false);
    setIsClosing(false);
    setHasShown(false);
    setShouldShow(false);
  }, [canRenderPopup]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!canRenderPopup || !isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
        isClosing ? "opacity-0" : "opacity-100"
      }`}
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Popup Content */}
      <div
        className={`relative w-full max-w-md transform transition-all duration-300 ${
          isClosing ? "scale-95 opacity-0" : "scale-100 opacity-100"
        }`}
      >
        <div className="rounded-2xl p-6 shadow-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 rounded-full p-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Zamknij popup"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>

          {/* Channel Image */}
          {imageProps && (
            <div className="mb-4 flex justify-center">
              <div className="relative h-20 w-20 overflow-hidden rounded-full ring-4 ring-gray-200 dark:ring-gray-700">
                <Image
                  src={imageProps.src}
                  alt={imageProps.alt}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>
            </div>
          )}

          {/* Title */}
          <h3 className="mb-2 text-center text-xl font-serif font-bold text-gray-900 dark:text-gray-100">
            {popupData.title}
          </h3>

          {/* Description */}
          {popupData.description && (
            <p className="mb-6 text-center text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              {popupData.description}
            </p>
          )}

          {/* Button */}
          {hasButton && (
            <div className="flex justify-center">
              <Button
                href={popupData.button?.href}
                variant={popupData.button?.variant}
                external={popupData.button?.external}
                className="w-full"
              >
                {popupData.button?.label}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
