"use client";

import { useState, useEffect, useRef } from "react";
import Button from "@/components/ui/Button";
import { Mail, Lock, Info, Download } from "lucide-react";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);

    // Symulacja wysłania formularza
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsSubscribed(true);
    setIsLoading(false);
    setEmail("");
  };

  if (isSubscribed) {
    return (
      <section
        ref={containerRef}
        className="mx-auto max-w-4xl px-6 py-16 bg-gray-50 dark:bg-gray-900"
      >
        <div
          className={`text-center transition-all duration-1000 ease-out ${
            isLoaded && isInView
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 translate-y-8 scale-95"
          }`}
        >
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4 transition-transform duration-300 hover:scale-110">
            <Mail className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl md:text-3xl font-serif font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Dziękujemy za zapisanie się!
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Wkrótce otrzymasz od nas pierwszy newsletter z najnowszymi
            artykułami i podróżniczymi inspiracjami.
          </p>
          <Button
            onClick={() => setIsSubscribed(false)}
            variant="outline"
            className="text-sm transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            Zapisz się ponownie
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={containerRef}
      className="mx-auto max-w-4xl px-6 py-16 bg-gray-50 dark:bg-gray-900"
    >
      <div
        className={`text-center mb-8 transition-all duration-1000 ease-out ${
          isLoaded && isInView
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-8"
        }`}
      >
        <h2 className="text-2xl md:text-3xl font-serif font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Nie przegap żadnego artykułu!
        </h2>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Zapisz się do naszego newslettera i otrzymuj najnowsze artykuły,
          porady podróżnicze i ekskluzywne treści prosto na swoją skrzynkę.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className={`max-w-md mx-auto transition-all duration-1000 ease-out delay-300 ${
          isLoaded && isInView
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-8"
        }`}
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Twój adres email"
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
              "Zapisz się"
            )}
          </Button>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
          Wysyłamy maksymalnie 2 emaile miesięcznie. Możesz zrezygnować w każdej
          chwili.
        </p>
      </form>

      <div
        className={`mt-8 flex items-center justify-center space-x-6 text-sm text-gray-500 dark:text-gray-400 transition-all duration-1000 ease-out delay-500 ${
          isLoaded && isInView
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4"
        }`}
      >
        <div className="flex items-center space-x-2 transition-all duration-300 hover:scale-105">
          <Lock className="w-4 h-4" />
          <span>Bezpieczne dane</span>
        </div>
        <div className="flex items-center space-x-2 transition-all duration-300 hover:scale-105">
          <Info className="w-4 h-4" />
          <span>Bez spamu</span>
        </div>
        <div className="flex items-center space-x-2 transition-all duration-300 hover:scale-105">
          <Download className="w-4 h-4" />
          <span>Łatwa rezygnacja</span>
        </div>
      </div>
    </section>
  );
}
