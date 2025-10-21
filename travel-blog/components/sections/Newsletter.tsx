"use client";

import React, { useState } from "react";
import Button from "@/components/ui/Button";
import { Mail, Shield, UserX, Ban } from "lucide-react";
import SectionContainer from "@/components/shared/SectionContainer";
import { useAnimation } from "@/lib/useAnimation";
import { getAnimationClass } from "@/lib/render-utils";
import { NewsletterData } from "@/lib/component-types";

type Props = {
  data: NewsletterData;
};

export default function Newsletter({ data }: Props) {
  // Zabezpieczenie na wypadek gdyby data był undefined
  if (!data) {
    console.error("Newsletter: Missing data", { data });
    return null;
  }

  const {
    container,
    title,
    subtitle,
    buttonText,
    privacyText,
    features,
    placeholder,
    successMessage,
    errorMessage,
  } = data;

  // Zabezpieczenie na wypadek gdyby container był undefined
  if (!container) {
    console.error("Newsletter: Missing container data", { container });
    return null;
  }

  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { isLoaded, isInView, containerRef } = useAnimation();

  // Sprawdź czy użytkownik już się zapisał (z localStorage z cache 7 dni)
  React.useEffect(() => {
    const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 dni w ms
    const cacheData = JSON.parse(
      localStorage.getItem("newsletter-cache") || "{}"
    );

    if (
      cacheData.subscribed &&
      Date.now() - cacheData.timestamp < CACHE_DURATION
    ) {
      setIsSubscribed(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError("");

    try {
      // Symulacja wysłania formularza
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setIsSubscribed(true);
      setIsLoading(false);
      setEmail("");

      // Zapisz w localStorage że użytkownik się zapisał (z timestamp)
      localStorage.setItem(
        "newsletter-cache",
        JSON.stringify({
          subscribed: true,
          timestamp: Date.now(),
        })
      );
    } catch (err) {
      setError(errorMessage || "Wystąpił błąd. Spróbuj ponownie.");
      setIsLoading(false);
    }
  };

  if (isSubscribed) {
    return (
      <SectionContainer config={container}>
        <section
          ref={containerRef}
          className="mx-auto max-w-4xl px-6 py-16 bg-gray-50 dark:bg-gray-900"
        >
          <div
            className={`text-center ${getAnimationClass({
              type: "image",
              delay: "none",
              isInView: isLoaded && isInView,
              isLoaded: true,
            })}`}
          >
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4 transition-transform duration-300 hover:scale-110">
              <Mail className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl md:text-3xl font-serif font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {successMessage || "Dziękujemy za zapisanie się!"}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Wkrótce otrzymasz od nas pierwszy newsletter z najnowszymi
              artykułami i podróżniczymi inspiracjami.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Dziękujemy za zaufanie! 🎉
            </p>
            <Button
              onClick={() => {
                localStorage.removeItem("newsletter-cache");
                setIsSubscribed(false);
              }}
              variant="danger"
              className="text-xs px-4 py-2 h-auto transition-all duration-300 hover:scale-105"
            >
              Zrezygnuj z subskrypcji
            </Button>
          </div>
        </section>
      </SectionContainer>
    );
  }

  return (
    <SectionContainer config={container}>
      <section
        ref={containerRef}
        className="mx-auto max-w-4xl px-6 py-16 bg-gray-50 dark:bg-gray-900"
      >
        <div
          className={`text-center mb-8 ${getAnimationClass({
            type: "sectionHeader",
            delay: "none",
            isInView: isLoaded && isInView,
            isLoaded: true,
          })}`}
        >
          <h2 className="text-2xl md:text-3xl font-serif font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {title}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className={`max-w-md mx-auto ${getAnimationClass({
            type: "text",
            delay: "long",
            isInView: isLoaded && isInView,
            isLoaded: true,
          })}`}
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={placeholder || "Twój adres email"}
              required
              className="flex-1 px-4 py-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:border-transparent transition-all duration-300 hover:shadow-md focus:shadow-lg"
            />
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading || !email}
              className="px-6 py-3 whitespace-nowrap transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Zapisywanie...</span>
                </div>
              ) : (
                buttonText
              )}
            </Button>
          </div>

          {error && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400 text-center">
                {error}
              </p>
            </div>
          )}

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
            {privacyText}
          </p>
        </form>

        {features && features.length > 0 && (
          <div
            className={`mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-sm text-gray-500 dark:text-gray-400 ${getAnimationClass(
              {
                type: "subtle",
                delay: "longest",
                isInView: isLoaded && isInView,
                isLoaded: true,
              }
            )}`}
          >
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 transition-all duration-300 hover:scale-105"
              >
                {feature.icon === "Shield" && <Shield className="w-4 h-4" />}
                {feature.icon === "UserX" && <UserX className="w-4 h-4" />}
                {feature.icon === "Ban" && <Ban className="w-4 h-4" />}
                <span>{feature.text}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </SectionContainer>
  );
}
