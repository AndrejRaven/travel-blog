"use client";

import React from "react";
import { Facebook, Twitter, Share2 } from "lucide-react";
import Button from "./Button";

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
      console.log(`Udostępnianie na ${platform}:`, url);

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
        console.log("Popup zablokowany, otwieram w nowej karcie");
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        console.log("Okno udostępniania otwarte pomyślnie");
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
        console.log("Udostępnianie zakończone pomyślnie");
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Błąd podczas udostępniania:", error);
          alert("Nie udało się udostępnić artykułu. Spróbuj ponownie.");
        }
      }
    } else {
      // Fallback - kopiuj URL do schowka
      try {
        await navigator.clipboard.writeText(postUrl);
        alert("✅ Link skopiowany do schowka!");
        console.log("URL skopiowany do schowka:", postUrl);
      } catch (error) {
        console.error("Błąd podczas kopiowania:", error);
        // Ostateczny fallback - pokaż URL do skopiowania
        const textArea = document.createElement("textarea");
        textArea.value = postUrl;
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand("copy");
          alert("✅ Link skopiowany do schowka!");
        } catch (fallbackError) {
          console.error("Fallback copy failed:", fallbackError);
          alert(`Skopiuj ten link: ${postUrl}`);
        }
        document.body.removeChild(textArea);
      }
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3 mb-4">
        <Share2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Udostępnij ten artykuł
        </h3>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          onClick={() => handleShare("facebook")}
          className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-blue-200 dark:border-blue-700"
        >
          <Facebook className="w-4 h-4" />
          Facebook
        </Button>

        <Button
          variant="outline"
          onClick={() => handleShare("twitter")}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600"
        >
          <Twitter className="w-4 h-4" />X (Twitter)
        </Button>

        <Button
          variant="outline"
          onClick={handleNativeShare}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600"
        >
          <Share2 className="w-4 h-4" />
          {navigator.share ? "Udostępnij" : "Kopiuj link"}
        </Button>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
        Pomóż innym znaleźć ten artykuł, udostępniając go w mediach
        społecznościowych.
      </p>
    </div>
  );
}
