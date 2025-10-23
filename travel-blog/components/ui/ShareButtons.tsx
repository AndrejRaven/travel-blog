"use client";

import React, { useState, useEffect } from "react";
import { Facebook, Twitter, Share2, Copy } from "lucide-react";

interface ShareButtonsProps {
  postTitle: string;
  postUrl: string;
  postDescription?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImageUrl?: string;
}

export default function ShareButtons({
  postTitle,
  postUrl,
  postDescription,
  ogTitle,
  ogDescription,
  ogImageUrl,
}: ShareButtonsProps) {
  const [copySuccess, setCopySuccess] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Client-side hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Auto-dismiss copy success message
  useEffect(() => {
    if (copySuccess) {
      const timer = setTimeout(() => setCopySuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copySuccess]);

  // Walidacja URL
  if (!postUrl || !postTitle) {
    console.warn("ShareButtons: Brak wymaganych danych (postUrl, postTitle)");
    return null;
  }

  // Użyj danych Open Graph jeśli dostępne, w przeciwnym razie fallback do podstawowych danych
  const shareTitle = ogTitle || postTitle;
  const shareDescription = ogDescription || postDescription || "";
  const shareImageUrl = ogImageUrl || "";

  const encodedTitle = encodeURIComponent(shareTitle);
  const encodedUrl = encodeURIComponent(postUrl);
  const encodedDescription = shareDescription
    ? encodeURIComponent(shareDescription)
    : "";

  // Poprawione linki do udostępniania
  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}${
      encodedDescription ? `%20${encodedDescription}` : ""
    }`,
  };

  const handleShare = (platform: keyof typeof shareLinks) => {
    try {
      const url = shareLinks[platform];

      // Sprawdź czy URL jest prawidłowy
      if (!url || url === "undefined" || url.includes("undefined")) {
        throw new Error("Nieprawidłowy URL do udostępniania");
      }

      const popup = window.open(
        url,
        "_blank",
        "width=600,height=400,scrollbars=yes,resizable=yes,noopener,noreferrer"
      );

      if (!popup) {
        // Jeśli popup został zablokowany, otwórz w nowej karcie
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
      }
    } catch (error) {
      console.error(`Błąd podczas udostępniania na ${platform}:`, error);
      alert(
        `Nie udało się otworzyć okna udostępniania. Sprawdź konsolę przeglądarki.`
      );
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareDescription || shareTitle,
          url: postUrl,
        });
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Błąd podczas udostępniania:", error);
          alert("Nie udało się udostępnić artykułu. Spróbuj ponownie.");
        }
      }
    } else {
      // Fallback - kopiuj URL do schowka
      handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopySuccess(true);
    } catch (error) {
      console.error("Błąd podczas kopiowania:", error);
      // Ostateczny fallback - pokaż URL do skopiowania
      const textArea = document.createElement("textarea");
      textArea.value = postUrl;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        setCopySuccess(true);
      } catch (fallbackError) {
        console.error("Fallback copy failed:", fallbackError);
        alert(`Skopiuj ten link: ${postUrl}`);
      }
      document.body.removeChild(textArea);
    }
  };

  // Don't render anything until client-side hydration is complete
  if (!isClient) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-3 flex-wrap">
      {/* Facebook */}
      <div className="relative group">
        <button
          onClick={() => handleShare("facebook")}
          className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-blue-600 hover:text-white text-gray-600 dark:text-gray-400 transition-all duration-200 ease-out flex items-center justify-center shadow-sm hover:shadow-md"
          aria-label="Udostępnij na Facebook"
        >
          <Facebook className="w-5 h-5" />
        </button>
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
          Facebook
        </div>
      </div>

      {/* Twitter/X */}
      <div className="relative group">
        <button
          onClick={() => handleShare("twitter")}
          className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-900 dark:hover:bg-white hover:text-white dark:hover:text-gray-900 text-gray-600 dark:text-gray-400 transition-all duration-200 ease-out flex items-center justify-center shadow-sm hover:shadow-md"
          aria-label="Udostępnij na X (Twitter)"
        >
          <Twitter className="w-5 h-5" />
        </button>
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
          X (Twitter)
        </div>
      </div>

      {/* Native Share */}
      <div className="relative group">
        <button
          onClick={handleNativeShare}
          className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-600 hover:text-white text-gray-600 dark:text-gray-400 transition-all duration-200 ease-out flex items-center justify-center shadow-sm hover:shadow-md"
          aria-label={
            typeof navigator !== "undefined" &&
            typeof navigator.share === "function"
              ? "Udostępnij"
              : "Kopiuj link"
          }
        >
          <Share2 className="w-5 h-5" />
        </button>
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
          {typeof navigator !== "undefined" &&
          typeof navigator.share === "function"
            ? "Udostępnij"
            : "Kopiuj link"}
        </div>
      </div>

      {/* Copy Link */}
      <div className="relative group">
        <button
          onClick={handleCopyLink}
          className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-500 hover:text-white text-gray-600 dark:text-gray-400 transition-all duration-200 ease-out flex items-center justify-center shadow-sm hover:shadow-md"
          aria-label="Kopiuj link"
        >
          <Copy className="w-5 h-5" />
        </button>
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
          Kopiuj link
        </div>
      </div>

      {/* Copy success toast */}
      {copySuccess && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse">
          ✅ Link skopiowany!
        </div>
      )}
    </div>
  );
}
