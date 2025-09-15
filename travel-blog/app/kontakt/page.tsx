"use client";

import { useState, useRef, useEffect } from "react";
import Button from "@/components/ui/Button";
import Link from "@/components/ui/Link";
import Image from "next/image";
import PageLayout from "@/components/shared/PageLayout";
import PageHeader from "@/components/shared/PageHeader";
import InfoCard from "@/components/shared/InfoCard";
import BackToHome from "@/components/shared/BackToHome";

export default function Kontakt() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const subjects = [
    { value: "wspolpraca", label: "Współpraca" },
    { value: "pytanie", label: "Pytanie o podróż" },
    { value: "blog", label: "Pytanie o blog" },
    { value: "newsletter", label: "Newsletter" },
    { value: "inne", label: "Inne" },
  ];

  const selectedSubject = subjects.find(
    (subject) => subject.value === formData.subject
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Symulacja wysłania formularza
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsSubmitted(true);
    setIsSubmitting(false);
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubjectSelect = (value: string) => {
    setFormData({
      ...formData,
      subject: value,
    });
    setIsDropdownOpen(false);
  };

  if (isSubmitted) {
    return (
      <PageLayout>
        <PageHeader
          title="Dziękujemy za wiadomość!"
          subtitle="Odpowiemy na Twoją wiadomość w ciągu 24 godzin"
        />

        <div className="mx-auto max-w-2xl">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-serif font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Wiadomość została wysłana
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              Dziękujemy za kontakt! Odezwiemy się do Ciebie wkrótce. W
              międzyczasie możesz śledzić nasze podróże na naszych kanałach
              społecznościowych.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button href="/" variant="primary">
                Powrót do strony głównej
              </Button>
              <Button href="/" variant="outline">
                Zobacz nasze artykuły
              </Button>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout maxWidth="6xl">
      <PageHeader
        title="Skontaktuj się z nami"
        subtitle="Masz pytania? Chcesz się z nami skontaktować? Napisz do nas!"
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* CONTACT FORM */}
        <div>
          <h2 className="text-2xl font-serif font-semibold text-gray-900 dark:text-gray-100 mb-6">
            Wyślij wiadomość
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Imię i nazwisko *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:border-transparent transition-colors"
                  placeholder="Twoje imię i nazwisko"
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Adres e-mail *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:border-transparent transition-colors"
                  placeholder="twoj@email.com"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="subject"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Temat *
              </label>
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`w-full px-4 py-3 pr-10 rounded-md border text-left transition-colors ${
                    isDropdownOpen
                      ? "border-gray-500 dark:border-gray-400 ring-2 ring-gray-500 dark:ring-gray-400"
                      : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                  } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:border-transparent`}
                >
                  <span
                    className={
                      selectedSubject
                        ? "text-gray-900 dark:text-gray-100"
                        : "text-gray-500 dark:text-gray-400"
                    }
                  >
                    {selectedSubject ? selectedSubject.label : "Wybierz temat"}
                  </span>
                </button>

                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg
                    className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>

                {isDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg">
                    {subjects.map((subject) => (
                      <button
                        key={subject.value}
                        type="button"
                        onClick={() => handleSubjectSelect(subject.value)}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                          formData.subject === subject.value
                            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100"
                            : "text-gray-900 dark:text-gray-100"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{subject.label}</span>
                          {formData.subject === subject.value && (
                            <svg
                              className="w-4 h-4 text-blue-600 dark:text-blue-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Wiadomość *
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={6}
                className="w-full px-4 py-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:border-transparent transition-colors resize-vertical"
                placeholder="Napisz swoją wiadomość..."
              />
            </div>

            <InfoCard variant="blue" className="p-4">
              <p className="text-sm">
                <strong>Uwaga:</strong> Wysyłając wiadomość, wyrażasz zgodę na
                przetwarzanie danych osobowych zgodnie z naszą{" "}
                <Link href="/polityka-prywatnosci" variant="underline">
                  Polityką Prywatności
                </Link>
                .
              </p>
            </InfoCard>

            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Wysyłanie...</span>
                </div>
              ) : (
                "Wyślij wiadomość"
              )}
            </Button>
          </form>
        </div>

        {/* CONTACT INFO */}
        <div>
          <h2 className="text-2xl font-serif font-semibold text-gray-900 dark:text-gray-100 mb-6">
            Informacje kontaktowe
          </h2>

          <div className="space-y-6">
            {/* EMAIL */}
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  E-mail
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  kontakt@naszblog.pl
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Odpowiadamy w ciągu 24 godzin
                </p>
              </div>
            </div>

            {/* PHONE */}
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Telefon
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  [Wpisz swój numer telefonu]
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Pon-Pt: 9:00-17:00
                </p>
              </div>
            </div>

            {/* ADDRESS */}
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 text-purple-600 dark:text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Adres
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  [Wpisz swój adres]
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Polska
                </p>
              </div>
            </div>

            {/* SOCIAL MEDIA */}
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900 rounded-full flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 text-pink-600 dark:text-pink-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Media społecznościowe
                </h3>
                <div className="flex space-x-4">
                  <Link href="#" variant="underline" className="text-sm">
                    Instagram
                  </Link>
                  <Link href="#" variant="underline" className="text-sm">
                    Facebook
                  </Link>
                  <Link href="#" variant="underline" className="text-sm">
                    YouTube
                  </Link>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Śledź nasze podróże na bieżąco
                </p>
              </div>
            </div>
          </div>

          {/* FAQ SECTION */}
          <div className="mt-12">
            <h3 className="text-xl font-serif font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Często zadawane pytania
            </h3>
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Jak długo czekać na odpowiedź?
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Odpowiadamy na wszystkie wiadomości w ciągu 24 godzin w dni
                  robocze.
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Czy oferujecie współpracę?
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Tak! Chętnie współpracujemy z markami związanymi z podróżami i
                  lifestyle.
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Gdzie mogę znaleźć Wasze najnowsze treści?
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Zapisz się do naszego newslettera lub śledź nas w mediach
                  społecznościowych.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BackToHome className="mt-12" />
    </PageLayout>
  );
}
