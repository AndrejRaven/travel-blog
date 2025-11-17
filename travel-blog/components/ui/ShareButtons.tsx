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
  size?: "default" | "compact";
  align?: "start" | "center";
  className?: string;
}

export default function ShareButtons({
  postTitle,
  postUrl,
  postDescription,
  ogTitle,
  ogDescription,
  size = "default",
  align = "center",
  className = "",
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

  const isCompact = size === "compact";
  const containerClasses = [
    "flex items-center flex-wrap",
    align === "start" ? "justify-start" : "justify-center",
    isCompact ? "gap-2" : "gap-3",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const buttonBaseClasses =
    "rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 transition-all duration-200 ease-out flex items-center justify-center shadow-sm hover:shadow-md";
  const buttonSizeClasses = isCompact ? "w-9 h-9" : "w-12 h-12";
  const iconSizeClasses = isCompact ? "w-4 h-4" : "w-5 h-5";

  const renderTooltip = (label: string) => (
    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
      {label}
    </div>
  );

  return (
    <div className={containerClasses}>
      {/* Facebook */}
      <div className="relative group">
        <button
          onClick={() => handleShare("facebook")}
          className={`${buttonBaseClasses} ${buttonSizeClasses} hover:bg-blue-600 hover:text-white dark:hover:bg-blue-500 dark:hover:text-white`}
          aria-label="Udostępnij na Facebook"
        >
          <Facebook className={iconSizeClasses} />
        </button>
        {renderTooltip("Facebook")}
      </div>

      {/* Twitter/X */}
      <div className="relative group">
        <button
          onClick={() => handleShare("twitter")}
          className={`${buttonBaseClasses} ${buttonSizeClasses} hover:bg-gray-900 dark:hover:bg-white hover:text-white dark:hover:text-gray-900`}
          aria-label="Udostępnij na X (Twitter)"
        >
          <Twitter className={iconSizeClasses} />
        </button>
        {renderTooltip("X (Twitter)")}
      </div>

      {/* Native Share */}
      <div className="relative group">
        <button
          onClick={handleNativeShare}
          className={`${buttonBaseClasses} ${buttonSizeClasses} hover:bg-gray-600 hover:text-white dark:hover:bg-gray-300 dark:hover:text-gray-900`}
          aria-label={
            typeof navigator !== "undefined" &&
            typeof navigator.share === "function"
              ? "Udostępnij"
              : "Kopiuj link"
          }
        >
          <Share2 className={iconSizeClasses} />
        </button>
        {renderTooltip(
          typeof navigator !== "undefined" && typeof navigator.share === "function"
            ? "Udostępnij"
            : "Kopiuj link"
        )}
      </div>

      {/* Copy Link */}
      <div className="relative group">
        <button
          onClick={handleCopyLink}
          className={`${buttonBaseClasses} ${buttonSizeClasses} hover:bg-gray-500 hover:text-white dark:hover:bg-gray-300 dark:hover:text-gray-900`}
          aria-label="Kopiuj link"
        >
          <Copy className={iconSizeClasses} />
        </button>
        {renderTooltip("Kopiuj link")}
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
