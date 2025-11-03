import PageLayout from "@/components/shared/PageLayout";
import PageHeader from "@/components/shared/PageHeader";
import InfoCard from "@/components/shared/InfoCard";
import BackToHome from "@/components/shared/BackToHome";
import Link from "@/components/ui/Link";
import { Home, FileText, Mail, Heart } from "lucide-react";

export default function NotFound() {
  return (
    <PageLayout maxWidth="4xl">
      <PageHeader
        title="404 - Strona nie została znaleziona"
        subtitle="Ups! Wygląda na to, że zabłądziłeś w podróży po naszym blogu."
      />

      <div className="space-y-8">
        {/* PRZYDATNE LINKI */}
        <InfoCard variant="green">
          <h3 className="text-2xl font-serif font-semibold text-green-900 dark:text-green-100 mb-8">
            Przydatne linki
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h4 className="font-sans font-semibold text-green-800 dark:text-green-200 text-xl">
                Główne sekcje
              </h4>
              <div className="space-y-4">
                <div>
                  <Link
                    href="/"
                    variant="underline"
                    className="text-green-700 dark:text-green-300 text-lg font-medium inline-flex items-center space-x-3 py-2 hover:text-green-800 dark:hover:text-green-200 transition-colors"
                  >
                    <Home className="w-5 h-5" />
                    <span>Strona główna</span>
                  </Link>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <h4 className="font-sans font-semibold text-green-800 dark:text-green-200 text-xl">
                Informacje
              </h4>
              <div className="space-y-4">
                <div>
                  <Link
                    href="/kontakt"
                    variant="underline"
                    className="text-green-700 dark:text-green-300 text-lg font-medium inline-flex items-center space-x-3 py-2 hover:text-green-800 dark:hover:text-green-200 transition-colors"
                  >
                    <Mail className="w-5 h-5" />
                    <span>Kontakt</span>
                  </Link>
                </div>
                <div>
                  <Link
                    href="/wsparcie"
                    variant="underline"
                    className="text-green-700 dark:text-green-300 text-lg font-medium inline-flex items-center space-x-3 py-2 hover:text-green-800 dark:hover:text-green-200 transition-colors"
                  >
                    <Heart className="w-5 h-5" />
                    <span>Wsparcie</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </InfoCard>

        {/* POWRÓT DO STRONY GŁÓWNEJ */}
        <BackToHome />
      </div>
    </PageLayout>
  );
}
