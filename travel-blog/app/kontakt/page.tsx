"use client";

import { useState, useRef, useEffect } from "react";
import Button from "@/components/ui/Button";
import Link from "@/components/ui/Link";
import PageLayout from "@/components/shared/PageLayout";
import PageHeader from "@/components/shared/PageHeader";
import InfoCard from "@/components/shared/InfoCard";
import BackToHome from "@/components/shared/BackToHome";
import { Check, ChevronDown, Mail, Instagram } from "lucide-react";

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
              <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
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
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
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
                            <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
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
                <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
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

            {/* SOCIAL MEDIA */}
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900 rounded-full flex items-center justify-center flex-shrink-0">
                <Instagram className="w-5 h-5 text-pink-600 dark:text-pink-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Media społecznościowe
                </h3>
                <div className="flex space-x-4">
                  <Link
                    href="https://instagram.com/vlogizdrogiaa"
                    variant="underline"
                    className="text-sm"
                    external
                  >
                    Instagram
                  </Link>
                  <Link
                    href="https://www.facebook.com/vlogizdrogi"
                    variant="underline"
                    className="text-sm"
                    external
                  >
                    Facebook
                  </Link>
                  <Link
                    href="https://youtube.com/@vlogizdrogiaa"
                    variant="underline"
                    className="text-sm"
                    external
                  >
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
