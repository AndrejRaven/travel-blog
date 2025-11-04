"use client";

import React, { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import { Mail, Shield, UserX, Ban, Clock, CheckCircle } from "lucide-react";
import SectionContainer from "@/components/shared/SectionContainer";
import { useAnimation } from "@/lib/useAnimation";
import { getAnimationClass } from "@/lib/render-utils";
import { NewsletterData, NewsletterCacheData } from "@/lib/component-types";
import {
  isValidEmail,
  getNewsletterCache,
  clearNewsletterCache,
  saveNewsletterCache,
  checkAndRecordRateLimit,
  subscribeNewsletter,
  unsubscribeNewsletter,
  replacePlaceholders,
  getNewsletterState,
  type NewsletterState,
  checkSubscriptionStatus,
} from "@/lib/newsletter";
import { useToast } from "@/components/ui/Toast";

type Props = {
  data: NewsletterData;
};

export default function Newsletter({ data }: Props) {
  // Wszystkie hooki muszą być przed wczesnymi returnami
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showUnsubscribeConfirm, setShowUnsubscribeConfirm] = useState(false);
  const [newsletterState, setNewsletterState] =
    useState<NewsletterState>("new");
  const [cache, setCache] = useState<NewsletterCacheData | null>(null);
  const { isLoaded, isInView, containerRef } = useAnimation();
  const { addToast } = useToast();

  // Inicjalizacja stanu na podstawie cache
  useEffect(() => {
    const cachedData = getNewsletterCache();
    setCache(cachedData);

    if (cachedData) {
      setEmail(cachedData.email);
      setNewsletterState(getNewsletterState(cachedData.email));
    }
  }, []);

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
    // Nowe pola
    successTitle,
    successSubtitle,
    successInfo,
    unsubscribeButtonText,
    alreadySubscribedTitle,
    alreadySubscribedConfirmed,
    unsubscribedTitle,
    unsubscribedSubtitle,
    unsubscribedInfo,
    resubscribeButtonText,
    errorInvalidEmail,
    errorNetworkIssue,
    errorUnknown,
    rateLimitMessage,
  } = data;

  // Zabezpieczenie na wypadek gdyby container był undefined
  if (!container) {
    console.error("Newsletter: Missing container data", { container });
    return null;
  }

  // Manual status refresh handler
  const handleRefreshStatus = async () => {
    const cached = getNewsletterCache();
    if (!cached?.email) return;

    setIsLoading(true);
    try {
      await checkSubscriptionStatus(cached.email);
      const updatedCache = getNewsletterCache();
      setCache(updatedCache);

      // Update newsletter state based on new cache
      if (updatedCache) {
        const newState = getNewsletterState(updatedCache.email);
        setNewsletterState(newState);

        if (updatedCache.confirmed) {
          addToast({
            type: "success",
            title: "Status zaktualizowany",
            message: "Twój email został potwierdzony!",
            duration: 3000,
          });
        } else {
          addToast({
            type: "info",
            title: "Status zaktualizowany",
            message: "Email nadal czeka na potwierdzenie. Sprawdź skrzynkę.",
            duration: 3000,
          });
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_err) {
      addToast({
        type: "error",
        title: "Błąd",
        message: "Nie udało się sprawdzić statusu. Spróbuj ponownie.",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !isValidEmail(email)) {
      setError(
        errorInvalidEmail ||
          "To nie wygląda jak prawidłowy email. Sprawdź pisownię."
      );
      return;
    }

    // Check rate limiting
    const rateLimit = checkAndRecordRateLimit();
    if (!rateLimit.allowed) {
      addToast({
        type: "rate-limit",
        title: rateLimitMessage || "Poczekaj chwilkę... Za dużo akcji.",
        message: rateLimit.message,
        duration: 5000,
      });
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Sprawdź czy email już jest zapisany przed próbą subskrypcji
      try {
        const status = await checkSubscriptionStatus(email);
        if (status.subscribed) {
          // Email już zapisany - przełącz na stan subscribed
          const cache: NewsletterCacheData = {
            email: email.trim(),
            subscribed: true,
            confirmed: status.confirmed,
            timestamp: Date.now(),
          };
          saveNewsletterCache(cache);
          setCache(cache);
          setNewsletterState("subscribed");

          const message = status.confirmed
            ? replacePlaceholders(
                alreadySubscribedConfirmed ||
                  "Twój email {{email}} jest zapisany. Dziękujemy za zaufanie!",
                { email: email.trim() }
              )
            : "Twój email jest już zapisany. Sprawdź skrzynkę — wysłaliśmy potwierdzenie.";

          addToast({
            type: "info",
            title:
              alreadySubscribedTitle ||
              "Cześć, wygląda na to, że jesteś już z nami!",
            message,
            duration: 5000,
          });
          return;
        }
      } catch (statusError) {
        // Jeśli sprawdzanie statusu się nie powiodło, kontynuuj z normalnym flow
        // (może być problem z połączeniem, ale subskrypcja może się udać)
        console.warn(
          "Failed to check subscription status, continuing with subscribe:",
          statusError
        );
      }

      const response = await subscribeNewsletter(email);

      if (response.success) {
        setNewsletterState("subscribed");
        setCache(getNewsletterCache());
        addToast({
          type: "success",
          title: successTitle || "Dzięki za zapis!",
          message: response.message,
          duration: 5000,
        });
      } else {
        // Sprawdź czy to błąd "email już zapisany"
        if (response.message.includes("już zapisany")) {
          // Przełącz na stan "już zapisany"
          setNewsletterState("subscribed");
          setCache(getNewsletterCache());
          addToast({
            type: "info",
            title: "Email już zapisany",
            message: response.message,
            duration: 5000,
          });
        } else {
          // Inne błędy (połączenie, etc.)
          setError(response.message);
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_err) {
      setError(
        errorNetworkIssue || "Ups, problem z połączeniem. Spróbuj ponownie."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!cache?.email) return;

    // Check rate limiting
    const rateLimit = checkAndRecordRateLimit();
    if (!rateLimit.allowed) {
      addToast({
        type: "rate-limit",
        title: rateLimitMessage || "Poczekaj chwilkę... Za dużo akcji.",
        message: rateLimit.message,
        duration: 5000,
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await unsubscribeNewsletter(cache.email);

      if (response.success) {
        setNewsletterState("unsubscribed");
        setCache(getNewsletterCache());
        addToast({
          type: "info",
          title: unsubscribedTitle || "Szkoda, że odchodzisz",
          message: response.message,
          duration: 5000,
        });
      } else {
        addToast({
          type: "error",
          title: "Błąd wypisywania",
          message:
            response.message ||
            errorUnknown ||
            "Coś poszło nie tak. Spróbuj za chwilę.",
          duration: 5000,
        });
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_err) {
      addToast({
        type: "error",
        title: "Błąd",
        message: errorUnknown || "Coś poszło nie tak. Spróbuj za chwilę.",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResubscribe = () => {
    setNewsletterState("new");
    setEmail("");
    setError("");
    clearNewsletterCache();
    setCache(null);
  };

  // Render functions for each state
  const renderNewUserForm = () => (
    <>
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
            disabled={isLoading}
            className="flex-1 px-4 py-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:border-transparent transition-all duration-300 hover:shadow-md focus:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
    </>
  );

  const renderSubscribedState = () => {
    const isConfirmed = cache?.confirmed;

    return (
      <div
        className={`text-center ${getAnimationClass({
          type: "image",
          delay: "none",
          isInView: isLoaded && isInView,
          isLoaded: true,
        })}`}
      >
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-transform duration-300 hover:scale-110 ${
            isConfirmed
              ? "bg-green-100 dark:bg-green-900"
              : "bg-blue-100 dark:bg-blue-900"
          }`}
        >
          <Mail
            className={`w-8 h-8 ${
              isConfirmed
                ? "text-green-600 dark:text-green-400"
                : "text-blue-600 dark:text-blue-400"
            }`}
          />
        </div>
        <h2 className="text-2xl md:text-3xl font-serif font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {isConfirmed
            ? alreadySubscribedTitle ||
              "Cześć, wygląda na to, że jesteś już z nami!"
            : successTitle || successMessage || "Dzięki za zapis!"}
        </h2>

        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {isConfirmed
            ? replacePlaceholders(
                alreadySubscribedConfirmed ||
                  "Twój email {{email}} jest zapisany. Dziękujemy za zaufanie!",
                {
                  email: cache?.email || "",
                }
              )
            : successSubtitle ||
              "Sprawdź skrzynkę — wysłaliśmy potwierdzenie. Kliknij link w emailu, aby dokończyć zapis."}
        </p>
        {!isConfirmed && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {successInfo ||
              "Email może dotrzeć z opóźnieniem 2-5 minut. Nie widzisz emaila? Sprawdź folder SPAM."}
          </p>
        )}

        {!isConfirmed && (
          <div className="flex items-center justify-center gap-2 mb-6">
            <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Oczekuje na potwierdzenie
            </span>
          </div>
        )}

        {isConfirmed && (
          <div className="flex items-center justify-center gap-2 mb-6">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Potwierdzone
            </span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {!isConfirmed && (
            <Button
              onClick={handleRefreshStatus}
              variant="outline"
              disabled={isLoading}
              className="px-6 py-2 h-auto transition-all duration-300 hover:scale-105"
            >
              {isLoading ? "Sprawdzanie..." : "Sprawdź status"}
            </Button>
          )}
          <Button
            onClick={() => setShowUnsubscribeConfirm(true)}
            variant="danger"
            disabled={isLoading}
            className="px-6 py-2 h-auto transition-all duration-300 hover:scale-105"
          >
            {isLoading
              ? "Wypisywanie..."
              : unsubscribeButtonText || "Wypisz się"}
          </Button>
        </div>
      </div>
    );
  };

  const renderUnsubscribedState = () => (
    <div
      className={`text-center ${getAnimationClass({
        type: "image",
        delay: "none",
        isInView: isLoaded && isInView,
        isLoaded: true,
      })}`}
    >
      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 transition-transform duration-300 hover:scale-110">
        <UserX className="w-8 h-8 text-gray-600 dark:text-gray-400" />
      </div>
      <h2 className="text-2xl md:text-3xl font-serif font-semibold text-gray-900 dark:text-gray-100 mb-4">
        {unsubscribedTitle || "Szkoda, że odchodzisz"}
      </h2>
      <p className="text-gray-600 dark:text-gray-300 mb-4">
        {unsubscribedSubtitle ||
          "Wypisaliśmy Cię z newslettera. Możesz wrócić w każdej chwili — zawsze będziesz mile widziana/y!"}
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        {unsubscribedInfo ||
          "Jeśli chcesz nam pomóc być lepszymi, napisz co możemy poprawić."}
      </p>

      <Button
        onClick={handleResubscribe}
        variant="primary"
        className="px-6 py-2 h-auto transition-all duration-300 hover:scale-105"
      >
        {resubscribeButtonText || "Zmieniłeś zdanie? Zapisz się ponownie"}
      </Button>
    </div>
  );

  return (
    <SectionContainer config={container}>
      <section
        ref={containerRef}
        className="mx-auto max-w-4xl px-6 py-6 bg-gray-50 dark:bg-gray-900"
      >
        {newsletterState === "new" && renderNewUserForm()}
        {newsletterState === "subscribed" && renderSubscribedState()}
        {newsletterState === "unsubscribed" && renderUnsubscribedState()}

        {showUnsubscribeConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => !isLoading && setShowUnsubscribeConfirm(false)}
            />
            <div className="relative z-10 w-full max-w-md mx-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 text-center">
                Potwierdź wypisanie
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 text-center">
                Czy na pewno chcesz wypisać adres {cache?.email || email}?
                Zakończysz otrzymywanie wiadomości z naszego newslettera.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-auto px-4 py-2"
                  disabled={isLoading}
                  onClick={() => setShowUnsubscribeConfirm(false)}
                >
                  Anuluj
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  className="flex-1 h-auto px-4 py-2"
                  disabled={isLoading}
                  onClick={async () => {
                    await handleUnsubscribe();
                    setShowUnsubscribeConfirm(false);
                  }}
                >
                  {isLoading ? "Wypisywanie..." : "Potwierdzam wypisanie"}
                </Button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
                Po wypisaniu otrzymasz e‑mail potwierdzający (wysyłany
                automatycznie przez MailerLite).
              </p>
            </div>
          </div>
        )}
      </section>
    </SectionContainer>
  );
}
